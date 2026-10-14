"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Odometer from "./Odometer";

export type Score = {
  runs: number;
  wkts: number;
  over: string;
  ballsLeft: number;
  need: number;
  target: number;
};

export type BatterStat = {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: string;
  out: string | null;
  isStriker?: boolean;
};

export type BowlerStat = {
  name: string;
  overs: string;
  maidens?: number;
  runs: number;
  wkts: number;
  econ: string;
};

export function rrrOf(s: Score): string {
  const rrr = s.ballsLeft > 0 ? s.need / (s.ballsLeft / 6) : 0;
  return rrr.toFixed(2);
}

export default function ScoreHeader({
  score,
  balls,
  batters = [],
  bowlers = [],
  isChase = true,
  battingTeam = "India",
  bowlingTeam = "West Indies",
  format = "2nd ODI • 50 ov",
  venue = "Barsapara Cricket Stadium, Guwahati",
  matchTitle,
}: {
  score: Score;
  balls: string[];
  batters?: BatterStat[];
  bowlers?: BowlerStat[];
  isChase?: boolean;
  battingTeam?: string;
  bowlingTeam?: string;
  format?: string;
  venue?: string;
  matchTitle?: string;
}) {
  const [showAllBatters, setShowAllBatters] = useState(false);

  const crr = (() => {
    const parts = String(score.over).split(".");
    const done = Number(parts[0]) * 6 + Number(parts[1] || 0);
    return done > 0 ? (score.runs / (done / 6)).toFixed(2) : "0.00";
  })();

  // Separate crease batters (not out) from dismissed batters
  const creaseBatters = batters.filter((b) => !b.out);
  const displayedBatters = showAllBatters ? batters : creaseBatters.length > 0 ? creaseBatters : batters.slice(0, 2);

  // Active bowler is the most recent bowler, plus secondary bowler if available
  const activeBowlers = bowlers.slice(0, 2);

  // Current over balls (last 6 deliveries)
  const currentOverBalls = balls.slice(-6);

  return (
    <div className="surface overflow-hidden shadow-sm">
      {/* A. Match Header */}
      <div className="px-3.5 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1.5 font-bold tracking-wider text-white text-[11px] shrink-0">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-live)] animate-pulse" />
            LIVE
          </span>
          <span className="text-[var(--text-muted)] shrink-0">•</span>
          <span className="font-semibold text-white truncate text-[11px]">
            {matchTitle || `${battingTeam} vs ${bowlingTeam}`}
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] tracking-tight shrink-0 font-medium ml-2">
          {format}
        </span>
      </div>

      {venue && (
        <div className="px-3.5 py-1 text-[10px] text-[var(--text-muted)] border-b border-[var(--border-subtle)] bg-[var(--surface-card)] truncate">
          {venue} • {isChase ? `2nd Innings (Target ${score.target})` : "1st Innings"}
        </div>
      )}

      {/* B. Main Score & Chase Information */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                {battingTeam}
              </span>
              <span className="font-num text-3xl font-extrabold tracking-tight text-white">
                <Odometer value={`${score.runs}/${score.wkts}`} />
              </span>
              <span className="font-num text-sm font-semibold text-[var(--text-secondary)]">
                ({score.over} ov)
              </span>
            </div>

            {/* Chase Equation or 1st Innings CRR */}
            {isChase ? (
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-snug">
                Need <b className="text-white font-num font-bold">{score.need}</b> runs off{" "}
                <span className="text-white font-num font-semibold">{score.ballsLeft}b</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-snug">
                Current Run Rate <b className="text-white font-num font-bold">{crr}</b>
              </p>
            )}
          </div>

          {/* Rates breakdown pill */}
          <div className="text-right shrink-0">
            <div className="inline-block px-2.5 py-1 rounded bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[11px]">
              <span className="text-[var(--text-muted)] font-medium">CRR </span>
              <span className="font-num text-white font-bold">{crr}</span>
              {isChase && (
                <>
                  <span className="mx-1.5 text-[var(--border-subtle)]">•</span>
                  <span className="text-[var(--brand-gold)] font-medium">RRR </span>
                  <span className="font-num text-[var(--brand-gold)] font-bold">{rrrOf(score)}</span>
                </>
              )}
            </div>
            {isChase && (
              <span className="block text-[10px] font-semibold text-[var(--text-muted)] mt-1 font-num">
                Target {score.target}
              </span>
            )}
          </div>
        </div>

        {/* C. Batting Scorecard Table */}
        {displayedBatters.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between pb-1.5 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              <span>Batting</span>
              {batters.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllBatters((v) => !v)}
                  className="text-[var(--brand-gold)] hover:underline normal-case tracking-normal font-medium"
                >
                  {showAllBatters ? "Show Crease Only" : `Full Card (${batters.length})`}
                </button>
              )}
            </div>

            <div className="overflow-x-auto -mx-3.5 px-3.5 no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] border-b border-[var(--border-subtle)]/60">
                    <th className="pb-1 font-medium tracking-wider uppercase">Batter</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-8">R</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-7">B</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-6">4s</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-6">6s</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-11">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/40 font-num">
                  {displayedBatters.map((b) => (
                    <tr
                      key={b.name}
                      className={b.isStriker ? "text-white font-semibold" : "text-[var(--text-secondary)]"}
                    >
                      <td className="py-1.5 pr-2 font-sans font-medium text-xs truncate max-w-[130px]">
                        <span className={b.isStriker ? "text-white font-bold" : "text-[var(--text-primary)]"}>
                          {b.name}
                        </span>
                        {b.isStriker && <span className="text-[var(--brand-gold)] ml-1 font-bold">*</span>}
                        {b.out && (
                          <span className="block text-[9px] text-[var(--text-muted)] truncate font-normal">
                            {b.out}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-right font-bold text-white">{b.runs}</td>
                      <td className="py-1.5 text-right text-[var(--text-secondary)]">{b.balls}</td>
                      <td className="py-1.5 text-right text-[var(--text-muted)]">{b.fours}</td>
                      <td className="py-1.5 text-right text-[var(--text-muted)]">{b.sixes}</td>
                      <td className="py-1.5 text-right text-[var(--text-secondary)] font-medium">{b.sr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* D. Bowling Figures Table */}
        {activeBowlers.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <span className="block pb-1.5 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Bowling
            </span>

            <div className="overflow-x-auto -mx-3.5 px-3.5 no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] border-b border-[var(--border-subtle)]/60">
                    <th className="pb-1 font-medium tracking-wider uppercase">Bowler</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-8">O</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-6">M</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-8">R</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-6">W</th>
                    <th className="pb-1 text-right font-medium tracking-wider uppercase w-11">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/40 font-num">
                  {activeBowlers.map((bw) => (
                    <tr key={bw.name} className="text-[var(--text-secondary)]">
                      <td className="py-1.5 pr-2 font-sans font-medium text-xs text-[var(--text-primary)] truncate max-w-[130px]">
                        {bw.name}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-white">{bw.overs}</td>
                      <td className="py-1.5 text-right text-[var(--text-muted)]">{bw.maidens ?? 0}</td>
                      <td className="py-1.5 text-right text-[var(--text-secondary)]">{bw.runs}</td>
                      <td className="py-1.5 text-right font-bold text-[var(--brand-gold)]">{bw.wkts}</td>
                      <td className="py-1.5 text-right text-[var(--text-secondary)] font-medium">{bw.econ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* E. Recent Deliveries Strip */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            This Over ({score.over} ov)
          </span>
          <div className="flex items-center gap-1.5">
            {currentOverBalls.map((b, i) => {
              const isWicket = b === "W";
              const isSix = b === "6";
              const isFour = b === "4";
              const isDot = b === "0";
              const isWide = b === "wd";
              const isNb = b === "nb" || b === "+";

              return (
                <motion.span
                  key={`${i}-${b}`}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className={`grid h-6 w-6 place-items-center rounded text-[10px] font-num font-bold transition-transform ${
                    isWicket
                      ? "bg-[var(--brand-live)] text-white shadow-sm"
                      : isSix
                      ? "bg-[var(--brand-gold)] text-black"
                      : isFour
                      ? "bg-white/20 text-white font-bold"
                      : isDot
                      ? "bg-white/5 text-[var(--text-muted)]"
                      : isWide || isNb
                      ? "bg-amber-500/20 text-[var(--brand-gold)] border border-amber-500/30"
                      : "bg-white/10 text-[var(--text-secondary)]"
                  }`}
                >
                  {b}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
