"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import daily from "@/data/daily.json";
import { addDailyXP } from "@/lib/store";

type DQ = { id: string; kind: string; text: string; options: string[]; answerIdx: number; explainer_cached: string };

function getSets(): DQ[][] {
  const d = daily as unknown as { sets?: DQ[][]; questions?: DQ[] };
  if (d.sets && d.sets.length) return d.sets;
  return [d.questions ?? []];
}

export default function DailyList({ onDone }: { onDone?: (xp: number, correct: number) => void }) {
  const qs = useMemo<DQ[]>(() => {
    const sets = getSets();
    return sets[Math.floor(Math.random() * sets.length)];
  }, []);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [earned, setEarned] = useState(0);

  function answer(id: string, idx: number) {
    if (done) return;
    setAnswers((a) => ({ ...a, [id]: idx }));
  }

  function submit() {
    if (done) return;
    let xp = 0;
    let correct = 0;
    qs.forEach((q) => {
      if (answers[q.id] === q.answerIdx) {
        xp += 10;
        correct += 1;
      }
    });
    addDailyXP(xp);
    setEarned(xp);
    setDone(true);
    onDone?.(xp, correct);
  }

  const allAnswered = qs.length > 0 && qs.every((q) => answers[q.id] !== undefined);

  return (
    <div className="panel panel-edge volt">
      <div className="panel-inner">
        <div className="flex items-center justify-between">
          <h3 className="cond text-lg">🔥 DAILY TRIVIA • +30 XP</h3>
          <span className="tag volt">SET {qs[0]?.id.slice(0, 2).toUpperCase() ?? "A"} • RANDOM</span>
        </div>
        <div className="mt-3 space-y-3">
          {qs.map((q, qi) => (
            <div key={q.id}>
              <p className="text-[11px] tracking-widest" style={{ color: "var(--text-2)" }}>{q.kind.toUpperCase()} • Q{qi + 1}</p>
              <p className="font-bold text-sm">{q.text}</p>
              <div className="mt-1 grid gap-1.5">
                {q.options.map((o, i) => {
                  const sel = answers[q.id] === i;
                  const show = done;
                  const right = i === q.answerIdx;
                  return (
                    <motion.button
                      key={i}
                      onClick={() => answer(q.id, i)}
                      whileTap={{ scale: 0.97 }}
                      animate={sel && !done ? { scale: 1.02 } : { scale: 1 }}
                      className="min-h-[52px] px-3 py-2 text-left text-sm font-bold"
                      style={{
                        background: show && right ? "rgba(46,230,166,0.22)" : sel ? "rgba(215,255,58,0.16)" : "var(--ink-3)",
                        border: `2px solid ${show && right ? "var(--win)" : sel ? "var(--volt)" : "var(--line)"}`,
                        boxShadow: sel && !done ? "0 0 14px rgba(215,255,58,0.45)" : "none",
                        opacity: show && !sel && !right ? 0.55 : 1,
                        clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                      }}
                    >
                      <span className="mr-2 inline-grid h-6 w-6 place-items-center text-xs"
                        style={{ background: sel ? "var(--volt)" : "rgba(0,0,0,0.35)", color: sel ? "#10173a" : "inherit" }}>
                        {sel ? "✓" : String.fromCharCode(65 + i)}
                      </span>
                      {o}
                      {sel && !done && <span className="tag volt ml-2">YOUR PICK</span>}
                      {show && right && <span className="ml-2">✓</span>}
                    </motion.button>
                  );
                })}
              </div>
              {done && <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>{q.explainer_cached}</p>}
            </div>
          ))}
        </div>
        {!done ? (
          <button
            onClick={submit}
            disabled={!allAnswered}
            className="btn-volt mt-4 w-full"
            style={{ opacity: allAnswered ? 1 : 0.45 }}
          >
            {allAnswered ? "SUBMIT DAILY →" : `PICK ALL ${qs.length} TO SUBMIT (${Object.keys(answers).length}/${qs.length})`}
          </button>
        ) : (
          <motion.p initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-3 text-center font-bold">
            +{earned} XP BANKED {earned === 30 ? "• PERFECT — TIER PUSHES UP" : earned === 0 ? "• 0/3 — BOARD SLIPS" : "• BOARD + CARD UPDATED"}
          </motion.p>
        )}
      </div>
    </div>
  );
}
