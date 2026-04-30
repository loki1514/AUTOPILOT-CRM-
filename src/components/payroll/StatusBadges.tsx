import { PayslipRunStatus, PayslipJobStatus } from '@/types/payslip';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileCheck, 
  Send,
  AlertCircle
} from 'lucide-react';

interface RunStatusBadgeProps {
  status: PayslipRunStatus;
}

const runStatusConfig: Record<PayslipRunStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ReactNode;
}> = {
  draft: { label: 'Draft', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  validating: { label: 'Validating', variant: 'outline', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  validated: { label: 'Validated', variant: 'outline', icon: <FileCheck className="h-3 w-3" /> },
  sending: { label: 'Sending', variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  partial: { label: 'Partial', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  completed: { label: 'Completed', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const config = runStatusConfig[status];
  
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

interface JobStatusBadgeProps {
  status: PayslipJobStatus;
}

const jobStatusConfig: Record<PayslipJobStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ReactNode;
}> = {
  pending: { label: 'Pending', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  processing: { label: 'Processing', variant: 'outline', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  sent: { label: 'Sent', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const config = jobStatusConfig[status];
  
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  
  if (confidence >= 85) {
    variant = 'default';
  } else if (confidence >= 70) {
    variant = 'outline';
  } else {
    variant = 'destructive';
  }
  
  return (
    <Badge variant={variant}>
      {confidence}% match
    </Badge>
  );
}
