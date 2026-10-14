import { NextResponse } from "next/server";
import { lookup } from "@/lib/vault";
import { buildDynamics, capWords, violates } from "@/lib/prompts";

async function liveLine(prompt: string): Promise<string | null> {
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
          generationConfig: { temperature: 0.4, maxOutputTokens: 90 },
        }),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const clean = capWords(text.trim(), 32);
    if (violates(clean)) return null;
    return clean;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const started = Date.now();
  const body = await req.json().catch(() => ({}));
  const { qId = "", state = "", q = "", answer = "", live = false } = body as {
    qId?: string;
    state?: string;
    q?: string;
    answer?: string;
    live?: boolean;
  };
  const cached = lookup(String(qId));
  void started;

  if (live) {
    const line = await liveLine(buildDynamics({ state: String(state), q: String(q), answer: String(answer) }));
    if (line) return NextResponse.json({ line, vaultId: cached.vaultId, badge: null as string | null, live: true });
  }
  return NextResponse.json({ line: cached.line, vaultId: cached.vaultId, badge: "OFFLINE ", live: false });
}
