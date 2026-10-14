"use client";
import { useState } from "react";
import AnimatedNumber from "./AnimatedNumber";
import { motion, AnimatePresence } from "framer-motion";

interface HomeScreenProps {
  onEnterLive: () => void;
  onViewAlbum: () => void;
  onViewDaily: () => void;
  liveScore: {
    runs: number;
    wkts: number;
    over: string;
    need: number;
    ballsLeft: number;
    target?: number;
  };
  userXP?: number;
  userRank?: number;
  unlockedCount?: number;
}

export default function HomeScreen({
  onEnterLive,
  onViewAlbum,
  onViewDaily,
  liveScore,
  userXP = 1250,
  userRank = 167,
  unlockedCount = 1,
}: HomeScreenProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const target = liveScore.target ?? 406;
  const rrr = liveScore.ballsLeft > 0 ? (liveScore.need / (liveScore.ballsLeft / 6)).toFixed(2) : "0.00";
  const crr = (() => {
    const parts = String(liveScore.over).split(".");
    const done = Number(parts[0]) * 6 + Number(parts[1] || 0);
    return done > 0 ? (liveScore.runs / (done / 6)).toFixed(2) : "0.00";
  })();

  return (
    <div className="space-y-3">
      {/* 1. Consolidated Cohesive Header */}
      <header className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-white uppercase">
            Call Room
          </h1>
          <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--brand-live)] tracking-wider uppercase px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-live)] animate-pulse" />
            Live
          </span>
        </div>

        {/* User Standing Pill */}
        <div className="flex items-center gap-2 font-num text-xs">
          <div className="px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <span className="text-[10px] text-[var(--text-muted)] mr-1 uppercase">XP</span>
            <b className="text-white font-bold"><AnimatedNumber value={userXP} /></b>
          </div>
          <div className="px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <span className="text-[10px] text-[var(--text-muted)] mr-1 uppercase">Rank</span>
            <b className="text-[var(--brand-gold)] font-bold">#{userRank}</b>
          </div>
        </div>
      </header>

      {/* 2. PRIMARY FOCAL POINT: Featured Live Match Card */}
      <div className="surface overflow-hidden shadow-sm">
        <div className="p-4 space-y-3.5">
          {/* Match Context Strip */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold tracking-wider text-[var(--brand-live)] uppercase text-[11px]">
                2nd ODI • 2nd Innings
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-muted)] truncate text-[11px]">
                Barsapara Stadium, Guwahati
              </span>
            </div>
            <span className="font-num text-[10px] text-[var(--text-muted)] shrink-0 font-medium">
              14.8k callers
            </span>
          </div>

          {/* Teams & Score Display */}
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wider text-white uppercase">
                  India
                </span>
                <span className="text-[9px] font-bold text-[var(--brand-gold)] bg-amber-500/10 px-1 rounded border border-amber-500/20 uppercase tracking-wide">
                  Batting
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-num text-3xl font-extrabold text-white tracking-tight">
                  {liveScore.runs}/{liveScore.wkts}
                </span>
                <span className="font-num text-xs font-semibold text-[var(--text-secondary)]">
                  ({liveScore.over} ov)
                </span>
              </div>
            </div>

            {/* Chase Equations */}
            <div className="text-right">
              <span className="block font-num text-[11px] text-[var(--text-secondary)] font-medium">
                Target {target} • Need <b className="text-white font-bold">{liveScore.need}</b> off <span className="font-semibold">{liveScore.ballsLeft}b</span>
              </span>
              <div className="flex items-center justify-end gap-1.5 font-num text-[10px] text-[var(--text-muted)] mt-0.5">
                <span>CRR {crr}</span>
                <span>•</span>
                <span className="text-[var(--brand-gold)] font-bold">RRR {rrr}</span>
              </div>
            </div>
          </div>

          {/* Recent Deliveries Strip */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Recent balls
            </span>
            <div className="flex items-center gap-1">
              {[
                { val: "1", type: "single" },
                { val: "4", type: "four" },
                { val: "6", type: "six" },
                { val: "W", type: "wicket" },
                { val: "1", type: "single" },
                { val: "2", type: "single" },
              ].map((b, idx) => (
                <span
                  key={idx}
                  className={`grid h-5.5 w-5.5 place-items-center rounded font-num text-[10px] font-bold ${
                    b.type === "wicket"
                      ? "bg-[var(--brand-live)] text-white"
                      : b.type === "six"
                      ? "bg-[var(--brand-gold)] text-black"
                      : b.type === "four"
                      ? "bg-white/20 text-white"
                      : "bg-white/5 text-[var(--text-secondary)]"
                  }`}
                >
                  {b.val}
                </span>
              ))}
            </div>
          </div>

          {/* Obvious Focal Call Room Action */}
          <button
            type="button"
            onClick={onEnterLive}
            className="btn-primary w-full py-2.5 text-center justify-center font-bold text-xs uppercase tracking-wider"
          >
            <span>Enter Live Call Room</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* 3. SECONDARY LEVEL: Trophy Album & Daily Trivia in Compact Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Trophy Album */}
        <button
          type="button"
          onClick={onViewAlbum}
          className="surface p-3 text-left hover:border-[var(--border-medium)] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[var(--brand-gold)] transition-colors">
              Trophy Album
            </span>
            <span className="font-num text-[10px] text-[var(--brand-gold)] font-bold">
              {unlockedCount}/6
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)] line-clamp-1">
            Verified match cards & rarity
          </p>
        </button>

        {/* Daily Trivia */}
        <button
          type="button"
          onClick={onViewDaily}
          className="surface p-3 text-left hover:border-[var(--border-medium)] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[var(--brand-gold)] transition-colors">
              Daily Trivia
            </span>
            <span className="font-num text-[10px] text-[var(--brand-emerald)] font-bold">
              +30 XP
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)] line-clamp-1">
            3 questions to upgrade tier
          </p>
        </button>
      </div>

      {/* 4. TERTIARY LEVEL: Compact Upcoming Match Row */}
      <div className="surface px-3.5 py-2.5 flex items-center justify-between text-xs">
        <div className="truncate mr-2">
          <span className="font-semibold text-white">England vs New Zealand</span>
          <p className="text-[10px] text-[var(--text-muted)] truncate">Calls open at toss • 7:30 PM</p>
        </div>
        <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 shrink-0">
          Upcoming
        </span>
      </div>

      {/* 5. How It Works: Compact Expandable Action */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => setShowHowItWorks((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <span>How Call Room Works</span>
          <span className="text-[9px]">{showHowItWorks ? "▲" : "▼"}</span>
        </button>

        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-left surface p-3 space-y-2 border-[var(--border-subtle)]"
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-[var(--surface-elevated)] space-y-0.5">
                  <span className="font-num text-[10px] font-bold text-[var(--text-muted)]">01</span>
                  <p className="text-xs font-semibold text-white">Predict</p>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    Call runs or wickets before each over
                  </p>
                </div>
                <div className="p-2 rounded bg-[var(--surface-elevated)] space-y-0.5">
                  <span className="font-num text-[10px] font-bold text-[var(--brand-gold)]">02</span>
                  <p className="text-xs font-semibold text-[var(--brand-gold)]">Streak</p>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    Chain correct calls to build accuracy streak
                  </p>
                </div>
                <div className="p-2 rounded bg-[var(--surface-elevated)] space-y-0.5">
                  <span className="font-num text-[10px] font-bold text-white">03</span>
                  <p className="text-xs font-semibold text-white">Collect</p>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    Finish session to reveal verified match card
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
