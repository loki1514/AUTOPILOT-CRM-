import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

export type LeadBucket = "cold" | "hot" | "future";

export function getLeadBucket(lead: Lead): LeadBucket {
  const status = (lead.crm_status ?? "new") as string;
  if (lead.move_in_date) {
    const m = new Date(lead.move_in_date).getTime();
    const cutoff = Date.now() + 60 * 24 * 60 * 60 * 1000;
    if (m > cutoff) return "future";
  }
  if (["qualified", "proposal", "negotiation", "won"].includes(status)) return "hot";
  return "cold";
}

const styles: Record<LeadBucket, { label: string; cls: string }> = {
  cold: {
    label: "Cold",
    cls: "bg-[oklch(0.78_0.18_85/0.18)] text-[oklch(0.85_0.15_85)] ring-[oklch(0.78_0.18_85/0.35)]",
  },
  hot: {
    label: "Hot",
    cls: "bg-[oklch(0.78_0.20_145/0.18)] text-[oklch(0.85_0.18_145)] ring-[oklch(0.78_0.20_145/0.35)]",
  },
  future: {
    label: "Future Pipeline",
    cls: "bg-[oklch(0.74_0.16_60/0.18)] text-[oklch(0.84_0.14_60)] ring-[oklch(0.74_0.16_60/0.35)]",
  },
};

export function LeadStatusPill({ lead }: { lead: Lead }) {
  const bucket = getLeadBucket(lead);
  const s = styles[bucket];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        s.cls
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}