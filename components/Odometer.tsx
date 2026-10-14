"use client";
import { motion, AnimatePresence } from "framer-motion";
export default function Odometer({ value }: { value: string | number }) {
  const chars = String(value).split("");
  return (
    <span className="font-num inline-flex overflow-hidden" aria-live="polite">
      {chars.map((c, i) => (
        <span key={i} className="relative inline-block h-[1.2em] w-[0.62em] overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={c}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 grid place-items-center"
            >
              {c}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
