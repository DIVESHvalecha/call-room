import { NextResponse } from "next/server";
import { buildAuthorPrompt, validateAuthored, generateContextualFallback } from "@/lib/author";
import type { MatchContext } from "@/lib/context";

async function callGemini(
  model: string,
  key: string,
  prompt: string,
  timeoutMs = 5500
): Promise<{ data: unknown; modelUsed: string } | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 350,
          responseMimeType: "application/json",
        },
      }),
      signal: ctl.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn(`[Gemini API] ${model} returned HTTP ${res.status}:`, errorText.slice(0, 140));
      return null;
    }

    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return { data: parsed, modelUsed: model };
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[Gemini API] Attempt on ${model} aborted or failed:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function liveAuthor(
  prompt: string
): Promise<{ data: unknown; modelUsed: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const configuredModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  // Try the fast working model first, then fallback to user's configured model or other variants
  const modelsToTry = [
    configuredModel,
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.5-flash",
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  for (const model of modelsToTry) {
    try {
      const result = await callGemini(model, key, prompt, 5500);
      if (result?.data) {
        return result;
      }
    } catch {
      // Continue to next available model
    }
  }

  return null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { context, candidates, seed, askedQuestions } = body as {
    context?: MatchContext;
    candidates?: string[];
    seed?: number;
    askedQuestions?: string[];
  };

  if (!context) return NextResponse.json({ ok: false as const, reason: "no-context" });
  const cands = Array.isArray(candidates) && candidates.length === 4 ? candidates : [];
  const asked = Array.isArray(askedQuestions) ? askedQuestions : [];

  // 1. Try Live Gemini API with user's key and curl config
  const prompt = buildAuthorPrompt(context, cands, asked);
  const aiResult = await liveAuthor(prompt);

  if (aiResult?.data) {
    const validated = validateAuthored(aiResult.data, context, cands);
    if (validated) {
      console.log(`[Gemini Live API ✓] Urgently authored via ${aiResult.modelUsed}: "${validated.text}"`);
      return NextResponse.json({
        ok: true as const,
        q: validated,
        source: "ai" as const,
        model: aiResult.modelUsed,
      });
    }
  }

  // 2. High-speed contextual fallback if key is missing, network is offline, or AI timed out
  const fallback = generateContextualFallback(context, cands, seed ?? 0);
  console.log(`[Contextual Fallback] Fallback for theme ${(seed ?? 0) % 6}: "${fallback.text}"`);
  return NextResponse.json({
    ok: true as const,
    q: fallback,
    source: "contextual" as const,
  });
}
