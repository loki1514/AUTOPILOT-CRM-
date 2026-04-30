/**
 * GlassCard
 * Purpose: the only surface used for cards in the Atmospheric Glass app.
 * Used by: every page (KPIs, tristats, schedules, lead rows, sidebar groups).
 * Variants: default | strong | subtle. Optional `glow` color blob top-right.
 * Gotchas: never re-roll inline glass styles — always go through this component.
 */
import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "default" | "strong" | "subtle";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  variant?: Variant;
  glow?: "accent" | "success" | "warning" | "critical" | "info" | "none";
  hover?: boolean;
  children?: ReactNode;
}

const surfaceClass: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  subtle: "glass-subtle",
};

const glowColor: Record<NonNullable<GlassCardProps["glow"]>, string> = {
  none: "",
  accent: "oklch(0.7 0.15 235 / 35%)",
  info: "oklch(0.7 0.15 235 / 35%)",
  success: "oklch(0.78 0.20 145 / 30%)",
  warning: "oklch(0.78 0.18 65 / 32%)",
  critical: "oklch(0.66 0.24 22 / 32%)",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", glow = "none", hover = true, className, children, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
        whileTap={hover ? { scale: 0.995 } : undefined}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={cn(surfaceClass[variant], "relative overflow-hidden", className)}
        {...rest}
      >
        {glow !== "none" && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: glowColor[glow] }}
          />
        )}
        <div className="relative">{children as ReactNode}</div>
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
