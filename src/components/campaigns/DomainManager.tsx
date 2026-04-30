import { useState } from 'react';
import { useSendingDomains, useAddSendingDomain, useVerifySendingDomain, useDeleteSendingDomain } from '@/hooks/useSendingDomains';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { DomainStatus } from '@/types/email';
import { DnsRecordsTable } from './DnsRecordsTable';

function DomainStatusBadge({ status }: { status: DomainStatus }) {
  switch (status) {
    case 'verified':
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
  }
}


function AddDomainDialog() {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const addDomain = useAddSendingDomain();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await addDomain.mutateAsync({ domain, fromEmail, fromName });
      if (result.domain?.status === 'verified') {
        toast.success('Domain already verified and ready to use!');
      } else {
        toast.success('Domain added! Please configure the DNS records.');
      }
      setOpen(false);
      setDomain('');
      setFromEmail('');
      setFromName('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Auto-fill from email when domain changes
  const handleDomainChange = (value: string) => {
    setDomain(value);
    if (value && !fromEmail) {
      setFromEmail(`hello@${value.replace(/^https?:\/\//, '').toLowerCase()}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Sending Domain
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Sending Domain</DialogTitle>
          <DialogDescription>
            Add a subdomain for sending emails. Root domains are not allowed to protect your inbox deliverability.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Subdomain Required</AlertTitle>
              <AlertDescription>
                Use a subdomain like <code className="bg-muted px-1 rounded">mail.yourdomain.com</code> or <code className="bg-muted px-1 rounded">notify.yourdomain.com</code>.
                Do not use your primary inbox domain.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Sending Subdomain</Label>
              <Input
                id="domain"
                placeholder="mail.yourdomain.com"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="hello@mail.yourdomain.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name (optional)</Label>
              <Input
                id="fromName"
                placeholder="Your Company"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addDomain.isPending}>
              {addDomain.isPending ? 'Adding...' : 'Add Domain'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DomainManager() {
  const { data: domains, isLoading } = useSendingDomains();
  const verifyDomain = useVerifySendingDomain();
  const deleteDomain = useDeleteSendingDomain();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const handleVerify = async (domainId: string) => {
    try {
      const result = await verifyDomain.mutateAsync(domainId);
      if (result.status === 'verified') {
        toast.success('Domain verified successfully!');
      } else if (result.status === 'failed') {
        toast.error('Verification failed. Please check your DNS records.');
      } else {
        toast.info('Verification in progress. DNS may take up to 72 hours to propagate.');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (domainId: string) => {
    try {
      await deleteDomain.mutateAsync(domainId);
      toast.success('Domain removed');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading domains...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sending Domains</CardTitle>
          <CardDescription>
            Manage your verified sending domains. Only subdomains are allowed.
          </CardDescription>
        </div>
        <AddDomainDialog />
      </CardHeader>
      <CardContent>
        {!domains || domains.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No sending domains configured</p>
            <p className="text-sm">Add a subdomain to start sending email campaigns.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{domain.domain}</span>
                      <DomainStatusBadge status={domain.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {domain.from_name ? `${domain.from_name} <${domain.from_email}>` : domain.from_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {domain.status !== 'verified' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(domain.id)}
                        disabled={verifyDomain.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${verifyDomain.isPending ? 'animate-spin' : ''}`} />
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
                    >
                      {expandedDomain === domain.id ? 'Hide DNS' : 'Show DNS'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(domain.id)}
                      disabled={deleteDomain.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {expandedDomain === domain.id && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-3">Configure these DNS records:</p>
                    <DnsRecordsTable records={domain.dns_records} domain={domain.domain} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
