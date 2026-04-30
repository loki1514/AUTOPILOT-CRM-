/**
 * DashboardTile
 * Purpose: top-of-fold KPI tile with display number + optional inline mini-chart.
 * Variants: pipeline | activities | health | revenue (renamed per Atmospheric Glass §5).
 */
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { cn } from "@/lib/utils";

type Variant = "pipeline" | "activities" | "health" | "revenue";

const tints: Record<Variant, { glow: "accent" | "info" | "success" | "warning"; text: string }> = {
  pipeline:   { glow: "accent",  text: "oklch(0.78 0.15 235)" },
  activities: { glow: "info",    text: "oklch(0.85 0.04 240)" },
  health:     { glow: "success", text: "oklch(0.82 0.18 145)" },
  revenue:    { glow: "warning", text: "oklch(0.88 0.16 70)" },
};

interface DashboardTileProps {
  variant: Variant;
  label: string;
  value: ReactNode;
  delta?: { value: number; positive: boolean };
  spark?: number[]; // 0..1 normalized
}

export function DashboardTile({ variant, label, value, delta, spark }: DashboardTileProps) {
  const t = tints[variant];
  return (
    <GlassCard glow={t.glow} className="p-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-display text-4xl text-foreground">{value}</div>
        {delta && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              delta.positive ? "text-success" : "text-critical"
            )}
            style={{
              background: delta.positive
                ? "oklch(0.78 0.20 145 / 14%)"
                : "oklch(0.66 0.24 22 / 14%)",
            }}
          >
            {delta.positive ? "+" : ""}
            {delta.value}%
          </span>
        )}
      </div>
      {spark && <Spark values={spark} color={t.text} />}
    </GlassCard>
  );
}

function Spark({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 0.001);
  return (
    <div className="mt-4 flex h-10 items-end gap-1">
      {values.map((v, i) => (
        <motion.span
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: v / max || 0.05 }}
          transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 origin-bottom rounded-sm"
          style={{ background: color, opacity: 0.55 }}
        />
      ))}
    </div>
  );
}
