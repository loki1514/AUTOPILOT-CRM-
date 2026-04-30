import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from '@/hooks/useProperties';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Properties() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);

  const { data: properties = [], isLoading } = useProperties();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();

  const filteredProperties = properties.filter((p) =>
    p.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.developer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (data: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createProperty.mutateAsync(data);
      toast({ title: 'Property created successfully' });
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: 'Failed to create property', variant: 'destructive' });
    }
  };

  const handleUpdate = async (data: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingProperty) return;
    try {
      await updateProperty.mutateAsync({ id: editingProperty.id, ...data });
      toast({ title: 'Property updated successfully' });
      setEditingProperty(null);
    } catch (error) {
      toast({ title: 'Failed to update property', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingProperty) return;
    try {
      await deleteProperty.mutateAsync(deletingProperty.id);
      toast({ title: 'Property deleted successfully' });
      setDeletingProperty(null);
    } catch (error) {
      toast({ title: 'Failed to delete property', variant: 'destructive' });
    }
  };

  const handleCreateBrochure = (property: Property) => {
    // Navigate to brochure generator with property data pre-filled
    navigate('/tools/brochure', { state: { property } });
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4.5rem)]">
        <div className="border-b border-border bg-card px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Property Library</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage reusable property listings for quick brochure generation
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        <div className="p-8">
          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Properties Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No properties found' : 'No properties yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first property to start building your library'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onEdit={setEditingProperty}
                  onDelete={setDeletingProperty}
                  onCreateBrochure={handleCreateBrochure}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <PropertyForm
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={createProperty.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={(open) => !open && setEditingProperty(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          {editingProperty && (
            <PropertyForm
              initialData={editingProperty}
              propertyId={editingProperty.id}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProperty(null)}
              isSubmitting={updateProperty.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProperty} onOpenChange={(open) => !open && setDeletingProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingProperty?.property_name}" from your library.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
