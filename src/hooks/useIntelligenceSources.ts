import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IntelligenceSource {
  id: string;
  user_id: string;
  source_type: 'rss' | 'pdf' | 'doc' | 'manual';
  name: string;
  url: string | null;
  file_path: string | null;
  city: string | null;
  micro_market: string | null;
  intelligence_type: string | null;
  is_active: boolean | null;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIntelligenceSourceInput {
  source_type: 'rss' | 'pdf' | 'doc' | 'manual';
  name: string;
  url?: string;
  file_path?: string;
  city?: string;
  micro_market?: string;
  intelligence_type?: string;
}

export function useIntelligenceSources() {
  const queryClient = useQueryClient();

  const sourcesQuery = useQuery({
    queryKey: ['intelligence-sources'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('intelligence_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IntelligenceSource[];
    },
  });

  const createSource = useMutation({
    mutationFn: async (input: CreateIntelligenceSourceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('intelligence_sources')
        .insert({
          user_id: user.id,
          source_type: input.source_type,
          name: input.name,
          url: input.url || null,
          file_path: input.file_path || null,
          city: input.city || null,
          micro_market: input.micro_market || null,
          intelligence_type: input.intelligence_type || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as IntelligenceSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-sources'] });
      toast.success('Intelligence source added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateSource = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IntelligenceSource> & { id: string }) => {
      const { data, error } = await supabase
        .from('intelligence_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as IntelligenceSource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-sources'] });
      toast.success('Source updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('intelligence_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-sources'] });
      toast.success('Source deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const fetchRSS = useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke('ingest-rss', {
        body: { source_id: sourceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-sources'] });
      queryClient.invalidateQueries({ queryKey: ['intelligence-items'] });
      toast.success(`Fetched ${data.items_inserted} new items`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    sources: sourcesQuery.data || [],
    isLoading: sourcesQuery.isLoading,
    error: sourcesQuery.error,
    createSource,
    updateSource,
    deleteSource,
    fetchRSS,
  };
}
