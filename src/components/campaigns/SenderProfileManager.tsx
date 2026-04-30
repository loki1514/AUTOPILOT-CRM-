import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useSenderProfiles } from '@/hooks/useSenderProfiles';
import { useSendingDomains } from '@/hooks/useSendingDomains';
import type { ReplyToMode } from '@/types/email';

export function SenderProfileManager() {
  const { profiles, isLoading, createProfile, updateProfile, deleteProfile } = useSenderProfiles();
  const domainsQuery = useSendingDomains();
  const domains = domainsQuery.data || [];
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter only verified domains
  const verifiedDomains = domains.filter((d) => d.status === 'verified');

  const [formData, setFormData] = useState({
    domain_id: '',
    name: '',
    from_email: '',
    default_reply_to_mode: 'shared' as ReplyToMode,
    default_reply_to_email: '',
  });

  const handleCreate = async () => {
    await createProfile.mutateAsync({
      domain_id: formData.domain_id,
      name: formData.name,
      from_email: formData.from_email,
      default_reply_to_mode: formData.default_reply_to_mode,
      default_reply_to_email: formData.default_reply_to_email || undefined,
    });
    setIsCreateOpen(false);
    setFormData({
      domain_id: '',
      name: '',
      from_email: '',
      default_reply_to_mode: 'shared',
      default_reply_to_email: '',
    });
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateProfile.mutateAsync({ id, is_active: isActive });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sender profile?')) {
      await deleteProfile.mutateAsync(id);
    }
  };

  const getEmailSuffix = (domainId: string) => {
    const domain = verifiedDomains.find((d) => d.id === domainId);
    return domain ? `@${domain.domain}` : '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sender Profiles</CardTitle>
            <CardDescription>
              Manage role-based sender identities for your campaigns
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={verifiedDomains.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Sender Profile</DialogTitle>
                <DialogDescription>
                  Create a role-based sender identity for your campaigns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Verified Domain *</Label>
                  <Select
                    value={formData.domain_id}
                    onValueChange={(v) => setFormData({ ...formData, domain_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {verifiedDomains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Profile Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Autopilot BD Team"
                  />
                </div>

                <div className="space-y-2">
                  <Label>From Email *</Label>
                  <div className="flex">
                    <Input
                      value={formData.from_email}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                      placeholder="e.g., bd"
                      className="rounded-r-none"
                    />
                    <div className="px-3 flex items-center bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                      {getEmailSuffix(formData.domain_id) || '@domain.com'}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full email: {formData.from_email}{getEmailSuffix(formData.domain_id)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Reply-To Mode</Label>
                  <Select
                    value={formData.default_reply_to_mode}
                    onValueChange={(v: ReplyToMode) =>
                      setFormData({ ...formData, default_reply_to_mode: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared">Shared (single inbox)</SelectItem>
                      <SelectItem value="individual">Individual (per user)</SelectItem>
                      <SelectItem value="custom">Custom (specify)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.default_reply_to_mode === 'shared' ||
                  formData.default_reply_to_mode === 'custom') && (
                  <div className="space-y-2">
                    <Label>Reply-To Email</Label>
                    <Input
                      type="email"
                      value={formData.default_reply_to_email}
                      onChange={(e) =>
                        setFormData({ ...formData, default_reply_to_email: e.target.value })
                      }
                      placeholder="e.g., bd@worksquare.in"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    !formData.domain_id ||
                    !formData.name ||
                    !formData.from_email ||
                    createProfile.isPending
                  }
                >
                  Create Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {verifiedDomains.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No verified domains available.</p>
            <p className="text-sm">
              Verify a sending domain first to create sender profiles.
            </p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No sender profiles yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.name}</span>
                    {profile.is_active ? (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile.name} &lt;{profile.from_email}&gt;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reply mode: {profile.default_reply_to_mode}
                    {profile.default_reply_to_email && ` → ${profile.default_reply_to_email}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={profile.is_active}
                    onCheckedChange={(checked) => handleToggleActive(profile.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(profile.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
