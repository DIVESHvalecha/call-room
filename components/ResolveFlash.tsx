"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function ResolveFlash({
  flash,
}: {
  flash: {
    pts: number;
    rare: boolean;
    verdict: "correct" | "wrong" | "sealed" | "waiting";
    correctLabel?: string;
  } | null;
}) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={`${flash.pts}-${flash.rare}-${flash.verdict}-${flash.correctLabel}`}
          initial={{ scale: 0.92, opacity: 0, y: -6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`p-3.5 rounded-xl border text-center shadow-xl my-2 ${
            flash.verdict === "correct"
              ? flash.rare
                ? "bg-amber-950/40 border-[var(--brand-gold)] text-[var(--brand-gold)]"
                : "bg-emerald-950/40 border-emerald-500/60 text-emerald-300"
              : flash.verdict === "wrong"
              ? "bg-red-950/30 border-red-500/50 text-white"
              : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-white"
          }`}
        >
          {flash.verdict === "sealed" ? (
            <span className="text-xs font-semibold tracking-wider uppercase text-white">
              Sealed — Declared at match conclusion
            </span>
          ) : flash.verdict === "waiting" ? (
            <span className="text-xs font-semibold tracking-wider uppercase text-[var(--brand-gold)]">
              Parked — {flash.correctLabel ?? "Resolves when over concludes"}
            </span>
          ) : flash.verdict === "wrong" ? (
            <div className="space-y-1">
              <span className="text-sm font-bold tracking-wider text-[var(--brand-live)] uppercase">
                Call Missed
              </span>
              {flash.correctLabel && (
                <p className="text-xs text-[var(--text-secondary)]">
                  Correct answer was: <b className="text-white font-semibold">{flash.correctLabel}</b>
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Call Hit
              </span>
              <span className="font-num text-lg font-black text-white">
                +{flash.pts} XP
              </span>
              {flash.rare && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-[var(--brand-gold)] uppercase tracking-wide">
                  Rare
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
