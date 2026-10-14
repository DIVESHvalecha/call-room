"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type Ball = string; // "0","1","2","4","6","W"

export const GAPS: Ball[][] = [
  ["1", "1", "4", "1", "2", "0", "1"], // 10.2 → 10.4
  ["0", "1", "W", "1", "4", "1"], // 10.4 → 11.2
  ["6", "1", "W", "0", "2", "1"], // 11.2 → 12.0
  ["1", "4", "1", "1", "6", "0"], // 12.0 → 13.1
  ["W", "1", "2", "4", "1", "1"], // 13.1 → 14.0
];

export function ballRuns(b: Ball): { runs: number; wkt: number } {
  if (b === "W") return { runs: 0, wkt: 1 };
  return { runs: Number(b) || 0, wkt: 0 };
}

function overLabel(qi: number, ballIdx: number, total: number): string {
  void qi;
  void ballIdx;
  void total;
  return "";
}

export default function FastForward({
  from,
  to,
  balls,
  onBall,
  onDone,
}: {
  from: string;
  to: string;
  balls: Ball[];
  onBall: (b: Ball, idx: number) => void;
  onDone: () => void;
}) {
  const [p, setP] = useState(0);
  const [shown, setShown] = useState(0);
  const done = useRef(false);
  void overLabel;

  useEffect(() => {
    let raf = 0;
    const fired = new Set<number>();
    const t0 = performance.now();
    const DUR = 1200;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / DUR);
      setP(k);
      const n = Math.floor(k * balls.length);
      setShown(n);
      for (let i = 0; i < n; i++) {
        if (!fired.has(i)) {
          fired.add(i);
          onBall(balls[i], i);
        }
      }
      if (k < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(onDone, 150);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  return (
    <div className="panel panel-edge">
      <div className="panel-inner">
        <div className="flex items-center justify-between">
          <span className="tag live">⏩ FAST-FORWARDING TO THE NEXT BEST MOMENT</span>
          <span className="font-num text-sm font-bold">{from} → {to}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden bg-black/40">
          <motion.div className="h-full" style={{ width: `${p * 100}%`, background: "var(--volt)" }} />
        </div>
        <div className="mt-2 flex gap-1.5">
          {balls.map((b, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.6, opacity: 0.25 }}
              animate={i < shown ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="grid h-7 w-7 place-items-center text-[11px] font-bold"
              style={{
                background: b === "W" ? "var(--live)" : b === "6" ? "var(--volt)" : b === "4" ? "var(--electric)" : "#2a3680",
                color: b === "6" ? "#10173a" : "#fff",
                clipPath: "polygon(25% 0, 100% 0, 75% 100%, 0 100%)",
              }}
            >
              {i < shown ? b : "•"}
            </motion.span>
          ))}
        </div>
        <p className="mt-1 text-[11px]" style={{ color: "var(--text-2)" }}>Catching you up ball-by-ball — watch the scorecard move, next call loads after this…</p>
      </div>
    </div>
  );
}
