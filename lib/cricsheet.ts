import raw from "@/data/ind-wi-raw.json";

type RawDelivery = {
  actual_delivery?: string;
  batter: string;
  bowler: string;
  non_striker: string;
  runs: { batter: number; extras: number; total: number };
  extras?: Record<string, number>;
  wickets?: { player_out: string; kind: string; fielders?: { name: string }[] }[];
};

type RawOver = { over: number; deliveries: RawDelivery[] };
type RawInnings = { team: string; overs: RawOver[] };

export type FlatBall = {
  idx: number;
  over: number;
  actual: string; // verbatim actual_delivery from source, e.g. "9.5", "12.3" (dupes on wides/nb)
  ballInOver: number; // legal ball number 1-6
  label: string; // e.g. "12.3"
  batter: string;
  bowler: string;
  runs: number; // total off bat+extras
  batterRuns: number;
  extras: number;
  extraKind: string | null; // wides | noballs | byes | legbyes
  wicket: { player_out: string; kind: string } | null;
  teamRuns: number;
  teamWkts: number;
};

export type BatterRow = { name: string; runs: number; balls: number; fours: number; sixes: number; out: string | null };
export type BowlerRow = { name: string; balls: number; runs: number; wkts: number };

function isLegal(d: RawDelivery): boolean {
  const ex = d.extras ?? {};
  return !("wides" in ex) && !("noballs" in ex);
}

export function inningsList(): { team: string; idx: number }[] {
  const inn = (raw as unknown as { innings: RawInnings[] }).innings;
  return inn.map((x, i) => ({ team: x.team, idx: i }));
}

export function matchInfo(): { venue: string; toss: string; outcome: string; playerOfMatch: string; date: string } {
  const r = raw as unknown as {
    info: {
      venue: string;
      toss: { winner: string; decision: string };
      outcome: { winner: string; by: { wickets?: number; runs?: number } };
      player_of_match: string[];
      dates: string[];
    };
  };
  const by = r.info.outcome.by.wickets ? `won by ${r.info.outcome.by.wickets} wkts` : `won by ${r.info.outcome.by.runs} runs`;
  return {
    venue: r.info.venue,
    toss: `${r.info.toss.winner} chose to ${r.info.toss.decision}`,
    outcome: `${r.info.outcome.winner} ${by}`,
    playerOfMatch: r.info.player_of_match?.[0] ?? "",
    date: r.info.dates?.[0] ?? "",
  };
}

export function flattenInnings(innIdx: number): FlatBall[] {
  const inn = (raw as unknown as { innings: RawInnings[] }).innings[innIdx];
  const out: FlatBall[] = [];
  let runs = 0;
  let wkts = 0;
  let idx = 0;
  for (const o of inn.overs) {
    let legal = 0;
    for (const d of o.deliveries) {
      const legalBall = isLegal(d);
      if (legalBall) legal += 1;
      runs += d.runs.total;
      const w = d.wickets?.[0] ?? null;
      if (w) wkts += 1;
      const exKind = d.extras ? Object.keys(d.extras)[0] ?? null : null;
      out.push({
        idx: idx++,
        over: o.over,
        actual: d.actual_delivery ?? `${o.over}.${legal + 1}`,
        ballInOver: legal, // for wides/nb shows current legal count (replay-accurate-ish)
        label: `${o.over}.${d.batter ? legal || 1 : legal}`,
        batter: d.batter,
        bowler: d.bowler,
        runs: d.runs.total,
        batterRuns: d.runs.batter,
        extras: d.runs.extras,
        extraKind: exKind,
        wicket: w ? { player_out: w.player_out, kind: w.kind } : null,
        teamRuns: runs,
        teamWkts: wkts,
      });
    }
  }
  // fix labels: use legal ball + suffix for extras balls
  const seen = new Map<string, number>();
  return out.map((b) => {
    const key = `${b.over}`;
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    void n;
    return b;
  });
}

