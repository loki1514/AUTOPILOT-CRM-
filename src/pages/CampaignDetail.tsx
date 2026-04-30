import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCampaign, useCampaigns } from '@/hooks/useCampaigns';
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge';
import { DomainManager } from '@/components/campaigns/DomainManager';
import { AIDraftGenerator } from '@/components/campaigns/AIDraftGenerator';
import { EmailBlockEditor } from '@/components/campaigns/EmailBlockEditor';
import { SenderProfileManager } from '@/components/campaigns/SenderProfileManager';
import { SenderProfileSelector } from '@/components/campaigns/SenderProfileSelector';
import { ReplyToConfig } from '@/components/campaigns/ReplyToConfig';
import { CcBccConfig } from '@/components/campaigns/CcBccConfig';
import { ApprovalPanel } from '@/components/campaigns/ApprovalPanel';
import { SendCampaignPanel } from '@/components/campaigns/SendCampaignPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Clock, Wand2, Edit3, CheckCircle, Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ReplyToMode } from '@/types/email';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading, error } = useCampaign(id);
  const { updateCampaign } = useCampaigns();

  // Local state for campaign settings
  const [senderProfileId, setSenderProfileId] = useState<string | null>(null);
  const [replyToMode, setReplyToMode] = useState<ReplyToMode>('shared');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);

  // Sync state from campaign data
  useEffect(() => {
    if (campaign) {
      // Handle extended campaign fields (cast to any for new fields)
      const extCampaign = campaign as any;
      setSenderProfileId(extCampaign.sender_profile_id || null);
      setReplyToMode(extCampaign.reply_to_mode || 'shared');
      setReplyToEmail(extCampaign.reply_to_email || '');
      setCcEmails(extCampaign.cc_emails || []);
      setBccEmails(extCampaign.bcc_emails || []);
    }
  }, [campaign]);

  const handleSaveSettings = async () => {
    if (!campaign) return;
    
    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        sender_profile_id: senderProfileId,
        reply_to_mode: replyToMode,
        reply_to_email: replyToEmail || null,
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
      });
      toast.success('Campaign settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleEditContent = () => {
    // If campaign is approved and user edits, reset to draft
    if (campaign?.status === 'approved') {
      updateCampaign.mutate({
        id: campaign.id,
        status: 'draft',
      });
      toast.info('Campaign reset to draft due to content edit');
    }
  };

  const isApproved = campaign?.status === 'approved';

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !campaign) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button variant="outline" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            {campaign.purpose && (
              <p className="text-muted-foreground mt-1">{campaign.purpose}</p>
            )}
          </div>
        </div>

        {/* Campaign Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Overview of your campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(campaign.created_at), 'PPp')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(campaign.updated_at), 'PPp')}
                  </p>
                </div>
              </div>
              {campaign.approved_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(campaign.approved_at), 'PPp')}
                    </p>
                  </div>
                </div>
              )}
              {campaign.sent_at && (
                <div className="flex items-center gap-3">
                  <Send className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sent</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(campaign.sent_at), 'PPp')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wizard Tabs */}
        <Tabs defaultValue="draft" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">AI Draft</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </TabsTrigger>
            <TabsTrigger value="approve" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Approve</span>
            </TabsTrigger>
            <TabsTrigger value="sender" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sender</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draft">
            <Card>
              <CardHeader>
                <CardTitle>AI Draft Generator</CardTitle>
                <CardDescription>
                  Describe your email idea and let AI generate a structured draft
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIDraftGenerator campaignId={id!} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Visual Email Editor</CardTitle>
                <CardDescription>
                  Drag and drop blocks to build your email. Changes auto-save.
                  {isApproved && (
                    <span className="text-amber-500 ml-2">
                      (Editing will reset approval)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailBlockEditor
                  campaignId={id!}
                  isReadOnly={false}
                  onEdit={handleEditContent}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approve">
            <ApprovalPanel campaign={campaign} senderProfileId={senderProfileId} />
          </TabsContent>

          <TabsContent value="sender">
            <div className="space-y-6">
              {/* Sender Profile Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Sender Settings</CardTitle>
                  <CardDescription>
                    Configure who this campaign is sent from and how replies are handled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SenderProfileSelector
                    value={senderProfileId}
                    onChange={setSenderProfileId}
                    disabled={isApproved}
                  />

                  <ReplyToConfig
                    mode={replyToMode}
                    email={replyToEmail}
                    onModeChange={setReplyToMode}
                    onEmailChange={setReplyToEmail}
                    disabled={isApproved}
                  />

                  <CcBccConfig
                    ccEmails={ccEmails}
                    bccEmails={bccEmails}
                    onCcChange={setCcEmails}
                    onBccChange={setBccEmails}
                    disabled={isApproved}
                  />

                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateCampaign.isPending || isApproved}
                  >
                    Save Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Sender Profile Manager */}
              <SenderProfileManager />

              {/* Domain Manager */}
              <DomainManager />
            </div>
          </TabsContent>

          <TabsContent value="send">
            <SendCampaignPanel
              campaign={{
                ...campaign,
                sender_profile_id: senderProfileId,
                sender_profiles: senderProfileId ? {
                  name: 'Sender Profile',
                  from_email: 'configured',
                } : null,
              }}
              senderProfileId={senderProfileId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
