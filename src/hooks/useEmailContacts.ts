import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmailContact } from '@/types/email';

export interface CreateContactInput {
  email: string;
  name?: string;
  company?: string;
  city?: string;
  tags?: string[];
}

export function useEmailContacts() {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['email-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('email_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailContact[];
    },
  });

  const createContact = useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('email_contacts')
        .insert({
          user_id: user.id,
          email: input.email,
          name: input.name || '',
          company: input.company || null,
          city: input.city || null,
          tags: input.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-contacts'] });
      toast.success('Contact added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-contacts'] });
      toast.success('Contact updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-contacts'] });
      toast.success('Contact removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Get contacts eligible for sending (subscribed + not bounced)
  const getEligibleContacts = () => {
    return contactsQuery.data?.filter(c => c.subscribed && !c.bounced) || [];
  };

  // Get contacts by city
  const getContactsByCity = (city: string) => {
    return contactsQuery.data?.filter(c => c.city === city && c.subscribed && !c.bounced) || [];
  };

  // Get contacts by tags
  const getContactsByTags = (tags: string[]) => {
    return contactsQuery.data?.filter(c => 
      c.subscribed && !c.bounced && c.tags.some(t => tags.includes(t))
    ) || [];
  };

  return {
    contacts: contactsQuery.data || [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createContact,
    updateContact,
    deleteContact,
    getEligibleContacts,
    getContactsByCity,
    getContactsByTags,
  };
}
