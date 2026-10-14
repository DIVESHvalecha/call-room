"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { loadStore, type CollectedCard, DEMO_CARDS } from "@/lib/store";
import { shareCardPNG, copyChallengeLink } from "@/lib/share";
import ParticleBurst from "./ParticleBurst";

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

const ALL_SLOTS = [
  { id: "live-match", label: "India vs West Indies", edition: "Chase 406 • Eden Gardens", tier: "Diamond", req: "Complete live over calls" },
  { id: "wtc-final", label: "India vs Australia", edition: "WTC Final • The Oval", tier: "Diamond", req: "Predict clutch final over" },
  { id: "death-duel", label: "India vs Pakistan", edition: "T20 World Cup • MCG", tier: "Platinum", req: "Call death-over boundary" },
  { id: "review-right", label: "India vs South Africa", edition: "Eden Gardens • 1st Innings", tier: "Gold", req: "Call turning delivery" },
  { id: "rare-x3", label: "Triple Rare Slot", edition: "England vs India • Lord's", tier: "Gold", req: "Hit 3 rare consensus calls" },
  { id: "streak-5", label: "Streak Master Slot", edition: "5-Day Streak Milestone", tier: "Silver", req: "Reach 5-call accuracy streak" },
];

export default function AlbumGrid() {
  const [cards, setCards] = useState<CollectedCard[]>(DEMO_CARDS);
  const [expandedCard, setExpandedCard] = useState<CollectedCard | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [shared, setShared] = useState<string>("");

  const cardRef = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rX = useTransform(ry, [-60, 60], [6, -6]);
  const rY = useTransform(rx, [-60, 60], [-6, 6]);

  useEffect(() => {
    const store = loadStore();
    if (store.cards && store.cards.length > 0) {
      setCards(store.cards);
    }
  }, []);

  const unlockedCount = cards.length;
  const activeTheme = expandedCard
    ? (TIER_THEMES[expandedCard.tier] || TIER_THEMES.Gold)
    : TIER_THEMES.Gold;
  const isDiamond = expandedCard?.tier === "Diamond";
  const pctTotal = expandedCard
    ? Math.min(100, Math.round(((expandedCard.xp || 90) / 140) * 100))
    : 45;

  return (
    <div className="space-y-3.5">
      {/* 1. Album Header with Progress */}
      <div className="surface p-3.5 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide uppercase">
            Trophy Album
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Verified match collectibles unlocked via live insight. Tap any card to inspect.
          </p>
        </div>
        <div className="text-right">
          <span className="font-num text-sm font-bold text-[var(--brand-gold)]">
            {unlockedCount} / 6 Collected
          </span>
          <span className="block text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Season Set
          </span>
        </div>
      </div>

      {/* Locked Slot Notice Toast */}
      {lockedNotice && (
        <div className="surface p-2.5 flex items-center justify-between border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Requirement: <b>{lockedNotice}</b></span>
          </div>
          <button
            onClick={() => setLockedNotice(null)}
            className="text-[10px] uppercase font-bold text-amber-400 hover:text-white px-1.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. THE 6-SLOT LIST/GRID (Like Before) */}
      <div className="grid grid-cols-2 gap-2.5">
        {ALL_SLOTS.map((slot) => {
          const card = cards.find(
            (c) =>
              c.slotId === slot.id ||
              (slot.id === "live-match" && (c.slotId === "live-match" || c.slotId.startsWith("card-ind-wi")))
          );
          const isUnlocked = !!card;
          const theme = isUnlocked
            ? TIER_THEMES[card.tier] || TIER_THEMES.Gold
            : TIER_THEMES[slot.tier] || TIER_THEMES.Silver;

          if (isUnlocked && card) {
            return (
              <motion.button
                key={slot.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setExpandedCard(card);
                  rx.set(0);
                  ry.set(0);
                }}
                className="relative text-left rounded-xl p-[2px] transition-all group overflow-hidden shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  background: card.isNew
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : theme.border,
                }}
              >
                <div className="relative rounded-[10px] bg-[#0c101a] p-3 flex flex-col justify-between h-full min-h-[148px]">
                  {/* Top row: Tier and Status */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase"
                      style={{ background: theme.badgeBg, color: theme.badgeText }}
                    >
                      {card.tier}
                    </span>
                    {card.isNew ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-400 text-black animate-pulse">
                        ★ NEW
                      </span>
                    ) : (
                      <span className="font-num text-[10px] font-bold text-[var(--brand-gold)]">
                        +{card.xp} XP
                      </span>
                    )}
                  </div>

                  {/* Middle: Title & Edition */}
                  <div className="my-2">
                    <h4 className="font-cond text-sm font-bold tracking-wide text-white leading-tight uppercase group-hover:text-[var(--brand-gold)] transition-colors">
                      {card.matchTitle.replace("INDIA v ", "IND v ").replace("INDIA vs ", "IND v ")}
                    </h4>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      {card.matchEdition}
                    </p>
                  </div>

                  {/* Bottom: Rarity score & Tap hint */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                    <span className="font-num text-[var(--text-muted)]">
                      Score <b className="text-white font-bold">{card.rarityScore ?? 78}/100</b>
                    </span>
                    <span className="text-[10px] font-bold text-[var(--brand-gold)] flex items-center gap-0.5">
                      Inspect ↗
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          }

          // Locked slot
          return (
            <div
              key={slot.id}
              onClick={() => setLockedNotice(slot.req)}
              className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 flex flex-col justify-between min-h-[148px] text-left opacity-75 transition-opacity hover:opacity-100 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {slot.tier} Slot
                </span>
                <span className="text-xs text-[var(--text-muted)]">🔒</span>
              </div>

              <div className="my-2">
                <h4 className="font-cond text-sm font-bold tracking-wide text-[var(--text-secondary)] uppercase">
                  {slot.label.replace("India vs ", "IND v ")}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                  {slot.edition}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 text-[9px] text-[var(--text-muted)]">
                Req: <span className="text-[var(--text-secondary)]">{slot.req}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-[var(--text-muted)]">
        Collect cards by predicting live cricket overs and hitting consensus reads.
      </p>

      {/* 3. EXPANDED COLLECTIBLE CARD MODAL OVERLAY (Matches Post-Scratch Card UI) */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-5 flex flex-col items-center justify-start sm:justify-center"
            onClick={() => setExpandedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[420px] my-auto space-y-3"
            >
              {/* Top Bar with Close Button */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: activeTheme.accent }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {expandedCard.tier} Collectible
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedCard(null)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>✕</span>
                  <span>Close</span>
                </button>
              </div>

              {/* Exact Collectible 3D Tilt Card Container */}
              <div className="relative">
                <ParticleBurst fire={isDiamond} />

                <motion.div
                  ref={cardRef}
                  onMouseMove={(e) => {
                    const r = cardRef.current?.getBoundingClientRect();
                    if (!r) return;
                    rx.set(e.clientX - r.left - r.width / 2);
                    ry.set(e.clientY - r.top - r.height / 2);
                  }}
                  onMouseLeave={() => {
                    rx.set(0);
                    ry.set(0);
                  }}
                  style={{
                    rotateX: rX,
                    rotateY: rY,
                    perspective: 1000,
                  }}
                  className="relative"
                >
                  {/* Full Collectible Card Frame */}
                  <div
                    id="album-card-shot"
                    style={{
                      background: activeTheme.border,
                      boxShadow: `0 14px 40px -8px ${activeTheme.glow}`,
                    }}
                    className="relative rounded-2xl p-[3px] transition-shadow duration-300"
                  >
                    {/* Card Inner Grounded Container */}
                    <div
                      className="relative overflow-hidden rounded-[13px] bg-[#0c101a] p-4 text-center sm:p-5"
                      style={{
                        backgroundImage: `
                          radial-gradient(ellipse 350px 220px at 50% 0%, ${activeTheme.accentBg}, transparent 70%),
                          linear-gradient(180deg, #131926 0%, #0c101a 60%, #070a10 100%)
                        `,
                      }}
                    >
                      {/* Prismatic Reflection Foil */}
                      <div className="shine pointer-events-none absolute inset-0 z-10" />

                      {/* Top Header */}
                      <div className="relative z-20 flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                          <span className="cond text-[11px] font-bold tracking-widest text-white/80">
                            MATCH EDITION #042/500
                          </span>
                        </div>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--volt)]">
                          {expandedCard.matchEdition}
                        </span>
                      </div>

                      {/* Headline & Title */}
                      <div className="relative z-20 mt-3">
                        <div
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-black tracking-wider uppercase"
                          style={{ background: activeTheme.badgeBg, color: activeTheme.badgeText }}
                        >
                          ★ {expandedCard.bestCall || "KEY INSIGHT READ"}
                        </div>
                        <h3 className="cond mt-1.5 text-2xl font-black italic tracking-wide text-white drop-shadow-md sm:text-3xl">
                          {expandedCard.matchTitle}
                        </h3>
                      </div>

                      {/* Key Call Read Highlight Card */}
                      {expandedCard.best && (
                        <div className="relative z-20 mx-auto mt-3 rounded-xl border border-white/15 bg-black/40 p-3 text-left shadow-inner backdrop-blur-sm">
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-[var(--volt)] px-1.5 py-0.5 text-[10px] font-extrabold text-[#0a0f2c]">
                                OVER {expandedCard.best.over}
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                                KEY CALL READ
                              </span>
                            </div>
                            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-extrabold text-emerald-400">
                              +{expandedCard.best.pts} XP
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-medium italic text-white/95 leading-relaxed">
                            “{expandedCard.best.qText}”
                          </p>

                          <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-2 text-[11px]">
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-white/50">Your Pick</span>
                              <span className="font-bold text-[var(--volt)]">✓ {expandedCard.best.yourPick}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[9px] uppercase tracking-wider text-white/50">Consensus</span>
                              <span className="font-semibold text-white/90">Only {expandedCard.best.p}% predicted</span>
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
                              {expandedCard.rarityScore ?? 78}<span className="text-xs font-normal text-white/40">/100</span>
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Live Rank</span>
                            <span className="font-num text-xl font-black text-[var(--volt)]">
                              #{expandedCard.matchRank ?? 1}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">Daily Rank</span>
                            <span className="font-num text-xl font-black text-[var(--win)]">
                              #{expandedCard.dailyRank ?? 5}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 border-t border-white/10 pt-2 text-[11px] font-medium text-white/70">
                          Live <b className="text-white">{expandedCard.liveXP ?? 70}</b> + Situational <b className="text-white">{expandedCard.situationalXP ?? 25}</b> = Total <b className="text-[var(--volt)] font-bold text-sm">+{expandedCard.xp} XP</b>
                        </div>
                      </div>

                      {/* Tier Seal */}
                      <div className="relative z-20 mt-3 flex flex-wrap items-center justify-center gap-2">
                        <div
                          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 shadow-lg"
                          style={{ background: activeTheme.badgeBg, color: activeTheme.badgeText }}
                        >
                          <span className="text-xs">★</span>
                          <span className="cond text-sm font-black tracking-wider uppercase">
                            {expandedCard.tier} TIER COLLECTIBLE
                          </span>
                        </div>

                        {expandedCard.reward && (
                          <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-[#06281c] shadow">
                            {expandedCard.reward}
                          </span>
                        )}
                      </div>

                      {/* Tier Progress Threshold Visual Bar */}
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

                {/* Action Buttons for Card */}
                <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={async () => {
                      rx.set(0);
                      ry.set(0);
                      await new Promise((r) => setTimeout(r, 60));
                      const el = document.getElementById("album-card-shot");
                      if (!el) {
                        setShared("Card element not found");
                        return;
                      }
                      setShared("Generating high-res card...");
                      const ok = await shareCardPNG(el as HTMLElement);
                      setShared(ok ? "Card saved / shared ✓" : "Share failed — screenshot instead");
                    }}
                    className="btn-gold shadow-md"
                  >
                    <span>Share Card PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => setShared((await copyChallengeLink()) ? "Challenge link copied ✓" : "Copy failed")}
                    className="btn-secondary"
                  >
                    <span>Challenge Friend</span>
                  </button>
                </div>

                {shared && (
                  <p className="mt-2 text-center text-xs font-semibold text-[var(--volt)] animate-fade-in">
                    {shared}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
