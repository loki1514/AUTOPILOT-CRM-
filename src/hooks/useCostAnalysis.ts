import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CostAnalysis } from '@/types';

export function useCostAnalysis(leadId: string | undefined) {
  return useQuery({
    queryKey: ['cost_analyses', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('cost_analyses')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();
      
      if (error) throw error;
      return data as CostAnalysis | null;
    },
    enabled: !!leadId,
  });
}

export function useUpsertCostAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (analysis: Omit<CostAnalysis, 'created_at' | 'updated_at'> & { id?: string }) => {
      const { id, ...rest } = analysis;
      
      if (id) {
        const { data, error } = await supabase
          .from('cost_analyses')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data as CostAnalysis;
      } else {
        const { data, error } = await supabase
          .from('cost_analyses')
          .insert(rest)
          .select()
          .single();
        
        if (error) throw error;
        return data as CostAnalysis;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cost_analyses', data.lead_id] });
    },
  });
}
