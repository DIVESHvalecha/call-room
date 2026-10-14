const BANNED = ["bet", "odds", "stake", "prize money", "cash win", "wager"];

export function buildDynamics(input: { state: string; q: string; answer: string; maxWords?: number }): string {
  const maxWords = input.maxWords ?? 30;
  return [
    "You are a TV broadcast lower-third writer for cricket. One line only.",
    `State: ${input.state}`,
    `Question: ${input.q}`,
    `Answer: ${input.answer}`,
    `Constraints: max ${maxWords} words, Barlow Condensed short punchy line, cite the target or diff, never invent goals/cards/scores outside the given state, playful, no profanity, no betting language.`,
    "Return the line only, no quotes.",
  ].join("\n");
}

export function buildParse(text: string, squad: string[]): string {
  return [
    "Extract a cricket what-if into JSON. Reply JSON only, no prose.",
    `Text: ${text}`,
    `Squad: ${squad.join(", ")}`,
    "Schema: {valid:boolean, hero:string|null, slot:number|null, reason:string|null}.",
    "Rules: valid only if hero is in squad and slot is 3-6. Else valid=false with short reason + suggestion naming a valid hero/slot.",
  ].join("\n");
}

export function buildLore(input: { moment: string; tier: string }): string {
  return [
    "Write an 8-word collectible card lore line. Playful, no profanity, no betting language.",
    `Moment: ${input.moment}`,
    `Tier: ${input.tier}`,
    "Return the line only.",
  ].join("\n");
}

export function violates(text: string): boolean {
  const t = text.toLowerCase();
  return BANNED.some((b) => t.includes(b));
}

export function capWords(text: string, max: number): string {
  const w = text.split(/\s+/);
  return w.length > max ? w.slice(0, max).join(" ") : text;
}
