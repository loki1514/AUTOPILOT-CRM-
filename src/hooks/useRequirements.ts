import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Requirement } from '@/types';

export function useRequirement(leadId: string | undefined) {
  return useQuery({
    queryKey: ['requirements', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('requirements')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Requirement | null;
    },
    enabled: !!leadId,
  });
}

export function useUpsertRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requirement: Omit<Requirement, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      const { id, ...rest } = requirement;
      
      if (id) {
        const { data, error } = await supabase
          .from('requirements')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data as Requirement;
      } else {
        const { data, error } = await supabase
          .from('requirements')
          .insert(rest)
          .select()
          .single();
        
        if (error) throw error;
        return data as Requirement;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requirements', data.lead_id] });
    },
  });
}
