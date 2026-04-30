import { useState } from 'react';
import { Phone, Mail, Linkedin, MapPin, CalendarDays, RotateCcw } from 'lucide-react';
import type { Lead, BdRep } from '@/types';
import { IntentBadge } from './IntentBadge';
import { RepAvatar } from './RepAvatar';
import { cn } from '@/lib/utils';

interface FlippableDealCardProps {
  lead: Lead;
  rep?: BdRep | null;
  onOpen: (lead: Lead) => void;
  onQuickAction: (lead: Lead, type: 'call' | 'email' | 'note') => void;
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'won': return 'border-emerald-500/30 bg-emerald-500/5';
    case 'lost': return 'border-red-500/30 bg-red-500/5';
    case 'negotiation': return 'border-amber-500/30 bg-amber-500/5';
    case 'proposal': return 'border-blue-500/30 bg-blue-500/5';
    case 'qualified': return 'border-sky-500/30 bg-sky-500/5';
    case 'contacted': return 'border-violet-500/30 bg-violet-500/5';
    default: return 'border-white/10 bg-white/[0.02]';
  }
}

export function FlippableDealCard({ lead, rep, onOpen, onQuickAction }: FlippableDealCardProps) {
  const [flipped, setFlipped] = useState(false);

  const name = lead.full_name || lead.client_name || '—';
  const status = lead.crm_status || 'new';
  const linkedin = lead.linkedin_url;
  const email = lead.email;
  const phone = lead.phone;

  return (
    <div
      className="group relative h-56 w-full cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={cn(
          'relative h-full w-full rounded-xl border p-4 transition-all duration-500',
          getStatusColor(status)
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-4"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lead.company}</p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">{name}</p>
              </div>
              <IntentBadge score={lead.intent_score ?? 0} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {lead.office_size_needed && (
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px]">
                  <MapPin className="h-3 w-3" />
                  {lead.office_size_needed}
                </span>
              )}
              {lead.city && (
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px]">
                  {lead.city}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
              <span className="text-xs font-medium capitalize">{status.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Assigned</span>
              <RepAvatar rep={rep} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</span>
              <span className="text-xs tabular-nums">
                {lead.budget_monthly ? `₹${lead.budget_monthly.toLocaleString()}/mo` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 flex flex-col justify-between p-4"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Contact Details</p>
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-14">Name</span>
                <span className="font-medium truncate">{name}</span>
              </div>
              {phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <a href={`tel:${phone}`} className="text-sky-300 hover:underline" onClick={(e) => e.stopPropagation()}>
                    {phone}
                  </a>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <a href={`mailto:${email}`} className="text-sky-300 hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                    {email}
                  </a>
                </div>
              )}
              {linkedin && (
                <div className="flex items-center gap-2 text-xs">
                  <Linkedin className="h-3 w-3 text-muted-foreground" />
                  <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} target="_blank" rel="noreferrer" className="text-sky-300 hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                    LinkedIn
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {lead.move_in_date && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Target move-in: {new Date(lead.move_in_date).toLocaleDateString('en-IN')}
              </div>
            )}
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction(lead, 'call'); }}
                className="flex-1 rounded bg-white/10 py-1.5 text-[10px] font-medium hover:bg-white/20 transition-colors"
              >
                Log Call
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction(lead, 'email'); }}
                className="flex-1 rounded bg-white/10 py-1.5 text-[10px] font-medium hover:bg-white/20 transition-colors"
              >
                Log Email
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(lead); }}
                className="flex-1 rounded bg-white/10 py-1.5 text-[10px] font-medium hover:bg-white/20 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
