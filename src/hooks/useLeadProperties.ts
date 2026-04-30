import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadProperty, LeadPropertyStage, Property, CustomFieldData, KeyDistanceData } from '@/types/property';

// Transform database row to Property type
function transformProperty(row: any): Property {
  return {
    ...row,
    custom_fields: (row.custom_fields || []) as CustomFieldData[],
    key_distances: (row.key_distances || []) as KeyDistanceData[],
    amenities: row.amenities || [],
    images: row.images || [],
  };
}

// Transform lead_property row
function transformLeadProperty(row: any): LeadProperty {
  return {
    ...row,
    stage: row.stage as LeadPropertyStage,
    property: row.property ? transformProperty(row.property) : undefined,
  };
}

export function useLeadProperties(leadId: string | undefined) {
  return useQuery({
    queryKey: ['lead-properties', leadId],
    queryFn: async (): Promise<LeadProperty[]> => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('lead_properties')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(transformLeadProperty);
    },
    enabled: !!leadId,
  });
}

export function useAssignPropertyToLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leadId, 
      propertyId, 
      stage = 'available' 
    }: { 
      leadId: string; 
      propertyId: string; 
      stage?: LeadPropertyStage;
    }): Promise<LeadProperty> => {
      const { data, error } = await supabase
        .from('lead_properties')
        .insert({
          lead_id: leadId,
          property_id: propertyId,
          stage,
        })
        .select(`
          *,
          property:properties(*)
        `)
        .single();

      if (error) throw error;
      return transformLeadProperty(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-properties', variables.leadId] });
    },
  });
}

export function useUpdateLeadPropertyStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      stage,
      leadId,
    }: { 
      id: string; 
      stage: LeadPropertyStage;
      leadId: string;
    }): Promise<LeadProperty> => {
      const updates: any = { stage };
      
      if (stage === 'assigned') {
        updates.assigned_at = new Date().toISOString();
      } else if (stage === 'brochure_sent') {
        updates.brochure_sent_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('lead_properties')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          property:properties(*)
        `)
        .single();

      if (error) throw error;
      return transformLeadProperty(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-properties', variables.leadId] });
    },
  });
}

export function useRemovePropertyFromLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }): Promise<void> => {
      const { error } = await supabase
        .from('lead_properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-properties', variables.leadId] });
    },
  });
}
