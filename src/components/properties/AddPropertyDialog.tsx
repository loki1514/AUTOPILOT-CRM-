import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyForm } from './PropertyForm';
import { PropertyCard } from './PropertyCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Property } from '@/types/property';
import { useProperties, useCreateProperty } from '@/hooks/useProperties';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExisting: (property: Property) => void;
  onCreateNew: (property: Property) => void;
}

export function AddPropertyDialog({
  open,
  onOpenChange,
  onSelectExisting,
  onCreateNew,
}: AddPropertyDialogProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: properties = [], isLoading } = useProperties();
  const createProperty = useCreateProperty();

  const filteredProperties = properties.filter((p) =>
    p.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.developer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = async (data: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProperty = await createProperty.mutateAsync(data);
      toast({
        title: 'Property created',
        description: `${newProperty.property_name} has been added to the library`,
      });
      onCreateNew(newProperty);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to create property',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSelectExisting = (property: Property) => {
    onSelectExisting(property);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Property to Lead</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'existing' | 'new')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Select Existing</TabsTrigger>
            <TabsTrigger value="new">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'No properties match your search' : 'No properties in library yet'}
                    </p>
                    <Button variant="outline" onClick={() => setTab('new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Property
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pr-4">
                    {filteredProperties.map((property) => (
                      <div
                        key={property.id}
                        onClick={() => handleSelectExisting(property)}
                        className="cursor-pointer"
                      >
                        <PropertyCard property={property} compact />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <PropertyForm
              onSubmit={handleCreateNew}
              onCancel={() => onOpenChange(false)}
              isSubmitting={createProperty.isPending}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
