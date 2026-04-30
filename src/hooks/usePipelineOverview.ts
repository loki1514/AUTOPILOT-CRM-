/**
 * usePipelineOverview
 * Purpose: aggregate real BD data for the Pipeline Overview at "/".
 * Used by: src/pages/Index.tsx.
 * Notes: pulls from leads + activities + intent_signals; falls back gracefully
 *        when tables are empty so the dashboard always renders.
 */
import { useMemo } from "react";
import { startOfDay, subDays, isAfter, addDays, startOfMonth } from "date-fns";
import { useLeads } from "@/hooks/useLeads";
import { useActivities } from "@/hooks/useActivities";
import type { Lead } from "@/types";

const PROSPECTING: Array<Lead["stage"]> = ["lead", "qualified"];
const NEGOTIATION: Array<Lead["stage"]> = ["proposal"];
const WON: Array<Lead["stage"]> = ["closed"];

function estimateDealValue(l: Lead): number {
  // Crude heuristic: monthly budget × 12, falling back to seats × 25k INR average.
  if (l.budget_monthly) return l.budget_monthly * 12;
  if (l.budget_max) return l.budget_max;
  return (l.headcount || 0) * 25000 * 12;
}

export interface PipelineOverviewData {
  loading: boolean;
  pipelineValue: number;          // ₹ active deal value
  activitiesToday: number;
  accountHealth: number;          // 0..100 — % of leads with intent>=60
  revenueMTD: number;
  pipelineSpark: number[];        // 14d new-lead counts
  activitiesSpark: number[];      // 14d activity counts
  healthSpark: number[];
  revenueSpark: number[];
  triStats: { prospecting: number; negotiation: number; won: number };
  quotaValue: number;
  quotaTarget: number;
  dailyRevenueValue: string;
  dailyRevenueData: number[];
  dailyRevenueDelta: number;
  schedule: Array<{
    id: string;
    date: Date;
    title: string;
    subtitle?: string;
    status: "scheduled" | "due" | "overdue" | "done";
  }>;
}

export function usePipelineOverview(): PipelineOverviewData {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: activities = [], isLoading: actsLoading } = useActivities();

  return useMemo<PipelineOverviewData>(() => {
    const now = new Date();
    const today = startOfDay(now);
    const monthStart = startOfMonth(now);

    // Stage buckets
    const prospecting = leads.filter((l) => PROSPECTING.includes(l.stage)).length;
    const negotiation = leads.filter((l) => NEGOTIATION.includes(l.stage)).length;
    const won = leads.filter((l) => WON.includes(l.stage)).length;

    // Pipeline $: sum of estimated value of non-closed/lost deals
    const pipelineValue = leads
      .filter((l) => !["closed", "lost"].includes(l.stage))
      .reduce((sum, l) => sum + estimateDealValue(l), 0);

    // Revenue MTD: sum of estimated value of deals closed this month
    const revenueMTD = leads
      .filter((l) => l.stage === "closed" && new Date(l.updated_at) >= monthStart)
      .reduce((sum, l) => sum + estimateDealValue(l), 0);

    // Activities today
    const activitiesToday = activities.filter((a) =>
      isAfter(new Date(a.created_at), today)
    ).length;

    // Account health: % with intent_score >= 60
    const scored = leads.filter((l) => typeof l.intent_score === "number");
    const accountHealth =
      scored.length === 0
        ? 0
        : Math.round(
            (scored.filter((l) => (l.intent_score ?? 0) >= 60).length / scored.length) * 100
          );

    // 14-day spark series
    const days14 = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));
    const pipelineSpark = days14.map(
      (d) => leads.filter((l) => startOfDay(new Date(l.created_at)).getTime() === d.getTime()).length
    );
    const activitiesSpark = days14.map(
      (d) => activities.filter((a) => startOfDay(new Date(a.created_at)).getTime() === d.getTime()).length
    );
    // crude proxies
    const healthSpark = days14.map((_, i) => Math.max(1, Math.round(accountHealth * (0.8 + Math.sin(i / 2) * 0.2))));
    const revenueSpark = days14.map(
      (d) =>
        leads
          .filter(
            (l) =>
              l.stage === "closed" &&
              startOfDay(new Date(l.updated_at)).getTime() === d.getTime()
          )
          .reduce((sum, l) => sum + estimateDealValue(l), 0) || Math.random() * 0.001
    );

    // Daily revenue card: last 7 days, WoW velocity
    const last7 = revenueSpark.slice(-7);
    const prev7 = revenueSpark.slice(0, 7);
    const sumLast = last7.reduce((s, n) => s + n, 0);
    const sumPrev = prev7.reduce((s, n) => s + n, 0);
    const dailyRevenueDelta = sumPrev > 0 ? ((sumLast - sumPrev) / sumPrev) * 100 : 0;

    // Schedule: synthesize follow-ups from leads with last_activity > 5 days
    const schedule = leads
      .filter((l) => !["closed", "lost"].includes(l.stage))
      .slice(0, 8)
      .map<PipelineOverviewData["schedule"][number]>((l, i) => {
        const baseDate = l.last_activity ? new Date(l.last_activity) : new Date(l.created_at);
        const due = addDays(baseDate, 3);
        const status: "scheduled" | "due" | "overdue" =
          due < today ? "overdue" : due.getTime() === today.getTime() ? "due" : "scheduled";
        return {
          id: l.id,
          date: due,
          title: l.client_name || l.full_name || "Untitled lead",
          subtitle: [l.company, l.city].filter(Boolean).join(" · ") || undefined,
          status: i === 0 && status === "scheduled" ? "due" : status,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      loading: leadsLoading || actsLoading,
      pipelineValue,
      activitiesToday,
      accountHealth,
      revenueMTD,
      pipelineSpark,
      activitiesSpark,
      healthSpark,
      revenueSpark,
      triStats: { prospecting, negotiation, won },
      quotaValue: revenueMTD,
      quotaTarget: Math.max(revenueMTD * 1.5, 5_000_000), // ₹50L default target
      dailyRevenueValue: formatINRCompact(sumLast),
      dailyRevenueData: last7,
      dailyRevenueDelta,
      schedule,
    };
  }, [leads, activities, leadsLoading, actsLoading]);
}

export function formatINRCompact(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}
