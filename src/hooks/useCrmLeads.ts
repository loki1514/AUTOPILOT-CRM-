import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, CrmStatus } from '@/types';

export function useCrmLeads() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['crm-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('last_activity', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('crm-leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          qc.invalidateQueries({ queryKey: ['crm-leads'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useUpdateCrmStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, crm_status }: { id: string; crm_status: CrmStatus }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ crm_status } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Lead;
    },
    onMutate: async ({ id, crm_status }) => {
      await qc.cancelQueries({ queryKey: ['crm-leads'] });
      const prev = qc.getQueryData<Lead[]>(['crm-leads']);
      qc.setQueryData<Lead[]>(['crm-leads'], (old) =>
        (old ?? []).map((l) => (l.id === id ? { ...l, crm_status } : l))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['crm-leads'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });
}

export function useUpdateLeadFields() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });
}

export function useAssignLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      repId,
      repName,
    }: {
      leadId: string;
      repId: string | null;
      repName?: string;
    }) => {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: repId } as any)
        .eq('id', leadId);
      if (error) throw error;

      await supabase.from('activities').insert({
        lead_id: leadId,
        rep_id: repId,
        type: 'assignment',
        content: repId ? `Assigned to ${repName ?? 'rep'}` : 'Unassigned',
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
      qc.invalidateQueries({ queryKey: ['bd-reps-load'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}