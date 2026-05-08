export type RiskLevel = "low" | "medium" | "high";

/**
 * Detection strategy:
 * - Normalize text to lowercase, convert common leetspeak (k1ll -> kill), and collapse repeated separators.
 * - Use case-insensitive, boundary-aware regex patterns for direct words and multi-word phrases.
 * - Include common variants/slang/typos/plurals to improve recall for urgent safety detection.
 *
 * High-risk words/phrases documented for maintenance:
 * kill, kills, killed, killing, kill myself, want to kill myself, wanna kill myself, k1ll, k!ll, kms;
 * suicide, suicidal, suicidality, suicde, sucide, suiside, self delete, unalive, unalive myself;
 * die, dying, dead, death, don't want to live, no reason to live, end my life, end it all, end it, take my life, off myself;
 * cut myself, cutting myself, hurt myself, harm myself, self harm, self-harm, selfharm;
 * hang, hanging, poison, poisoning, overdose, od, jump off, jump from, slit my wrist, burn myself.
 */
const HIGH_PATTERNS: Array<{ phrase: string; regex: RegExp }> = [
  { phrase: "kill", regex: /\b(?:kill|kills|killed|killing|k1ll|k!ll)\b/i },
  {
    phrase: "kill myself",
    regex: /\b(?:kill|k1ll|k!ll)\s*(?:myself|my\s*self|me)\b/i,
  },
  {
    phrase: "suicide",
    regex: /\b(?:suicid(?:e|al|ality)|suicde|sucide|suiside)\b/i,
  },
  {
    phrase: "die/death",
    regex: /\b(?:(?:i|im|i'm|me|myself)\s*(?:want\s*to|wanna|need\s*to)?\s*(?:die|dying|be\s*dead)|my\s*death)\b/i,
  },
  {
    phrase: "end my life",
    regex: /\b(?:end\s*(?:my\s*)?life|end\s*it\s*all|end\s*it|take\s*my\s*life)\b/i,
  },
  {
    phrase: "don't want to live",
    regex: /\b(?:do\s*not|don['’]?t|cant|can['’]?t)\s*(?:want\s*to\s*)?live\b/i,
  },
  { phrase: "no reason to live", regex: /\bno\s*reason\s*to\s*live\b/i },
  { phrase: "off myself", regex: /\boff\s*myself\b/i },
  { phrase: "kms", regex: /\bkms\b/i },
  {
    phrase: "unalive myself",
    regex: /\b(?:unalive(?:\s*myself)?|self\s*delete)\b/i,
  },
  {
    phrase: "cut myself",
    regex: /\b(?:cut|cutting|slit)\s*(?:myself|my\s*wrist|my\s*wrists)\b/i,
  },
  {
    phrase: "hurt myself",
    regex: /\b(?:hurt|harm|burn)\s*myself\b/i,
  },
  {
    phrase: "self harm",
    regex: /\bself(?:\s|-)?harm(?:ing)?\b/i,
  },
  { phrase: "hang", regex: /\b(?:hang|hanging)\s*(?:myself|me)\b/i },
  {
    phrase: "poison",
    regex: /\b(?:poison|poisoning)\s*(?:myself|me)|\b(?:drink|drank|taking)\s*poison\b/i,
  },
  {
    phrase: "overdose",
    regex: /\b(?:overdose|od)\s*(?:myself|me|on|with)\b|\b(?:i|im|i'm)\s*(?:might|will|wanna|want\s*to)?\s*od\b/i,
  },
  {
    phrase: "jump off",
    regex: /\bjump\s*(?:off|from)\s*(?:a|the)?\s*(?:bridge|building|roof|balcony|cliff|ledge)\b/i,
  },
  { phrase: "i can't go on", regex: /\bi\s*can(?:'|’)?t\s*go\s*on\b/i },
  { phrase: "hopeless", regex: /\bhopeless\b/i },
  { phrase: "i want to disappear", regex: /\bi\s*want\s*to\s*disappear\b/i },
];

function normalizeForRiskScan(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessRisk(text: string): { riskLevel: RiskLevel; reasons: string[] } {
  const t = normalizeForRiskScan(text);
  const reasons = HIGH_PATTERNS.filter((p) => p.regex.test(t)).map((p) => p.phrase);

  if (reasons.length > 0) return { riskLevel: "high", reasons: [...new Set(reasons)] };

  // simple medium check (optional)
  if (/\b(depressed|worthless|empty|panic|anxious)\b/i.test(t)) {
    return { riskLevel: "medium", reasons: ["distress_keywords"] };
  }

  return { riskLevel: "low", reasons: [] };
}
