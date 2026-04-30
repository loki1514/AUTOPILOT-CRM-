/**
 * WeatherScene
 * Purpose: full-viewport ambient mood layer behind the entire app.
 * Used by: MainLayout (mounted once at -z-0).
 * Modes: sunny | cloudy | rainy | clear-night. Cross-fades on change.
 * Gotchas: pointer-events:none and -z-0 — never blocks clicks.
 *          Heavy filters; rely on transform/opacity only for animation.
 */
import { AnimatePresence, motion } from "framer-motion";
import { StarField } from "./StarField";

export type WeatherMode = "sunny" | "cloudy" | "rainy" | "clear-night";

interface WeatherSceneProps {
  mode: WeatherMode;
}

const skyByMode: Record<WeatherMode, string> = {
  sunny: `radial-gradient(120% 80% at 50% 0%,
    oklch(0.55 0.12 240) 0%,
    oklch(0.32 0.07 255) 45%,
    oklch(0.16 0.04 265) 100%)`,
  cloudy: `radial-gradient(120% 80% at 50% 0%,
    oklch(0.42 0.05 255) 0%,
    oklch(0.26 0.04 260) 50%,
    oklch(0.14 0.03 265) 100%)`,
  rainy: `radial-gradient(120% 80% at 50% 0%,
    oklch(0.32 0.04 250) 0%,
    oklch(0.20 0.03 260) 50%,
    oklch(0.10 0.02 265) 100%)`,
  "clear-night": `radial-gradient(120% 80% at 50% 0%,
    oklch(0.22 0.05 270) 0%,
    oklch(0.14 0.04 265) 50%,
    oklch(0.08 0.02 268) 100%)`,
};

function SunRays() {
  return (
    <div
      className="absolute"
      style={{
        top: "-20vh",
        right: "-10vw",
        width: "85vw",
        height: "85vw",
        background:
          "conic-gradient(from 0deg, transparent 0deg, oklch(0.92 0.12 80 / 14%) 6deg, transparent 12deg, transparent 30deg, oklch(0.92 0.12 80 / 10%) 36deg, transparent 42deg, transparent 60deg, oklch(0.92 0.12 80 / 12%) 66deg, transparent 72deg, transparent 360deg)",
        animation: "sun-spin 120s linear infinite",
        filter: "blur(8px)",
      }}
    />
  );
}

function Sun() {
  return (
    <div
      className="absolute"
      style={{
        top: "8vh",
        right: "12vw",
        width: "18vw",
        height: "18vw",
        maxWidth: 280,
        maxHeight: 280,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, oklch(0.95 0.13 85 / 90%) 0%, oklch(0.85 0.18 70 / 50%) 40%, transparent 70%)",
        filter: "blur(2px)",
      }}
    />
  );
}

function Clouds() {
  return (
    <>
      {[
        { top: "12vh", scale: 1.0, dur: 80, dir: "l" as const, opacity: 0.35 },
        { top: "28vh", scale: 0.7, dur: 60, dir: "r" as const, opacity: 0.25 },
        { top: "55vh", scale: 1.3, dur: 90, dir: "l" as const, opacity: 0.22 },
        { top: "75vh", scale: 0.9, dur: 70, dir: "r" as const, opacity: 0.18 },
      ].map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.top,
            left: 0,
            width: "30vw",
            height: "12vh",
            transform: `scale(${c.scale})`,
            opacity: c.opacity,
            background:
              "radial-gradient(ellipse at center, oklch(0.92 0.01 250 / 80%) 0%, transparent 70%)",
            filter: "blur(20px)",
            animation: `cloud-drift-${c.dir} ${c.dur}s linear infinite`,
            animationDelay: `${i * -15}s`,
          }}
        />
      ))}
    </>
  );
}

function Rain() {
  const drops = Array.from({ length: 80 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {drops.map((_, i) => {
        const left = Math.random() * 100;
        const dur = 0.6 + Math.random() * 0.8;
        const delay = Math.random() * 2;
        const len = 30 + Math.random() * 50;
        return (
          <span
            key={i}
            className="absolute top-[-10vh] block"
            style={{
              left: `${left}%`,
              width: "1px",
              height: `${len}px`,
              background:
                "linear-gradient(to bottom, transparent, oklch(0.85 0.04 240 / 55%))",
              animation: `rain-fall ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

function Moon() {
  return (
    <div
      className="absolute"
      style={{
        top: "10vh",
        right: "15vw",
        width: 140,
        height: 140,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 35%, oklch(0.96 0.03 90) 0%, oklch(0.85 0.04 90) 70%, oklch(0.7 0.04 90) 100%)",
        boxShadow:
          "0 0 40px oklch(0.92 0.04 90 / 35%), inset -10px -10px 20px oklch(0 0 0 / 25%)",
        animation: "moon-glow 8s ease-in-out infinite",
      }}
    >
      {/* craters */}
      <span className="absolute rounded-full" style={{ top: "30%", left: "55%", width: 14, height: 14, background: "oklch(0 0 0 / 12%)" }} />
      <span className="absolute rounded-full" style={{ top: "55%", left: "30%", width: 22, height: 22, background: "oklch(0 0 0 / 10%)" }} />
      <span className="absolute rounded-full" style={{ top: "20%", left: "25%", width: 8,  height: 8,  background: "oklch(0 0 0 / 14%)" }} />
    </div>
  );
}

function Vignette() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 110%, oklch(0 0 0 / 55%) 0%, transparent 60%)",
      }}
    />
  );
}

function AuroraGlow() {
  return (
    <div
      className="absolute inset-0"
      style={{ background: "var(--gradient-aurora)", opacity: 0.6 }}
    />
  );
}

export function WeatherScene({ mode }: WeatherSceneProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Sky base — cross-fades on mode change */}
      <AnimatePresence mode="sync">
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ background: skyByMode[mode] }}
        />
      </AnimatePresence>

      <AuroraGlow />

      <AnimatePresence mode="sync">
        {mode === "sunny" && (
          <motion.div key="sunny" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            <SunRays />
            <Sun />
            <Clouds />
          </motion.div>
        )}
        {mode === "cloudy" && (
          <motion.div key="cloudy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            <Clouds />
          </motion.div>
        )}
        {mode === "rainy" && (
          <motion.div key="rainy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            <Clouds />
            <Rain />
          </motion.div>
        )}
        {mode === "clear-night" && (
          <motion.div key="night" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            <StarField />
            <Moon />
          </motion.div>
        )}
      </AnimatePresence>

      <Vignette />
    </div>
  );
}
