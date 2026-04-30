import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BdRep } from '@/types';

export function useBdReps() {
  return useQuery({
    queryKey: ['bd-reps-load'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bd_reps_with_load')
        .select('*')
        .order('member_name');
      if (error) throw error;
      return (data ?? []) as BdRep[];
    },
  });
}