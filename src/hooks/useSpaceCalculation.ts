import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SpaceCalculation, SpaceModule } from '@/types';

export function useSpaceCalculation(leadId: string | undefined) {
  return useQuery({
    queryKey: ['space_calculations', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('space_calculations')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          modules: (data.modules as unknown) as SpaceModule[],
        } as SpaceCalculation;
      }
      return null;
    },
    enabled: !!leadId,
  });
}

export function useUpsertSpaceCalculation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (calc: {
      id?: string;
      lead_id: string;
      modules: SpaceModule[];
      total_carpet_area: number;
      total_seats: number;
    }) => {
      const { id, modules, ...rest } = calc;
      // Cast modules to Json type for Supabase
      const payload = { ...rest, modules: JSON.parse(JSON.stringify(modules)) };
      
      if (id) {
        const { data, error } = await supabase
          .from('space_calculations')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return {
          ...data,
          modules: (data.modules as unknown) as SpaceModule[],
        } as SpaceCalculation;
      } else {
        const { data, error } = await supabase
          .from('space_calculations')
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        return {
          ...data,
          modules: (data.modules as unknown) as SpaceModule[],
        } as SpaceCalculation;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['space_calculations', data.lead_id] });
    },
  });
}
