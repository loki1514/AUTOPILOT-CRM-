import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { OutboxEntry, OutboxStatus, StatusTimelineEntry } from '@/types/email';

interface OutboxFilters {
  campaignId?: string;
  status?: OutboxStatus;
  dateFrom?: string;
  dateTo?: string;
}

export function useOutbox(filters?: OutboxFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['outbox', user?.id, filters],
    queryFn: async (): Promise<OutboxEntry[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('email_outbox')
        .select(`
          *,
          email_campaigns!inner(user_id)
        `)
        .eq('email_campaigns.user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.campaignId) {
        query = query.eq('campaign_id', filters.campaignId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      return (data || []).map((entry) => ({
        id: entry.id,
        campaign_id: entry.campaign_id,
        recipient_id: entry.recipient_id,
        resend_email_id: entry.resend_email_id,
        from_name: entry.from_name,
        from_email: entry.from_email,
        reply_to: entry.reply_to,
        to_email: entry.to_email,
        cc_emails: entry.cc_emails,
        bcc_emails: entry.bcc_emails,
        subject: entry.subject,
        html_snapshot: entry.html_snapshot,
        status: entry.status as OutboxStatus,
        status_timeline: (Array.isArray(entry.status_timeline) ? entry.status_timeline : []) as unknown as StatusTimelineEntry[],
        sent_at: entry.sent_at,
        delivered_at: entry.delivered_at,
        opened_at: entry.opened_at,
        clicked_at: entry.clicked_at,
        created_at: entry.created_at,
      })) as OutboxEntry[];
    },
    enabled: !!user?.id,
  });
}

export function useOutboxEntry(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['outbox-entry', id],
    queryFn: async (): Promise<OutboxEntry | null> => {
      if (!id || !user?.id) return null;

      const { data, error } = await supabase
        .from('email_outbox')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        status: data.status as OutboxStatus,
        status_timeline: (Array.isArray(data.status_timeline) ? data.status_timeline : []) as unknown as StatusTimelineEntry[],
      } as OutboxEntry;
    },
    enabled: !!id && !!user?.id,
  });
}
