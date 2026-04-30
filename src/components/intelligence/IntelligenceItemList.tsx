import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntelligenceItems } from '@/hooks/useIntelligenceItems';
import { ExternalLink, Star, StarOff, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CITIES = ['All', 'Bangalore', 'Mumbai', 'Delhi/Noida', 'Indore'];
const INTELLIGENCE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'lease_expiry', label: 'Lease Expiry' },
  { value: 'funded_companies', label: 'Recently Funded' },
  { value: 'competitor', label: 'Competitor Movement' },
  { value: 'pricing', label: 'Market Pricing' },
  { value: 'strategic', label: 'Strategic Notes' },
];

function getTypeColor(type: string | null) {
  switch (type) {
    case 'lease_expiry':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'funded_companies':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'competitor':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'pricing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'strategic':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function IntelligenceItemList() {
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { items, isLoading, updateItem, deleteItem } = useIntelligenceItems({
    city: cityFilter !== 'All' ? cityFilter : undefined,
    intelligence_type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const toggleActionable = (item: typeof items[0]) => {
    updateItem.mutate({ id: item.id, is_actionable: !item.is_actionable });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Intelligence Feed</CardTitle>
          <div className="flex gap-2">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTELLIGENCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading intelligence...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No intelligence items found.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-colors ${
                  item.is_actionable ? 'border-primary/50 bg-primary/5' : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.city && (
                        <Badge variant="outline" className="text-xs">
                          {item.city}
                        </Badge>
                      )}
                      {item.intelligence_type && (
                        <Badge className={`text-xs ${getTypeColor(item.intelligence_type)}`}>
                          {INTELLIGENCE_TYPES.find(t => t.value === item.intelligence_type)?.label || item.intelligence_type}
                        </Badge>
                      )}
                      {item.micro_market && (
                        <span className="text-xs text-muted-foreground">• {item.micro_market}</span>
                      )}
                    </div>
                    <h4 className="font-medium text-sm leading-tight mb-1">{item.headline}</h4>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {item.relevance_date
                        ? new Date(item.relevance_date).toLocaleDateString()
                        : formatDistanceToNow(new Date(item.created_at)) + ' ago'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActionable(item)}
                      title={item.is_actionable ? 'Unmark as actionable' : 'Mark as actionable'}
                    >
                      {item.is_actionable ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    {item.source_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(item.source_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
