/**
 * PageHeader
 * Purpose: shared header pattern for every screen.
 * Layout: eyebrow + display H1 + subtitle on the left, slot on the right.
 * Used by: MainLayout (and per-page custom headers when needed).
 */
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, subtitle, right, className }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex items-start justify-between gap-6 pb-8", className)}
    >
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-display text-3xl text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-foreground/55">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-3">{right}</div>}
    </motion.header>
  );
}
