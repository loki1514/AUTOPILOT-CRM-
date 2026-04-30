import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/types";
import type { LeadContact } from "./useLeadContacts";

export interface LeadWithContact extends Lead {
  top_contact: LeadContact | null;
  contact_count: number;
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

async function getCurrentUserRole(): Promise<'master_admin' | 'admin' | 'rep'> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  if (error || !data?.length) return 'rep';
  const roles = data.map((r) => r.role);
  if (roles.includes('master_admin')) return 'master_admin';
  if (roles.includes('admin')) return 'admin';
  return 'rep';
}

export function useLeadsWithContacts() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("leads-with-contacts-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_contacts" }, () => {
        qc.invalidateQueries({ queryKey: ["leads-with-contacts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads-with-contacts"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ["leads-with-contacts"],
    queryFn: async (): Promise<LeadWithContact[]> => {
      const role = await getCurrentUserRole();
      const userId = await getCurrentUserId();

      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (role === 'rep') {
        query = query.eq('assigned_to', userId);
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      const ids = (leads ?? []).map((l: any) => l.id);
      if (ids.length === 0) return [];

      const { data: contacts } = await supabase
        .from("lead_contacts")
        .select("*")
        .in("lead_id", ids)
        .order("priority_rank", { ascending: true });

      const byLead = new Map<string, LeadContact[]>();
      (contacts ?? []).forEach((c: any) => {
        const arr = byLead.get(c.lead_id) ?? [];
        arr.push(c as LeadContact);
        byLead.set(c.lead_id, arr);
      });

      return (leads ?? []).map((l: any) => {
        const cs = byLead.get(l.id) ?? [];
        return { ...(l as Lead), top_contact: cs[0] ?? null, contact_count: cs.length };
      });
    },
  });
}
