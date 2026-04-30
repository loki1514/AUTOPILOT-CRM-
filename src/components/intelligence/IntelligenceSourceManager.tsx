import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIntelligenceSources, CreateIntelligenceSourceInput } from '@/hooks/useIntelligenceSources';
import { Plus, Rss, FileText, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi/Noida', 'Indore'];
const INTELLIGENCE_TYPES = [
  { value: 'lease_expiry', label: 'Lease Expiry' },
  { value: 'funded_companies', label: 'Recently Funded' },
  { value: 'competitor', label: 'Competitor Movement' },
  { value: 'pricing', label: 'Market Pricing' },
  { value: 'strategic', label: 'Strategic Notes' },
];

export function IntelligenceSourceManager() {
  const { sources, isLoading, createSource, deleteSource, fetchRSS } = useIntelligenceSources();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateIntelligenceSourceInput>({
    source_type: 'rss',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSource.mutateAsync(formData);
    setIsOpen(false);
    setFormData({ source_type: 'rss', name: '' });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'rss':
        return <Rss className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Intelligence Sources</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Intelligence Source</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select
                  value={formData.source_type}
                  onValueChange={(v) => setFormData({ ...formData, source_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rss">RSS Feed</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Google News - CRE India"
                  required
                />
              </div>

              {formData.source_type === 'rss' && (
                <div className="space-y-2">
                  <Label>RSS URL</Label>
                  <Input
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://news.google.com/rss/..."
                    type="url"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={formData.city || ''}
                    onValueChange={(v) => setFormData({ ...formData, city: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Intelligence Type</Label>
                  <Select
                    value={formData.intelligence_type || ''}
                    onValueChange={(v) => setFormData({ ...formData, intelligence_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
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

              <div className="space-y-2">
                <Label>Micro-market (optional)</Label>
                <Input
                  value={formData.micro_market || ''}
                  onChange={(e) => setFormData({ ...formData, micro_market: e.target.value })}
                  placeholder="e.g., ORR, BKC, Noida Sec 62"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSource.isPending}>
                  {createSource.isPending ? 'Adding...' : 'Add Source'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sources...</p>
        ) : sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sources configured yet.</p>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    {getSourceIcon(source.source_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{source.name}</span>
                      {source.city && (
                        <Badge variant="secondary" className="text-xs">
                          {source.city}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {source.last_fetched_at
                        ? `Last fetched ${formatDistanceToNow(new Date(source.last_fetched_at))} ago`
                        : 'Never fetched'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {source.source_type === 'rss' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchRSS.mutate(source.id)}
                      disabled={fetchRSS.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 ${fetchRSS.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  {source.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(source.url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSource.mutate(source.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
