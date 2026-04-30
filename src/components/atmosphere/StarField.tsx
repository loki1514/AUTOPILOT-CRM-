/**
 * StarField
 * Purpose: twinkling stars layer for the clear-night WeatherScene mode.
 * Notes: positions are stable (seeded once on mount) so stars don't jitter on re-render.
 */
import { useMemo } from "react";

interface StarFieldProps {
  count?: number;
}

export function StarField({ count = 90 }: StarFieldProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.6,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            boxShadow: "0 0 4px oklch(1 0 0 / 80%)",
          }}
        />
      ))}
    </div>
  );
}
