"use client";
import { motion } from "framer-motion";
import type { BatterRow, BowlerRow } from "@/lib/cricsheet";

function sr(r: number, b: number): string {
  return ((r / Math.max(1, b)) * 100).toFixed(1);
}
function econ(runs: number, balls: number): string {
  return ((runs / Math.max(1, balls)) * 6).toFixed(1);
}
function oversFmt(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

export default function FullScoreboard({
  team,
  runs,
  wkts,
  oversLabel,
  oversTotal,
  batters,
  bowlers,
  extras,
  crr,
  target,
}: {
  team: string;
  runs: number;
  wkts: number;
  oversLabel: string;
  oversTotal: number;
  batters: BatterRow[];
  bowlers: BowlerRow[];
  extras: number;
  crr: string;
  target?: number;
}) {
  return (
    <div className="panel panel-edge">
      <div className="panel-inner">
        <div className="flex items-baseline justify-between">
          <h3 className="cond text-2xl">{team} <span className="font-num">{runs}/{wkts}</span></h3>
          <span className="font-num text-sm" style={{ color: "var(--text-2)" }}>({oversLabel}/{oversTotal}) • CRR {crr}{target ? ` • NEED ${Math.max(0, target - runs)}` : ""}</span>
        </div>

        <div className="paper mt-3 p-0">
          <div className="grid grid-cols-[1fr_34px_30px_26px_26px_44px] px-3 py-1.5 text-[11px] font-bold" style={{ background: "var(--ink-2)", color: "var(--text-1)" }}>
            <span>BATTER</span><span className="text-right">R</span><span className="text-right">B</span><span className="text-right">4s</span><span className="text-right">6s</span><span className="text-right">SR</span>
          </div>
          {batters.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className="grid grid-cols-[1fr_34px_30px_26px_26px_44px] px-3 py-1.5 text-[13px]"
              style={{ color: "#10173a", borderTop: "1px solid #dfe4ff", fontWeight: b.out ? 400 : 700 }}
            >
              <span>{b.name} {!b.out ? "*" : ""} <span className="block text-[10px] font-normal opacity-60">{b.out ? b.out : "batting"}</span></span>
              <span className="font-num text-right font-bold">{b.runs}</span>
              <span className="font-num text-right">{b.balls}</span>
              <span className="font-num text-right">{b.fours}</span>
              <span className="font-num text-right">{b.sixes}</span>
              <span className="font-num text-right">{sr(b.runs, b.balls)}</span>
            </motion.div>
          ))}
          <div className="flex justify-between px-3 py-1.5 text-[12px] font-bold" style={{ color: "#10173a", borderTop: "2px solid var(--ink-2)" }}>
            <span>Extras ({extras}) • Total {runs}/{wkts}</span>
            <span className="font-num">CRR {crr}</span>
          </div>
        </div>

        <div className="paper mt-2 p-0">
          <div className="grid grid-cols-[1fr_40px_40px_34px_44px] px-3 py-1.5 text-[11px] font-bold" style={{ background: "var(--ink-2)", color: "var(--text-1)" }}>
            <span>BOWLER</span><span className="text-right">O</span><span className="text-right">R</span><span className="text-right">W</span><span className="text-right">Econ</span>
          </div>
          {bowlers.map((b) => (
            <div key={b.name} className="grid grid-cols-[1fr_40px_40px_34px_44px] px-3 py-1.5 text-[13px]" style={{ color: "#10173a", borderTop: "1px solid #dfe4ff" }}>
              <span className="font-bold">{b.name}</span>
              <span className="font-num text-right">{oversFmt(b.balls)}</span>
              <span className="font-num text-right">{b.runs}</span>
              <span className="font-num text-right font-bold">{b.wkts}</span>
              <span className="font-num text-right">{econ(b.runs, b.balls)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
