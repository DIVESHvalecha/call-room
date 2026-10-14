export function basePoints(p_pct: number): number {
  const p = Math.min(100, Math.max(1, p_pct));
  return Math.min(100, Math.floor(100 / Math.sqrt(p)));
}

export function speedBonus(ms: number): number {
  return ms < 5000 ? 5 : 0;
}

export function totalPoints(p_pct: number, ms: number): number {
  return basePoints(p_pct) + speedBonus(ms);
}

export function isRare(p_pct: number): boolean {
  return p_pct <= 20;
}

export function tierOf(matchRank: number): string {
  if (matchRank <= 1) return "Diamond";
  if (matchRank <= 3) return "Platinum";
  if (matchRank <= 10) return "Gold";
  return "Silver";
}

export function seasonXP(matchTotal: number, dailyTotal: number): number {
  const d = Math.min(30, dailyTotal);
  return Math.round(0.7 * matchTotal + 0.3 * d);
}

/** daily performance can upgrade one tier max */
export function tierWithDaily(matchRank: number, seasonPct: number, streak: number): string {
  const base = tierOf(matchRank);
  const order = ["Silver", "Gold", "Platinum", "Diamond"];
  let idx = order.indexOf(base);
  const eligible = seasonPct <= 25 || streak >= 3;
  if (eligible && idx < 3) idx += 1;
  if (order[idx] === "Diamond" && !(matchRank <= 1 && (seasonPct <= 10 || streak >= 5))) {
    return "Platinum";
  }
  return order[idx];
}

/** earlier answer wins ties */
export function tieBreak(aMs: number, bMs: number): number {
  return aMs - bMs;
}

export type RarityInput = {
  accuracy: number; // 0..1 fraction of calls correct
  importance: number; // 0..1 avg importance weight of answered calls
  liveRank: number; // 1-based in live room
  liveSize: number;
  dailyRank: number; // 1-based in daily board
  dailySize: number;
  streak: number;
};

export function rarityScore(r: RarityInput): { score: number; tier: string; reward: string } {
  const acc = Math.min(1, Math.max(0, r.accuracy)) * 40;
  const imp = Math.min(1, Math.max(0, r.importance)) * 20;
  const live = (1 - Math.min(1, (r.liveRank - 1) / Math.max(1, r.liveSize))) * 20;
  const daily = (1 - Math.min(1, (r.dailyRank - 1) / Math.max(1, r.dailySize))) * 12;
  const streak = Math.min(8, Math.max(0, r.streak) * 2);
  const score = Math.round(acc + imp + live + daily + streak);
  let tier = "Silver";
  let reward = "PROFILE BADGE";
  if (score >= 85) {
    tier = "Diamond";
    reward = "NEON FRAME + 2x NEXT-MATCH BOOST";
  } else if (score >= 68) {
    tier = "Platinum";
    reward = "GLOW FRAME + PRIORITY POLL";
  } else if (score >= 50) {
    tier = "Gold";
    reward = "GOLD BORDER + EXTRA REVEAL";
  }
  return { score, tier, reward };
}
