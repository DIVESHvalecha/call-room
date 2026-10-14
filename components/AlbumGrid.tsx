"use client";
import { motion } from "framer-motion";

const SLOTS = [
  { id: "head-falls", hint: "Top Match Call" },
  { id: "death-duel", hint: "Win a duel" },
  { id: "review-right", hint: "Nail a review call" },
  { id: "rare-x3", hint: "3 rare calls" },
  { id: "daily-3", hint: "Daily 3/3" },
  { id: "streak-5", hint: "5-day streak" },
];

export default function AlbumGrid({ unlocked }: { unlocked?: string[] }) {
  const has = new Set(unlocked ?? ["head-falls"]);
  return (
    <div className="panel panel-edge volt">
      <div className="panel-inner">
        <h3 className="cond text-lg">ALBUM • 1/6 UNLOCKED </h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SLOTS.map((s, i) => {
            const open = has.has(s.id);
            return (
              <motion.div
                key={s.id}
                initial={{ y: 24, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05 }}
                className="p-3 text-center text-xs font-bold"
                style={{
                  background: open ? "var(--volt)" : "rgba(0,0,0,0.35)",
                  color: open ? "#10173a" : "var(--text-2)",
                  border: "1px solid var(--line)",
                  clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                }}
              >
                {open ? `★ ${s.hint}` : `? ${s.hint}`}
              </motion.div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px]" style={{ color: "var(--text-2)" }}>Play daily to unlock silhouettes. No two cards alike.</p>
      </div>
    </div>
  );
}
