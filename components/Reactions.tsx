"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["🔥", "😱", "👏", "💥", "🙌", "⚡", "💛", "😭", "🤯", "👑", "💪", "🎯", "🚀", "🫣", "📣", "❤️‍🔥"];
const TEMPLATES = [
  "{p} on fire right now",
  "That {b} over changed everything",
  "{p} vs {b} is box office",
  "Crowd has lost it after that {e}",
  "RRR climbing — nerves everywhere",
  "Someone call the physio, my BP 📈",
  "{p} reading the game like a book",
  "This chase is going to the wire",
  "Field spread, pressure on bowler",
  "Kids crying, elders praying 😭",
  "What a time to be watching",
  "Momentum swinging every ball",
  "Dew coming in, grip going out",
  "Death overs specialist walking in",
  "Commentators have given up predicting",
  "My parlay survived that ball 💀",
];
const PLAYERS = ["Head", "Bumrah", "Axar", "Maxwell", "Chahal", "Kohli", "Hardik", "Siraj"];
const BOWLERS = ["Bumrah", "Axar", "Chahal", "Siraj", "Hardik"];

function pick<T>(arr: T[], avoid?: T): T {
  let v = arr[Math.floor(Math.random() * arr.length)];
  let guard = 0;
  while (avoid !== undefined && v === avoid && guard++ < 6) v = arr[Math.floor(Math.random() * arr.length)];
  return v;
}

export default function Reactions({ scoreLine = "", team = "", batter = "", bowler = "", isChase = true, liveBall = null as null | { label: string; text: string; big: boolean } }) {
  const [floats, setFloats] = useState<{ id: number; e: string }[]>([]);
  const [comments, setComments] = useState<string[]>(() => [`${"Campbell"} on fire`, `${"Prasidh"} time`]);
  const lastComment = useRef("");
  const lastEmoji = useRef("");
  const seenBall = useRef("");

  useEffect(() => {
    if (!liveBall || liveBall.label === seenBall.current) return;
    seenBall.current = liveBall.label;
    setComments((prev) => [...prev.slice(-2), liveBall.text]);
    if (liveBall.big) {
      const id = Date.now();
      setFloats((f) => [...f.slice(-12), { id, e: "🔥" }, { id: id + 1, e: "😱" }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id && x.id !== id + 1)), 2600);
    }
  }, [liveBall]);

  useEffect(() => {
    let id = 0;
    const t = setInterval(() => {
      if (document.querySelectorAll("[data-float]").length > 14) return;
      id += 1;
      const e = pick(EMOJIS, lastEmoji.current);
      lastEmoji.current = e;
      setFloats((f) => [...f.slice(-12), { id, e }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 2600);
    }, 1600);
    const c = setInterval(() => {
      const tpl = pick(TEMPLATES, lastComment.current);
      const line = tpl
        .replace("{p}", batter || pick(PLAYERS))
        .replace("{b}", bowler || pick(BOWLERS))
        .replace("{e}", pick(["six", "yorker", "review", "diving stop", "slower ball"]))
        + (team ? ` • ${team} ${isChase ? "chasing" : "batting 1st"}` : "")
        + (scoreLine ? ` ${scoreLine}` : "");
      lastComment.current = tpl;
      setComments((prev) => [...prev.slice(-2), line]);
    }, 3600);
    return () => { clearInterval(t); clearInterval(c); };
  }, [scoreLine]);

  return (
    <div className="panel panel-edge">
      <div className="panel-inner relative min-h-[120px] overflow-hidden">
        <span className="tag">REACTIONS • LIVE CROWD</span>
        <div className="mt-2 min-h-[44px] space-y-1">
          <AnimatePresence initial={false}>
            {comments.map((c, i) => (
              <motion.p key={`${c}-${i}`} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="text-xs" style={{ color: "var(--text-2)" }}>
                {c}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-3 h-20 w-24">
          <AnimatePresence>
            {floats.map((f) => (
              <motion.span key={f.id} data-float initial={{ y: 40, x: 0, opacity: 0 }}
                animate={{ y: -50, x: [0, 12, -12, 0], opacity: [0, 1, 1, 0] }} exit={{ opacity: 0 }}
                transition={{ duration: 2.4 }} className="absolute bottom-0 right-2 text-xl">{f.e}</motion.span>
            ))}
          </AnimatePresence>
        </div>
        {team ? <p className="mt-1 text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{team} • {batter || ""}{batter && bowler ? " v " : ""}{bowler || ""}</p> : null}
        <div className="mt-2 flex gap-2">
          {["🔥", "👏", "😱"].map((e) => (
            <button key={e} onClick={() => setFloats((f) => [...f.slice(-12), { id: Date.now() + Math.random(), e }])}
              className="grid h-11 w-11 place-items-center border text-xl" style={{ borderColor: "var(--line)", borderRadius: 2 }}>{e}</button>
          ))}
          <span className="tag volt self-center">YOU TAP = BIGGER</span>
        </div>
      </div>
    </div>
  );
}
