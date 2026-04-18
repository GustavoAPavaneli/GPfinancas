"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car } from "lucide-react";

type Phase = "logo" | "text" | "car" | "drive" | "flash" | "done";

const PHASES: { phase: Phase; delay: number }[] = [
  { phase: "logo",  delay: 200  },
  { phase: "text",  delay: 900  },
  { phase: "car",   delay: 1700 },
  { phase: "drive", delay: 2300 },
  { phase: "flash", delay: 3700 },
  { phase: "done",  delay: 4200 },
];

export default function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    PHASES.forEach(({ phase: p, delay }) => {
      timers.current.push(setTimeout(() => setPhase(p), delay));
    });
    timers.current.push(setTimeout(onComplete, 4500));
    return () => timers.current.forEach(clearTimeout);
  }, [onComplete]);

  function skip() {
    timers.current.forEach(clearTimeout);
    setPhase("flash");
    setTimeout(onComplete, 500);
  }

  const showLogo  = phase === "logo"  || phase === "text" || phase === "car" || phase === "drive";
  const showText  = phase === "text"  || phase === "car"  || phase === "drive";
  const showCar   = phase === "car"   || phase === "drive";
  const isDriving = phase === "drive" || phase === "flash" || phase === "done";
  const isFlash   = phase === "flash" || phase === "done";

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
      style={{ background: "var(--bg-primary)" }}
      onClick={skip}
    >
      {/* Background grid + orbs (same as app) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div
          className="animate-orb-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(0,212,255,0.6) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="animate-orb-2 absolute -bottom-40 -right-20 w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.7) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
      </div>

      {/* Center stage */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Hexagon logo */}
        <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
            >
              <motion.div
                animate={{ boxShadow: ["0 0 0 0 rgba(0,212,255,0.4)", "0 0 0 24px rgba(0,212,255,0)", "0 0 0 0 rgba(0,212,255,0)"] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="w-32 h-32 rounded-3xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,102,255,0.12))",
                  border: "1px solid rgba(0,212,255,0.35)",
                  boxShadow: "0 0 60px rgba(0,212,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <polygon points="32,4 58,18 58,46 32,60 6,46 6,18"
                    stroke="rgba(0,212,255,0.6)" strokeWidth="1.5" fill="rgba(0,212,255,0.07)" />
                  <polygon points="32,11 51,22 51,42 32,53 13,42 13,22"
                    stroke="rgba(0,212,255,0.25)" strokeWidth="1" fill="none" />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                    fontSize="18" fontWeight="bold" fontFamily="monospace" fill="url(#g1)">GP</text>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#0066ff" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand text + car */}
        <div className="relative flex items-center">
          {/* GP — cyan glow */}
          <div className="flex">
            {["G","P"].map((ch, i) => (
              <motion.span
                key={ch}
                initial={{ opacity: 0, y: 18 }}
                animate={showText ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 24 }}
                className="text-7xl font-bold"
                style={{ color: "#00d4ff", textShadow: "0 0 30px rgba(0,212,255,0.6)", fontFamily: "var(--font-geist)" }}
              >
                {ch}
              </motion.span>
            ))}
            {/* "finança" letters */}
            {"finança".split("").map((ch, i) => (
              <motion.span
                key={`f${i}`}
                initial={{ opacity: 0, y: 18 }}
                animate={showText ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                transition={{ delay: 0.14 + i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
                className="text-7xl font-bold text-white"
                style={{ fontFamily: "var(--font-geist)" }}
              >
                {ch}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={showText ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ delay: 0.14 + 7 * 0.06, type: "spring", stiffness: 300, damping: 24 }}
              className="text-7xl font-bold text-white"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              s
            </motion.span>
          </div>

          {/* Car + speed trail */}
          <div className="relative ml-3 flex items-center" style={{ minWidth: 50 }}>
            {/* Neon trails */}
            <AnimatePresence>
              {isDriving && (
                <>
                  <motion.div key="t1"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute right-full top-1/2 -translate-y-px h-px pointer-events-none"
                    style={{ background: "linear-gradient(to left, rgba(0,212,255,1), rgba(0,212,255,0.3), transparent)", boxShadow: "0 0 8px rgba(0,212,255,0.7)" }}
                  />
                  <motion.div key="t2"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 130, opacity: 0.45 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: 0.04 }}
                    className="absolute right-full pointer-events-none"
                    style={{ top: "calc(50% + 5px)", height: 1, background: "linear-gradient(to left, rgba(0,212,255,0.6), transparent)" }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* The car */}
            <AnimatePresence>
              {showCar && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <motion.div
                    animate={isDriving ? { x: "120vw" } : { x: 0 }}
                    transition={isDriving ? { duration: 1.4, ease: [0.4, 0, 1, 1] } : { duration: 0 }}
                  >
                    <Car size={44} style={{
                      color: "#00d4ff",
                      filter: "drop-shadow(0 0 14px rgba(0,212,255,0.9)) drop-shadow(0 0 28px rgba(0,212,255,0.5))",
                    }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={showText ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-sm font-mono uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Controle financeiro para motoristas
        </motion.p>
      </div>

      {/* Skip hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: showCar ? 0.4 : 0 }}
        className="absolute bottom-10 text-xs font-mono"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        toque para pular
      </motion.p>

      {/* Flash burst */}
      <AnimatePresence>
        {isFlash && (
          <motion.div
            key="flash"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 0] }}
            transition={{ duration: 0.55, times: [0, 0.2, 0.5, 1] }}
            style={{
              background: "radial-gradient(ellipse 130% 100% at 100% 50%, rgba(0,212,255,0.9) 0%, rgba(0,102,255,0.55) 40%, rgba(4,4,14,0.9) 100%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Final fade to dark */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            key="out"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ background: "var(--bg-primary)" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
