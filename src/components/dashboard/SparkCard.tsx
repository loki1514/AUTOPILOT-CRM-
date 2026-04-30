/**
 * SparkCard
 * Purpose: big number + bar mini-chart + week-over-week chip.
 */
import { motion } from "framer-motion";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { cn } from "@/lib/utils";

interface SparkCardProps {
  title: string;
  value: string;
  data: number[];
  delta?: number;
  color?: string;
}

export function SparkCard({ title, value, data, delta, color = "oklch(0.78 0.15 235)" }: SparkCardProps) {
  const max = Math.max(...data, 0.001);
  const positive = (delta ?? 0) >= 0;

  return (
    <GlassCard glow="accent" className="p-6">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{title}</div>
        {delta !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              positive ? "text-success" : "text-critical"
            )}
            style={{
              background: positive
                ? "oklch(0.78 0.20 145 / 14%)"
                : "oklch(0.66 0.24 22 / 14%)",
            }}
          >
            {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% WoW
          </span>
        )}
      </div>
      <div className="mt-3 text-display text-5xl">{value}</div>
      <div className="mt-5 flex h-16 items-end gap-1.5">
        {data.map((v, i) => (
          <motion.span
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: (v / max) || 0.05 }}
            transition={{ duration: 0.7, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 origin-bottom rounded"
            style={{
              background: `linear-gradient(180deg, ${color} 0%, oklch(1 0 0 / 4%) 100%)`,
              boxShadow: `0 0 10px ${color}`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </GlassCard>
  );
}
