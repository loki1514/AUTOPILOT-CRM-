import { Property } from '@/types/property';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, IndianRupee, Pencil, Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onCreateBrochure?: (property: Property) => void;
  compact?: boolean;
  className?: string;
}

export function PropertyCard({
  property,
  onEdit,
  onDelete,
  onCreateBrochure,
  compact = false,
  className,
}: PropertyCardProps) {
  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className={cn('pb-2', compact && 'p-3')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn('font-semibold truncate', compact ? 'text-sm' : 'text-base')}>
              {property.property_name}
            </h3>
            {property.developer_name && (
              <p className="text-xs text-muted-foreground truncate">
                {property.developer_name}
              </p>
            )}
          </div>
          {property.images.length > 0 && (
            <div className={cn('rounded-lg overflow-hidden bg-muted flex-shrink-0', compact ? 'w-12 h-12' : 'w-16 h-16')}>
              <img
                src={property.images[0]}
                alt={property.property_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-3', compact && 'p-3 pt-0')}>
        {/* Location */}
        {property.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-3')}>
          {property.carpet_area && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{property.carpet_area.toLocaleString()} sq.ft</span>
            </div>
          )}
          {property.total_seats && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{property.total_seats} seats</span>
            </div>
          )}
          {property.rent_per_sqft && (
            <div className="flex items-center gap-1.5">
              <IndianRupee className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">₹{property.rent_per_sqft}/sqft</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {!compact && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 4).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-[10px] px-1.5 py-0">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 4 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{property.amenities.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete || onCreateBrochure) && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {onCreateBrochure && (
              <Button
                size="sm"
                variant="default"
                className="flex-1 h-7 text-xs"
                onClick={() => onCreateBrochure(property)}
              >
                <FileText className="h-3 w-3 mr-1" />
                Brochure
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onEdit(property)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(property)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
