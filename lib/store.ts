export type CollectedCard = {
  id: string;
  slotId: string;
  matchTitle: string;
  matchEdition: string;
  tier: "Diamond" | "Platinum" | "Gold" | "Silver";
  rarityScore: number;
  xp: number;
  liveXP?: number;
  situationalXP?: number;
  streak: number;
  matchRank: number;
  dailyRank?: number;
  bestCall: string;
  unlockedAt: string;
  isNew?: boolean;
  reward?: string;
  best?: {
    qText: string;
    yourPick: string;
    correctPick: string;
    pts: number;
    p: number;
    over: string;
    verdict: string;
  };
};

export type Store = {
  matchXP: number;
  dailyXP: number;
  streak: number;
  lastDaily: string | null;
  album: string[];
  cards: CollectedCard[];
};

const KEY = "callroom";
const CAP_DAILY = 30;
const STREAK_BONUS = 5;
const STREAK_CAP = 15;

export const DEMO_CARDS: CollectedCard[] = [
  {
    id: "card-demo-1",
    slotId: "wtc-final",
    matchTitle: "INDIA v AUSTRALIA",
    matchEdition: "WTC FINAL • THE OVAL",
    tier: "Diamond",
    rarityScore: 92,
    xp: 135,
    liveXP: 85,
    situationalXP: 50,
    streak: 5,
    matchRank: 1,
    dailyRank: 3,
    bestCall: "RARE INSIGHT READ",
    reward: "DIAMOND COLLECTIBLE",
    unlockedAt: "Yesterday",
    best: {
      qText: "Can Cummins break the 84-run stand in Over 48?",
      yourPick: "Wicket in over",
      correctPick: "Wicket in over",
      pts: 32,
      p: 14,
      over: "48.2",
      verdict: "correct +32",
    },
  },
  {
    id: "card-demo-2",
    slotId: "death-duel",
    matchTitle: "INDIA v PAKISTAN",
    matchEdition: "T20 WORLD CUP • MCG",
    tier: "Platinum",
    rarityScore: 78,
    xp: 95,
    liveXP: 65,
    situationalXP: 30,
    streak: 3,
    matchRank: 2,
    dailyRank: 5,
    bestCall: "CLUTCH MOMENT READ",
    reward: "PLATINUM GLOW FRAME",
    unlockedAt: "3 days ago",
    best: {
      qText: "Will Kohli clear long-on against Rauf on ball 5?",
      yourPick: "Six over long-on",
      correctPick: "Six over long-on",
      pts: 28,
      p: 18,
      over: "18.5",
      verdict: "correct +28",
    },
  },
  {
    id: "card-demo-3",
    slotId: "review-right",
    matchTitle: "INDIA v SOUTH AFRICA",
    matchEdition: "EDEN GARDENS • 1ST INNINGS",
    tier: "Gold",
    rarityScore: 64,
    xp: 80,
    liveXP: 55,
    situationalXP: 25,
    streak: 2,
    matchRank: 5,
    dailyRank: 8,
    bestCall: "SPIN TWIST READ",
    reward: "GOLD BORDER BADGE",
    unlockedAt: "5 days ago",
    best: {
      qText: "How many dots will Jadeja bowl in Over 14?",
      yourPick: "4+ Dot Balls",
      correctPick: "4+ Dot Balls",
      pts: 22,
      p: 24,
      over: "13.4",
      verdict: "correct +22",
    },
  },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadStore(): Store {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        matchXP: parsed.matchXP ?? 0,
        dailyXP: parsed.dailyXP ?? 0,
        streak: parsed.streak ?? 0,
        lastDaily: parsed.lastDaily ?? null,
        album: parsed.album && parsed.album.length > 0 ? parsed.album : ["wtc-final", "death-duel", "review-right"],
        cards: parsed.cards && parsed.cards.length > 0 ? parsed.cards : DEMO_CARDS,
      };
    }
  } catch { /* noop */ }
  return {
    matchXP: 0,
    dailyXP: 0,
    streak: 0,
    lastDaily: null,
    album: ["wtc-final", "death-duel", "review-right"],
    cards: DEMO_CARDS,
  };
}

export function saveStore(s: Store): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(s));
    }
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
  if (s.lastDaily !== t) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    s.streak = s.lastDaily === yesterday ? s.streak + 1 : 1;
    s.lastDaily = t;
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

export function addCollectedCard(card: CollectedCard): Store {
  const s = loadStore();
  if (!s.cards) s.cards = [...DEMO_CARDS];
  
  // Clear any existing isNew flags
  s.cards.forEach((c) => { c.isNew = false; });

  const idx = s.cards.findIndex((c) => c.slotId === card.slotId || c.id === card.id);
  if (idx >= 0) {
    s.cards[idx] = { ...card, isNew: true };
  } else {
    s.cards.unshift({ ...card, isNew: true });
  }

  if (!s.album.includes(card.slotId)) {
    s.album.push(card.slotId);
  }
  saveStore(s);
  return s;
}

export const LIMITS = { CAP_DAILY, STREAK_BONUS, STREAK_CAP };
