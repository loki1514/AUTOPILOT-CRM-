import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { SenderProfile, CreateSenderProfileInput, ReplyToMode } from '@/types/email';

export function useSenderProfiles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ['sender-profiles', user?.id],
    queryFn: async (): Promise<SenderProfile[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('sender_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SenderProfile[];
    },
    enabled: !!user?.id,
  });

  const createProfile = useMutation({
    mutationFn: async (input: CreateSenderProfileInput): Promise<SenderProfile> => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sender_profiles')
        .insert({
          user_id: user.id,
          domain_id: input.domain_id,
          name: input.name,
          from_email: input.from_email,
          default_reply_to_mode: input.default_reply_to_mode || 'shared',
          default_reply_to_email: input.default_reply_to_email || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SenderProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sender-profiles'] });
      toast({
        title: 'Profile Created',
        description: 'Sender profile has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<{
      name: string;
      from_email: string;
      default_reply_to_mode: ReplyToMode;
      default_reply_to_email: string | null;
      is_active: boolean;
    }> & { id: string }): Promise<SenderProfile> => {
      const { data, error } = await supabase
        .from('sender_profiles')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SenderProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sender-profiles'] });
      toast({
        title: 'Profile Updated',
        description: 'Sender profile has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('sender_profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sender-profiles'] });
      toast({
        title: 'Profile Deleted',
        description: 'Sender profile has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deletion Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get only active profiles from verified domains
  const activeProfiles = profilesQuery.data?.filter((p) => p.is_active) || [];

  return {
    profiles: profilesQuery.data || [],
    activeProfiles,
    isLoading: profilesQuery.isLoading,
    error: profilesQuery.error,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}
