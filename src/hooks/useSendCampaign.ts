import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendCampaignParams {
  campaignId: string;
  recipientIds?: string[];
  testMode?: boolean;
}

interface SendCampaignResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
  testMode: boolean;
}

export function useSendCampaign() {
  const queryClient = useQueryClient();

  const sendCampaign = useMutation({
    mutationFn: async (params: SendCampaignParams): Promise<SendCampaignResult> => {
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Failed to send campaign');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as SendCampaignResult;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['outbox'] });
      queryClient.invalidateQueries({ queryKey: ['email-contacts'] });

      if (data.testMode) {
        toast.success(`Test email sent successfully`);
      } else {
        toast.success(`Campaign sent: ${data.sent} emails delivered, ${data.failed} failed`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    sendCampaign,
    isSending: sendCampaign.isPending,
  };
}
