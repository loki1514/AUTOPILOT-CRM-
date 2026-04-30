import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, CustomFieldData, KeyDistanceData } from '@/types/property';
import { Json } from '@/integrations/supabase/types';

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export type PropertyInsert = Omit<Property, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
type PropertyUpdate = Partial<PropertyInsert>;

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

// Transform Property to database insert format
function toDbFormat(property: PropertyInsert) {
  return {
    ...property,
    custom_fields: property.custom_fields as unknown as Json,
    key_distances: property.key_distances as unknown as Json,
  };
}

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformProperty);
    },
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: async (): Promise<Property | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? transformProperty(data) : null;
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (property: PropertyInsert): Promise<Property> => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('properties')
        .insert({ ...toDbFormat(property), user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return transformProperty(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PropertyUpdate & { id: string }): Promise<Property> => {
      const dbUpdates: any = { ...updates };
      if (updates.custom_fields) {
        dbUpdates.custom_fields = updates.custom_fields as unknown as Json;
      }
      if (updates.key_distances) {
        dbUpdates.key_distances = updates.key_distances as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('properties')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformProperty(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties', variables.id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

// Upload property image to storage
export async function uploadPropertyImage(file: File, propertyId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${propertyId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(fileName);

  return publicUrl;
}
