import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/stage-badge';
import type { Lead } from '@/types';

interface RecentLeadsProps {
  leads: Lead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  const recentLeads = leads.slice(0, 5);

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold">Recent Leads</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/leads" className="gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="divide-y">
        {recentLeads.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No leads yet. Create your first lead to get started.
          </div>
        ) : (
          recentLeads.map((lead) => (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{lead.client_name}</p>
                  <p className="text-sm text-muted-foreground">{lead.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {lead.headcount}
                </div>
                <StageBadge stage={lead.stage} />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
