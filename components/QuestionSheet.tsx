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
        if (v <= 1) {
          clearInterval(t);
          setLocked(true);
          return 0;
        }
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
    try {
      (navigator as unknown as { vibrate?: (p: number) => void }).vibrate?.(15);
    } catch {
      /* noop */
    }
    onResolve(k, Date.now() - start.current);
  }

  const isUrgent = left <= 5;

  return (
    <motion.div
      key={q.id}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="surface overflow-hidden shadow-lg border-[var(--border-medium)]"
    >
      <div className="p-4 space-y-3.5">
        {/* Header Strip: Context & Timer */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold tracking-wider text-[var(--brand-live)] uppercase">
                {kind === "future" ? "Future Call" : `Over ${q.at} Call`}
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-secondary)]">15s Window</span>
              {source === "ai" && (
                <>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Live AI</span>
                </>
              )}
            </div>
            {/* Highly readable sentence-case question */}
            <h3 className="text-base font-semibold text-white leading-snug tracking-normal">
              {q.text}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Timer Badge */}
            <div
              className={`font-num grid h-9 w-9 place-items-center rounded-lg text-sm font-bold border transition-colors ${
                isUrgent
                  ? "border-[var(--brand-live)] bg-red-950/40 text-[var(--brand-live)]"
                  : "border-[var(--border-medium)] bg-black/40 text-white"
              }`}
            >
              {left}
            </div>
            <button
              onClick={onClose}
              aria-label="Dismiss"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border-subtle)] bg-white/5 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Prediction Option Cards */}
        <div className="grid gap-2">
          {OPT_KEYS.map((k, i) => {
            const p = pOf(eff, k);
            const isWin = k === winKey;
            const isMine = k === picked;
            const dim = locked && !isMine && !isWin;

            return (
              <motion.button
                key={k}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: dim ? 0.35 : 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => pick(k)}
                whileTap={{ scale: 0.99 }}
                className={`relative w-full text-left p-3 rounded-lg border transition-all ${
                  locked && isWin
                    ? "bg-emerald-950/20 border-emerald-500/60 text-emerald-200"
                    : locked && isMine
                    ? "bg-amber-950/20 border-[var(--brand-gold)] text-[var(--brand-gold)]"
                    : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-white hover:border-[var(--border-medium)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded font-num text-xs font-bold ${
                        locked && isWin
                          ? "bg-emerald-500/20 text-emerald-400"
                          : locked && isMine
                          ? "bg-amber-500/20 text-[var(--brand-gold)]"
                          : "bg-black/40 text-[var(--text-secondary)]"
                      }`}
                    >
                      {k}
                    </span>
                    <span className="text-sm font-medium">
                      {q.options[OPT_KEYS.indexOf(k)]}
                    </span>
                  </div>

                  {isMine && locked && (
                    <span className="text-[10px] font-bold tracking-wider text-[var(--brand-gold)] uppercase">
                      Locked
                    </span>
                  )}
                </div>

                {/* Percentage distribution bar after locking */}
                {locked && (
                  <div className="mt-2 pl-8.5">
                    <div className="h-1 w-full rounded-full bg-black/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          p <= 20 ? "bg-[var(--brand-gold)]" : "bg-white/20"
                        }`}
                      />
                    </div>
                    <span className="mt-1 block font-num text-[10px] text-[var(--text-muted)]">
                      {p}% crowd split {p <= 20 ? "• Rare (+XP)" : ""}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-[var(--text-muted)]">
          {locked
            ? q.dynamics_cached || "Settles automatically upon completion of the over."
            : "Select one call before the over begins. Rare calls earn bonus XP."}
        </p>
      </div>
    </motion.div>
  );
}
