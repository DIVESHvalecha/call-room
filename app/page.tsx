"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import ScoreHeader from "@/components/ScoreHeader";
import type { Score } from "@/components/ScoreHeader";
import EventFeed from "@/components/EventFeed";
import QuestionSheet from "@/components/QuestionSheet";
import ResolveFlash from "@/components/ResolveFlash";
import Leaderboard, { Row } from "@/components/Leaderboard";
import MintCard from "@/components/MintCard";
import AlbumGrid from "@/components/AlbumGrid";
import SeasonTable from "@/components/SeasonTable";
import DailyList from "@/components/DailyList";
import MockMapModal from "@/components/MockMapModal";
import HomeScreen from "@/components/HomeScreen";
import MobileNav from "@/components/MobileNav";
import Reactions from "@/components/Reactions";
import ScratchReveal from "@/components/ScratchReveal";
import FlyingPoints from "@/components/FlyingPoints";
import AnimatedNumber from "@/components/AnimatedNumber";
import FinalBoard from "@/components/FinalBoard";
import FastForward from "@/components/FastForward";
import { addMatchXP, unlockSlot, loadStore, addCollectedCard } from "@/lib/store";
import OnAirLight from "@/components/OnAirLight";
import WipeTransition from "@/components/WipeTransition";
import { useHype } from "@/hooks/useHype";
import type { OptKey } from "@/lib/slice";
import { OPT_KEYS } from "@/lib/slice";
import { pOf, liveSplits, mockDailyBoard, bigBoard, driftBoard } from "@/lib/room";
import { totalPoints, isRare, rarityScore } from "@/lib/score";
import { flattenInnings, tableAt, ballText, inningsList, matchInfo } from "@/lib/cricsheet";
import { overRuns, rangeRuns, rangeWickets, rangeBoundaries, batterRunsInRange, nextBowlerAfter, otherBowlers, bucketIdx, bucketEdgesFor, eventOptionsFor, dismissalOption } from "@/lib/predict";
import { buildMatchContext } from "@/lib/context";
import pools from "@/data/situation-pools.json";

type Step = "lobby" | "preview" | "contest" | "reveal" | "mint" | "album" | "daily";
type PoolQ = { id: string; kind: string; resolve: string; text: string; options: [string, string, string, string]; answerIdx?: 0 | 1 | 2 | 3; splits: { A: number; B: number; C: number; D: number }; dynamics: string };
type CurQ = PoolQ & { at: string; situation: string; filledText: string; options: [string, string, string, string]; answerIdx: 0 | 1 | 2 | 3; targetCursor: number; askCursor: number; batterKey: string; source: "ai" | "pool"; resolver: { type: string; window?: 6 | "overEnd"; n?: number; yesIndex?: number } | null };
type PendingCall = { q: CurQ; key: OptKey; ms: number; p: number };

function startMark(overOf: (i: number) => number, len: number, targetOver: number): number {
  for (let i = 0; i < len; i++) {
    if (overOf(i) >= targetOver) return i;
  }
  return 0;
}

function detectSituation(
  lastSyms: string[],
  rrr: number,
  isChase: boolean,
  overNo = 12,
  milestoneBatter?: { name: string; runs: number; milestone: number } | null
): "wicket" | "pressure" | "momentum" | "standard" | "milestone" | "death" {
  if (milestoneBatter) return "milestone";
  if (lastSyms.includes("W")) return "wicket";
  if (overNo >= 38) return "death";
  if (isChase && rrr > 7.5) return "pressure";
  const runs = lastSyms.reduce((a, s) => a + (s === "W" || s === "wd" || s === "•" ? 0 : Number(s) || 0), 0);
  if (runs >= 10) return "momentum";
  if (lastSyms.filter((s) => s === "0" || s === "•").length >= 4) return "pressure";
  return "standard";
}

function fillTpl(text: string, ctx: { batter: string; bowler: string; overLabel: string }): string {
  return text.replaceAll("{batter}", ctx.batter).replaceAll("{bowler}", ctx.bowler).replaceAll("{overLabel}", ctx.overLabel);
}