export function tableAt(balls: FlatBall[], upto: number): {
  runs: number;
  wkts: number;
  oversLabel: string;
  batters: BatterRow[];
  bowlers: BowlerRow[];
  extras: number;
  lastBalls: string[];
  fow: { score: string; player: string }[];
} {
  const slice = balls.slice(0, Math.max(0, Math.min(upto, balls.length)));
  const bat = new Map<string, { runs: number; balls: number; fours: number; sixes: number; out: string | null }>();
  const bowl = new Map<string, { balls: number; runs: number; wkts: number }>();
  const order: string[] = [];
  let extras = 0;
  const fow: { score: string; player: string }[] = [];
  const lastBalls: string[] = [];
  let lastOver = 0;

  for (const b of slice) {
    if (!bat.has(b.batter)) {
      bat.set(b.batter, { runs: 0, balls: 0, fours: 0, sixes: 0, out: null });
      order.push(b.batter);
    }
    const bs = bat.get(b.batter)!;
    const isWide = b.extraKind === "wides";
    if (!isWide) {
      bs.balls += 1;
      bs.runs += b.batterRuns;
      if (b.batterRuns === 4) bs.fours += 1;
      if (b.batterRuns === 6) bs.sixes += 1;
    } else {
      bs.runs += 0;
    }
    if (b.wicket) {
      const cur = bat.get(b.wicket.player_out);
      if (cur) cur.out = b.wicket.kind;
    }
    extras += b.extras;
    if (!bowl.has(b.bowler)) bowl.set(b.bowler, { balls: 0, runs: 0, wkts: 0 });
    const bw = bowl.get(b.bowler)!;
    const isNb = b.extraKind === "noballs";
    if (!isWide && !isNb) bw.balls += 1;
    bw.runs += b.runs;
    if (b.wicket && b.wicket.player_out) {
      // bowler gets wicket unless run out — attribute simply
      if (b.wicket.kind !== "run out") bw.wkts += 1;
    }
    if (b.wicket) fow.push({ score: `${b.teamRuns}/${b.teamWkts}`, player: b.wicket.player_out });
    lastOver = b.over;
    const sym = b.wicket ? "W" : b.extras > 0 && b.batterRuns === 0 ? (b.extraKind === "wides" ? "wd" : "+") : String(b.runs);
    lastBalls.push(sym);
  }

  const last = slice[slice.length - 1];
  const oversLabel = last ? last.actual : "0.0";
  void lastOver;

  const batters: BatterRow[] = order.map((name) => ({ name, ...bat.get(name)! }));
  // crease order: not-out batters first (last two), then rest by runs
  const notOut = batters.filter((b) => !b.out);
  const out = batters.filter((b) => b.out);
  const ordered = [...notOut.slice(-2), ...out.reverse(), ...notOut.slice(0, -2)];

  const bowlers: BowlerRow[] = Array.from(bowl.entries()).map(([name, s]) => ({ name, ...s }));

  const head = slice[slice.length - 1];
  return {
    runs: head ? head.teamRuns : 0,
    wkts: head ? head.teamWkts : 0,
    oversLabel,
    batters: ordered,
    bowlers,
    extras,
    lastBalls: lastBalls.slice(-12),
    fow,
  };
}

export function ballText(b: FlatBall): string {
  if (b.wicket) return `${b.label}: WICKET — ${b.wicket.player_out} ${b.wicket.kind}, ${b.bowler} to ${b.batter}`;
  if (b.batterRuns === 6) return `${b.label}: SIX — ${b.batter} launches ${b.bowler}!`;
  if (b.batterRuns === 4) return `${b.label}: FOUR — ${b.batter} pierces the gap off ${b.bowler}`;
  if (b.extras > 0) return `${b.label}: ${b.extras} ${b.extraKind ?? "extras"} — ${b.bowler} strays`;
  if (b.runs === 0) return `${b.label}: DOT — ${b.bowler} beats ${b.batter}`;
  return `${b.label}: ${b.runs} run${b.runs > 1 ? "s" : ""} — ${b.batter} off ${b.bowler}`;
}
