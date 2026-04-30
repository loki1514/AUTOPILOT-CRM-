/**
 * WeatherToggle
 * Purpose: orb in the header that cycles through WeatherScene modes.
 * Used by: PageHeader (top-right cluster).
 * Notes: initial mode derived from local hour; persisted to localStorage.
 */
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sun, Cloud, CloudRain, Moon } from "lucide-react";
import type { WeatherMode } from "./WeatherScene";

const MODES: WeatherMode[] = ["sunny", "cloudy", "rainy", "clear-night"];
const STORAGE_KEY = "atmos.weather";

const ICONS: Record<WeatherMode, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  "clear-night": Moon,
};

const TINTS: Record<WeatherMode, string> = {
  sunny: "oklch(0.92 0.12 80)",
  cloudy: "oklch(0.85 0.02 250)",
  rainy: "oklch(0.78 0.05 240)",
  "clear-night": "oklch(0.92 0.04 90)",
};

function modeFromHour(h: number): WeatherMode {
  if (h >= 6 && h < 12) return "sunny";
  if (h >= 12 && h < 18) return "cloudy";
  if (h >= 18 && h < 21) return "rainy";
  return "clear-night";
}

interface WeatherToggleProps {
  mode: WeatherMode;
  onChange: (m: WeatherMode) => void;
}

export function WeatherToggle({ mode, onChange }: WeatherToggleProps) {
  const Icon = ICONS[mode];

  const cycle = useCallback(() => {
    const i = MODES.indexOf(mode);
    const next = MODES[(i + 1) % MODES.length];
    onChange(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, [mode, onChange]);

  return (
    <motion.button
      type="button"
      onClick={cycle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Weather: ${mode}. Click to change.`}
      className="glass relative flex h-10 w-10 items-center justify-center rounded-full"
      style={{ color: TINTS[mode] }}
    >
      <Icon className="h-4 w-4" />
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: `0 0 16px ${TINTS[mode]}`,
          opacity: 0.4,
        }}
      />
    </motion.button>
  );
}

export function useWeatherMode(): [WeatherMode, (m: WeatherMode) => void] {
  const [mode, setMode] = useState<WeatherMode>("clear-night");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as WeatherMode | null;
      if (stored && MODES.includes(stored)) {
        setMode(stored);
        return;
      }
    } catch {}
    setMode(modeFromHour(new Date().getHours()));
  }, []);
  return [mode, setMode];
}
