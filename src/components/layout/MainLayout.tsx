/**
 * MainLayout
 * Purpose: app shell. Mounts WeatherScene + Sidebar + FloatingNav once.
 * Used by: every protected page.
 * Notes: pages render their own PageHeader inside `children`.
 */
import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { WeatherScene } from "@/components/atmosphere/WeatherScene";
import { useWeatherMode, WeatherToggle } from "@/components/atmosphere/WeatherToggle";
import { FloatingNav } from "@/components/atmosphere/FloatingNav";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
}

/** Singleton state hoisted to the layout so WeatherScene + WeatherToggle stay in sync. */
function useSharedWeather() {
  return useWeatherMode();
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mode, setMode] = useSharedWeather();

  return (
    <div className="relative min-h-screen text-foreground">
      <WeatherScene mode={mode} />

      <Sidebar />

      <div className="pl-64">
        {/* Top utility bar — weather toggle + bell. Pages add their own PageHeader below. */}
        <div className="sticky top-0 z-30 flex items-center justify-end gap-3 px-6 pt-5 lg:px-10">
          <WeatherToggle mode={mode} onChange={setMode} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span
              className="pulse-dot absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
              style={{ background: "var(--critical)", color: "var(--critical)" }}
            />
          </motion.button>
        </div>

        <main className="px-6 pb-32 pt-2 lg:px-10">
          {children}
        </main>
      </div>

      <FloatingNav />
    </div>
  );
}
