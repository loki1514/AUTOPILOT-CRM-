/**
 * ScheduleCard
 * Purpose: list of upcoming meetings/follow-ups (date · item · status pill).
 */
import { motion } from "framer-motion";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { format } from "date-fns";

export interface ScheduleItem {
  id: string;
  date: Date;
  title: string;
  subtitle?: string;
  status: "scheduled" | "due" | "overdue" | "done";
}

const statusTint: Record<ScheduleItem["status"], { bg: string; text: string; label: string }> = {
  scheduled: { bg: "oklch(0.72 0.15 235 / 18%)", text: "oklch(0.85 0.12 235)", label: "Scheduled" },
  due:       { bg: "oklch(0.78 0.18 65 / 18%)",  text: "oklch(0.9 0.16 70)",   label: "Due" },
  overdue:   { bg: "oklch(0.66 0.24 22 / 18%)",  text: "oklch(0.85 0.2 25)",   label: "Overdue" },
  done:      { bg: "oklch(0.78 0.20 145 / 18%)", text: "oklch(0.85 0.18 145)", label: "Done" },
};

export function ScheduleCard({ title, items }: { title: string; items: ScheduleItem[] }) {
  return (
    <GlassCard className="p-6">
      <div className="eyebrow mb-4">{title}</div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/55">Nothing scheduled.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 6).map((it, i) => {
            const t = statusTint[it.status];
            return (
              <motion.li
                key={it.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
              >
                <div className="w-14 shrink-0 text-center">
                  <div className="text-display text-xl leading-none">{format(it.date, "d")}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                    {format(it.date, "MMM")}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground/90">{it.title}</div>
                  {it.subtitle && (
                    <div className="truncate text-[12px] text-foreground/55">{it.subtitle}</div>
                  )}
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{ background: t.bg, color: t.text }}
                >
                  {t.label}
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
