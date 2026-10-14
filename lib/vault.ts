import sliceData from "@/data/slice.json";
import dailyData from "@/data/daily.json";

type SliceLike = { questions: { id: string; dynamics_cached: string }[] };
type DailyLike = { questions?: { id: string; explainer_cached: string }[]; sets?: { id: string; explainer_cached: string }[][] };

export function lookup(qId: string, lang = "en"): { line: string; vaultId: string } {
  const slice = sliceData as unknown as SliceLike;
  const hit = slice.questions.find((q) => q.id === qId);
  if (hit) return { line: hit.dynamics_cached, vaultId: `slice:${qId}:${lang}` };
  const daily = dailyData as unknown as DailyLike;
  const all: { id: string; explainer_cached: string }[] = daily.questions ?? (daily.sets ?? []).flat();
  const d = all.find((q) => q.id === qId);
  if (d) return { line: d.explainer_cached, vaultId: `daily:${qId}:${lang}` };
  return { line: "Locked call — dynamics sealed until full time.", vaultId: `miss:${qId}:${lang}` };
}
