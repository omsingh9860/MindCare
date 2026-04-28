// Mood question bank and utilities for the MoodTest feature.

export type QuestionCategory =
  | "mood"
  | "sleep"
  | "energy"
  | "stress"
  | "sadness"
  | "anger"
  | "social"
  | "self"
  | "focus"
  | "lifestyle";

export interface MoodQuestion {
  /** Stable unique key used as the answer map key (e.g. "mood_1"). */
  id: string;
  question: string;
  category: QuestionCategory;
  /**
   * When true the question is "negative" (higher response = worse wellbeing),
   * so its Likert score is inverted before computing the overall score.
   */
  negative: boolean;
}

/** Uniform 5-point Likert scale used for every question. */
export const LIKERT_OPTIONS = [
  "Not at all",
  "A little",
  "Moderately",
  "Quite a bit",
  "Extremely",
] as const;

export type LikertOption = (typeof LIKERT_OPTIONS)[number];

/**
 * Returns a 1-5 wellbeing score for a single answer.
 * For negative questions the raw index is inverted so that
 * a higher overall score always means better wellbeing.
 */
export function getOptionScore(option: LikertOption, negative: boolean): number {
  const raw = (LIKERT_OPTIONS as readonly string[]).indexOf(option) + 1; // 1–5
  return negative ? 6 - raw : raw;
}

/**
 * Computes a 0–100 wellbeing score from the answered questions.
 * Returns null when no questions have been answered yet.
 */
export function computeMoodScore(
  questions: MoodQuestion[],
  answers: Record<string, string>
): number | null {
  const scores = questions
    .map((q) => {
      const ans = answers[q.id] as LikertOption | undefined;
      if (!ans || !(LIKERT_OPTIONS as readonly string[]).includes(ans)) return null;
      return getOptionScore(ans as LikertOption, q.negative);
    })
    .filter((s): s is number => s !== null);

  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(((avg - 1) / 4) * 100);
}

/**
 * Formats an answer option for storage, including its numeric score.
 * e.g. "Moderately (3/5)"
 */
export function formatAnswerForStorage(option: string, negative: boolean): string {
  const idx = (LIKERT_OPTIONS as readonly string[]).indexOf(option) + 1;
  const score = negative ? 6 - idx : idx;
  return `${option} (${score}/5)`;
}

/**
 * Picks between `min` and `max` unique questions at random from the full bank,
 * trying to include at least one question from each category when the count
 * allows it.
 */
