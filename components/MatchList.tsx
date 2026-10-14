"use client";
import { motion } from "framer-motion";
export default function MatchList({ onEnter, liveScore }: { onEnter: (id: string) => void; liveScore?: { runs: number; wkts: number; over: string; need: number; ballsLeft: number; target?: number } }) {
  const feat = liveScore ?? { runs: 120, wkts: 2, over: "18.2", need: 286, ballsLeft: 190, target: 406 };
  const target = feat.target ?? 406;
  const matches = [
    { id: "m1", title: `IND v WI • ODI • ${feat.runs}/${feat.wkts} (${feat.over})`, meta: `TARGET ${target} • NEED ${feat.need} OFF ${feat.ballsLeft}`, watchers: 128, live: true },

    { id: "m3", title: "ENG v NZ • 7 PM", meta: "PRE-MATCH ROOM • BEGINS SOON", watchers: 34, live: false },
  ];
  return (
    <div className="space-y-3">
      <h3 className="cond text-lg">FEATURED »» LIVE</h3>
      {matches.map((m, i) => (
        <motion.button key={m.id} initial={{ y: 24, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: i * 0.08 }} onClick={() => onEnter(m.id)}
          className="panel panel-edge live min-h-[84px] w-full text-left active:scale-[0.99]">
          <div className="panel-inner">
            <span className="flex items-center justify-between">
              <span className="cond text-xl">{m.title}</span>
              {m.live ? <span className="tag live">● LIVE {m.watchers} </span> : <span className="tag">{m.meta}</span>}
            </span>
            <span className="mt-1 block text-xs" style={{ color: "var(--text-2)" }}>{m.meta} • LIVE</span>
            {i === 0 && (
              <span className="mt-2 flex gap-1.5">
                {[["1", "#5B67A3"], ["4", "#2D5BFF"], ["6", "#D7FF3A"], ["W", "#FF3D71"], ["1", "#5B67A3"], ["2", "#5B67A3"]].map(([t, c], j) => (
                  <motion.span key={j} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: j * 0.08 }}
                    className="grid h-6 w-6 place-items-center text-[10px] font-bold"
                    style={{ background: c, color: c === "#D7FF3A" ? "#10173a" : "#fff", clipPath: "polygon(25% 0, 100% 0, 75% 100%, 0 100%)" }}>{t}</motion.span>
                ))}
              </span>
            )}
          </div>
        </motion.button>
      ))}
      <div className="panel panel-edge volt">
        <div className="panel-inner flex items-center justify-between">
          <div><p className="cond">DAILY TRIVIA STREAK RIBBON</p>
          <p className="text-xs" style={{ color: "var(--text-2)" }}>● ● ○ • +30 XP </p></div>
          <span className="tag volt">+30 XP</span>
        </div>
      </div>
    </div>
  );
}
