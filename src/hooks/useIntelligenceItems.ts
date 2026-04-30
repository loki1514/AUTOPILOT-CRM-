import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IntelligenceItem {
  id: string;
  source_id: string | null;
  user_id: string;
  headline: string;
  summary: string | null;
  content_preview: string | null;
  source_url: string | null;
  city: string | null;
  micro_market: string | null;
  intelligence_type: string | null;
  relevance_date: string | null;
  is_actionable: boolean | null;
  action_notes: string | null;
  created_at: string;
}

export interface CreateIntelligenceItemInput {
  headline: string;
  summary?: string;
  content_preview?: string;
  source_url?: string;
  city?: string;
  micro_market?: string;
  intelligence_type?: string;
  is_actionable?: boolean;
  action_notes?: string;
}

export function useIntelligenceItems(filters?: {
  city?: string;
  intelligence_type?: string;
  is_actionable?: boolean;
}) {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['intelligence-items', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('intelligence_items')
        .select('*')
        .eq('user_id', user.id)
        .order('relevance_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.intelligence_type) {
        query = query.eq('intelligence_type', filters.intelligence_type);
      }
      if (filters?.is_actionable !== undefined) {
        query = query.eq('is_actionable', filters.is_actionable);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as IntelligenceItem[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (input: CreateIntelligenceItemInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('intelligence_items')
        .insert({
          user_id: user.id,
          headline: input.headline,
          summary: input.summary || null,
          content_preview: input.content_preview || null,
          source_url: input.source_url || null,
          city: input.city || null,
          micro_market: input.micro_market || null,
          intelligence_type: input.intelligence_type || null,
          is_actionable: input.is_actionable || false,
          action_notes: input.action_notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as IntelligenceItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-items'] });
      toast.success('Intelligence item added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IntelligenceItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('intelligence_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as IntelligenceItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-items'] });
      toast.success('Item updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('intelligence_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-items'] });
      toast.success('Item deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error,
    createItem,
    updateItem,
    deleteItem,
  };
}
