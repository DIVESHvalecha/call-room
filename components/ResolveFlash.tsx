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
          initial={{ scale: 0.6, opacity: 0, y: -8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="panel panel-edge p-4 text-center font-num text-xl md:text-2xl font-black uppercase tracking-wider shadow-2xl"
          style={{
            background:
              flash.verdict === "correct"
                ? flash.rare
                  ? "var(--volt)"
                  : "var(--win)"
                : flash.verdict === "wrong"
                ? "rgba(255, 61, 113, 0.25)"
                : "rgba(45, 91, 255, 0.25)",
            borderColor:
              flash.verdict === "correct"
                ? flash.rare
                  ? "var(--volt)"
                  : "var(--win)"
                : flash.verdict === "wrong"
                ? "var(--live)"
                : "var(--electric)",
            color:
              flash.verdict === "correct"
                ? "#0a0f2c"
                : "#ffffff",
          }}
        >
          {flash.verdict === "sealed" ? (
            <span style={{ color: "#ffffff" }}>🔒 SEALED — DECLARED AT FULL TIME</span>
          ) : flash.verdict === "waiting" ? (
            <span style={{ color: "var(--volt)" }}>⏳ PARKED — {flash.correctLabel ?? "resolves when the balls land"}</span>
          ) : flash.verdict === "wrong" ? (
            <div>
              <span className="text-2xl" style={{ color: "#ff3d71" }}>✗ WRONG</span>
              {flash.correctLabel && (
                <p className="mt-1 text-sm font-bold tracking-normal" style={{ color: "#ffffff" }}>
                  CORRECT ANSWER: <b style={{ color: "var(--win)" }}>{flash.correctLabel}</b>
                </p>
              )}
            </div>
          ) : (
            <span style={{ color: "#0a0f2c" }}>
              ✓ CORRECT +{flash.pts} {flash.rare ? "RARE 🔥" : "SAFE ✓"}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
