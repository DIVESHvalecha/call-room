"use client";
import { motion } from "framer-motion";
import Odometer from "./Odometer";

export type Score = { runs: number; wkts: number; over: string; ballsLeft: number; need: number; target: number };

export function rrrOf(s: Score): string {
  const rrr = s.ballsLeft > 0 ? s.need / (s.ballsLeft / 6) : 0;
  return rrr.toFixed(2);
}

export default function ScoreHeader({
  score,
  balls,
  live = 128,
  batters = [],
  bowlers = [],
  isChase = true,
  inningsTotal = 300,
  matchTitle = "IND v WI • ODI",
}: {
  score: Score;
  balls: string[];
  live?: number;
  batters?: { name: string; runs: number; balls: number; sr: string }[];
  bowlers?: { name: string; overs: string; runs: number; wkts: number }[];
  isChase?: boolean;
  inningsTotal?: number;
  matchTitle?: string;
}) {
  const crr = (() => {
    const parts = String(score.over).split(".");
    const done = Number(parts[0]) * 6 + Number(parts[1] || 0);
    return done > 0 ? (score.runs / (done / 6)).toFixed(2) : "0.00";
  })();
  return (
    <div className="panel panel-edge live sticky top-8 z-30">
      <div className="panel-inner">
        <div className="flex items-center justify-between">
          <span className="tag live animate-pop">● LIVE {live}</span>
          <span className="tag">{matchTitle}</span>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-[11px] tracking-widest" style={{ color: "var(--text-2)" }}>
              {isChase ? `TARGET ${score.target} • ${score.over} OV` : `1ST INNINGS • ${score.over} OV`}
            </p>
            <p className="font-num text-4xl font-extrabold">
              <Odometer value={`${score.runs}/${score.wkts}`} />{" "}
              <span className="text-base">({score.over})</span>
            </p>
            {isChase ? (
              <motion.p key={`${score.runs}-${score.wkts}`} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="text-xs" style={{ color: "var(--text-2)" }}>
                NEED {score.need} OFF {score.ballsLeft} • RRR {rrrOf(score)}
              </motion.p>
            ) : (
              <motion.p key={`${score.runs}-${score.wkts}`} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="text-xs" style={{ color: "var(--text-2)" }}>
                CRR {crr} • {score.over} OV DONE • 1ST INNINGS
              </motion.p>
            )}
          </div>
        </div>
        {(batters.length > 0 || bowlers.length > 0) && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]" style={{ color: "var(--text-2)" }}>
            <div>
              {batters.slice(0, 2).map((b) => (
                <p key={b.name} className="font-num">{b.name} <b style={{ color: "var(--text-1)" }}>{b.runs}({b.balls})</b> SR {b.sr}</p>
              ))}
            </div>
            <div className="text-right">
              {bowlers.slice(0, 2).map((b) => (
                <p key={b.name} className="font-num">{b.name} <b style={{ color: "var(--text-1)" }}>{b.wkts}-{b.runs}({b.overs})</b></p>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 h-1 overflow-hidden bg-black/40">
          <div className="h-full" style={{ width: `${Math.min(100, (Number(String(score.over).split(".")[0]) * 6 + Number(String(score.over).split(".")[1] || 0)) / Math.max(1, inningsTotal) * 100)}%`, background: "var(--volt)" }} />
        </div>
        <div className="mt-2 flex gap-1.5">
          {balls.slice(-6).map((b, i) => (
            <motion.span
              key={`${i}-${b}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="grid h-7 w-7 place-items-center text-[11px] font-bold"
              style={{
                background: b === "W" ? "var(--live)" : b === "6" ? "var(--volt)" : b === "4" ? "var(--electric)" : "#2a3680",
                color: b === "6" ? "#10173a" : "#fff",
                clipPath: "polygon(25% 0, 100% 0, 75% 100%, 0 100%)",
              }}
            >
              {b}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