export function pickRandomQuestions(min = 5, max = 10): MoodQuestion[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;

  // Shuffle each category independently and take one representative first
  const byCategory = new Map<QuestionCategory, MoodQuestion[]>();
  for (const q of QUESTION_BANK) {
    const list = byCategory.get(q.category) ?? [];
    list.push(q);
    byCategory.set(q.category, list);
  }

  const categories = Array.from(byCategory.keys());
  // Shuffle category order
  const shuffledCategories = categories.sort(() => Math.random() - 0.5);

  const selected: MoodQuestion[] = [];
  const usedIds = new Set<string>();

  // One representative per category (variety pass)
  for (const cat of shuffledCategories) {
    if (selected.length >= count) break;
    const pool = (byCategory.get(cat) ?? []).sort(() => Math.random() - 0.5);
    for (const q of pool) {
      if (!usedIds.has(q.id)) {
        selected.push(q);
        usedIds.add(q.id);
        break;
      }
    }
  }

  // Fill remaining slots from the full bank (random order)
  if (selected.length < count) {
    const remaining = QUESTION_BANK.filter((q) => !usedIds.has(q.id)).sort(
      () => Math.random() - 0.5
    );
    for (const q of remaining) {
      if (selected.length >= count) break;
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  // Return in a randomised display order
  return selected.sort(() => Math.random() - 0.5);
}

// ---------------------------------------------------------------------------
// Full question bank (90 questions across 10 categories)
// ---------------------------------------------------------------------------

export const QUESTION_BANK: MoodQuestion[] = [
  // ── MOOD (15) ──────────────────────────────────────────────────────────────
  { id: "mood_1",  category: "mood", negative: false, question: "How would you describe your overall mood today?" },
  { id: "mood_2",  category: "mood", negative: false, question: "How positive do you feel right now?" },
  { id: "mood_3",  category: "mood", negative: false, question: "How often did you feel happy today?" },
  { id: "mood_4",  category: "mood", negative: false, question: "Did you feel emotionally stable today?" },
  { id: "mood_5",  category: "mood", negative: false, question: "How satisfied are you with your day?" },
  { id: "mood_6",  category: "mood", negative: false, question: "How often did you smile today?" },
  { id: "mood_7",  category: "mood", negative: false, question: "How hopeful do you feel about things?" },
  { id: "mood_8",  category: "mood", negative: false, question: "Did you feel calm throughout the day?" },
  { id: "mood_9",  category: "mood", negative: true,  question: "How often did you feel overwhelmed?" },
  { id: "mood_10", category: "mood", negative: false, question: "How would you rate your emotional balance?" },
  { id: "mood_11", category: "mood", negative: false, question: "Did you feel content today?" },
  { id: "mood_12", category: "mood", negative: true,  question: "How frequently did your mood change today?" },
  { id: "mood_13", category: "mood", negative: false, question: "How peaceful do you feel right now?" },
  { id: "mood_14", category: "mood", negative: false, question: "Did you feel emotionally strong today?" },
  { id: "mood_15", category: "mood", negative: false, question: "How would you rate your overall mental state?" },

  // ── SLEEP (10) ─────────────────────────────────────────────────────────────
  { id: "sleep_1",  category: "sleep", negative: false, question: "How well did you sleep last night?" },
  { id: "sleep_2",  category: "sleep", negative: false, question: "Did you wake up feeling refreshed?" },
  { id: "sleep_3",  category: "sleep", negative: false, question: "How many hours did you sleep?" },
  { id: "sleep_4",  category: "sleep", negative: true,  question: "Did you experience disturbed sleep?" },
  { id: "sleep_5",  category: "sleep", negative: false, question: "How easy was it for you to fall asleep?" },
  { id: "sleep_6",  category: "sleep", negative: true,  question: "Did you wake up multiple times during the night?" },
  { id: "sleep_7",  category: "sleep", negative: false, question: "How energetic did you feel after waking up?" },
  { id: "sleep_8",  category: "sleep", negative: true,  question: "Did you feel tired during the day?" },
  { id: "sleep_9",  category: "sleep", negative: false, question: "How consistent is your sleep schedule?" },
  { id: "sleep_10", category: "sleep", negative: true,  question: "Did you have trouble sleeping due to stress?" },

  // ── ENERGY LEVEL (10) ──────────────────────────────────────────────────────
  { id: "energy_1",  category: "energy", negative: false, question: "How energetic do you feel right now?" },
  { id: "energy_2",  category: "energy", negative: false, question: "Did you feel motivated to work today?" },
  { id: "energy_3",  category: "energy", negative: false, question: "How active were you physically today?" },
  { id: "energy_4",  category: "energy", negative: true,  question: "Did you feel exhausted during the day?" },
  { id: "energy_5",  category: "energy", negative: false, question: "How productive were you today?" },
  { id: "energy_6",  category: "energy", negative: true,  question: "Did you feel mentally tired?" },
  { id: "energy_7",  category: "energy", negative: false, question: "How focused were you today?" },
  { id: "energy_8",  category: "energy", negative: true,  question: "Did you feel lazy or unmotivated?" },
  { id: "energy_9",  category: "energy", negative: false, question: "How alert did you feel throughout the day?" },
  { id: "energy_10", category: "energy", negative: true,  question: "How much effort did daily tasks require?" },

  // ── STRESS & ANXIETY (15) ──────────────────────────────────────────────────
  { id: "stress_1",  category: "stress", negative: true, question: "How stressed are you feeling right now?" },
  { id: "stress_2",  category: "stress", negative: true, question: "Did you feel anxious today?" },
  { id: "stress_3",  category: "stress", negative: true, question: "How often did you feel worried?" },
  { id: "stress_4",  category: "stress", negative: true, question: "Did you experience panic or fear?" },
  { id: "stress_5",  category: "stress", negative: false, question: "How well did you handle stress today?" },
  { id: "stress_6",  category: "stress", negative: true, question: "Did you feel under pressure?" },
  { id: "stress_7",  category: "stress", negative: true, question: "How often did you overthink things?" },
  { id: "stress_8",  category: "stress", negative: true, question: "Did small things irritate you?" },
  { id: "stress_9",  category: "stress", negative: true, question: "How tense did you feel today?" },
  { id: "stress_10", category: "stress", negative: true, question: "Did you feel mentally overloaded?" },
  { id: "stress_11", category: "stress", negative: true, question: "How often did you feel nervous?" },
  { id: "stress_12", category: "stress", negative: true, question: "Did you feel out of control?" },
  { id: "stress_13", category: "stress", negative: true, question: "How often did you feel restless?" },
  { id: "stress_14", category: "stress", negative: true, question: "Did stress affect your performance today?" },
  { id: "stress_15", category: "stress", negative: true, question: "How difficult was it to relax?" },

  // ── SADNESS & LOW MOOD (10) ────────────────────────────────────────────────
  { id: "sadness_1",  category: "sadness", negative: true, question: "Did you feel sad today?" },
  { id: "sadness_2",  category: "sadness", negative: true, question: "How often did you feel low or down?" },
  { id: "sadness_3",  category: "sadness", negative: true, question: "Did you feel emotionally drained?" },
  { id: "sadness_4",  category: "sadness", negative: true, question: "Did you feel like avoiding people?" },
  { id: "sadness_5",  category: "sadness", negative: true, question: "How often did you feel hopeless?" },
  { id: "sadness_6",  category: "sadness", negative: true, question: "Did you feel disconnected from others?" },
  { id: "sadness_7",  category: "sadness", negative: true, question: "Did you lose interest in activities?" },
  { id: "sadness_8",  category: "sadness", negative: true, question: "How often did you feel like crying?" },
  { id: "sadness_9",  category: "sadness", negative: true, question: "Did you feel lonely today?" },
  { id: "sadness_10", category: "sadness", negative: true, question: "Did you feel empty inside?" },

  // ── ANGER & IRRITATION (10) ────────────────────────────────────────────────
  { id: "anger_1",  category: "anger", negative: true,  question: "Did you feel angry today?" },
  { id: "anger_2",  category: "anger", negative: true,  question: "How often did you feel irritated?" },
  { id: "anger_3",  category: "anger", negative: true,  question: "Did small things annoy you?" },
  { id: "anger_4",  category: "anger", negative: false, question: "How well did you control your anger?" },
  { id: "anger_5",  category: "anger", negative: true,  question: "Did you feel frustrated?" },
  { id: "anger_6",  category: "anger", negative: true,  question: "Did you react aggressively to situations?" },
  { id: "anger_7",  category: "anger", negative: true,  question: "Did you feel impatient today?" },
  { id: "anger_8",  category: "anger", negative: true,  question: "How often did you feel upset with others?" },
  { id: "anger_9",  category: "anger", negative: true,  question: "Did you feel like shouting or arguing?" },
  { id: "anger_10", category: "anger", negative: true,  question: "Did anger affect your mood?" },

  // ── SOCIAL & RELATIONSHIPS (10) ────────────────────────────────────────────
  { id: "social_1",  category: "social", negative: false, question: "How connected did you feel with others?" },
  { id: "social_2",  category: "social", negative: false, question: "Did you enjoy conversations today?" },
  { id: "social_3",  category: "social", negative: false, question: "Did you feel supported by people around you?" },
  { id: "social_4",  category: "social", negative: false, question: "How comfortable were you interacting socially?" },
  { id: "social_5",  category: "social", negative: true,  question: "Did you avoid social interactions?" },
  { id: "social_6",  category: "social", negative: false, question: "Did you feel valued by others?" },
  { id: "social_7",  category: "social", negative: false, question: "Did you feel understood by others?" },
  { id: "social_8",  category: "social", negative: false, question: "How often did you communicate with friends/family?" },
  { id: "social_9",  category: "social", negative: true,  question: "Did you feel isolated?" },
  { id: "social_10", category: "social", negative: false, question: "How satisfied are you with your relationships?" },

  // ── SELF-PERCEPTION (10) ───────────────────────────────────────────────────
  { id: "self_1",  category: "self", negative: false, question: "How confident did you feel today?" },
  { id: "self_2",  category: "self", negative: false, question: "Did you feel good about yourself?" },
  { id: "self_3",  category: "self", negative: false, question: "Did you feel capable of handling problems?" },
  { id: "self_4",  category: "self", negative: true,  question: "How often did you doubt yourself?" },
  { id: "self_5",  category: "self", negative: false, question: "Did you feel proud of your actions?" },
  { id: "self_6",  category: "self", negative: true,  question: "Did you feel like a failure?" },
  { id: "self_7",  category: "self", negative: false, question: "How motivated were you to improve yourself?" },
  { id: "self_8",  category: "self", negative: false, question: "Did you feel satisfied with your progress?" },
  { id: "self_9",  category: "self", negative: false, question: "How positive was your self-talk?" },
  { id: "self_10", category: "self", negative: true,  question: "Did you feel insecure?" },

  // ── FOCUS & PRODUCTIVITY (5) ───────────────────────────────────────────────
  { id: "focus_1", category: "focus", negative: false, question: "How well could you concentrate today?" },
  { id: "focus_2", category: "focus", negative: false, question: "Did you complete your tasks on time?" },
  { id: "focus_3", category: "focus", negative: true,  question: "Did distractions affect your work?" },
  { id: "focus_4", category: "focus", negative: false, question: "How organized were you today?" },
  { id: "focus_5", category: "focus", negative: false, question: "Did you feel mentally sharp?" },

  // ── LIFESTYLE & HABITS (5) ─────────────────────────────────────────────────
  { id: "lifestyle_1", category: "lifestyle", negative: false, question: "Did you exercise today?" },
  { id: "lifestyle_2", category: "lifestyle", negative: false, question: "How healthy was your diet today?" },
  { id: "lifestyle_3", category: "lifestyle", negative: false, question: "Did you take breaks when needed?" },
  { id: "lifestyle_4", category: "lifestyle", negative: false, question: "Did you spend time on hobbies?" },
  { id: "lifestyle_5", category: "lifestyle", negative: false, question: "How balanced was your day?" },
];
