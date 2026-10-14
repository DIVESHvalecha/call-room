"use client";
import ParticleBurst from "./ParticleBurst";
import AnimatedNumber from "./AnimatedNumber";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { shareCardPNG, copyChallengeLink } from "@/lib/share";
import { tierOf, tierWithDaily } from "@/lib/score";

function useCountUp(target: number, delay = 0): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / 800));
      setV(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay]);
  return v;
}

export function tierByFraction(total: number, max: number): string {
  const f = max > 0 ? total / max : 0;
  if (f >= 0.8) return "Diamond";
  if (f >= 0.6) return "Platinum";
  if (f >= 0.4) return "Gold";
  return "Silver";
}

const TIER_THEMES: Record<string, {
  border: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
  accentBg: string;
}> = {
  Diamond: {
    border: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)",
    glow: "rgba(56, 189, 248, 0.4)",
    badgeBg: "linear-gradient(90deg, #38bdf8, #818cf8)",
    badgeText: "#031525",
    accent: "#38bdf8",
    accentBg: "rgba(56, 189, 248, 0.12)",
  },
  Platinum: {
    border: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 50%, #94a3b8 100%)",
    glow: "rgba(226, 232, 240, 0.3)",
    badgeBg: "linear-gradient(90deg, #f8fafc, #cbd5e1)",
    badgeText: "#0f172a",
    accent: "#e2e8f0",
    accentBg: "rgba(241, 245, 249, 0.12)",
  },
  Gold: {
    border: "linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)",
    glow: "rgba(245, 158, 11, 0.4)",
    badgeBg: "linear-gradient(90deg, #fef08a, #f59e0b)",
    badgeText: "#1c1402",
    accent: "#fbbf24",
    accentBg: "rgba(245, 158, 11, 0.12)",
  },
  Silver: {
    border: "linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
    glow: "rgba(148, 163, 184, 0.25)",
    badgeBg: "linear-gradient(90deg, #94a3b8, #64748b)",
    badgeText: "#0f172a",
    accent: "#94a3b8",
    accentBg: "rgba(148, 163, 184, 0.12)",
  },
};

