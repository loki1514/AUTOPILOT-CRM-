import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LeadContact } from '@/types';

export function useLeadContacts(leadId?: string) {
  return useQuery({
    queryKey: ['lead-contacts', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('lead_contacts')
        .select('*')
        .eq('lead_id', leadId)
        .order('priority_rank', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LeadContact[];
    },
    enabled: !!leadId,
  });
}
