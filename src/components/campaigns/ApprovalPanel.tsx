import { useState } from 'react';
import { CheckCircle, Lock, AlertCircle, Loader2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useEmailTemplate } from '@/hooks/useEmailTemplate';
import { useSenderProfiles } from '@/hooks/useSenderProfiles';
import { format } from 'date-fns';
import type { EmailCampaign } from '@/types/email';

interface ApprovalPanelProps {
  campaign: EmailCampaign;
  senderProfileId: string | null;
}

export function ApprovalPanel({ campaign, senderProfileId }: ApprovalPanelProps) {
  const { approveCampaign, updateCampaign } = useCampaigns();
  const { template, isLoading: templateLoading } = useEmailTemplate(campaign.id);
  const { profiles } = useSenderProfiles();
  const [isApproving, setIsApproving] = useState(false);

  const selectedProfile = profiles.find((p) => p.id === senderProfileId);
  const isApproved = campaign.status === 'approved';
  const isDraft = campaign.status === 'draft';

  const canApprove = () => {
    if (!template) return { ok: false, reason: 'No email template created' };
    if (!template.subject) return { ok: false, reason: 'Subject line is required' };
    if (!template.blocks || template.blocks.length === 0)
      return { ok: false, reason: 'Email content is required' };
    if (!senderProfileId) return { ok: false, reason: 'Sender profile must be selected' };
    return { ok: true, reason: '' };
  };

  const approvalCheck = canApprove();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveCampaign.mutateAsync(campaign.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleResetToDraft = async () => {
    await updateCampaign.mutateAsync({
      id: campaign.id,
      status: 'draft',
    });
  };

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isApproved ? (
              <>
                <Lock className="h-5 w-5 text-green-500" />
                Campaign Approved & Locked
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Pending Approval
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isApproved
              ? 'Content is locked. Any edits will reset approval.'
              : 'Review your campaign before approving.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isApproved && campaign.approved_at && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Approved on {format(new Date(campaign.approved_at), 'PPp')}</span>
              </div>
              {selectedProfile && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Sender: {selectedProfile.name} &lt;{selectedProfile.from_email}&gt;
                  </span>
                </div>
              )}
            </div>
          )}

          {!isApproved && !approvalCheck.ok && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cannot Approve</AlertTitle>
              <AlertDescription>{approvalCheck.reason}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {template && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>Review your email before approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-background">
              {/* Email header preview */}
              <div className="border-b pb-3 mb-4 space-y-1">
                {selectedProfile && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">From:</span>{' '}
                    <span className="font-medium">
                      {selectedProfile.name} &lt;{selectedProfile.from_email}&gt;
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Subject:</span>{' '}
                  <span className="font-medium">{template.subject || '(No subject)'}</span>
                </div>
              </div>

              {/* Email content preview */}
              <div className="space-y-4">
                {template.blocks.map((block, index) => (
                  <div key={index}>
                    {block.type === 'heading' && (
                      <h2 className="text-xl font-bold">{block.content}</h2>
                    )}
                    {block.type === 'paragraph' && <p>{block.content}</p>}
                    {block.type === 'bullets' && (
                      <ul className="list-disc pl-5 space-y-1">
                        {block.items?.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    )}
                    {block.type === 'image' && block.imageUrl && (
                      <img
                        src={block.imageUrl}
                        alt={block.altText || ''}
                        className="max-w-full rounded"
                      />
                    )}
                    {block.type === 'cta' && (
                      <div className="text-center py-2">
                        <span className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                          {block.buttonText}
                        </span>
                      </div>
                    )}
                    {block.type === 'divider' && <hr className="border-t" />}
                    {block.type === 'footer' && (
                      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                        {block.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isApproved ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Reset to Draft</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will unlock the campaign for editing and remove the approval.
                  You'll need to approve it again before sending.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetToDraft}>
                  Reset to Draft
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!approvalCheck.ok || isApproving}>
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Lock
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Campaign?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will lock the campaign content. Any edits after approval will
                  reset the status back to draft.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove}>
                  Approve & Lock
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
