import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog';

export default function Campaigns() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create AI-powered email campaigns with human approval before sending
          </p>
        </div>

        <CampaignList onCreateNew={() => setCreateDialogOpen(true)} />
        
        <CreateCampaignDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </MainLayout>
  );
}
