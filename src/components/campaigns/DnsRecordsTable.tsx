import { DnsRecord } from '@/types/email';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Copy, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';

interface DnsRecordsTableProps {
  records: DnsRecord[];
  domain: string;
}

function RecordStatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'verified':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case 'failed':
    case 'not_started':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <XCircle className="h-4 w-4 text-destructive" />
            </TooltipTrigger>
            <TooltipContent>
              {status === 'failed' ? 'Verification failed' : 'Not configured'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Clock className="h-4 w-4 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent>Pending verification</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={copyToClipboard}
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}

// Extract the registrar-friendly name (without root domain appended)
function getRegistrarName(fullName: string, rootDomain: string): string {
  // If the name ends with the root domain, strip it
  const suffix = `.${rootDomain}`;
  if (fullName.endsWith(suffix)) {
    return fullName.slice(0, -suffix.length);
  }
  return fullName;
}

// Get the full FQDN
function getFullFqdn(name: string, rootDomain: string): string {
  if (name.endsWith(rootDomain)) {
    return name;
  }
  return `${name}.${rootDomain}`;
}

export function DnsRecordsTable({ records, domain }: DnsRecordsTableProps) {
  // Extract root domain (e.g., "autopilotoffices.com" from "mail.autopilotoffices.com")
  const parts = domain.split('.');
  const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : domain;

  if (!records || records.length === 0) {
    return <p className="text-sm text-muted-foreground">No DNS records available</p>;
  }

  return (
    <div className="space-y-3">
      {/* Registrar guidance */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm">
        <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
          ⚠️ Important: Registrar Configuration
        </p>
        <p className="text-amber-700 dark:text-amber-300 text-xs mb-2">
          Most registrars (Hostinger, GoDaddy, Namecheap) <strong>automatically append</strong> your root domain.
          Use the <strong>"At Registrar"</strong> column values to avoid double-appending.
        </p>
        <p className="text-amber-600 dark:text-amber-400 text-xs">
          Example: Enter <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">resend._domainkey.mail</code> NOT the full FQDN.
        </p>
      </div>

      {/* DNS Records Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead className="w-16">Type</TableHead>
              <TableHead className="min-w-[180px]">Name (At Registrar)</TableHead>
              <TableHead className="min-w-[200px]">Full FQDN</TableHead>
              <TableHead className="min-w-[200px]">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => {
              const registrarName = getRegistrarName(record.name, rootDomain);
              const fullFqdn = getFullFqdn(record.name, rootDomain);
              const displayName = record.type === 'MX' && record.priority 
                ? `${registrarName} (pri: ${record.priority})`
                : registrarName;

              return (
                <TableRow key={index}>
                  <TableCell>
                    <RecordStatusIcon status={record.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {record.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="font-mono text-xs break-all bg-muted px-1 py-0.5 rounded">
                        {displayName}
                      </code>
                      <CopyButton value={registrarName} label="Name" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground break-all">
                        {fullFqdn}
                      </span>
                      <CopyButton value={fullFqdn} label="Full FQDN" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="font-mono text-xs break-all max-w-[300px] truncate">
                        {record.value}
                      </code>
                      <CopyButton value={record.value} label="Value" />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* DNS Checker Link */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Verify your records propagated:</span>
        <a
          href={`https://dnschecker.org/#TXT/${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          DNSChecker.org <ExternalLink className="h-3 w-3" />
        </a>
        <span className="text-muted-foreground/50">|</span>
        <a
          href={`https://mxtoolbox.com/SuperTool.aspx?action=txt%3a${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          MXToolbox <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
