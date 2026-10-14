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
}) {
  return (
    <div className="paper p-0">
      <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--ink-2)" }}>
        <span className="cond text-sm" style={{ color: "var(--text-1)" }}>TOP CALLERS • LIVE 500</span>
        {typeof youRank === "number" ? (
          <span className="tag volt">
            YOU #{youRank}
            {typeof gapPts === "number" && gapPts > 0 ? ` • ${gapPts} PTS TO NEXT` : " • LEADING"}
          </span>
        ) : (
          <span className="tag volt">JOIN TO CLIMB</span>
        )}
      </div>

      <div className="space-y-1 p-3">
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
            <div key={r.name} className="space-y-1">
              {hasGap && (
                <div className="py-1 text-center text-[10px] font-bold text-gray-500 tracking-wider">
                  ••• {gapCount} OTHER CALLERS •••
                </div>
              )}
              <motion.div
                layout
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="flex items-center justify-between px-3 py-2 text-sm font-bold"
                style={{
                  background: r.you ? "var(--volt)" : "#fff",
                  color: "#10173a",
                  borderLeft: r.you ? "6px solid var(--electric)" : "6px solid transparent",
                  clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                }}
              >
                <span>
                  #{displayRank} {r.name}
                  {r.you ? " ★ YOU" : " "}
                </span>
                <span>
                  <AnimatedNumber value={r.pts} />
                  {typeof r.delta === "number" && r.delta !== 0 && (
                    <span className="ml-2 text-xs">
                      {r.delta > 0 ? `▲${r.delta}` : `▼${-r.delta}`}
                    </span>
                  )}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      <p className="px-4 pb-3 text-[11px] font-bold">+{others} OTHERS (LIVE CROWD)</p>
    </div>
  );
}
