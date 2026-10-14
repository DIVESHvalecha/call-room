"use client";
import { motion } from "framer-motion";
export default function ParticleBurst({ fire }: { fire: boolean }) {
  if (!fire) return null;
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return null;
  const parts = Array.from({ length: 12 }, (_, i) => ({
    x: Math.cos((i / 12) * Math.PI * 2) * (60 + (i % 3) * 30),
    y: Math.sin((i / 12) * Math.PI * 2) * (60 + (i % 3) * 30),
  }));
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute h-2.5 w-2.5"
          style={{ background: i % 2 ? "var(--volt)" : "var(--win)", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
        />
      ))}
    </div>
  );
}
