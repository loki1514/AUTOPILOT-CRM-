import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/atmosphere/PageHeader';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { SpocList } from '@/components/leads/SpocList';
import { LeadForm } from '@/components/leads/LeadForm';
import { useCreateLead } from '@/hooks/useLeads';
import { useLeadsWithContacts } from '@/hooks/useLeadsWithContacts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Target } from 'lucide-react';

export default function Leads() {
  const navigate = useNavigate();
  const { data: leads = [], isLoading } = useLeadsWithContacts();
  const createLead = useCreateLead();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const handleCreateLead = async (values: any) => {
    try {
      const lead = await createLead.mutateAsync(values);
      setShowCreateDialog(false);
      toast.success('Lead created successfully');
      navigate(`/leads/${lead.id}`);
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  return (
    <MainLayout>
      <PageHeader
        eyebrow="Pipeline · Leads"
        title="Leads"
        subtitle={`${leads.length} opportunities in motion`}
      />
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Leads
            </TabsTrigger>
            <TabsTrigger value="spoc" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              SPOC List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            <LeadsTable
              leads={leads}
              onCreateNew={() => setShowCreateDialog(true)}
            />
          </TabsContent>

          <TabsContent value="spoc" className="mt-6 space-y-6">
            <SpocList leads={leads} />
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <LeadForm
              onSubmit={handleCreateLead}
              onCancel={() => setShowCreateDialog(false)}
              isLoading={createLead.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
