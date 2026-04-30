/**
 * HalfCircleGauge
 * Purpose: animated SVG arc — Quota Attainment.
 * Notes: pure SVG, no chart library.
 */
import { motion } from "framer-motion";
import { GlassCard } from "@/components/atmosphere/GlassCard";

interface HalfCircleGaugeProps {
  title: string;
  value: number;     // current
  target: number;    // 100%
  unit?: string;
  color?: string;
}

export function HalfCircleGauge({
  title,
  value,
  target,
  unit = "",
  color = "oklch(0.78 0.20 145)",
}: HalfCircleGaugeProps) {
  const pct = Math.max(0, Math.min(1, target > 0 ? value / target : 0));
  const radius = 90;
  const circumference = Math.PI * radius;
  const dash = circumference * pct;

  return (
    <GlassCard glow="success" className="p-6">
      <div className="eyebrow">{title}</div>

      <div className="relative mt-2 flex justify-center">
        <svg width="240" height="140" viewBox="0 0 240 140">
          {/* track */}
          <path
            d="M 30 130 A 90 90 0 0 1 210 130"
            fill="none"
            stroke="oklch(1 0 0 / 8%)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* progress */}
          <motion.path
            d="M 30 130 A 90 90 0 0 1 210 130"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <span className="text-display text-4xl">
            {value.toLocaleString()}
            <span className="text-foreground/40">/{target.toLocaleString()}</span>
          </span>
          <span className="mt-1 text-[11px] text-foreground/55">{unit}</span>
        </div>
      </div>
    </GlassCard>
  );
}
