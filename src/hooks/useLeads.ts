import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, LeadStage } from '@/types';

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

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const role = await getCurrentUserRole();
      const userId = await getCurrentUserId();

      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Reps only see leads assigned to them
      if (role === 'rep') {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      if (!id) return null;
      const role = await getCurrentUserRole();
      const userId = await getCurrentUserId();

      let query = supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (role === 'rep') {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...lead, user_id: userId } as any)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', data.id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLeadStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: LeadStage }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', data.id] });
    },
  });
}