export default function MintCard({
  live = 68,
  situational = 24,
  matchRank = 1,
  matchTitle = "INDIA v WEST INDIES",
  matchEdition = "CHASE 406 • 2ND INNINGS",
  bestCall = "CLUTCH MOMENT",
  seasonPct = 8,
  streak = 4,
  rarityScore,
  rarityTier,
  reward,
  dailyRank = 7,
  best,
}: {
  live?: number;
  situational?: number;
  matchRank?: number;
  matchTitle?: string;
  matchEdition?: string;
  bestCall?: string;
  seasonPct?: number;
  streak?: number;
  rarityScore?: number;
  rarityTier?: string;
  reward?: string;
  dailyRank?: number;
  best?: { qText: string; yourPick: string; correctPick: string; pts: number; p: number; over: string; verdict: string };
}) {
  const total = live + situational;
  const max = 140;
  const a = useCountUp(live, 200);
  const b = useCountUp(situational, 700);
  const c = useCountUp(total, 1200);
  const fracTier = rarityTier ?? tierByFraction(total, max);
  const rankTier = tierOf(matchRank);
  const finalTier = tierWithDaily(matchRank, seasonPct, streak) === "Diamond" ? fracTier : tierWithDaily(matchRank, seasonPct, streak);
  const upgraded = tierWithDaily(matchRank, seasonPct, streak) !== rankTier;
  const cardRef = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rX = useTransform(ry, [-60, 60], [6, -6]);
  const rY = useTransform(rx, [-60, 60], [-6, 6]);
  const [shared, setShared] = useState("");

  const activeTheme = TIER_THEMES[finalTier] || TIER_THEMES.Gold;
  const pctTotal = Math.min(100, Math.round((total / max) * 100));
  const isDiamond = finalTier === "Diamond";

  return (
    <div className="relative mx-auto max-w-[420px] p-1">
      <ParticleBurst fire={isDiamond} />
      
      {/* 3D Interactive Tilt Container */}
      <motion.div
        ref={cardRef}
        onMouseMove={(e) => {
          const r = cardRef.current?.getBoundingClientRect();
          if (!r) return;
          rx.set(e.clientX - r.left - r.width / 2);
          ry.set(e.clientY - r.top - r.height / 2);
        }}
        onMouseLeave={() => { rx.set(0); ry.set(0); }}
        style={{
          rotateX: rX,
          rotateY: rY,
          perspective: 1000,
        }}
        className="relative"
      >
        {/* Full Collectible Card Frame - High-Res DOM Target for Share PNG */}
        <div
          id="mint-card-shot"
          style={{
            background: activeTheme.border,
            boxShadow: `0 14px 40px -8px ${activeTheme.glow}`,
          }}
          className="relative rounded-2xl p-[3px] transition-shadow duration-300"
        >
          {/* Card Inner Navy Container */}
          <div
            className="relative overflow-hidden rounded-[13px] bg-[#0a0f2c] p-4 text-center sm:p-5"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 350px 220px at 50% 0%, ${activeTheme.accentBg}, transparent 70%),
                linear-gradient(180deg, #101844 0%, #0a0f2c 60%, #06091e 100%)
              `,
            }}
          >
            {/* Gentle, Slow Prismatic Reflection Foil */}
            <div className="shine pointer-events-none absolute inset-0 z-10" />

            {/* Top Collectible Header */}
            <div className="relative z-20 flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="cond text-[11px] font-bold tracking-widest text-white/80">
                  LIVE MINT #042/500
                </span>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--volt)]">
                {matchEdition}
              </span>
            </div>

            {/* Match & Highlight Headline */}
            <div className="relative z-20 mt-3">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-black tracking-wider uppercase"
                style={{ background: activeTheme.badgeBg, color: activeTheme.badgeText }}
              >
                ★ {bestCall}
              </div>
              <h3 className="cond mt-1.5 text-2xl font-black italic tracking-wide text-white drop-shadow-md sm:text-3xl">
                {matchTitle}
              </h3>
            </div>

            {/* Best Call / Key Play Highlight Card */}
            {best && (
              <div className="relative z-20 mx-auto mt-3 rounded-xl border border-white/15 bg-black/40 p-3 text-left shadow-inner backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[var(--volt)] px-1.5 py-0.5 text-[10px] font-extrabold text-[#0a0f2c]">
                      OVER {best.over}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      KEY CALL READ
                    </span>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-extrabold text-emerald-400">
                    +{best.pts} PTS
                  </span>
                </div>

                {/* Question Text */}
                <p className="mt-2 text-xs font-medium italic text-white/95 leading-relaxed">
                  “{best.qText}”
                </p>

                {/* Resolution Grid */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-2 text-[11px]">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-white/50">Your Pick</span>
                    <span className="font-bold text-[var(--volt)]">✓ {best.yourPick}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase tracking-wider text-white/50">Consensus</span>
                    <span className="font-semibold text-white/90">Only {best.p}% predicted</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rarity & Score Stats Row */}
            <div className="relative z-20 mt-3.5 rounded-xl border border-white/10 bg-[#0d143c]/80 p-3">
              <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Rarity Score</span>
                  <span className="font-num text-xl font-black text-white">
                    {rarityScore ?? 62}<span className="text-xs font-normal text-white/40">/100</span>
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Live Rank</span>
                  <span className="font-num text-xl font-black text-[var(--volt)]">
                    #{matchRank}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Daily Rank</span>
                  <span className="font-num text-xl font-black text-[var(--win)]">
                    #{dailyRank}
                  </span>
                </div>
              </div>

              {/* Score Composition Equation */}
              <div className="mt-2.5 border-t border-white/10 pt-2 text-[11px] font-medium text-white/70">
                Live <b className="text-white"><AnimatedNumber value={a} /></b> + Situational <b className="text-white"><AnimatedNumber value={b} /></b> = Total <b className="text-[var(--volt)] font-bold text-sm"><AnimatedNumber value={c} /> PTS</b>
              </div>
            </div>

            {/* Tier Seal & Daily Boost */}
            <div className="relative z-20 mt-3 flex flex-wrap items-center justify-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.9 }}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 shadow-lg"
                style={{ background: activeTheme.badgeBg, color: activeTheme.badgeText }}
              >
                <span className="text-xs">★</span>
                <span className="cond text-sm font-black tracking-wider uppercase">
                  {finalTier} TIER COLLECTIBLE
                </span>
              </motion.div>

              {reward && (
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-[#06281c] shadow">
                  🎁 {reward}
                </span>
              )}
            </div>

            {upgraded && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="relative z-20 mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300"
              >
                <span>⚡</span>
                <span>DAILY BONUS BOOSTED: {rankTier.toUpperCase()} → {finalTier.toUpperCase()}</span>
              </motion.div>
            )}

            {/* Rarity Tier Threshold Visual Bar */}
            <div className="relative z-20 mt-3 px-1 text-left">
              <div className="flex justify-between text-[10px] font-bold text-white/50">
                <span>TIER PROGRESS</span>
                <span className="text-white/80">{pctTotal}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${pctTotal}%`,
                    background: activeTheme.border,
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[8px] font-semibold tracking-wider text-white/40 uppercase">
                <span>Silver &lt;40</span>
                <span>Gold ≥40</span>
                <span>Plat ≥60</span>
                <span>Dia ≥80</span>
              </div>
            </div>

            {/* Collectible Footer Stamp */}
            <div className="relative z-20 mt-3.5 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-white/50">
              <span className="font-bold tracking-wider uppercase text-white/70">
                DREAM11 CALL ROOM
              </span>
              <span className="font-semibold tracking-wide text-[var(--volt)]">
                VERIFIED MATCH COLLECTIBLE
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <motion.button
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={async () => {
            // Flatten 3D tilt before snapshot to ensure clean straight capture
            rx.set(0);
            ry.set(0);
            await new Promise((r) => setTimeout(r, 60));
            const el = document.getElementById("mint-card-shot");
            if (!el) {
              setShared("Card element not found");
              return;
            }
            setShared("Generating high-res card...");
            const ok = await shareCardPNG(el as HTMLElement);
            setShared(ok ? "Card saved / shared ✓" : "Share failed — screenshot instead");
          }}
          className="btn-volt flex items-center justify-center gap-1.5 shadow-lg"
        >
          <span>📸</span>
          <span>SHARE CARD</span>
        </motion.button>
        <motion.button
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
          onClick={async () => setShared((await copyChallengeLink()) ? "Challenge link copied ✓" : "Copy failed")}
          className="panel panel-edge flex items-center justify-center gap-1.5 min-h-[56px] cond text-base font-bold text-white hover:border-[var(--volt)]"
        >
          <span>⚔️</span>
          <span>CHALLENGE A FRIEND</span>
        </motion.button>
      </div>

      {shared && (
        <p className="mt-2 text-center text-xs font-semibold text-[var(--volt)] animate-fade-in">
          {shared}
        </p>
      )}
    </div>
  );
}
