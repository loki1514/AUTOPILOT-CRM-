import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateCustomSpaceData {
  name: string;
  category: string;
  width_ft: number | null;
  length_ft: number | null;
  area_sqft: number;
  seats: number;
  images?: File[];
}

export function useCreateCustomSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomSpaceData) => {
      let imageUrls: string[] = [];

      // Upload images if provided
      if (data.images && data.images.length > 0) {
        for (const file of data.images) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('space-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('space-images')
            .getPublicUrl(uploadData.path);

          imageUrls.push(urlData.publicUrl);
        }
      }

      // Insert the custom space
      const { data: space, error } = await supabase
        .from('space_library')
        .insert({
          name: data.name,
          category: data.category,
          width_ft: data.width_ft,
          length_ft: data.length_ft,
          area_sqft: data.area_sqft,
          seats: data.seats,
          is_custom: true,
          is_standard: false,
          images: imageUrls,
        })
        .select()
        .single();

      if (error) throw error;
      return space;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-library'] });
      toast.success('Custom space created successfully');
    },
    onError: (error) => {
      console.error('Error creating custom space:', error);
      toast.error('Failed to create custom space');
    },
  });
}
