import { NextResponse } from "next/server";
import { buildParse } from "@/lib/prompts";

const SQUAD = ["Kohli", "Head", "Maxwell", "Axar", "Bumrah", "Chahal", "Rohit", "Hardik"];

async function liveParse(prompt: string): Promise<unknown | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 120, responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validate(raw: unknown): { valid: boolean; hero: string | null; slot: number | null; reason: string | null } {
  const r = (raw ?? {}) as { valid?: boolean; hero?: string | null; slot?: number | null; reason?: string | null };
  const hero = typeof r.hero === "string" ? r.hero : null;
  const slot = typeof r.slot === "number" ? r.slot : null;
  const heroOk = !!hero && SQUAD.some((s) => s.toLowerCase() === hero.toLowerCase());
  const slotOk = !!slot && slot >= 3 && slot <= 6;
  if (r.valid === true && heroOk && slotOk) return { valid: true, hero, slot, reason: null };
  return {
    valid: false,
    hero: heroOk ? hero : null,
    slot: slotOk ? slot : null,
    reason:
      typeof r.reason === "string" && r.reason
        ? r.reason
        : `Try a squad batter at 3–6, e.g. "what if Axar batted at 4".`,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { text = "" } = body as { text?: string };
  const parsed = await liveParse(buildParse(String(text), SQUAD));
  if (parsed) return NextResponse.json({ ...validate(parsed), badge: null as string | null, live: true });
  // offline deterministic fallback: simple regex for "axar at 4" style
  const m = String(text).match(/([A-Za-z]+)[^\d]*([3-6])/);
  const hero = m ? m[1] : null;
  const slot = m ? Number(m[2]) : null;
  const heroOk = !!hero && SQUAD.some((s) => s.toLowerCase() === hero.toLowerCase());
  if (heroOk && slot) return NextResponse.json({ valid: true, hero, slot, reason: null, badge: "OFFLINE ", live: false });
  return NextResponse.json({
    valid: false,
    hero: null,
    slot: null,
    reason: `Try a squad batter at 3–6, e.g. "what if Axar batted at 4".`,
    badge: "OFFLINE ",
    live: false,
  });
}
