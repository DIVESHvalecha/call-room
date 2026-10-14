export type Split = { A: number; B: number; C: number; D: number };
export type Question = {
  id: string;
  at: string;
  text: string;
  options: [string, string, string, string];
  answerIdx: 0 | 1 | 2 | 3;
  splits: Split;
  dynamics_cached: string;
};
export type Slice = {
  target: number;
  current: { runs: number; wkts: number; over: string; ballsLeft: number; need: number; rrr: number };
  sample: boolean;
  questions: Question[];
};
export const OPT_KEYS = ["A", "B", "C", "D"] as const;
export type OptKey = (typeof OPT_KEYS)[number];
