import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Building, ChevronRight, MapPin, Users, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StageBadge } from '@/components/ui/stage-badge';
import type { Lead, LeadStage } from '@/types';

interface LeadsListProps {
  leads: Lead[];
  onCreateNew: () => void;
}

const stageFilters: { value: LeadStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lead', label: 'Leads' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
];

export function LeadsList({ leads, onCreateNew }: LeadsListProps) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.client_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.location?.toLowerCase().includes(search.toLowerCase());

    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            {stageFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStageFilter(filter.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  stageFilter === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-card divide-y">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No leads found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {leads.length === 0
                ? 'Get started by creating your first lead.'
                : 'Try adjusting your search or filter.'}
            </p>
            {leads.length === 0 && (
              <Button onClick={onCreateNew} className="mt-4">
                Create Lead
              </Button>
            )}
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {lead.client_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{lead.company}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {lead.location && (
                  <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {lead.location}
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {lead.headcount}
                </div>
                <StageBadge stage={lead.stage} />
                <span className="hidden sm:block text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
