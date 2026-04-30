import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignDialog({ open, onOpenChange }: CreateCampaignDialogProps) {
  const navigate = useNavigate();
  const { createCampaign } = useCampaigns();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        name: name.trim(),
        purpose: purpose.trim() || undefined,
      });
      toast.success('Campaign created successfully');
      onOpenChange(false);
      setName('');
      setPurpose('');
      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Start a new email campaign. You can add content and recipients later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 Product Launch"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose / Description</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What is this campaign about?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
