"use client";
import { motion } from "framer-motion";
import type { Row } from "./Leaderboard";
export default function RankStrip({ rows }: { rows: Row[] }) {
  return (
    <div className="panel panel-edge volt">
      <div className="panel-inner flex items-center gap-2 overflow-x-auto">
        <span className="tag sample shrink-0">RANK </span>
        {rows.slice(0, 5).map((r) => (
          <motion.span
            key={r.name}
            layout
            className={`shrink-0 px-3 py-1.5 text-xs font-bold ${r.you ? "tag volt" : "tag"}`}
          >
            {r.name} {r.pts}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
