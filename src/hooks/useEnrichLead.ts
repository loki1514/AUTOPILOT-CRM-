import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnrichInput {
  leadId: string;
  provider?: 'apollo' | 'perplexity';
}

export function useEnrichLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, provider }: EnrichInput) => {
      const { data, error } = await supabase.functions.invoke('enrich-lead-pipeline', {
        body: { lead_id: leadId, provider },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Enrichment failed');
      return data;
    },
    onSuccess: (_data, variables) => {
      const { leadId } = variables;
      // Invalidate all related queries
      qc.invalidateQueries({ queryKey: ['leads-with-contacts'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads', leadId] });
      qc.invalidateQueries({ queryKey: ['lead-contacts'] });
      qc.invalidateQueries({ queryKey: ['lead-contacts', leadId] });
      qc.invalidateQueries({ queryKey: ['intent-signals'] });
      qc.invalidateQueries({ queryKey: ['intent-signals', leadId] });
      qc.invalidateQueries({ queryKey: ['enrichment-jobs'] });
      qc.invalidateQueries({ queryKey: ['integration-status'] });
    },
  });
}
