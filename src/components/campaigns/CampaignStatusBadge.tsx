import { Badge } from '@/components/ui/badge';
import type { CampaignStatus } from '@/types/email';

const statusConfig: Record<CampaignStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  sending: { label: 'Sending', variant: 'outline' },
  sent: { label: 'Sent', variant: 'default' },
  paused: { label: 'Paused', variant: 'destructive' },
};

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
