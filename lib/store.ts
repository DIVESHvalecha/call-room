export type Store = {
  matchXP: number;
  dailyXP: number;
  streak: number;
  lastDaily: string | null;
  album: string[];
};

const KEY = "callroom";
const CAP_DAILY = 30;
const STREAK_BONUS = 5;
const STREAK_CAP = 15;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { matchXP: 0, dailyXP: 0, streak: 0, lastDaily: null, album: [], ...JSON.parse(raw) };
  } catch { /* noop */ }
  return { matchXP: 0, dailyXP: 0, streak: 0, lastDaily: null, album: [] };
}

export function saveStore(s: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* noop */ }
}

export function addMatchXP(pts: number): Store {
  const s = loadStore();
  s.matchXP += pts;
  saveStore(s);
  return s;
}

export function addDailyXP(pts: number): Store {
  const s = loadStore();
  const t = today();
  // new day resets streak chain tracking via lastDaily
  if (s.lastDaily !== t) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    s.streak = s.lastDaily === yesterday ? s.streak + 1 : 1;
    s.lastDaily = t;
    // daily counter resets per day — store today's earned in dailyXP? keep cumulative seasonal: add capped
  }
  const add = Math.min(CAP_DAILY, pts);
  s.dailyXP += add;
  saveStore(s);
  return s;
}

export function streakBonus(streak: number): number {
  return Math.min(STREAK_CAP, Math.max(0, streak) * STREAK_BONUS);
}

export function unlockSlot(id: string): Store {
  const s = loadStore();
  if (!s.album.includes(id)) s.album.push(id);
  saveStore(s);
  return s;
}

export const LIMITS = { CAP_DAILY, STREAK_BONUS, STREAK_CAP };
