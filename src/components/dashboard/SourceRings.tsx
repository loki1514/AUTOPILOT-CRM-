import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SourceRingProps {
  label: string;
  today: number;
  monthly: number;
  color: string;
  bgColor: string;
  delay?: number;
}

function SourceRing({ label, today, monthly, color, bgColor, delay = 0 }: SourceRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const target = monthly > 0 ? Math.min(100, (today / Math.max(monthly * 0.1, 1)) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(target);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/5"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {today}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">today</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          This month: <span className="text-foreground font-medium">{monthly}</span>
        </p>
      </div>
    </div>
  );
}

interface SourceRingsProps {
  dailyBriefCount?: number;
  metaCount?: number;
  linkedinCount?: number;
  monthlyBriefs?: number;
  monthlyMeta?: number;
  monthlyLinkedin?: number;
}

export function SourceRings({
  dailyBriefCount = 0,
  metaCount = 0,
  linkedinCount = 0,
  monthlyBriefs = 0,
  monthlyMeta = 0,
  monthlyLinkedin = 0,
}: SourceRingsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <SourceRing
        label="Daily Briefs"
        today={dailyBriefCount}
        monthly={monthlyBriefs}
        color="#06b6d4"
        bgColor="rgba(6,182,212,0.08)"
        delay={0}
      />
      <SourceRing
        label="Meta Leads"
        today={metaCount}
        monthly={monthlyMeta}
        color="#8b5cf6"
        bgColor="rgba(139,92,246,0.08)"
        delay={200}
      />
      <SourceRing
        label="LinkedIn Leads"
        today={linkedinCount}
        monthly={monthlyLinkedin}
        color="#3b82f6"
        bgColor="rgba(59,130,246,0.08)"
        delay={400}
      />
    </div>
  );
}
