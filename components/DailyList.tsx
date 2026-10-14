"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dailyData from "@/data/daily.json";
import { addDailyXP, loadStore } from "@/lib/store";

export type DailyQ = {
  id: string;
  kind: string;
  text: string;
  options: [string, string, string, string];
  answerIdx: number;
  explainer_cached: string;
};

export default function DailyList({
  onDone,
  onBackToHome,
}: {
  onDone?: (xp: number) => void;
  onBackToHome?: () => void;
}) {
  const [qs, setQs] = useState<DailyQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizState, setQuizState] = useState<"intro" | "in-progress" | "result">("intro");
  const [showReview, setShowReview] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    const sets = dailyData.sets as DailyQ[][];
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const todayQuestions = sets[day % sets.length] ?? sets[0];
    setQs(todayQuestions);

    const store = loadStore();
    const todayStr = new Date().toISOString().slice(0, 10);
    if (store.lastDaily === todayStr) {
      setAlreadyCompleted(true);
      // Restore past answers if saved in session storage
      try {
        const saved = sessionStorage.getItem(`daily_answers_${todayStr}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setEarnedXP(parsed.earned || 0);
          setQuizState("result");
          return;
        }
      } catch {
        /* noop */
      }
    }
  }, []);

  function startQuiz() {
    setQuizState("in-progress");
    setCurrentIndex(0);
  }

  function selectOption(optIdx: number) {
    if (quizState !== "in-progress") return;
    const currentQ = qs[currentIndex];
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
  }

  function handleNext() {
    if (currentIndex < qs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  function handleSubmit() {
    if (submitting || quizState === "result") return;
    setSubmitting(true);

    let xp = 0;
    qs.forEach((q) => {
      if (answers[q.id] === q.answerIdx) {
        xp += 10;
      }
    });

    setEarnedXP(xp);
    setQuizState("result");
    setSubmitting(false);

    if (!alreadyCompleted) {
      addDailyXP(xp);
      onDone?.(xp);
      setAlreadyCompleted(true);
    }

    // Cache in session storage for today
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      sessionStorage.setItem(
        `daily_answers_${todayStr}`,
        JSON.stringify({ answers, earned: xp })
      );
    } catch {
      /* noop */
    }
  }

  const currentQ = qs[currentIndex];
  const isAnswered = currentQ && answers[currentQ.id] !== undefined;
  const isFinalQ = currentIndex === qs.length - 1;
  const totalQuestions = qs.length || 3;

  // Correct count calculation
  const correctCount = qs.filter((q) => answers[q.id] === q.answerIdx).length;

  return (
    <div className="surface overflow-hidden shadow-sm">
      {/* 1. INTRO STATE: Compact, Focused Overview */}
      {quizState === "intro" && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">
                Daily Cricket Trivia
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                3 match-insight questions • +10 XP per correct call
              </p>
            </div>
            <div className="text-right">
              <span className="block text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Available
              </span>
              <span className="font-num text-sm font-bold text-[var(--brand-gold)]">
                +30 XP Max
              </span>
            </div>
          </div>

          {/* Quick Info Strip */}
          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
              <span className="block font-num text-sm font-bold text-white">3</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                Questions
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
              <span className="block font-num text-sm font-bold text-[var(--brand-gold)]">+10</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                XP Per Hit
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
              <span className="block font-num text-sm font-bold text-[var(--brand-emerald)]">Tier</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                Upgrade
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Daily trivia strengthens your season rank and directly boosts tonight&apos;s collectible card tier threshold.
          </p>

          <button
            type="button"
            onClick={startQuiz}
            className="btn-primary w-full py-2.5 text-center justify-center font-bold"
          >
            {alreadyCompleted ? "Review Today's Trivia" : "Start Daily Quiz →"}
          </button>
        </div>
      )}

      {/* 2. IN-PROGRESS QUIZ: One Question at a Time */}
      {quizState === "in-progress" && currentQ && (
        <div className="p-4 space-y-4">
          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-num font-bold text-white">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {currentQ.kind}
                </span>
              </div>
              <span className="font-num text-[11px] font-semibold text-[var(--brand-gold)]">
                +10 XP
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
              {qs.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i < currentIndex
                      ? "bg-[var(--brand-gold)]"
                      : i === currentIndex
                      ? "bg-white"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Display with Smooth Slide Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5 pt-1"
            >
              <h3 className="text-sm font-semibold text-white leading-snug">
                {currentQ.text}
              </h3>

              {/* 4 Interactive Answer Options */}
              <div className="grid gap-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => selectOption(optIdx)}
                      className={`w-full min-h-[48px] p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-amber-500/15 border-[var(--brand-gold)] text-white shadow-sm"
                          : "bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-medium)] active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid h-6 w-6 place-items-center rounded text-[11px] font-num font-bold ${
                            isSelected
                              ? "bg-[var(--brand-gold)] text-black font-extrabold"
                              : "bg-black/30 text-[var(--text-muted)]"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="font-medium">{opt}</span>
                      </div>

                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-[var(--brand-gold)] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                currentIndex === 0
                  ? "opacity-30 border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed"
                  : "border-[var(--border-subtle)] text-white hover:bg-white/5 active:scale-95"
              }`}
            >
              ← Previous
            </button>

            {isFinalQ ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isAnswered || submitting}
                className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all text-center justify-center ${
                  !isAnswered || submitting
                    ? "opacity-40 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed"
                    : "btn-primary"
                }`}
              >
                {submitting ? "Submitting…" : "Submit Answers ✓"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isAnswered}
                className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all text-center justify-center ${
                  !isAnswered
                    ? "opacity-40 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed"
                    : "btn-primary"
                }`}
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. RESULT STATE: Completion & Optional Review */}
      {quizState === "result" && (
        <div className="p-4 space-y-4">
          <div className="text-center py-2 space-y-1.5 border-b border-[var(--border-subtle)] pb-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-gold)]">
              Daily Quiz Complete
            </span>
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-num text-3xl font-extrabold text-white">
                {correctCount} / {totalQuestions}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-medium">Correct</span>
            </div>
            <p className="font-num text-sm font-bold text-[var(--brand-emerald)]">
              +{earnedXP} XP Added to Season Standing
            </p>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowReview((v) => !v)}
              className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-xs font-semibold text-white hover:border-[var(--border-medium)] transition-colors"
            >
              {showReview ? "Hide Answers" : "Review Answers"}
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              className="btn-primary py-2 text-center justify-center text-xs font-bold"
            >
              Return Home →
            </button>
          </div>

          {/* Review Details Accordion */}
          {showReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2 border-t border-[var(--border-subtle)]"
            >
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                Question Review
              </h4>
              <div className="space-y-3">
                {qs.map((q, idx) => {
                  const userPick = answers[q.id];
                  const isCorrect = userPick === q.answerIdx;
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-num text-[10px] font-bold text-[var(--text-muted)] uppercase">
                          Q{idx + 1} • {q.kind}
                        </span>
                        <span
                          className={`font-semibold text-[11px] ${
                            isCorrect ? "text-[var(--brand-emerald)]" : "text-[var(--brand-live)]"
                          }`}
                        >
                          {isCorrect ? "Correct (+10 XP)" : "Missed (0 XP)"}
                        </span>
                      </div>

                      <p className="text-white font-medium">{q.text}</p>

                      <div className="grid gap-1 pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)]">Your pick:</span>
                          <span className={isCorrect ? "text-[var(--brand-emerald)] font-semibold" : "text-white"}>
                            {userPick !== undefined ? q.options[userPick] : "None"}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[var(--text-muted)]">Correct answer:</span>
                            <span className="text-[var(--brand-emerald)] font-semibold">
                              {q.options[q.answerIdx]}
                            </span>
                          </div>
                        )}
                      </div>

                      {q.explainer_cached && (
                        <p className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-white/5 leading-relaxed">
                          {q.explainer_cached}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
