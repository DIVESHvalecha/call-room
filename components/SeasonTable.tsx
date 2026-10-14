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
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Season Progress
        </h4>
        <span className="font-num text-xs font-semibold text-[var(--brand-gold)]">
          {s.streak} Day Streak
        </span>
      </div>

      <div className="grid grid-cols-4 divide-x divide-[var(--border-subtle)] p-3 text-center">
        <div className="px-1">
          <span className="font-num text-lg font-bold text-white">{s.matchXP}</span>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Match</p>
        </div>
        <div className="px-1">
          <span className="font-num text-lg font-bold text-[var(--brand-gold)]">{s.dailyXP}</span>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Daily</p>
        </div>
        <div className="px-1">
          <span className="font-num text-lg font-bold text-white">{total}</span>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Total</p>
        </div>
        <div className="px-1 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-[var(--brand-gold)] uppercase tracking-wide border border-amber-500/30">
            {proj}
          </span>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Tier</p>
        </div>
      </div>
    </div>
  );
}
