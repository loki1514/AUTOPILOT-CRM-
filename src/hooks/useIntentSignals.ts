import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { IntentSignal } from '@/types';

export function useIntentSignals(leadId?: string) {
  return useQuery({
    queryKey: ['intent-signals', leadId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('intent_signals')
        .select('*')
        .order('detected_at', { ascending: false });
      if (leadId) q = q.eq('lead_id', leadId);
      else q = q.limit(100);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as IntentSignal[];
    },
  });
}