import { cn } from "@/lib/utils";

export type TimeRange = "today" | "week" | "month";

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

interface TimeRangeToggleProps {
  value: TimeRange;
  onChange: (next: TimeRange) => void;
  className?: string;
}

export function TimeRangeToggle({ value, onChange, className }: TimeRangeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className={cn(
        "glass-subtle inline-flex items-center gap-1 rounded-full p-1 text-[12px]",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium uppercase tracking-[0.14em] transition-colors",
              active
                ? "bg-foreground/90 text-background shadow-sm"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}