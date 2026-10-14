"use client";
import AnimatedNumber from "./AnimatedNumber";
import { motion } from "framer-motion";

export type Row = {
  name: string;
  pts: number;
  rank?: number;
  you?: boolean;
  delta?: number;
  sample?: boolean;
};

export default function Leaderboard({
  rows,
  others = 490,
  youRank,
  gapPts,
  tied = false,
}: {
  rows: Row[];
  others?: number;
  youRank?: number;
  gapPts?: number;
  tied?: boolean;
  onEnter?: () => void;
}) {
  return (
    <div className="surface overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
        <span className="text-xs font-bold text-white tracking-wider uppercase">
          Room Standings
        </span>
        {typeof youRank === "number" ? (
          <span className="text-xs font-semibold text-[var(--brand-gold)] font-num">
            Your Rank: #{youRank}
            {typeof gapPts === "number" && gapPts > 0 ? ` (${gapPts} XP to next)` : " (Leading)"}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Live 500 Room
          </span>
        )}
      </div>

      {/* Rows List */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {rows.map((r, i) => {
          const displayRank = tied ? 1 : (r.rank ?? i + 1);
          const prevRow = i > 0 ? rows[i - 1] : null;
          const hasGap = Boolean(
            prevRow &&
            r.rank &&
            prevRow.rank &&
            r.rank - prevRow.rank > 1
          );
          const gapCount = hasGap ? (r.rank! - prevRow!.rank! - 1) : 0;

          return (
            <div key={r.name}>
              {hasGap && (
                <div className="py-1.5 px-3.5 bg-black/20 text-center font-num text-[10px] text-[var(--text-muted)] tracking-wider">
                  ••• {gapCount} callers in between •••
                </div>
              )}
              <motion.div
                layout
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                  r.you
                    ? "bg-amber-500/10 text-[var(--brand-gold)] font-semibold"
                    : "text-[var(--text-primary)] hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-num w-6 font-bold ${
                      displayRank <= 3 && !tied
                        ? "text-[var(--brand-gold)]"
                        : r.you
                        ? "text-[var(--brand-gold)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    #{displayRank}
                  </span>
                  <span className="font-medium text-sm">
                    {r.name}
                    {r.you && (
                      <span className="ml-1.5 text-[10px] font-bold text-[var(--brand-gold)] tracking-wide uppercase">
                        (You)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-num text-sm font-semibold">
                    <AnimatedNumber value={r.pts} />
                    <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">XP</span>
                  </span>
                  {typeof r.delta === "number" && r.delta !== 0 && (
                    <span className={`font-num text-[10px] font-bold ${r.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {r.delta > 0 ? `+${r.delta}` : `${r.delta}`}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Table Footer */}
      <div className="px-3.5 py-2 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50 text-center">
        <p className="font-num text-[10px] text-[var(--text-muted)]">
          +{others} other participants in this session
        </p>
      </div>
    </div>
  );
}
