import { useState } from 'react';
import { AudienceSelector } from './AudienceSelector';
import { SendingProgress } from './SendingProgress';
import { useSendCampaign } from '@/hooks/useSendCampaign';
import { useEmailContacts } from '@/hooks/useEmailContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send, AlertTriangle, CheckCircle, TestTube } from 'lucide-react';
import type { EmailCampaign } from '@/types/email';

interface SendCampaignPanelProps {
  campaign: EmailCampaign & {
    sender_profile_id?: string | null;
    sender_profiles?: {
      name: string;
      from_email: string;
    } | null;
  };
  senderProfileId: string | null;
}

export function SendCampaignPanel({ campaign, senderProfileId }: SendCampaignPanelProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'complete' | 'error'>('idle');
  const [sendingResult, setSendingResult] = useState<{
    sent: number;
    failed: number;
    errors: string[];
  }>({ sent: 0, failed: 0, errors: [] });

  const { sendCampaign, isSending } = useSendCampaign();
  const { getEligibleContacts } = useEmailContacts();
  const eligibleContacts = getEligibleContacts();

  const isApproved = campaign.status === 'approved';
  const hasSenderProfile = !!senderProfileId;
  const hasRecipients = selectedRecipients.length > 0;

  const canSend = isApproved && hasSenderProfile && hasRecipients && !isSending;

  const handleSend = async () => {
    if (!canSend) return;

    setSendingStatus('sending');
    setSendingResult({ sent: 0, failed: 0, errors: [] });

    try {
      const result = await sendCampaign.mutateAsync({
        campaignId: campaign.id,
        recipientIds: selectedRecipients,
        testMode,
      });

      setSendingResult({
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
      });
      setSendingStatus('complete');
    } catch (error) {
      setSendingResult({
        sent: 0,
        failed: selectedRecipients.length,
        errors: [(error as Error).message],
      });
      setSendingStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Alerts */}
      {!isApproved && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Campaign Not Approved</AlertTitle>
          <AlertDescription>
            This campaign must be approved before it can be sent. Go to the Approve tab to review and approve the content.
          </AlertDescription>
        </Alert>
      )}

      {isApproved && !hasSenderProfile && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Sender Profile</AlertTitle>
          <AlertDescription>
            Please configure a sender profile in the Sender tab before sending.
          </AlertDescription>
        </Alert>
      )}

      {isApproved && hasSenderProfile && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Ready to Send</AlertTitle>
          <AlertDescription>
            Campaign is approved and ready. Select recipients below and click Send.
          </AlertDescription>
        </Alert>
      )}

      {/* Sender Info */}
      {campaign.sender_profiles && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sending As</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Send className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{campaign.sender_profiles.name}</p>
                <p className="text-sm text-muted-foreground">
                  &lt;{campaign.sender_profiles.from_email}&gt;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience Selector */}
      <AudienceSelector
        selectedIds={selectedRecipients}
        onSelectionChange={setSelectedRecipients}
        disabled={!isApproved || isSending}
      />

      {/* Send Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Send Options</CardTitle>
          <CardDescription>
            Configure how you want to send this campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="testMode"
              checked={testMode}
              onCheckedChange={(checked) => setTestMode(checked as boolean)}
              disabled={isSending}
            />
            <Label htmlFor="testMode" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test Mode (send to first recipient only)
            </Label>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Sending...
                </>
              ) : testMode ? (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedRecipients.length} Recipients
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sending Progress */}
      <SendingProgress
        status={sendingStatus}
        sent={sendingResult.sent}
        failed={sendingResult.failed}
        total={testMode ? 1 : selectedRecipients.length}
        errors={sendingResult.errors}
      />
    </div>
  );
}
