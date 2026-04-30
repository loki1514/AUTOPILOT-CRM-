import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyKanban } from '@/components/properties/PropertyKanban';
import { AddPropertyDialog } from '@/components/properties/AddPropertyDialog';
import { useLeadProperties, useAssignPropertyToLead, useUpdateLeadPropertyStage, useRemovePropertyFromLead } from '@/hooks/useLeadProperties';
import { Property, LeadProperty, LeadPropertyStage } from '@/types/property';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeadPropertiesTabProps {
  leadId: string;
}

export function LeadPropertiesTab({ leadId }: LeadPropertiesTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: leadProperties = [], isLoading } = useLeadProperties(leadId);
  const assignProperty = useAssignPropertyToLead();
  const updateStage = useUpdateLeadPropertyStage();
  const removeProperty = useRemovePropertyFromLead();

  const handleAddProperty = async (property: Property) => {
    // Check if already assigned
    if (leadProperties.some((lp) => lp.property_id === property.id)) {
      toast({
        title: 'Already assigned',
        description: 'This property is already assigned to this lead',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assignProperty.mutateAsync({
        leadId,
        propertyId: property.id,
        stage: 'available',
      });
      toast({
        title: 'Property added',
        description: `${property.property_name} has been added`,
      });
    } catch (error) {
      toast({
        title: 'Failed to add property',
        variant: 'destructive',
      });
    }
  };

  const handleStageChange = async (id: string, stage: LeadPropertyStage) => {
    try {
      await updateStage.mutateAsync({ id, stage, leadId });
    } catch (error) {
      toast({
        title: 'Failed to update stage',
        variant: 'destructive',
      });
    }
  };

  const handleCreateBrochure = (leadProperty: LeadProperty) => {
    if (!leadProperty.property) return;
    // Navigate to brochure generator with property data pre-filled
    navigate('/tools/brochure', { 
      state: { 
        property: leadProperty.property,
        leadPropertyId: leadProperty.id,
        leadId,
      } 
    });
  };

  const handleRemoveProperty = async (id: string) => {
    try {
      await removeProperty.mutateAsync({ id, leadId });
      toast({ title: 'Property removed' });
    } catch (error) {
      toast({
        title: 'Failed to remove property',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PropertyKanban
        leadProperties={leadProperties}
        onStageChange={handleStageChange}
        onAddProperty={() => setIsAddDialogOpen(true)}
        onCreateBrochure={handleCreateBrochure}
        onRemoveProperty={handleRemoveProperty}
      />

      <AddPropertyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSelectExisting={handleAddProperty}
        onCreateNew={handleAddProperty}
      />
    </div>
  );
}
