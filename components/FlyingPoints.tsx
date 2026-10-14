"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function FlyingPoints({ flight }: { flight: { pts: number; rare: boolean } | null }) {
  const reduced =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <AnimatePresence>
      {flight && flight.pts > 0 && (
        <motion.div
          key={`${flight.pts}-${Date.now()}`}
          initial={{ y: -30, x: 40, opacity: 0, scale: 0.7 }}
          animate={{ y: 60, x: 0, opacity: [0, 1, 1, 0.9], scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.8, ease: "easeInOut" }}
          className="pointer-events-none fixed left-1/2 top-[38%] z-50 font-num text-3xl font-extrabold"
          style={{ color: flight.rare ? "var(--volt)" : "var(--win)", textShadow: "0 2px 18px rgba(0,0,0,0.7)" }}
        >
          +{flight.pts}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
