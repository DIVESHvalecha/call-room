"use client";
export default function OnAirLight({ on }: { on: boolean }) {
  return (
    <span className="tag live" style={{ opacity: on ? 1 : 0.35, animation: on ? "pop 1.6s ease-in-out infinite" : "none" }}>
      ● ON AIR
    </span>
  );
}
