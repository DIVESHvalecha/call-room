"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function DynamicsLine({
  qId,
  state,
  q,
  answer,
  fallback,
  vaultHint,
}: {
  qId: string;
  state: string;
  q: string;
  answer: string;
  fallback: string;
  vaultHint?: string;
}) {
  const [line, setLine] = useState(fallback);
  const [badge, setBadge] = useState<string | null>(null);
  const [vaultId, setVaultId] = useState(vaultHint ?? `slice:${qId}:en`);

  useEffect(() => {
    let dead = false;
    setLine(fallback);
    setBadge(null);
    (async () => {
      try {
        const res = await fetch("/api/dynamics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qId, state, q, answer, live: true }),
        });
        if (!res.ok) throw new Error("bad");
        const j = await res.json();
        if (!dead && typeof j.line === "string") {
          setLine(j.line);
          setBadge((j.badge as string | null) ?? null);
          if (typeof j.vaultId === "string") setVaultId(j.vaultId);
        }
      } catch {
        if (!dead) setBadge("OFFLINE ");
      }
    })();
    return () => {
      dead = true;
    };
  }, [qId, state, q, answer, fallback]);

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="panel panel-edge volt mt-2"
    >
      <div className="panel-inner">
        <p className="cond text-base leading-tight">🗞 {line}</p>
        <p className="mt-1 text-[10px]" style={{ color: "var(--text-2)" }}>
          {badge ? `${badge} • ` : "LIVE AI • "}from {vaultId} • situational sealed regardless
        </p>
      </div>
    </motion.div>
  );
}