export default function Page() {
  const [step, setStep] = useState<Step>("lobby");
  const [innIdx, setInnIdx] = useState(1);
  const inns = inningsList();
  const balls = useMemo(() => flattenInnings(innIdx), [innIdx]);
  const startAt = useMemo(() => {
    const target = innIdx === 1 ? 12 : 18;
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].over >= target) return i;
    }
    return 0;
  }, [balls, innIdx]);
  void startMark;
  const [cursor, setCursor] = useState<number | null>(null);
  const liveCursor = cursor ?? startAt;

  // match session
  const [qi, setQi] = useState(0);
  const [showQ, setShowQ] = useState(false);
  const [curQ, setCurQ] = useState<CurQ | null>(null);
  const [ff, setFf] = useState<{ from: string; to: string; syms: string[] } | null>(null);
  const [myPts, setMyPts] = useState(0);
  const [sitPts, setSitPts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [impSum, setImpSum] = useState(0);
  const [pendings, setPendings] = useState<PendingCall[]>([]);
  const pending = null;
  void pending;
  const [flash, setFlash] = useState<{ pts: number; rare: boolean; verdict: "correct" | "wrong" | "sealed" | "waiting"; correctLabel?: string } | null>(null);
  const [flying, setFlying] = useState<{ pts: number; rare: boolean } | null>(null);
  const [prevRank, setPrevRank] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [debug, setDebug] = useState(false);
  const [match, setMatch] = useState("m1");
  const isPrematch = match === "m3";
  const [dailyEarned, setDailyEarned] = useState(0);
  const [best, setBest] = useState<{ qText: string; yourPick: string; correctPick: string; pts: number; p: number; over: string; verdict: string } | null>(null);
  const [big, setBig] = useState(() => bigBoard(500));
  const [askedOvers, setAskedOvers] = useState<number[]>([]);
  const [incoming, setIncoming] = useState(false);
  const authorCache = useRef(new Map<string, unknown>());
  const fireTarget = useRef<{ over: number; atCursor: number } | null>(null);
  const askedIds = useRef<string[]>([]);
  const askedTexts = useRef<string[]>([]);
  const rememberId = (id: string) => {
    askedIds.current = [...askedIds.current.slice(-7), id];
    lastPool.current = id;
  };
  const lastPool = useRef("");
  const lastOverSeen = useRef<number>(-1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      if (q.get("debug") === "1") setDebug(true);
    }
  }, []);

  const table = useMemo(() => tableAt(balls, liveCursor), [balls, liveCursor]);
  const info = matchInfo();
  const isChase = innIdx === 1;
  const matchTarget = isChase ? 406 : 0;
  const scoreBallsLeft = Math.max(0, 300 - liveCursor);
  const scoreNeed = isChase ? Math.max(0, matchTarget - table.runs) : 0;
  const score: Score = {
    runs: table.runs,
    wkts: table.wkts,
    over: table.oversLabel,
    ballsLeft: scoreBallsLeft,
    need: scoreNeed,
    target: matchTarget,
  };
  const lastBalls = table.lastBalls;
  const lastBall = balls[Math.max(0, liveCursor - 1)];
  const chaseRrr = isChase && scoreBallsLeft > 0 ? (scoreNeed / (scoreBallsLeft / 6)) : 0;

  const splits = useMemo(
    () => (curQ && curQ.splits ? liveSplits(curQ.splits, Date.now() % 97 + qi) : { A: 25, B: 25, C: 25, D: 25 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [curQ?.id, qi]
  );

  const storeDaily = (() => { try { return loadStore().dailyXP; } catch { return 0; } })();
  const youDailyXP = 58 + storeDaily + dailyEarned;
  const daily = useMemo(() => mockDailyBoard(youDailyXP), [youDailyXP]);

  const sorted: Row[] = useMemo(() => {
    const pool: Row[] = [...big.map((b) => ({ ...b })), { name: "You", pts: myPts, you: true }];
    pool.sort((a, b) => b.pts - a.pts);
    return pool.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [myPts, big]);
  const liveRank = sorted.find((r) => r.you)?.rank ?? 1;
  const rows: Row[] = useMemo(() => {
    const you = sorted.find((r) => r.you)!;
    let list: Row[];
    if (liveRank <= 10) {
      list = sorted.slice(0, 10);
    } else {
      list = [...sorted.slice(0, 8), you];
    }
    return list.map((r) => ({
      ...r,
      delta: r.you && prevRank !== null ? prevRank - liveRank : 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, prevRank, liveRank]);
  const gapToNext = useMemo(() => {
    const i = sorted.findIndex((r) => r.you);
    if (i <= 0) return 0;
    return sorted[i - 1].pts - myPts;
  }, [sorted, myPts]);

  // world clock: match + bots move on every screen, joined or not
  useEffect(() => {
    if (ff || showQ) return;
    const id = setInterval(() => {
      setCursor((c) => {
        const base = c ?? startAt;
        return Math.min(balls.length, base + 1);
      });
    }, 3200);
    return () => clearInterval(id);
  }, [ff, showQ, balls.length, startAt, step]);

  // over checkpoint: bot round every over + schedule this over's question MID-over
  useEffect(() => {
    const cur = balls[Math.max(0, liveCursor - 1)];
    if (!cur) return;
    if (cur.over === lastOverSeen.current) return;
    const first = lastOverSeen.current === -1;
    lastOverSeen.current = cur.over;
    if (first) return;
    // bots answer every over — board moves even if you never joined
    setBig((b) => driftBoard(b.map((x) => ({ ...x })), cur.over * 13 + 5).sort((a, z) => z.pts - a.pts));
    if (step !== "contest") return;
    if (liveCursor >= balls.length) {
      setStep("reveal");
      return;
    }
    // roll the fire ball: legal balls 2-5 of the NEW over (seeded, replay-stable)
    const seed = (innIdx * 1000 + cur.over * 37) % 97;
    const fireBall = 2 + (seed % 4);
    let idx = liveCursor;
    let legal = 0;
    while (idx < balls.length && balls[idx].over === cur.over && legal < fireBall) {
      const ex = balls[idx].extraKind;
      if (ex !== "wides" && ex !== "noballs") legal++;
      idx++;
    }
    fireTarget.current = { over: cur.over, atCursor: Math.min(idx, balls.length) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCursor]);

  // mid-over fire: ask when the cursor reaches the rolled ball (not at ball one)
  useEffect(() => {
    if (step !== "contest" || showQ || ff || incoming) return;
    const ft = fireTarget.current;
    if (!ft || liveCursor < ft.atCursor) return;
    const cur = balls[Math.max(0, liveCursor - 1)];
    if (!cur || cur.over !== ft.over) {
      fireTarget.current = null;
      return;
    }
    if (liveCursor >= balls.length) {
      setStep("reveal");
      return;
    }
    if (askedOvers.includes(cur.over)) {
      fireTarget.current = null;
      return;
    }
    setAskedOvers((v) => [...v, cur.over]);
    fireTarget.current = null;
    const syms = table.lastBalls.slice(-6);
    const heroBat = table.batters.find((b) => !b.out);
    const msBat = heroBat && heroBat.runs >= 42 && heroBat.runs < 50
      ? { name: heroBat.name, runs: heroBat.runs, milestone: 50 }
      : heroBat && heroBat.runs >= 92 && heroBat.runs < 100
      ? { name: heroBat.name, runs: heroBat.runs, milestone: 100 }
      : null;
    const sit = detectSituation(syms, chaseRrr, isChase, cur.over, msBat);
    const batter = table.batters.find((b) => !b.out)?.name ?? table.batters[0]?.name ?? "batter";
    const bowler = table.bowlers[table.bowlers.length - 1]?.name ?? table.bowlers[0]?.name ?? "bowler";
    const overAtFire = cur.over;
    const cursorAtFire = liveCursor;
    const cacheKey = `${innIdx}:${cur.over}:${sit}`;
    setIncoming(true);
    const finish = (cq: CurQ) => {
      askedTexts.current = [...askedTexts.current.slice(-10), cq.filledText || cq.text];
      setCurQ(cq);
      setShowQ(true);
      setIncoming(false);
    };
    const buildPoolQ = () => {
    const seen = new Set(askedIds.current);
    const poolList = (pools as unknown as Record<string, PoolQ[]>)[sit] ?? (pools as unknown as Record<string, PoolQ[]>).standard;
    let pool = poolList.filter((x) => x.id !== lastPool.current && !seen.has(x.id));
    if (!pool.length) pool = poolList.filter((x) => x.id !== lastPool.current);
    if (!pool.length) pool = poolList;
    let pick = pool[Math.floor(Math.random() * pool.length)] ?? (pools as unknown as Record<string, PoolQ[]>).standard[0];
    if (!pick || !pick.splits) {
      setIncoming(false);
      return;
    }
    const last12 = balls.slice(Math.max(0, liveCursor - 12), liveCursor);
    const lastW = [...last12].reverse().find((b) => b.wicket);
    // m3 needs a recent scoring shot — else fall back to standard pool
    if (pick.id === "m3") {
      const shot = [...last12].reverse().find((b) => b.batterRuns >= 4 || b.extras > 0);
      if (!shot) {
        const std = (pools as unknown as Record<string, PoolQ[]>).standard.filter((x) => x.id !== lastPool.current);
        pick = std[Math.floor(Math.random() * std.length)];
      }
    }
    let options = [...pick.options] as [string, string, string, string];
    let answerIdx = (pick.answerIdx ?? 0) as 0 | 1 | 2 | 3;
    if (pick.id === "s2") {
      // next bowler: actual + 3 others from this innings, rotated
      const actual = nextBowlerAfter(balls, liveCursor);
      const others = otherBowlers(balls, actual, 3);
      const base = [actual, ...others] as [string, string, string, string];
      const rot = (actual.length + liveCursor) % 4;
      options = [...base.slice(rot), ...base.slice(0, rot)] as [string, string, string, string];
      answerIdx = options.indexOf(actual) as 0 | 1 | 2 | 3;
    } else if (pick.id === "s3") {
      const ev = eventOptionsFor(balls[Math.max(0, liveCursor - 1)]);
      options = ev.options;
      answerIdx = ev.answerIdx;
    } else if (pick.id === "w3" && lastW?.wicket) {
      const d = dismissalOption(lastW.wicket.kind);
      options = d.options;
      answerIdx = d.answerIdx;
    } else if (pick.id === "m3") {
      const shot = [...last12].reverse().find((b) => b.batterRuns >= 4 || b.extras > 0);
      if (shot) answerIdx = (shot.batterRuns === 6 ? 1 : shot.batterRuns === 4 ? 0 : 3) as 0 | 1 | 2 | 3;
    } else if (pick.id === "w6") {
      // incoming batter: first new face in the next 12 real balls
      const faced = new Set(table.batters.filter((b) => b.balls > 0).map((b) => b.name));
      const upcoming = balls.slice(liveCursor, liveCursor + 14);
      const fresh = upcoming.map((b) => b.batter).find((n) => !faced.has(n));
      if (!fresh) {
        const alt = (pools as unknown as Record<string, PoolQ[]>).wicket.filter((x) => !askedIds.current.includes(x.id) && x.id !== "w6");
        pick = alt[Math.floor(Math.random() * alt.length)] ?? pick;
      } else {
        const others = table.batters.filter((b) => b.name !== fresh).slice(0, 3).map((b) => b.name);
        while (others.length < 3) others.push(table.bowlers[others.length % Math.max(1, table.bowlers.length)]?.name ?? "12th man");
        const base = [fresh, ...others] as [string, string, string, string];
        const rot = (fresh.length + liveCursor) % 4;
        options = [...base.slice(rot), ...base.slice(0, rot)] as [string, string, string, string];
        answerIdx = options.indexOf(fresh) as 0 | 1 | 2 | 3;
      }
    } else if (pick.id === "m6" || pick.id === "s6") {
      // set danger / top SR straight from the live table
      const rows = [...table.batters].filter((b) => b.balls >= (pick.id === "s6" ? 10 : 1));
      const Rank = (b: { name: string; runs: number; balls: number }) => (pick.id === "s6" ? b.runs / Math.max(1, b.balls) : b.runs);
      const top = [...rows].sort((a, b) => Rank(b) - Rank(a)).slice(0, 4);
      if (top.length >= 2) {
        const rot = (top[0].name.length + liveCursor) % 4;
        const base = [top[0].name, ...top.slice(1).map((b) => b.name)] as [string, string, string, string];
        while (base.length < 4) base.push(table.batters[base.length]?.name ?? "—");
        options = [...base.slice(rot), ...base.slice(0, rot)] as [string, string, string, string];
        answerIdx = options.indexOf(top[0].name) as 0 | 1 | 2 | 3;
      }
    }
    // over-end target: if asked at end-of-over (e.g. 15.6), target is the full UPCOMING over (16); otherwise current over
    const isEndOfOver = cur.ballInOver >= 6 || cur.actual.endsWith(".6");
    const targetOver = isEndOfOver ? cur.over + 1 : cur.over;
    let endIdx = liveCursor;
    while (endIdx < balls.length && balls[endIdx].over <= targetOver) {
      endIdx++;
    }
    const endOfOverCursor = Math.max(liveCursor + 6, endIdx);

    let targetCursor = liveCursor;
    if (pick.resolve === "overEnd" || pick.resolve === "nextBowler") {
      targetCursor = endOfOverCursor;
    } else if (pick.resolve === "balls6") {
      targetCursor = Math.min(balls.length, liveCursor + 6);
    }
    const prevOverRuns = overRuns(balls, cur.over - 1);
    const outBatter = lastW?.wicket?.player_out ?? "batter";
    const hero = table.batters.find((b) => !b.out) ?? table.batters[0];
    const heroSR = hero ? ((hero.runs / Math.max(1, hero.balls)) * 100).toFixed(1) : "0.0";
    const notOut = table.batters.filter((b) => !b.out);
    const pship = notOut.reduce((a, b) => a + b.runs, 0);
    const lastBowler = table.bowlers[table.bowlers.length - 1];
    const bowlerFig = lastBowler ? `${lastBowler.wkts}-${lastBowler.runs}` : "0-0";
    const ctx = { batter, bowler, overLabel: cur.actual };
    const text = fillTpl(pick.text, ctx)
      .replaceAll("{lastOverRuns}", String(prevOverRuns))
      .replaceAll("{outBatter}", outBatter)
      .replaceAll("{batterRuns}", String(hero?.runs ?? 0))
      .replaceAll("{batterBalls}", String(hero?.balls ?? 0))
      .replaceAll("{batterSR}", String(heroSR))
      .replaceAll("{bowlerFig}", bowlerFig)
      .replaceAll("{pship}", String(pship));
    rememberId(pick.id);
    setCurQ({ ...pick, options, answerIdx, at: cur.actual, situation: sit, filledText: text, dynamics_cached: pick.dynamics, targetCursor, askCursor: liveCursor, batterKey: batter, source: "pool", resolver: null } as unknown as CurQ);
    setShowQ(true);
    setIncoming(false);
    }; // end buildPoolQ
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiFinish = (aq: { text: string; options: [string, string, string, string]; splits: { A: number; B: number; C: number; D: number }; resolver: any; situation: string }, source: "ai" | "pool" = "ai") => {
      let aIdx = 0 as 0 | 1 | 2 | 3;
      if (aq.resolver?.type === "next-bowler") {
        const actualNext = nextBowlerAfter(balls, cursorAtFire);
        const f = aq.options.findIndex((o) => o.toLowerCase().trim() === actualNext.toLowerCase().trim());
        aIdx = (f >= 0 ? f : 0) as 0 | 1 | 2 | 3;
      }
      const isEndOfOver = cur.ballInOver >= 6 || cur.actual.endsWith(".6");
      const targetOver = isEndOfOver ? overAtFire + 1 : overAtFire;
      let endIdx = cursorAtFire;
      while (endIdx < balls.length && balls[endIdx].over <= targetOver) {
        endIdx++;
      }
      const endOfOver = Math.max(cursorAtFire + 6, endIdx);
      const isBalls6 = aq.resolver?.type === "wicket-bool" || aq.resolver?.window === 6;
      const targetCursor = isBalls6 ? Math.min(balls.length, cursorAtFire + 6) : endOfOver;

      finish({
        id: `ai-${overAtFire}-${aq.situation}-${Date.now() % 10000}`,
        kind: "over",
        resolve: aq.resolver?.type === "next-bowler" ? "nextBowler" : isBalls6 ? "balls6" : "overEnd",
        text: aq.text,
        options: aq.options,
        answerIdx: aIdx,
        splits: aq.splits,
        dynamics: "",
        at: balls[Math.max(0, cursorAtFire - 1)]?.actual ?? "",
        situation: aq.situation,
        filledText: aq.text,
        dynamics_cached: "",
        targetCursor,
        askCursor: cursorAtFire,
        batterKey: batter,
        source,
        resolver: aq.resolver,
      } as unknown as CurQ);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = authorCache.current.get(cacheKey) as any;
    if (cached) {
      aiFinish(cached, "ai");
    } else {
      (async () => {
        try {
          const ctx = buildMatchContext(
            balls,
            cursorAtFire,
            inns[innIdx]?.team ?? "",
            table.batters.map((b) => ({ name: b.name, runs: b.runs, balls: b.balls })),
            table.bowlers.map((b) => ({ name: b.name, balls: b.balls, runs: b.runs, wkts: b.wkts })),
            `${sit} at ${cur.actual}`,
            matchTarget
          );
          const actualNext = nextBowlerAfter(balls, cursorAtFire);
          const cands = [actualNext, ...otherBowlers(balls, actualNext, 3)];
          const ctl = new AbortController();
          const to = setTimeout(() => ctl.abort(), 6500);
          const res = await fetch("/api/author", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              context: ctx,
              candidates: cands,
              seed: qi,
              askedQuestions: askedTexts.current,
            }),
            signal: ctl.signal,
          });
          clearTimeout(to);
          const j = await res.json();
          if (j && j.ok && j.q) {
            authorCache.current.set(cacheKey, j.q);
            aiFinish(j.q, j.source === "ai" ? "ai" : "pool");
          } else {
            buildPoolQ();
          }
        } catch {
          buildPoolQ();
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCursor]);

  function settlePendingCall(pc: PendingCall): { pts: number; ok: boolean; correctLabel: string } {
    // ground truth from REAL balls — never before the over/balls exist
    const q = pc.q;
    if (q.resolver) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = q.resolver as any;
      let correctIdx = 0;
      if (r.type === "runs-bucket") {
        const n = r.window === "overEnd" ? q.targetCursor - q.askCursor : 6;
        const runs = rangeRuns(balls, q.askCursor, n);
        correctIdx = bucketIdx(runs, bucketEdgesFor([...q.options])) as 0 | 1 | 2 | 3;
      } else if (r.type === "wicket-bool") {
        const wk = rangeWickets(balls, q.askCursor, 6) > 0;
        const yi = typeof r.yesIndex === "number" ? r.yesIndex : 0;
        correctIdx = (wk ? yi : q.options.findIndex((o) => /^no\b/i.test(o)) + 0) as 0 | 1 | 2 | 3;
        if (!wk && correctIdx === yi) correctIdx = ((yi + 1) % 4) as 0 | 1 | 2 | 3;
      } else if (r.type === "next-bowler") {
        const actual = nextBowlerAfter(balls, q.askCursor).toLowerCase().trim();
        const found = q.options.findIndex((o) => o.toLowerCase().trim() === actual);
        correctIdx = (found >= 0 ? found : q.answerIdx) as 0 | 1 | 2 | 3;
      } else if (r.type === "boundary-kind") {
        const n = q.targetCursor - q.askCursor;
        const windowBalls = balls.slice(q.askCursor, q.askCursor + n);
        const hasWicket = windowBalls.some((b) => b.wicket);
        const hasSix = windowBalls.some((b) => b.batterRuns === 6);
        const hasFour = windowBalls.some((b) => b.batterRuns === 4);
        if (hasWicket && q.options[3]?.toLowerCase().includes("wicket")) {
          correctIdx = 3;
        } else if (hasSix && q.options[0]?.toLowerCase().includes("six")) {
          correctIdx = 0;
        } else if (hasFour && q.options[1]?.toLowerCase().includes("four")) {
          correctIdx = 1;
        } else {
          correctIdx = 2;
        }
      } else if (r.type === "milestone-reach") {
        const n = q.targetCursor - q.askCursor;
        const windowBalls = balls.slice(q.askCursor, q.askCursor + n);
        const batterName = String(r.batter ?? "").toLowerCase();
        const batterOut = windowBalls.some((b) => b.wicket && b.wicket.player_out?.toLowerCase().includes(batterName));
        const totalRuns = tableAt(balls, q.targetCursor).batters.find((b) => b.name.toLowerCase().includes(batterName))?.runs ?? 0;
        const targetM = Number(r.milestone ?? 50);
        if (batterOut && q.options[3]?.toLowerCase().includes("out")) {
          correctIdx = 3;
        } else if (totalRuns >= targetM) {
          correctIdx = 0;
        } else if (targetM - totalRuns <= 2) {
          correctIdx = 1;
        } else {
          correctIdx = 2;
        }
      } else if (r.type === "dots-count") {
        const n = q.targetCursor - q.askCursor;
        const dots = balls.slice(q.askCursor, q.askCursor + n).filter((b) => b.runs === 0).length;
        if (dots >= 6) correctIdx = 3;
        else if (dots >= 4) correctIdx = 2;
        else if (dots >= 2) correctIdx = 1;
        else correctIdx = 0;
      }
      const ok = OPT_KEYS[correctIdx] === pc.key;
      const p = pOf(liveSplits(q.splits, 99), OPT_KEYS[correctIdx]);
      const pts = ok ? totalPoints(p, pc.ms) : 0;
      return { pts, ok, correctLabel: `${OPT_KEYS[correctIdx]}: ${q.options[correctIdx]}` };
    }
    let correctIdx = q.answerIdx;
    if (q.resolve === "overEnd") {
      if (q.id === "p4") {
        const wkts = balls.slice(q.askCursor, q.targetCursor).filter((b) => b.wicket);
        const ro = wkts.find((b) => b.wicket?.kind === "run out");
        correctIdx = (wkts.length === 0 ? 1 : ro ? 2 : 0) as 0 | 1 | 2 | 3;
      } else {
        const runs = balls.slice(q.askCursor, q.targetCursor).reduce((a, b) => a + b.runs, 0);
        correctIdx = bucketIdx(runs, bucketEdgesFor([...q.options])) as 0 | 1 | 2 | 3;
      }
    } else if (q.resolve === "balls6") {
      if (q.id === "w2") {
        const wk = balls.slice(q.askCursor, q.targetCursor).filter((b) => b.wicket);
        const first = wk[0];
        correctIdx = (wk.length === 0 ? 2 : first?.wicket?.kind === "run out" ? 3 : first?.wicket?.kind === "caught" ? 1 : 0) as 0 | 1 | 2 | 3;
      } else if (q.id === "m4") {
        const wk = balls.slice(q.askCursor, q.targetCursor).filter((b) => b.wicket);
        const ro = wk.find((b) => b.wicket?.kind === "run out");
        correctIdx = (wk.length === 0 ? 1 : ro ? 2 : 0) as 0 | 1 | 2 | 3;
      } else if (q.id === "p2") {
        const n = rangeBoundaries(balls, q.askCursor, q.targetCursor - q.askCursor);
        correctIdx = (n >= 3 ? 3 : n) as 0 | 1 | 2 | 3;
      } else if (q.id === "w1" || q.id === "s4") {
        const hero = q.id === "w1" ? q.filledText.split(" ")[2] ?? "" : "";
        void hero;
        const runs = q.batterKey ? batterRunsInRange(balls, q.batterKey, q.askCursor, q.targetCursor - q.askCursor) : rangeRuns(balls, q.askCursor, q.targetCursor - q.askCursor);
        correctIdx = bucketIdx(runs, bucketEdgesFor([...q.options])) as 0 | 1 | 2 | 3;
      } else if (q.id === "m1" || q.id === "m5") {
        const w = rangeWickets(balls, q.askCursor, q.targetCursor - q.askCursor);
        if (w > 0) correctIdx = (q.id === "m5" ? 3 : 3) as 0 | 1 | 2 | 3;
        else {
          const runs = rangeRuns(balls, q.askCursor, q.targetCursor - q.askCursor);
          correctIdx = bucketIdx(runs, bucketEdgesFor([...q.options])) as 0 | 1 | 2 | 3;
          if (correctIdx === 3) correctIdx = 1;
        }
      } else if (q.id === "s5") {
        const ex = balls.slice(q.askCursor, q.targetCursor).reduce((a, b) => a + b.extras, 0);
        correctIdx = (ex === 0 ? 0 : ex <= 2 ? 1 : ex <= 5 ? 2 : 3) as 0 | 1 | 2 | 3;
      } else {
        const runs = rangeRuns(balls, q.askCursor, q.targetCursor - q.askCursor);
        correctIdx = bucketIdx(runs, bucketEdgesFor([...q.options])) as 0 | 1 | 2 | 3;
      }
    }
    const ok = OPT_KEYS[correctIdx] === pc.key;
    const p = pOf(liveSplits(q.splits, 99), OPT_KEYS[correctIdx]);
    const pts = ok ? totalPoints(p, pc.ms) : 0;
    return { pts, ok, correctLabel: `${OPT_KEYS[correctIdx]}: ${q.options[correctIdx]}` };
  }

  function resolve(key: OptKey, ms: number) {
    if (!curQ) return;
    const imp = curQ.situation === "wicket" ? 1 : curQ.situation === "pressure" ? 0.9 : curQ.situation === "momentum" ? 0.8 : 0.6;
    setAnswered((v) => v + 1);
    setImpSum((v) => v + imp);
    if (curQ.resolve !== "immediate") {
      // prediction about balls that don't exist yet — park it, pay on proof
      const p = pOf(splits, OPT_KEYS[curQ.answerIdx]);
      setPendings((v) => [...v, { q: { ...curQ, askCursor: liveCursor }, key, ms, p }]);
      setFlash({ pts: 0, rare: false, verdict: "waiting", correctLabel: `resolves ${curQ.resolve === "overEnd" ? "when this over ends" : curQ.resolve === "nextBowler" ? "at the next over" : "in 6 balls"}` });
      setTimeout(() => { setFlash(null); setShowQ(false); setQi((i) => i + 1); }, 1700);
      return;
    }
    const winKey = OPT_KEYS[curQ.answerIdx];
    const ok = key === winKey;
    if (ok) {
      setCorrect((v) => v + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    const p = pOf(splits, winKey);
    const pts = ok ? totalPoints(p, ms) : 0;
    setPrevRank(liveRank);
    setFlying({ pts, rare: ok && isRare(p) });
    setFlash({ pts, rare: ok && isRare(p), verdict: ok ? "correct" : "wrong", correctLabel: ok ? undefined : `${winKey}: ${curQ.options[curQ.answerIdx]}` });
    setBest((b) => {
      if (!ok) return b;
      const cand = { qText: curQ.filledText, yourPick: curQ.options[OPT_KEYS.indexOf(key)], correctPick: curQ.options[curQ.answerIdx], pts, p, over: curQ.at, verdict: `correct +${pts}` };
      if (!b || cand.pts >= b.pts) return cand;
      return b;
    });
    setTimeout(() => setMyPts((v) => v + pts), 750);
    setTimeout(() => { setFlash(null); setFlying(null); setShowQ(false); setQi((i) => i + 1); }, 1700);
  }

  // settle parked predictions the moment their balls exist
  useEffect(() => {
    setPendings((list) => {
      const due = list.filter((pc) => liveCursor >= pc.q.targetCursor);
      if (!due.length) return list;
      let gain = 0;
      let hits = 0;
      let firstLabel = "";
      due.forEach((pc, i) => {
        const r = settlePendingCall(pc);
        gain += r.pts;
        if (r.ok) {
          hits += 1;
          setCorrect((v) => v + 1);
          setStreak((s) => s + 1);
        } else {
          setStreak(0);
        }
        if (i === 0 || !firstLabel) {
          firstLabel = r.correctLabel;
        }
        setBest((b) => {
          if (!r.ok) return b;
          const cand = { qText: pc.q.filledText, yourPick: pc.q.options[OPT_KEYS.indexOf(pc.key)], correctPick: r.correctLabel, pts: r.pts, p: pc.p, over: pc.q.at, verdict: `settled +${r.pts} when the balls landed` };
          if (!b || cand.pts >= b.pts) return cand;
          return b;
        });
      });
      setPrevRank(liveRank);
      setFlying({ pts: gain, rare: gain >= 25 });
      setFlash({ pts: gain, rare: gain >= 25, verdict: hits === due.length && gain > 0 ? "correct" : gain > 0 ? "correct" : "wrong", correctLabel: firstLabel });
      setTimeout(() => setMyPts((v) => v + gain), 750);
      setTimeout(() => { setFlash(null); setFlying(null); }, 2200);
      return list.filter((pc) => liveCursor < pc.q.targetCursor);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCursor]);

  function skipQ() {
    // skip = no points, no accuracy hit — but bots keep scoring, so rank still slips
    setShowQ(false);
    setQi((i) => i + 1);
  }

  function ffToNextCall() {
    // manual fast-forward: fast forward remaining balls of current over directly to next over
    const cur = balls[Math.max(0, liveCursor - 1)];
    if (!cur) return;
    const targetOver = cur.over + 1;
    let targetIdx = liveCursor;
    while (targetIdx < balls.length && balls[targetIdx].over < targetOver) {
      targetIdx++;
    }
    if (targetIdx <= liveCursor) {
      targetIdx = Math.min(balls.length, liveCursor + 6);
    }
    const take = balls.slice(liveCursor, targetIdx);
    if (!take.length) return;
    const syms = take.map((b) => (b.wicket ? "W" : b.extras > 0 && b.batterRuns === 0 ? "wd" : String(b.runs)));
    setFf({ from: cur.actual, to: take[take.length - 1].actual, syms });
  }

  function ffDone() {
    setFf(null);
    // Allow new over checkpoint to trigger smoothly so scoreboard never stalls
    lastOverSeen.current = -1;
  }

  function onFfBall() {
    setCursor((c) => Math.min(balls.length, (c ?? startAt) + 1));
  }

  function finalizeReveal() {
    // settle any parked predictions against the real balls, then reveal
    setPendings((list) => {
      let gain = 0;
      list.forEach((pc) => {
        const r = settlePendingCall(pc);
        gain += r.pts;
        if (r.ok) setCorrect((v) => v + 1);
      });
      if (gain > 0) {
        setMyPts((v) => v + gain);
        addMatchXP(myPts + gain);
      }
      unlockSlot("live-match");
      return [];
    });

    // Add revealed card to Trophy Album
    addCollectedCard({
      id: `card-ind-wi-${Date.now()}`,
      slotId: "live-match",
      matchTitle: isChase ? "INDIA v WEST INDIES" : "WEST INDIES v INDIA",
      matchEdition: isChase ? "CHASE 406 • EDEN GARDENS" : "1ST INNINGS • EDEN GARDENS",
      tier: (rar.tier as "Diamond" | "Platinum" | "Gold" | "Silver") || "Gold",
      rarityScore: rar.score,
      xp: myPts,
      liveXP: myPts - sitPts,
      situationalXP: sitPts,
      streak: streak || 4,
      matchRank: liveRank,
      dailyRank: daily.youRank,
      bestCall: best && best.pts >= 20 ? "RARE INSIGHT READ" : "CLUTCH MOMENT READ",
      reward: rar.reward,
      best: best ?? {
        qText: "Can India chase down 406 at Eden Gardens?",
        yourPick: "Over boundary on ball 6",
        correctPick: "Over boundary on ball 6",
        pts: 25,
        p: 22,
        over: table.oversLabel || "11.3",
        verdict: "correct +25",
      },
      unlockedAt: "Just now",
      isNew: true,
    });

    setRevealed(true);
    setStep("mint");
  }

  const rar = rarityScore({
    accuracy: answered ? correct / answered : 0,
    importance: answered ? impSum / Math.max(1, answered) : 0,
    liveRank,
    liveSize: 500,
    dailyRank: daily.youRank,
    dailySize: 132,
    streak: streak || 4,
  });

  useHype(step === "contest" ? 0.75 : 0.35);
  void startAt;

  const scoreLine = `${score.runs}/${score.wkts} (${table.oversLabel})`;
  const liveBall = lastBall
    ? {
        label: `${lastBall.actual}`,
        text: `${ballText(lastBall)} • ${lastBall.teamRuns}/${lastBall.teamWkts}`,
        big: !!lastBall.wicket || lastBall.batterRuns >= 4,
      }
    : null;

  const currentTab = step === "lobby" || step === "preview" ? "home" : step === "contest" ? "live" : step === "album" || step === "mint" ? "album" : "daily";

  const handleSelectTab = (tab: "home" | "live" | "album" | "daily") => {
    if (tab === "home") setStep("lobby");
    else if (tab === "live") {
      setMatch("m1");
      setStep("contest");
    } else if (tab === "album") setStep("album");
    else if (tab === "daily") setStep("daily");
  };

  const battersMapped = useMemo(() => table.batters.map((b) => ({
    name: b.name,
    runs: b.runs,
    balls: b.balls,
    fours: b.fours,
    sixes: b.sixes,
    sr: ((b.runs / Math.max(1, b.balls)) * 100).toFixed(1),
    out: b.out,
    isStriker: b.isStriker,
  })), [table.batters]);

  const bowlersMapped = useMemo(() => table.bowlers.map((b) => ({
    name: b.name,
    overs: `${Math.floor(b.balls / 6)}.${b.balls % 6}`,
    maidens: b.maidens ?? 0,
    runs: b.runs,
    wkts: b.wkts,
    econ: b.balls > 0 ? ((b.runs / b.balls) * 6).toFixed(1) : "0.0",
  })), [table.bowlers]);

  return (
    <main>
      <WipeTransition k={step} />
      <FlyingPoints flight={flying} />

      {/* Header with Exit to Home when inside sub-screens */}
      {step !== "lobby" && (
        <div className="mb-3.5 flex items-center justify-between">
          <button
            onClick={() => setStep("lobby")}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[var(--ink-2)] px-3 py-1.5 text-xs font-bold cond text-[var(--text-2)] hover:text-white active:scale-95 transition-all shadow-sm"
          >
            <span>←</span>
            <span>HOME</span>
          </button>
          <span className="cond text-sm font-bold tracking-wider text-white">
            {step === "contest" ? "LIVE CALL ROOM" : step.toUpperCase()}
          </span>
          <OnAirLight on={step === "contest"} />
        </div>
      )}

      {step === "lobby" && (
        <HomeScreen
          onEnterLive={() => {
            setMatch("m1");
            setQi(0);
            setAskedOvers([]);
            setCurQ(null);
            setShowQ(false);
            setStep("contest");
          }}
          onViewAlbum={() => setStep("album")}
          onViewDaily={() => setStep("daily")}
          liveScore={{
            runs: score.runs,
            wkts: score.wkts,
            over: score.over,
            need: score.need,
            ballsLeft: score.ballsLeft,
            target: score.target,
          }}
          userXP={1250 + dailyEarned + myPts}
          userRank={liveRank}
          unlockedCount={loadStore().cards.length}
        />
      )}

      {(step === "preview" || step === "contest") && (
        <div className="mb-3 flex gap-2">
          {inns.map((inn) => (
            <button key={inn.idx} onClick={() => { setInnIdx(inn.idx); setAskedOvers([]); setShowQ(false); }}
              className={inn.idx === innIdx ? "tag volt" : "tag"}>{inn.team.toUpperCase()} {inn.idx === innIdx ? "●" : ""}</button>
          ))}
          <span className="tag ml-auto">{info.venue} • {info.date}</span>
        </div>
      )}

      {step === "preview" && isPrematch && (
        <section className="space-y-3">
          <div className="panel panel-edge">
            <div className="panel-inner text-center">
              <span className="tag">PRE-MATCH ROOM</span>
              <h3 className="cond mt-2 text-3xl">ENG v NZ • BEGINS SOON</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>Room opens at 7 PM • calls unlock at toss</p>
            </div>
          </div>
          <Leaderboard
            tied
            rows={[
              { name: "Rahul", pts: 0 },
              { name: "Priya", pts: 0 },
              { name: "You", pts: 0, you: true },
              { name: "Aman", pts: 0 },
              { name: "Neha", pts: 0 },
            ]}
            others={495}
          />
          <button disabled className="btn-volt w-full text-lg" style={{ opacity: 0.45 }}>
            ROOM OPENS AT 7 PM
          </button>
          <button onClick={() => setStep("lobby")} className="w-full min-h-[48px] text-sm" style={{ color: "var(--text-2)" }}>← ALL MATCHES</button>
        </section>
      )}

      {step === "preview" && !isPrematch && (
        <section className="space-y-3">
          <ScoreHeader
            score={{ ...score, over: table.oversLabel }}
            balls={lastBalls}
            isChase={isChase}
            battingTeam={isChase ? "India" : "West Indies"}
            bowlingTeam={isChase ? "West Indies" : "India"}
            format="2nd ODI • 50 ov"
            venue="Barsapara Cricket Stadium, Guwahati"
            matchTitle={isChase ? "India vs West Indies • Chase 406" : "West Indies vs India • 1st Innings"}
            batters={battersMapped}
            bowlers={bowlersMapped}
          />
          <Reactions scoreLine={scoreLine} team={inns[innIdx]?.team ?? ""} batter={table.batters.find((b) => !b.out)?.name ?? ""} bowler={table.bowlers[table.bowlers.length - 1]?.name ?? ""} isChase={isChase} liveBall={liveBall} />
          <Leaderboard rows={rows} others={490} youRank={liveRank} gapPts={gapToNext} />
          <button
            onClick={() => { setQi(0); setMyPts(0); setSitPts(0); setCorrect(0); setStreak(0); setAnswered(0); setImpSum(0); setPrevRank(null); setPendings([]); setBest(null); setRevealed(false); setAskedOvers([]); setCurQ(null); setShowQ(false); setStep("contest"); }}
            className="btn-primary">
            Enter Live Call Room →
          </button>
          <button onClick={() => setStep("lobby")} className="btn-secondary">← Back to Matches</button>
        </section>
      )}

      {step === "contest" && curQ && (
        <section className="space-y-3">
          <ScoreHeader
            score={{ ...score, over: table.oversLabel }}
            balls={lastBalls}
            isChase={isChase}
            battingTeam={isChase ? "India" : "West Indies"}
            bowlingTeam={isChase ? "West Indies" : "India"}
            format="2nd ODI • 50 ov"
            venue="Barsapara Cricket Stadium, Guwahati"
            matchTitle={isChase ? "India vs West Indies • Chase 406" : "West Indies vs India • 1st Innings"}
            batters={battersMapped}
            bowlers={bowlersMapped}
          />
          {ff && (
            <FastForward from={ff.from} to={ff.to} balls={ff.syms} onBall={onFfBall} onDone={ffDone} />
          )}
          {!ff && incoming && !showQ && (
            <div className="surface p-3 flex items-center gap-2 border-[var(--border-accent)]">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-gold)] animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Over Call Incoming</span>
              <span className="text-xs text-[var(--text-secondary)]">• Analyzing match dynamics</span>
            </div>
          )}
          {!ff && showQ && curQ && (
            <QuestionSheet key={curQ.id} q={{ ...curQ, text: curQ.filledText } as unknown as never} kind={curQ.kind} splits={splits} onResolve={resolve} onClose={skipQ} source={curQ.source} />
          )}
          {!ff && !showQ && (
            <div className="surface p-3 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-[var(--text-secondary)]">Calls: <b className="text-white font-num font-bold">{answered}</b></span>
                <span className="mx-1.5 text-[var(--text-muted)]">•</span>
                <span className="text-[var(--text-secondary)]">Streak: <b className="text-[var(--brand-gold)] font-num font-bold">{streak}</b></span>
                <span className="mx-1.5 text-[var(--text-muted)]">•</span>
                <span className="text-[var(--text-secondary)]">Total: <b className="text-[var(--brand-gold)] font-num font-bold"><AnimatedNumber value={myPts} /></b> XP</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={ffToNextCall} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--border-subtle)] text-xs font-semibold text-white hover:bg-white/10 transition-colors">
                  Next Over →
                </button>
                {answered >= 1 && (
                  <button onClick={() => setStep("reveal")} className="px-2.5 py-1.5 rounded-lg bg-[var(--brand-gold)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-colors">
                    Finish & reveal card
                  </button>
                )}
              </div>
            </div>
          )}
          <ResolveFlash flash={flash} />
          {answered >= 1 && showQ && (
            <div className="surface p-3 flex items-center justify-between gap-3 border-[var(--border-accent)]">
              <div>
                <span className="text-xs font-bold text-[var(--brand-gold)] uppercase tracking-wider">Session Progress</span>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {answered} calls • Streak: {streak} • {myPts} XP • Rank #{liveRank}
                </p>
              </div>
              <button
                onClick={() => setStep("reveal")}
                className="px-3 py-1.5 rounded-lg bg-[var(--brand-gold)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110"
              >
                Finish & reveal card →
              </button>
            </div>
          )}
          <Leaderboard rows={rows} others={490} youRank={liveRank} gapPts={gapToNext} />
          <div className="panel panel-edge win">
            <div className="panel-inner text-xs">PREDICTIONS SETTLE ONLY WHEN THE BALLS EXIST • never before the over ends</div>
          </div>
          {pendings.length > 0 && (
            <div className="panel panel-edge">
              <div className="panel-inner">
                <span className="tag">{pendings.length} CALL{pendings.length > 1 ? "S" : ""} WAITING</span>
                <div className="mt-2 space-y-1">
                  {pendings.map((pc) => (
                    <p key={pc.q.id} className="text-xs" style={{ color: "var(--text-2)" }}>
                      {pc.q.at} • “{pc.q.filledText.slice(0, 44)}…” → resolves in play
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
          <EventFeed events={balls.slice(Math.max(0, liveCursor - 4), liveCursor).reverse().map((b) => ({ at: b.actual, label: ballText(b).slice(0, 60), active: false }))} />
        </section>
      )}

      {step === "contest" && !curQ && (
        <section className="space-y-3">
          <ScoreHeader
            score={{ ...score, over: table.oversLabel }}
            balls={lastBalls}
            isChase={isChase}
            battingTeam={isChase ? "India" : "West Indies"}
            bowlingTeam={isChase ? "West Indies" : "India"}
            format="2nd ODI • 50 ov"
            venue="Barsapara Cricket Stadium, Guwahati"
            matchTitle={isChase ? "India vs West Indies • Chase 406" : "West Indies vs India • 1st Innings"}
            batters={battersMapped}
            bowlers={bowlersMapped}
          />
          <div className="surface p-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-[var(--text-secondary)]">Calls: <b className="text-white font-num font-bold">{answered}</b></span>
              <span className="mx-1.5 text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-secondary)]">Streak: <b className="text-[var(--brand-gold)] font-num font-bold">{streak}</b></span>
              <span className="mx-1.5 text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-secondary)]">Total: <b className="text-[var(--brand-gold)] font-num font-bold"><AnimatedNumber value={myPts} /></b> XP</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={ffToNextCall} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-[var(--border-subtle)] text-xs font-semibold text-white hover:bg-white/10 transition-colors">
                Next Over →
              </button>
              {answered >= 1 && (
                <button onClick={() => setStep("reveal")} className="px-2.5 py-1.5 rounded-lg bg-[var(--brand-gold)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-colors">
                  Finish & reveal card
                </button>
              )}
            </div>
          </div>
          <Leaderboard rows={rows} others={490} youRank={liveRank} gapPts={gapToNext} />
        </section>
      )}

      {step === "reveal" && (
        <section>
          {!revealed
            ? <ScratchReveal onReveal={finalizeReveal} />
            : <p className="panel panel-edge"><span className="panel-inner block text-center">Revealed →</span></p>}
        </section>
      )}

      {step === "mint" && (
        <section className="space-y-3">
          <MintCard
            matchTitle={`${inns[innIdx]?.team.toUpperCase() ?? "INDIA"} v ${inns[1 - innIdx]?.team.toUpperCase() ?? "WEST INDIES"}`}
            matchEdition="CHASE 406 • 2ND INNINGS"
            live={myPts - sitPts}
            situational={sitPts}
            matchRank={liveRank}
            bestCall={best && best.pts >= 20 ? "RARE INSIGHT READ" : "CLUTCH MOMENT READ"}
            seasonPct={Math.round((daily.youRank / 132) * 100)}
            streak={streak || 4}
            rarityScore={rar.score}
            rarityTier={rar.tier}
            reward={rar.reward}
            dailyRank={daily.youRank}
            best={best ?? undefined}
            onViewAlbum={() => setStep("album")}
          />
          <FinalBoard rows={rows} youRank={liveRank} />
        </section>
      )}
      {step === "album" && (
        <section className="space-y-3">
          <AlbumGrid />
          <SeasonTable matchPts={myPts} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setStep("lobby")} className="btn-secondary py-2 text-xs">← Back to Home</button>
            <button onClick={() => setStep("daily")} className="btn-primary py-2 text-xs font-bold">Daily Trivia →</button>
          </div>
        </section>
      )}
      {step === "daily" && (
        <section className="space-y-3">
          <DailyList
            onDone={(xp) => { setDailyEarned((v) => v + xp); }}
            onBackToHome={() => setStep("lobby")}
          />
          {/* Secondary Daily Standings */}
          <div className="surface overflow-hidden">
            <div className="px-3.5 py-2 text-xs font-bold tracking-wider border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] flex justify-between items-center">
              <span className="uppercase text-white">Daily Standings</span>
              <span className="font-num text-[11px] text-[var(--brand-gold)] font-semibold">Rank #{daily.youRank} of 132</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {daily.rows.slice(0, 5).map((r, i) => (
                <div
                  key={r.name + i}
                  className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                    r.you
                      ? "bg-amber-500/10 text-[var(--brand-gold)] font-semibold"
                      : "text-[var(--text-primary)] hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-num w-5 font-bold ${r.you ? "text-[var(--brand-gold)]" : "text-[var(--text-muted)]"}`}>
                      #{i + 1}
                    </span>
                    <span className="font-medium">
                      {r.name}
                      {r.you && <span className="ml-1 text-[10px] font-bold text-[var(--brand-gold)] uppercase tracking-wide"> (You)</span>}
                    </span>
                  </div>
                  <span className="font-num font-semibold text-white">{r.xp} XP</span>
                </div>
              ))}
            </div>
            <div className="px-3.5 py-2 text-[10px] text-[var(--text-muted)] text-center border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50">
              Daily trivia progression directly upgrades tonight&apos;s collectible card tier
            </div>
          </div>
          <button onClick={() => setStep("lobby")} className="btn-secondary w-full">← Back to Home</button>
        </section>
      )}

      {debug && <MockMapModal onClose={() => setDebug(false)} />}

      <MobileNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isLiveActive={true}
      />
    </main>
  );
}
