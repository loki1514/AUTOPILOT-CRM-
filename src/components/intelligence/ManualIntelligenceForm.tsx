import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useIntelligenceItems, CreateIntelligenceItemInput } from '@/hooks/useIntelligenceItems';
import { Plus } from 'lucide-react';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi/Noida', 'Indore'];
const INTELLIGENCE_TYPES = [
  { value: 'lease_expiry', label: 'Lease Expiry' },
  { value: 'funded_companies', label: 'Recently Funded' },
  { value: 'competitor', label: 'Competitor Movement' },
  { value: 'pricing', label: 'Market Pricing' },
  { value: 'strategic', label: 'Strategic Notes' },
];

export function ManualIntelligenceForm() {
  const { createItem } = useIntelligenceItems();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<CreateIntelligenceItemInput>({
    headline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem.mutateAsync(formData);
    setFormData({ headline: '' });
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <Card>
        <CardContent className="py-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsExpanded(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Intelligence
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Manual Intelligence</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Headline *</Label>
            <Input
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="e.g., Large IT company lease expiring in Q2 2026"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief description of the intelligence..."
              rows={3}
            />
          </div>

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
            <Label>Micro-market</Label>
            <Input
              value={formData.micro_market || ''}
              onChange={(e) => setFormData({ ...formData, micro_market: e.target.value })}
              placeholder="e.g., ORR, BKC, Noida Sec 62"
            />
          </div>

          <div className="space-y-2">
            <Label>Source URL (optional)</Label>
            <Input
              value={formData.source_url || ''}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label>Action Notes</Label>
            <Textarea
              value={formData.action_notes || ''}
              onChange={(e) => setFormData({ ...formData, action_notes: e.target.value })}
              placeholder="Suggested BD actions based on this intelligence..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_actionable || false}
              onCheckedChange={(v) => setFormData({ ...formData, is_actionable: v })}
            />
            <Label>Mark as Actionable</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsExpanded(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createItem.isPending}>
              {createItem.isPending ? 'Adding...' : 'Add Intelligence'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
