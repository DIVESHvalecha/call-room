"use client";
import { useState } from "react";
import DynamicsLine from "./DynamicsLine";

export default function SOSButton({ context }: { context: string }) {
  const [open, setOpen] = useState(false);
  const [watchNext, setWatchNext] = useState("Watch the next 5 balls — new batter vs spin decides it.");
  const [badge, setBadge] = useState<string | null>(null);

  async function sos() {
    setOpen(true);
    try {
      const res = await fetch("/api/dynamics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qId: "sos",
          state: context,
          q: "Chaos just happened — what occurred and what to watch next?",
          answer: "Explain + watch-next",
          live: true,
        }),
      });
      const j = await res.json();
      if (typeof j.line === "string") {
        const parts = j.line.split(/[.!?]\s/);
        if (parts[1]) setWatchNext(parts.slice(1).join(". "));
      }
      setBadge((j.badge as string | null) ?? null);
    } catch {
      setBadge("OFFLINE ");
    }
  }

  return (
    <div>
      <button onClick={sos} className="btn-volt w-full text-base">🚨 WHAT JUST HAPPENED?</button>
      {open && (
        <div>
          <DynamicsLine
            qId="sos"
            state={context}
            q="SOS: last-5 chaos"
            answer="Explain + watch-next"
            fallback="Whistle chaos — penalty shout in the box. Watch the keeper's left next 5."
          />
          <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
            NEXT: {watchNext} {badge ? `• ${badge}` : "• LIVE AI"}
          </p>
        </div>
      )}
    </div>
  );
}
