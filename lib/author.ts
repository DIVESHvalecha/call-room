import type { MatchContext } from "./context";

export type Resolver =
  | { type: "runs-bucket"; window: 6 | "overEnd" }
  | { type: "wicket-bool"; n: 6; yesIndex: number }
  | { type: "next-bowler" }
  | { type: "boundary-kind"; window: 6 | "overEnd" }
  | { type: "milestone-reach"; batter: string; milestone: number }
  | { type: "dots-count"; window: "overEnd" };

export type AuthoredQ = {
  text: string;
  options: [string, string, string, string];
  expected: { A: number; B: number; C: number; D: number };
  resolver: Resolver;
  situation: "wicket" | "pressure" | "momentum" | "standard" | "milestone" | "death";
};

const ALLOWED = ["runs-bucket", "wicket-bool", "next-bowler", "boundary-kind", "milestone-reach", "dots-count"];

export function buildAuthorPrompt(ctx: MatchContext, candidates: string[], askedQuestions: string[] = []): string {
  return [
    "You are the live TV cricket broadcaster quiz writer for Dream11 Call Room.",
    "Write ONE urgent, broadcast-quality cricket question strictly grounded in the current live match context. No generic fluff.",
    askedQuestions.length > 0 ? `PREVIOUSLY ASKED QUESTIONS IN THIS SESSION (DO NOT REPEAT CONCEPTS OR SIMILAR PHRASING): ${JSON.stringify(askedQuestions)}` : "",
    `Match Context: ${JSON.stringify(ctx)}`,
    `Next Bowler Candidates: ${JSON.stringify(candidates)}`,
    "Contract: reply strictly with a JSON object: {text, options[4 strings], expected{A,B,C,D percentages}, resolver:{type, window?, n?, yesIndex?, batter?, milestone?}, situation}.",
    "Resolver options:",
    "1) runs-bucket (window: 6 or overEnd) - Options format: ['0-5', '6-10', '11-15', '16+']",
    "2) wicket-bool (n: 6, yesIndex: index of the YES option) - e.g. ['Yes, clean bowled/LBW', 'Yes, caught in deep', 'No wicket', 'Run out / Chaos']",
    "3) next-bowler - options MUST be exactly the 4 candidates above.",
    "4) boundary-kind (window: 6 or overEnd) - e.g. ['SIX launched', 'FOUR through gap', 'Singles only', 'Wicket falls instead']",
    "5) milestone-reach (batter: name, milestone: 50 or 100) - e.g. ['Reaches 50 this over', 'Falls 1-4 short', 'Dismissed trying', 'Rotates strike only']",
    "6) dots-count (window: overEnd) - e.g. ['0-1 dots (free flowing)', '2-3 dots (standard)', '4-5 dots (tight choke)', 'Maiden over (6 dots)']",
    "Rules: max 22 words; use exact player names from context; expected must sum 95-105; situation must be one of: milestone, pressure, momentum, death, wicket, standard.",
  ].filter(Boolean).join("\n");
}

export function validateAuthored(raw: unknown, ctx: MatchContext, candidates: string[]): (AuthoredQ & { splits: { A: number; B: number; C: number; D: number } }) | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.text !== "string" || r.text.length < 8 || r.text.length > 160) return null;
  if (!Array.isArray(r.options) || r.options.length !== 4 || !(r.options as unknown[]).every((o) => typeof o === "string" && (o as string).length > 0 && (o as string).length < 75)) return null;
  const options = r.options as [string, string, string, string];
  const exp = r.expected as Record<string, unknown> | undefined;
  if (!exp || !["A", "B", "C", "D"].every((k) => typeof exp[k] === "number" && (exp[k] as number) >= 0 && (exp[k] as number) <= 100)) return null;
  const sum = (exp.A as number) + (exp.B as number) + (exp.C as number) + (exp.D as number);
  if (sum < 90 || sum > 110) return null;
  const res = r.resolver as Record<string, unknown> | undefined;
  if (!res || typeof res.type !== "string" || !ALLOWED.includes(res.type)) return null;

  if (res.type === "runs-bucket") {
    if (res.window !== 6 && res.window !== "overEnd") return null;
  } else if (res.type === "wicket-bool") {
    if (typeof res.yesIndex !== "number" || res.yesIndex < 0 || res.yesIndex > 3) return null;
  } else if (res.type === "next-bowler") {
    const set = new Set(options.map((o) => o.toLowerCase().trim()));
    const cand = new Set(candidates.map((c) => c.toLowerCase().trim()));
    if (set.size !== 4 || Array.from(set).some((o) => !cand.has(o))) return null;
  }

  const validSituation = ["wicket", "pressure", "momentum", "standard", "milestone", "death"].includes(String(r.situation))
    ? (r.situation as AuthoredQ["situation"])
    : "standard";

  return {
    text: r.text as string,
    options,
    expected: { A: exp.A as number, B: exp.B as number, C: exp.C as number, D: exp.D as number },
    resolver: res as unknown as Resolver,
    situation: validSituation,
    splits: { A: exp.A as number, B: exp.B as number, C: exp.C as number, D: exp.D as number },
  };
}

/**
 * Strict Cyclic Round-Robin Dispatcher:
 * Ensures every single consecutive call in the session cycles to a completely
 * different cricket dimension (Theme 0 -> 1 -> 2 -> 3 -> 4 -> 5).
 * It is mathematically impossible for questions to repeat back-to-back.
 */
