/**
 * TriStatCard
 * Purpose: 3-column split for Deals by stage (Prospecting / Negotiation / Closed-Won).
 */
import { motion } from "framer-motion";
import { GlassCard } from "@/components/atmosphere/GlassCard";

interface Stat {
  label: string;
  value: number | string;
  dot: string; // oklch color
}

interface TriStatCardProps {
  title: string;
  stats: [Stat, Stat, Stat];
}

export function TriStatCard({ title, stats }: TriStatCardProps) {
  return (
    <GlassCard className="p-6">
      <div className="eyebrow">{title}</div>
      <div className="mt-5 grid grid-cols-3 divide-x divide-white/10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2 px-4 first:pl-0 last:pr-0"
          >
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/55">
              <span className="h-2 w-2 rounded-full" style={{ background: s.dot }} />
              {s.label}
            </span>
            <span className="text-display text-3xl">{s.value}</span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
