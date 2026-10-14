"use client";
import { useEffect, useState } from "react";
import { loadStore } from "@/lib/store";
import { seasonXP } from "@/lib/score";
import { tierWithDaily } from "@/lib/score";

export default function SeasonTable({ matchPts }: { matchPts?: number }) {
  const [s, setS] = useState({ matchXP: 0, dailyXP: 0, streak: 0 });
  useEffect(() => {
    const st = loadStore();
    setS({ matchXP: st.matchXP + (matchPts ?? 0), dailyXP: st.dailyXP, streak: st.streak });
  }, [matchPts]);
  const total = seasonXP(s.matchXP, s.dailyXP);
  const proj = tierWithDaily(2, 20, s.streak);
  return (
    <div className="paper p-0">
      <div className="px-4 py-2 cond text-sm" style={{ background: "var(--ink-2)", color: "var(--text-1)" }}>
        SEASON BOARD 
      </div>
      <div className="grid grid-cols-4 gap-2 p-3 text-center text-xs font-bold" style={{ color: "#10173a" }}>
        <div><p className="font-num text-xl">{s.matchXP}</p><p>MATCH XP</p></div>
        <div><p className="font-num text-xl">{s.dailyXP}🔥{s.streak}</p><p>DAILY XP</p></div>
        <div><p className="font-num text-xl">{total}</p><p>SEASON XP</p></div>
        <div><p className="text-sm" style={{ background: "var(--volt)", padding: "4px" }}>{proj.toUpperCase()}</p><p>TIER PROJ</p></div>
      </div>
    </div>
  );
}
