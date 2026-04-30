import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { EmailCampaign, CreateCampaignInput, UpdateCampaignInput, CampaignStatus } from '@/types/email';

export function useCampaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async (): Promise<EmailCampaign[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EmailCampaign[];
    },
    enabled: !!user?.id,
  });

  const createCampaign = useMutation({
    mutationFn: async (input: CreateCampaignInput): Promise<EmailCampaign> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          user_id: user.id,
          name: input.name,
          purpose: input.purpose || null,
          status: 'draft' as CampaignStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCampaignInput & { id: string }): Promise<EmailCampaign> => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const approveCampaign = useMutation({
    mutationFn: async (id: string): Promise<EmailCampaign> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('email_campaigns')
        .update({
          status: 'approved' as CampaignStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    approveCampaign,
  };
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async (): Promise<EmailCampaign | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EmailCampaign;
    },
    enabled: !!id,
  });
}
