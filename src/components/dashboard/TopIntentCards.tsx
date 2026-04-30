import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Eye, UserCheck } from "lucide-react";
import type { Lead } from "@/types";

interface TopIntentCardsProps {
  leads: Lead[];
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export function TopIntentCards({ leads }: TopIntentCardsProps) {
  // Sort by outreach readiness / intent score, take top 8
  const topLeads = [...leads]
    .sort((a, b) => {
      const aScore = (a as any).outreach_readiness ?? (a as any).intent_score ?? 0;
      const bScore = (b as any).outreach_readiness ?? (b as any).intent_score ?? 0;
      return bScore - aScore;
    })
    .slice(0, 8);

  if (topLeads.length === 0) {
    return (
      <GlassCard variant="subtle" className="p-8 text-center">
        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          No enriched leads yet. Run enrichment to see top intent leads here.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground/80">Top Intent Leads</h3>
        <Link to="/leads" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {topLeads.map((lead, idx) => {
          const score = (lead as any).outreach_readiness ?? (lead as any).intent_score ?? 0;
          const signal = (lead as any).intent_signals?.[0]?.signal_type || "enriched";
          const repName = lead.assigned_to ? "Assigned" : "Unassigned";
          const displayName = lead.full_name || lead.client_name || lead.company || "Unknown";

          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
              className={`flex-shrink-0 w-[220px] rounded-xl border p-4 backdrop-blur-md ${getScoreBg(score)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                </div>
                <span className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>
                  {score}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium capitalize">
                  {signal.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-white/10">
                      {initials(repName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-muted-foreground">{repName}</span>
                </div>
                <div className="flex gap-1">
                  <Link to={`/leads/${lead.id}`}>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
                      <Eye className="mr-1 h-3 w-3" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
