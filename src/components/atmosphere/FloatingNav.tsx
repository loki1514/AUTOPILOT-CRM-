/**
 * FloatingNav
 * Purpose: bottom-floating glass pill — primary nav + center "Ask Pipeline AI" orb.
 * Used by: MainLayout (mounted globally).
 * Behavior: hides on scroll-down, returns on scroll-up. AI orb has bobbing caption.
 */
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Inbox, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Pipeline", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/outbox", label: "Inbox", icon: Inbox },
  { to: "/indicators", label: "Forecast", icon: Target },
];

const FloatingNav = forwardRef<HTMLDivElement>(function FloatingNav(_props, ref) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (Math.abs(dy) > 8) {
        setHidden(dy > 0 && y > 120);
        lastY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          ref={ref}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
        >
          <div className="glass-strong flex items-center gap-1 rounded-full px-2 py-2">
            {items.slice(0, 2).map((it) => (
              <NavItem key={it.to} {...it} />
            ))}

            <AIOrb />

            {items.slice(2).map((it) => (
              <NavItem key={it.to} {...it} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export { FloatingNav };

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "group relative flex h-11 w-11 items-center justify-center rounded-full text-foreground/70 transition-colors",
          isActive ? "text-foreground" : "hover:text-foreground"
        )
      }
      title={label}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="floatnav-active"
              className="absolute inset-0 rounded-full"
              style={{ background: "oklch(1 0 0 / 12%)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <Icon className="relative h-[18px] w-[18px]" />
        </>
      )}
    </NavLink>
  );
}

function AIOrb() {
  return (
    <div className="relative mx-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-12 w-12 items-center justify-center rounded-full text-foreground"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, oklch(0.85 0.18 240) 0%, oklch(0.55 0.22 270) 60%, oklch(0.32 0.18 280) 100%)",
          boxShadow:
            "0 0 24px oklch(0.7 0.2 260 / 55%), inset 0 1px 0 oklch(1 0 0 / 30%)",
        }}
        aria-label="Ask Pipeline AI"
      >
        <Sparkles className="h-5 w-5" />
        <span className="pulse-dot absolute inset-0 rounded-full" style={{ color: "oklch(0.7 0.2 260)" }} />
      </motion.button>

      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <span className="eyebrow rounded-full bg-foreground/5 px-2.5 py-1 text-[10px] tracking-[0.18em] text-foreground/70 backdrop-blur">
          Ask Pipeline AI
        </span>
      </motion.div>
    </div>
  );
}
