import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpaceLibraryItem, SpaceCategory } from '@/types/space';

interface UseSpaceLibraryOptions {
  searchQuery?: string;
  category?: SpaceCategory;
}

export function useSpaceLibrary(options: UseSpaceLibraryOptions = {}) {
  const { searchQuery = '', category = 'All' } = options;

  return useQuery({
    queryKey: ['space-library', searchQuery, category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_library')
        .select('*')
        .order('is_standard', { ascending: false })
        .order('category')
        .order('name');

      if (error) throw error;

      let filtered = (data || []) as SpaceLibraryItem[];

      // Apply search filter (client-side for instant results)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((space) =>
          space.name.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (category !== 'All') {
        if (category === 'Custom') {
          filtered = filtered.filter((space) => space.is_custom);
        } else {
          filtered = filtered.filter((space) => space.category === category);
        }
      }

      return filtered;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
