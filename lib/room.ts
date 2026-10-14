import type { Split, OptKey } from "./slice";

export const OTHERS = 127;
export const BASE_COUNT = 128;

/** scripted mean splits + live noise (±4, renormalized) so every demo feels live */
const FALLBACK_SPLIT: Split = { A: 25, B: 25, C: 25, D: 25 };
export function liveSplits(base: Split, seed = 0): Split {
  const safe: Split = base && typeof base.A === "number" ? base : FALLBACK_SPLIT;
  base = safe;
  const noise = (i: number) => {
    const x = Math.sin(seed * 97 + i * 31) * 10000;
    const frac = x - Math.floor(x);
    return Math.round((frac - 0.5) * 8);
  };
  const keys: OptKey[] = ["A", "B", "C", "D"];
  const vals = keys.map((k, i) => Math.max(2, base[k] + noise(i)));
  const sum = vals.reduce((a, b) => a + b, 0);
  const out = {} as Split;
  keys.forEach((k, i) => {
    out[k] = Math.max(2, Math.round((vals[i] / sum) * 100));
  });
  // fix rounding drift
  const drift = 100 - (out.A + out.B + out.C + out.D);
  out.B += drift;
  return out;
}

export function countsFromSplits(splits: Split): Record<OptKey, number> {
  const out = {} as Record<OptKey, number>;
  const s = splits ?? FALLBACK_SPLIT;
  (Object.keys(s) as OptKey[]).forEach((k) => {
    out[k] = Math.round((s[k] / 100) * OTHERS);
  });
  return out;
}

/** % of room on an option (uses live splits as source of truth) */
export function pOf(splits: Split, key: OptKey): number {
  const s = splits && typeof splits[key] === "number" ? splits : FALLBACK_SPLIT;
  return Math.min(100, Math.max(1, s[key]));
}

/** jittered live counter for UI only (121–135) */
export function jitterCount(base = BASE_COUNT): number {
  return base + Math.floor(Math.random() * 15) - 7;
}

/** dynamic daily leaderboard: rivals fixed, your XP moves you up/down the table */
export type DailyRow = { name: string; xp: number; you?: boolean };
const DAILY_NAMES = [
  "Rahul", "Priya", "Aman", "Neha", "Kabir", "Zoya", "Arjun", "Meera", "Vikram", "Isha",
  "Dev", "Anaya", "Karan", "Riya", "Aditya",
];
const RIVAL_XP = [148, 139, 131, 124, 117, 110, 104, 98, 92, 86, 81, 76, 71, 66, 61];
export function mockDailyBoard(youXP = 86): { rows: DailyRow[]; youRank: number } {
  const rows: DailyRow[] = RIVAL_XP.map((xp, i) => ({
    name: DAILY_NAMES[i % DAILY_NAMES.length] + (i >= DAILY_NAMES.length ? ` ${Math.floor(i / DAILY_NAMES.length) + 1}` : ""),
    xp: xp + (i % 3),
  }));
  rows.push({ name: "You", xp: youXP, you: true });
  rows.sort((a, b) => b.xp - a.xp);
  const youRank = rows.findIndex((r) => r.you) + 1;
  return { rows: rows.slice(0, 15), youRank };
}

const FIRST = ["Aarav","Vihaan","Kabir","Anaya","Ishaan","Diya","Rohan","Sneha","Arjun","Myra","Aditya","Riya","Krishna","Anika","Dev","Sara","Yash","Pooja","Nikhil","Tara","Farhan","Zoya","Imran","Kavya","Manav","Ritu","Sahil","Tanya","Varun","Pari"];
const LAST = ["S","K","M","R","P","V","N","G","J","D","A","B","Sharma","Iyer","Nair","Gupta","Reddy","Khan","Das","Menon"];
export type BigRow = { name: string; pts: number; you?: boolean };
export function bigBoard(count = 500, seedBase = 3): BigRow[] {
  const rows: BigRow[] = [];
  let s = seedBase;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < count; i++) {
    const n = `${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]}`;
    const pts = Math.round(60 * Math.exp(-i / 90) + rnd() * 14);
    rows.push({ name: `${n} #${i + 1}`, pts });
  }
  rows.sort((a, b) => b.pts - a.pts);
  return rows;
}
/** bots drift each question so the board breathes: leaders gain 0-6, tail 0-3 */
export function driftBoard(rows: BigRow[], seed: number): BigRow[] {
  let s = seed * 7919 + 13;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return rows.map((r, i) => (r.you ? r : { ...r, pts: r.pts + Math.round(rnd() * (i < 20 ? 6 : 3)) }));
}
