"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Question, OptKey } from "@/lib/slice";
import { OPT_KEYS } from "@/lib/slice";
import { pOf } from "@/lib/room";
import type { Split } from "@/lib/slice";

export default function QuestionSheet({
  q,
  kind,
  splits,
  onResolve,
  onClose,
  source,
}: {
  q: Question;
  kind: string;
  splits: Split;
  onResolve: (key: OptKey, ms: number) => void;
  onClose: () => void;
  source?: "ai" | "pool";
}) {
  const [picked, setPicked] = useState<OptKey | null>(null);
  const [locked, setLocked] = useState(false);
  const [left, setLeft] = useState(15);
  const start = useRef(Date.now());

  useEffect(() => {
    setPicked(null);
    setLocked(false);
    setLeft(15);
    start.current = Date.now();
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) { clearInterval(t); setLocked(true); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [q.id]);

  const winKey = OPT_KEYS[q.answerIdx];
  const eff = splits ?? q.splits;
  function pick(k: OptKey) {
    if (locked) return;
    setPicked(k);
    setLocked(true);
    try { (navigator as unknown as { vibrate?: (p: number) => void }).vibrate?.(15); } catch { /* noop */ }
    onResolve(k, Date.now() - start.current);
  }

  return (
    <motion.div
      key={q.id}
      initial={{ rotateX: 70, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      style={{ perspective: 800 }}
      className="panel panel-edge volt"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <rect x="1" y="1" width="98" height="98" fill="none" stroke={left <= 5 ? "var(--live)" : "var(--volt)"} strokeWidth="1.5"
          strokeDasharray="400" strokeDashoffset={400 * (1 - left / 15)} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div className="panel-inner">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="tag volt">{kind === "future" ? "FUTURE CALL • SHIMMER" : `CALL INCOMING • OVER ${q.at}`} {left <= 5 ? "• HURRY" : ""} • {source === "ai" ? "AI-AUTHORED ✓" : "POOL"}</p>
            <h3 className="cond mt-1 text-xl">{q.text}</h3>
          </div>
          <div className="flex shrink-0 gap-1">
            <span className="font-num grid h-11 w-11 place-items-center border text-lg font-bold" style={{ borderColor: left <= 5 ? "var(--live)" : "var(--line)" }}>{left}</span>
            <button onClick={onClose} aria-label="Dismiss" className="grid h-11 w-11 place-items-center border text-lg" style={{ borderColor: "var(--line)" }}>✕</button>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {OPT_KEYS.map((k, i) => {
            const p = pOf(eff, k);
            const isWin = k === winKey;
            const isMine = k === picked;
            const dim = locked && !isMine && !isWin;
            return (
              <motion.button
                key={k}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: dim ? 0.35 : 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => pick(k)}
                whileTap={{ scale: 0.98 }}
                className="min-h-[56px] px-4 py-3 text-left font-bold text-[var(--text-1)]"
                style={{
                  background: locked && isWin ? "rgba(46,230,166,0.22)" : "var(--ink-3)",
                  border: `1.5px solid ${locked && isWin ? "var(--win)" : "var(--line)"}`,
                  clipPath: "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)",
                  transform: locked && isMine ? "scale(1.02)" : "none",
                  color: locked && isWin ? "var(--win)" : "var(--text-1)",
                }}
              >
                <span className="mr-2 inline-grid h-6 w-6 place-items-center bg-black/40 text-xs" style={{ color: locked && isWin ? "var(--win)" : "var(--text-1)" }}>{k}</span>
                {q.options[OPT_KEYS.indexOf(k)]}
                {isMine && locked && <span className="tag volt ml-2">LOCKED ✓</span>}
                {locked && (
                  <span className="mt-1 block h-1.5 bg-black/40">
                    <motion.span initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.6 }}
                      className="block h-full" style={{ background: p <= 20 ? "var(--volt)" : "var(--text-3)" }} />
                  </span>
                )}
                {locked && <span className="mt-1 block text-xs font-normal" style={{ color: "var(--text-2)" }}>{p}%{p <= 20 ? " • RARE" : ""}{isMine ? " • YOU" : ""}</span>}
              </motion.button>
            );
          })}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--text-2)" }}>{locked ? q.dynamics_cached : "Max 1 per over • key moments + future calls when quiet."}</p>
      </div>
    </motion.div>
  );
}
