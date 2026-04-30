import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DailyBrief } from '@/hooks/useDailyBriefs';
import { format } from 'date-fns';

export function useBriefToCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createCampaignFromBrief = useMutation({
    mutationFn: async (brief: DailyBrief) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          user_id: user.id,
          name: `Daily Brief: ${brief.city} - ${format(new Date(brief.brief_date), 'MMM d, yyyy')}`,
          purpose: 'daily_brief',
          status: 'draft',
          is_recurring: false,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Generate email HTML content from brief
      const emailHtml = generateBriefEmailHtml(brief);

      // Create the email template with blocks
      const { error: templateError } = await supabase
        .from('email_templates')
        .insert({
          campaign_id: campaign.id,
          subject: `${brief.city} BD Brief: ${brief.headline}`,
          blocks: [
            {
              id: crypto.randomUUID(),
              type: 'text',
              content: emailHtml,
            },
          ],
          footer_address: 'Internal Use Only - BD Accelerate',
        });

      if (templateError) throw templateError;

      // Fetch BD team members for this city
      const { data: teamMembers, error: teamError } = await supabase
        .from('bd_team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or(`city.eq.${brief.city},role.eq.leadership`);

      if (teamError) throw teamError;

      // Find or create contacts for team members
      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
          // Upsert contact
          const { data: contact, error: contactError } = await supabase
            .from('email_contacts')
            .upsert(
              {
                user_id: user.id,
                email: member.member_email,
                name: member.member_name,
                city: member.city,
                tags: ['bd-team', brief.city.toLowerCase()],
              },
              { onConflict: 'user_id,email', ignoreDuplicates: false }
            )
            .select()
            .single();

          if (contactError && !contactError.message.includes('duplicate')) {
            console.error('Error upserting contact:', contactError);
            continue;
          }

          // Get the contact ID
          const { data: existingContact } = await supabase
            .from('email_contacts')
            .select('id')
            .eq('user_id', user.id)
            .eq('email', member.member_email)
            .single();

          if (existingContact) {
            // Add as campaign recipient
            await supabase.from('campaign_recipients').insert({
              campaign_id: campaign.id,
              contact_id: existingContact.id,
              status: 'pending',
            });
          }
        }
      }

      // Link campaign to brief
      await supabase
        .from('daily_briefs')
        .update({ campaign_id: campaign.id })
        .eq('id', brief.id);

      return campaign;
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['daily-briefs'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created from brief');
      navigate(`/campaigns/${campaign.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    createCampaignFromBrief,
    isCreating: createCampaignFromBrief.isPending,
  };
}

function generateBriefEmailHtml(brief: DailyBrief): string {
  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      default: return '⚪';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lease_expiry': return 'Lease Expiry';
      case 'funded_company': return 'Funded Company';
      case 'competitor': return 'Competitor';
      case 'pricing': return 'Pricing';
      default: return 'Strategic';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'today': return '🔥 Today';
      case 'this_week': return '📅 This Week';
      default: return '👀 Monitor';
    }
  };

  let html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e5e7eb;">
    <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Daily BD Intelligence</p>
    <h1 style="margin: 10px 0; font-size: 24px; color: #111827;">${brief.headline}</h1>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">${brief.city} • ${format(new Date(brief.brief_date), 'MMMM d, yyyy')}</p>
  </div>

  <div style="padding: 20px 0;">
    <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 15px;">🎯 Top Signals</h2>
`;

  for (const signal of brief.top_signals) {
    html += `
    <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
      <p style="margin: 0 0 8px 0; font-size: 15px; color: #111827;">${signal.signal}</p>
      <span style="display: inline-block; font-size: 12px; color: #6b7280;">${getPriorityEmoji(signal.priority)} ${signal.priority.toUpperCase()} • ${getTypeLabel(signal.type)}</span>
    </div>
`;
  }

  if (brief.micro_market_watch && brief.micro_market_watch.length > 0) {
    html += `
  </div>

  <div style="padding: 20px 0; border-top: 1px solid #e5e7eb;">
    <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 15px;">📍 Micro-Market Watch</h2>
`;
    for (const item of brief.micro_market_watch) {
      html += `
    <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
      <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #111827;">${item.micro_market}</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">${item.summary}</p>
    </div>
`;
    }
  }

  if (brief.competitor_movement && brief.competitor_movement.length > 0) {
    html += `
  </div>

  <div style="padding: 20px 0; border-top: 1px solid #e5e7eb;">
    <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 15px;">👥 Competitor Movement</h2>
`;
    for (const item of brief.competitor_movement) {
      html += `
    <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
      <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #111827;">${item.entity}</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">${item.movement}</p>
    </div>
`;
    }
  }

  html += `
  </div>

  <div style="padding: 20px 0; border-top: 1px solid #e5e7eb;">
    <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 15px;">✨ What to Do Today</h2>
`;

  for (const action of brief.suggested_actions) {
    html += `
    <div style="background: ${action.urgency === 'today' ? '#fef2f2' : '#f9fafb'}; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid ${action.urgency === 'today' ? '#ef4444' : '#d1d5db'};">
      <span style="display: inline-block; font-size: 12px; font-weight: 600; margin-bottom: 5px;">${getUrgencyLabel(action.urgency)}</span>
      <p style="margin: 0; font-size: 14px; color: #111827;">${action.action}</p>
    </div>
`;
  }

  html += `
  </div>

  <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Internal Use Only • BD Accelerate</p>
  </div>
</div>
`;

  return html;
}