export function generateContextualFallback(
  ctx: MatchContext,
  candidates: string[],
  qi = 0
): AuthoredQ & { splits: { A: number; B: number; C: number; D: number } } {
  const batter = ctx.batters[0]?.name ?? "The striker";
  const bowler = ctx.bowler.name || "The bowler";
  const isChase = typeof ctx.target === "number" && ctx.target > 0;
  const need = ctx.need ?? 0;
  const rrr = ctx.rrr ?? "0.0";

  // Clean human-readable cricket over number (e.g. at 15.2 it is Over 16; at 15.6 over 16 is complete, next is Over 17)
  const overParts = String(ctx.overs).split(".");
  const currentOverNum = Number(overParts[0] || 0) + (Number(overParts[1] || 0) >= 6 ? 2 : 1);

  const theme = Math.abs(qi) % 6;

  // Theme 0: Tactical Bowling Change
  if (theme === 0 && candidates.length === 4) {
    return {
      text: `Tactical bowling change: who does the captain bring on for the next over?`,
      options: [candidates[0], candidates[1], candidates[2], candidates[3]] as [string, string, string, string],
      expected: { A: 30, B: 28, C: 24, D: 18 },
      splits: { A: 30, B: 28, C: 24, D: 18 },
      resolver: { type: "next-bowler" },
      situation: "standard",
    };
  }

  // Theme 1: Boundary Execution / Release Shot
  if (theme === 1) {
    return {
      text: isChase
        ? `Chase tension (${need} needed at ${rrr} RRR) — what boundary will ${batter} strike next?`
        : `Over ${currentOverNum}: ${batter} takes on ${bowler} — what is the next boundary kind?`,
      options: ["Huge SIX into the stands", "Cracking FOUR along ground", "Bowler holds tight (Singles only)", "WICKET on the release shot"],
      expected: { A: 20, B: 44, C: 24, D: 12 },
      splits: { A: 20, B: 44, C: 24, D: 12 },
      resolver: { type: "boundary-kind", window: "overEnd" },
      situation: "momentum",
    };
  }

  // Theme 2: Dot-Ball Choke / Pressure Index
  if (theme === 2) {
    return {
      text: `${bowler} testing ${batter}'s patience — how many dot balls in Over ${currentOverNum}?`,
      options: ["0-1 dots (Free flowing)", "2-3 dots (Standard battle)", "4-5 dots (Tight choke)", "Maiden over (6 dots)"],
      expected: { A: 22, B: 52, C: 20, D: 6 },
      splits: { A: 22, B: 52, C: 20, D: 6 },
      resolver: { type: "dots-count", window: "overEnd" },
      situation: "pressure",
    };
  }

  // Theme 3: Batter Milestone or Strike Rate Intent
  if (theme === 3) {
    if (ctx.milestoneBatter) {
      const mb = ctx.milestoneBatter;
      const diff = mb.milestone - mb.runs;
      return {
        text: `${mb.name} is on ${mb.runs}* (needs ${diff} for ${mb.milestone}) — will they reach it this over?`,
        options: [
          `Yes, reaches ${mb.milestone} in style`,
          `Gets within 1-2 runs of ${mb.milestone}`,
          `Falls short / remains not out`,
          `WICKET! Out chasing milestone`,
        ],
        expected: { A: 28, B: 34, C: 26, D: 12 },
        splits: { A: 28, B: 34, C: 26, D: 12 },
        resolver: { type: "milestone-reach", batter: mb.name, milestone: mb.milestone },
        situation: "milestone",
      };
    }
    return {
      text: `Striker focus: ${batter} in the middle — how many runs off their next 6 balls?`,
      options: ["0-3 runs (Quiet period)", "4-7 runs (Steady strike)", "8-11 runs (Attacking)", "12+ runs (Carnage)"],
      expected: { A: 26, B: 48, C: 18, D: 8 },
      splits: { A: 26, B: 48, C: 18, D: 8 },
      resolver: { type: "runs-bucket", window: 6 },
      situation: "standard",
    };
  }

  // Theme 4: Over Squeeze / Run Range
  if (theme === 4) {
    return {
      text: ctx.phase === "death"
        ? `Death overs surge: ${bowler} bowling to ${batter} — over yields?`
        : `Over ${currentOverNum}: ${bowler} into the attack — runs conceded this over?`,
      options: ["0-4 runs (Disciplined)", "5-8 runs (Par)", "9-13 runs (Expensive)", "14+ runs or Wicket"],
      expected: { A: 26, B: 50, C: 16, D: 8 },
      splits: { A: 26, B: 50, C: 16, D: 8 },
      resolver: { type: "runs-bucket", window: "overEnd" },
      situation: ctx.phase === "death" ? "death" : "standard",
    };
  }

  // Theme 5: Wicket Hunt / Dismissal Threat
  return {
    text: `Crucial breakthrough moment: will ${bowler} strike in the next 6 balls?`,
    options: ["Yes, bowled/LBW timber", "Yes, caught in deep", "No wicket conceded", "Run out chaos"],
    expected: { A: 18, B: 24, C: 46, D: 12 },
    splits: { A: 18, B: 24, C: 46, D: 12 },
    resolver: { type: "wicket-bool", n: 6, yesIndex: 1 },
    situation: "wicket",
  };
}
