"use client";
import ParticleBurst from "./ParticleBurst";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ScratchReveal({ onReveal }: { onReveal: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(false);
  const draws = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const r = c.getBoundingClientRect();
    c.width = r.width * 2;
    c.height = 320 * 2;
    ctx.scale(2, 2);
    const g = ctx.createLinearGradient(0, 0, r.width, 0);
    g.addColorStop(0, "#2D5BFF");
    g.addColorStop(0.5, "#8fa4ff");
    g.addColorStop(1, "#2D5BFF");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, r.width, 320);
    ctx.fillStyle = "#fff";
    ctx.font = "italic 800 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL »»", r.width / 2, 160);
    ctx.font = "italic 700 12px sans-serif";
    ctx.fillText("LIVE • SEALED UNTIL FULL TIME", r.width / 2, 184);
  }, []);

  function erase(e: React.PointerEvent) {
    const c = canvasRef.current;
    if (!c || done) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fill();
    draws.current += 1;
    if (draws.current > 10) {
      setDone(true);
      setBurst(true);
      setTimeout(onReveal, 900);
    }
  }

  return (
    <div className="panel panel-edge volt">
      <div className="panel-inner text-center">
        <h3 className="cond text-2xl">FULL TIME • YOUR CARD IS READY</h3>
        <p className="text-xs" style={{ color: "var(--text-2)" }}>FINAL BOARD HIDDEN • SITUATIONAL SEALED 🔒</p>
        <div className="relative mx-auto mt-4 h-[320px] overflow-hidden" style={{ touchAction: "none" }}>
          <ParticleBurst fire={burst} />
          <div className="absolute inset-0 grid place-items-center" style={{ background: "var(--volt)", color: "#10173a" }}>
            <p className="cond text-3xl">READY ✓<br /><span className="text-sm">releasing…</span></p>
          </div>
          {!done && (
            <canvas
              ref={canvasRef}
              onPointerMove={(e) => { if (e.buttons > 0) erase(e); }}
              onPointerDown={erase}
              className="absolute inset-0 h-full w-full cursor-crosshair"
            />
          )}
          {done && (
            <motion.p initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="absolute inset-x-0 bottom-3 font-bold" style={{ color: "#10173a" }}>
              Revealing…
            </motion.p>
          )}
        </div>
        <button onClick={() => { setDone(true); setBurst(true); setTimeout(onReveal, 900); }}
          className="mt-3 w-full min-h-[48px] border text-sm font-bold" style={{ borderColor: "var(--line)" }}>
          Hold-to-reveal fallback (accessibility)
        </button>
      </div>
    </div>
  );
}
