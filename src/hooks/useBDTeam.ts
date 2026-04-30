import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BDTeamMember {
  id: string;
  user_id: string;
  member_name: string;
  member_email: string;
  city: string;
  role: 'bd' | 'city_head' | 'leadership';
  is_active: boolean;
  created_at: string;
}

export interface CreateBDTeamMemberInput {
  member_name: string;
  member_email: string;
  city: string;
  role?: 'bd' | 'city_head' | 'leadership';
}

export function useBDTeam() {
  const queryClient = useQueryClient();

  const teamQuery = useQuery({
    queryKey: ['bd-team'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bd_team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('city', { ascending: true })
        .order('role', { ascending: true });

      if (error) throw error;
      return data as BDTeamMember[];
    },
  });

  const createMember = useMutation({
    mutationFn: async (input: CreateBDTeamMemberInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bd_team_members')
        .insert({
          user_id: user.id,
          member_name: input.member_name,
          member_email: input.member_email,
          city: input.city,
          role: input.role || 'bd',
        })
        .select()
        .single();

      if (error) throw error;
      return data as BDTeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd-team'] });
      toast.success('Team member added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BDTeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('bd_team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BDTeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd-team'] });
      toast.success('Team member updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bd_team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd-team'] });
      toast.success('Team member removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Get team members by city or role
  const getTeamByCity = (city: string) => {
    return teamQuery.data?.filter(m => m.city === city && m.is_active) || [];
  };

  const getTeamByRole = (role: 'bd' | 'city_head' | 'leadership') => {
    return teamQuery.data?.filter(m => m.role === role && m.is_active) || [];
  };

  const getAllCities = () => {
    const cities = new Set(teamQuery.data?.map(m => m.city) || []);
    return Array.from(cities);
  };

  return {
    team: teamQuery.data || [],
    isLoading: teamQuery.isLoading,
    error: teamQuery.error,
    createMember,
    updateMember,
    deleteMember,
    getTeamByCity,
    getTeamByRole,
    getAllCities,
  };
}
