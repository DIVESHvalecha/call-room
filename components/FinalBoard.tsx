"use client";
import { motion } from "framer-motion";
import type { Row } from "./Leaderboard";

export default function FinalBoard({ rows, youRank }: { rows: Row[]; youRank: number }) {
  return (
    <div className="paper p-0">
      <div className="px-4 py-2 cond text-sm" style={{ background: "var(--ink-2)", color: "var(--text-1)" }}>
        FINAL BOARD • YOU CLIMB #{youRank}
      </div>
      <div className="space-y-1 p-3">
        {rows.map((r, i) => {
          const displayRank = r.rank ?? (i + 1);
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
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: r.you ? 0.9 : i * 0.12, type: "spring", stiffness: 260, damping: 24 }}
                className="flex items-center justify-between px-3 py-2 text-sm font-bold"
                style={{
                  background: r.you ? "var(--volt)" : "#fff",
                  color: "#10173a",
                  borderLeft: r.you ? "6px solid var(--electric)" : "6px solid transparent",
                  clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                  boxShadow: r.you ? "0 0 18px rgba(215,255,58,0.8)" : "none",
                }}
              >
                <span>
                  #{displayRank} {r.name}
                  {r.you ? " (YOU)" : " "}
                </span>
                <span className="font-num">{r.pts} PTS</span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
