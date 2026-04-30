import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Activity, ActivityType } from '@/types';

export function useActivities(leadId?: string) {
  return useQuery({
    queryKey: ['activities', leadId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      if (leadId) q = q.eq('lead_id', leadId);
      else q = q.limit(20);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Activity[];
    },
  });
}

export function useActivitiesRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('activities-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => qc.invalidateQueries({ queryKey: ['activities'] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lead_id,
      type,
      content,
      rep_id,
    }: {
      lead_id: string;
      type: ActivityType;
      content: string;
      rep_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('activities')
        .insert({ lead_id, type, content, rep_id: rep_id ?? null } as any)
        .select()
        .single();
      if (error) throw error;
      return data as Activity;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['activities', vars.lead_id] });
      qc.invalidateQueries({ queryKey: ['activities', 'all'] });
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });
}