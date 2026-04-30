import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SendingDomain, DnsRecord } from '@/types/email';

// Transform database row to typed SendingDomain
function transformDomain(row: any): SendingDomain {
  return {
    ...row,
    dns_records: (row.dns_records || []) as DnsRecord[],
  };
}

export function useSendingDomains() {
  return useQuery({
    queryKey: ['sending-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sending_domains')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(transformDomain);
    },
  });
}

export function useVerifiedDomains() {
  return useQuery({
    queryKey: ['sending-domains', 'verified'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sending_domains')
        .select('*')
        .eq('status', 'verified')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(transformDomain);
    },
  });
}

interface AddDomainInput {
  domain: string;
  fromEmail: string;
  fromName: string;
}

export function useAddSendingDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddDomainInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('add-sending-domain', {
        body: input,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to add domain');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sending-domains'] });
    },
  });
}

export function useVerifySendingDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('verify-sending-domain', {
        body: { domainId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to verify domain');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sending-domains'] });
    },
  });
}

export function useDeleteSendingDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from('sending_domains')
        .delete()
        .eq('id', domainId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sending-domains'] });
    },
  });
}
