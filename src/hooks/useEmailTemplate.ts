import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailBlock, EmailTemplate } from '@/types/email';
import { toast } from '@/hooks/use-toast';

interface GenerateDraftParams {
  prompt: string;
  targetAudience?: string;
}

interface GenerateDraftResponse {
  subject: string;
  blocks: EmailBlock[];
}

export function useEmailTemplate(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch existing template for campaign
  const templateQuery = useQuery({
    queryKey: ['email-template', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          blocks: (data.blocks as unknown) as EmailBlock[],
        } as EmailTemplate;
      }
      
      return null;
    },
    enabled: !!campaignId,
  });

  // Generate draft using AI
  const generateDraft = useMutation({
    mutationFn: async (params: GenerateDraftParams): Promise<GenerateDraftResponse> => {
      const { data, error } = await supabase.functions.invoke('generate-email-draft', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate draft');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as GenerateDraftResponse;
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Save template to database
  const saveTemplate = useMutation({
    mutationFn: async (params: { subject: string; blocks: EmailBlock[]; footerAddress?: string }) => {
      if (!campaignId) throw new Error('Campaign ID is required');

      const templateData = {
        campaign_id: campaignId,
        subject: params.subject,
        blocks: params.blocks as unknown as any,
        footer_address: params.footerAddress || '',
        updated_at: new Date().toISOString(),
      };

      // Check if template exists
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('email_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-template', campaignId] });
      toast({
        title: 'Draft Saved',
        description: 'Your email draft has been saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update template blocks
  const updateTemplate = useMutation({
    mutationFn: async (params: Partial<{ subject: string; blocks: EmailBlock[]; footerAddress: string }>) => {
      if (!campaignId) throw new Error('Campaign ID is required');

      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (!existing) throw new Error('Template not found');

      const updateData: any = { updated_at: new Date().toISOString() };
      if (params.subject !== undefined) updateData.subject = params.subject;
      if (params.blocks !== undefined) updateData.blocks = params.blocks;
      if (params.footerAddress !== undefined) updateData.footer_address = params.footerAddress;

      const { data, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-template', campaignId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    template: templateQuery.data,
    isLoading: templateQuery.isLoading,
    error: templateQuery.error,
    generateDraft,
    saveTemplate,
    updateTemplate,
  };
}
