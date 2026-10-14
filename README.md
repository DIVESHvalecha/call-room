# Call Room — Predict Rare, Collect Rare

Live second-screen cricket companion (Broadcast Booth theme). Fans enter a match room, make one call per over / at key moments, get rarity-scored (rare-correct beats common-correct), climb a live board, and reveal a rarity-tiered collectible card at full time. Daily trivia feeds card rarity.

## Run

```bash
cd call-room
npm install
npm run dev        # http://localhost:3000 — test at 390px width + one real phone
npm run build      # must pass before recording/deploy
```

Env (optional — app works cached without it):

```bash
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash   # or whichever current Flash your key supports
```

## What it does (90s path)

Lobby (match list + daily) → Preview (score bug + reactions + board + Enter) → Contest (5 calls, 15s timer, lock, rarity bars, flying +25, board flips, fast-forward 10.2→11.3 with live scorecard) → Full time (board hidden, canvas scratch) → Mint (count-up, tier, rarity score + reward, share PNG, challenge link) → Album (6 slots) → Daily (random 3-Q set, visible picks, dynamic 132-board feeding rarity).

## Mock-map (interview only — not on screen)

| Area | Video shows | Reality today | Prod path |
|---|---|---|---|
| Match feed | Ticking replay + FF bar | Scripted `slice.json` + `GAPS` ball outcomes | Ball-by-ball websocket adapter |
| Crowd 128 | Jitter counter + floating reactions | Simulated splits + scripted pools | Sockets + presence |
| Questions | AI-looking calls + dynamics lines | Cached copy + 1 live Gemini path (`/api/dynamics`, `/api/parse`) with offline badge | Nightly question bank + moderation queue |
| Scoring | Rarity math + tiers | Pure functions in `lib/score.ts` (auditable, tested) | Server timestamps + fingerprint anti-farm |
| Board/album | Live ranks + unlocks | Local state + localStorage | Auth + DB + season service |
| Images | Gradient/emoji cards | CSS/SVG only (no player photos = no rights issue) | Licensed feed via FanCode/BCCI |

## Limits (stated in submission)

- One replay slice (Target 155, 85/2 in 10.2 → ~14.0), 5 contest calls + 4 daily sets (random 1 shown).
- Room of 128 simulated; daily 132 simulated — your ranks move for real within the sim.
- No auth, no backend persistence, no live API; works offline on cached copy.
- Tier/rarity thresholds are design choices for demo feel, to be calibrated on real data.

## Tools used

- Gemini Flash (current): dynamics lines, SOS explainer, parse schema, question/lore drafting + offline vault bootstrap (human-curated, frozen).
- Coding assistant: scaffolding, animation wiring, test table.
- Libraries: Next.js 14, Framer Motion (transform/opacity only), html-to-image. No images; CSS/SVG/emoji only.

## Metric hypotheses (to A/B, not claimed)

Calls per match, next-day return via daily, card forwards per match. Success = longer death-over sessions + return without money.
