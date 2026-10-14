"use client";
import { motion } from "framer-motion";

export type FeedEvent = { at: string; label: string; active?: boolean };

export default function EventFeed({ events }: { events?: FeedEvent[] }) {
  const list: FeedEvent[] = events ?? [
    { at: "10.2", label: "WICKET threat — Kohli falls, Head in" },
    { at: "10.4", label: "Q1 resolves: 6-10 runs" },
    { at: "11.2", label: "LBW shout — Q2 review call" },
    { at: "12.0", label: "Q3: Axar to Head — WICKET" },
  ];
  return (
    <div className="card p-4">
      <h3 className="text-xs font-bold tracking-widest text-[var(--mut)]">EVENT FEED</h3>
      <ul className="mt-2 space-y-2">
        {list.map((e, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-3 py-2 text-sm ${e.active ? "bg-[var(--card2)] text-[var(--ink)]" : "text-[var(--mut)]"}`}
          >
            <span className="font-num mr-2 text-xs">{e.at}</span>{e.label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
