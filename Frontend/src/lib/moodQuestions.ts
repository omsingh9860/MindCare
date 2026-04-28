export type MoodCategory =
  | "MOOD"
  | "SLEEP"
  | "ENERGY"
  | "STRESS"
  | "SADNESS"
  | "ANGER"
  | "SOCIAL"
  | "SELF"
  | "FOCUS"
  | "LIFESTYLE";

export type MoodQuestion = {
  id: string;
  category: MoodCategory;
  question: string;
  negative: boolean; // higher option means worse -> inverted in scoring
};

export type LikertOption = {
  label: string;
  value: 1 | 2 | 3 | 4 | 5;
};

export const LIKERT_5: LikertOption[] = [
  { label: "Not at all", value: 1 },
  { label: "A little", value: 2 },
  { label: "Moderately", value: 3 },
  { label: "Quite a bit", value: 4 },
  { label: "Extremely", value: 5 },
];

export const QUESTION_BANK: MoodQuestion[] = [
  // MOOD (15)
  { id: "mood_01", category: "MOOD", question: "How would you describe your overall mood today?", negative: false },
  { id: "mood_02", category: "MOOD", question: "How positive do you feel right now?", negative: false },
  { id: "mood_03", category: "MOOD", question: "How often did you feel happy today?", negative: false },
  { id: "mood_04", category: "MOOD", question: "Did you feel emotionally stable today?", negative: false },
  { id: "mood_05", category: "MOOD", question: "How satisfied are you with your day?", negative: false },
  { id: "mood_06", category: "MOOD", question: "How often did you smile today?", negative: false },
  { id: "mood_07", category: "MOOD", question: "How hopeful do you feel about things?", negative: false },
  { id: "mood_08", category: "MOOD", question: "Did you feel calm throughout the day?", negative: false },
  { id: "mood_09", category: "MOOD", question: "How often did you feel overwhelmed?", negative: true },
  { id: "mood_10", category: "MOOD", question: "How would you rate your emotional balance?", negative: false },
  { id: "mood_11", category: "MOOD", question: "Did you feel content today?", negative: false },
  { id: "mood_12", category: "MOOD", question: "How frequently did your mood change today?", negative: true },
  { id: "mood_13", category: "MOOD", question: "How peaceful do you feel right now?", negative: false },
  { id: "mood_14", category: "MOOD", question: "Did you feel emotionally strong today?", negative: false },
  { id: "mood_15", category: "MOOD", question: "How would you rate your overall mental state?", negative: false },

  // SLEEP (10)
  { id: "sleep_01", category: "SLEEP", question: "How well did you sleep last night?", negative: false },
  { id: "sleep_02", category: "SLEEP", question: "Did you wake up feeling refreshed?", negative: false },
  { id: "sleep_03", category: "SLEEP", question: "How many hours did you sleep?", negative: false },
  { id: "sleep_04", category: "SLEEP", question: "Did you experience disturbed sleep?", negative: true },
  { id: "sleep_05", category: "SLEEP", question: "How easy was it for you to fall asleep?", negative: false },
  { id: "sleep_06", category: "SLEEP", question: "Did you wake up multiple times during the night?", negative: true },
  { id: "sleep_07", category: "SLEEP", question: "How energetic did you feel after waking up?", negative: false },
  { id: "sleep_08", category: "SLEEP", question: "Did you feel tired during the day?", negative: true },
  { id: "sleep_09", category: "SLEEP", question: "How consistent is your sleep schedule?", negative: false },
  { id: "sleep_10", category: "SLEEP", question: "Did you have trouble sleeping due to stress?", negative: true },

  // ENERGY (10)
  { id: "energy_01", category: "ENERGY", question: "How energetic do you feel right now?", negative: false },
  { id: "energy_02", category: "ENERGY", question: "Did you feel motivated to work today?", negative: false },
  { id: "energy_03", category: "ENERGY", question: "How active were you physically today?", negative: false },
  { id: "energy_04", category: "ENERGY", question: "Did you feel exhausted during the day?", negative: true },
  { id: "energy_05", category: "ENERGY", question: "How productive were you today?", negative: false },
  { id: "energy_06", category: "ENERGY", question: "Did you feel mentally tired?", negative: true },
  { id: "energy_07", category: "ENERGY", question: "How focused were you today?", negative: false },
  { id: "energy_08", category: "ENERGY", question: "Did you feel lazy or unmotivated?", negative: true },
  { id: "energy_09", category: "ENERGY", question: "How alert did you feel throughout the day?", negative: false },
  { id: "energy_10", category: "ENERGY", question: "How much effort did daily tasks require?", negative: true },

  // STRESS (15)
  { id: "stress_01", category: "STRESS", question: "How stressed are you feeling right now?", negative: true },
  { id: "stress_02", category: "STRESS", question: "Did you feel anxious today?", negative: true },
  { id: "stress_03", category: "STRESS", question: "How often did you feel worried?", negative: true },
  { id: "stress_04", category: "STRESS", question: "Did you experience panic or fear?", negative: true },
  { id: "stress_05", category: "STRESS", question: "How well did you handle stress today?", negative: false },
  { id: "stress_06", category: "STRESS", question: "Did you feel under pressure?", negative: true },
  { id: "stress_07", category: "STRESS", question: "How often did you overthink things?", negative: true },
  { id: "stress_08", category: "STRESS", question: "Did small things irritate you?", negative: true },
  { id: "stress_09", category: "STRESS", question: "How tense did you feel today?", negative: true },
  { id: "stress_10", category: "STRESS", question: "Did you feel mentally overloaded?", negative: true },
  { id: "stress_11", category: "STRESS", question: "How often did you feel nervous?", negative: true },
  { id: "stress_12", category: "STRESS", question: "Did you feel out of control?", negative: true },
  { id: "stress_13", category: "STRESS", question: "How often did you feel restless?", negative: true },
  { id: "stress_14", category: "STRESS", question: "Did stress affect your performance today?", negative: true },
  { id: "stress_15", category: "STRESS", question: "How difficult was it to relax?", negative: true },

  // SADNESS (10)
  { id: "sad_01", category: "SADNESS", question: "Did you feel sad today?", negative: true },
  { id: "sad_02", category: "SADNESS", question: "How often did you feel low or down?", negative: true },
  { id: "sad_03", category: "SADNESS", question: "Did you feel emotionally drained?", negative: true },
  { id: "sad_04", category: "SADNESS", question: "Did you feel like avoiding people?", negative: true },
  { id: "sad_05", category: "SADNESS", question: "How often did you feel hopeless?", negative: true },
  { id: "sad_06", category: "SADNESS", question: "Did you feel disconnected from others?", negative: true },
  { id: "sad_07", category: "SADNESS", question: "Did you lose interest in activities?", negative: true },
  { id: "sad_08", category: "SADNESS", question: "How often did you feel like crying?", negative: true },
  { id: "sad_09", category: "SADNESS", question: "Did you feel lonely today?", negative: true },
  { id: "sad_10", category: "SADNESS", question: "Did you feel empty inside?", negative: true },

  // ANGER (10)
  { id: "anger_01", category: "ANGER", question: "Did you feel angry today?", negative: true },
  { id: "anger_02", category: "ANGER", question: "How often did you feel irritated?", negative: true },
  { id: "anger_03", category: "ANGER", question: "Did small things annoy you?", negative: true },
  { id: "anger_04", category: "ANGER", question: "How well did you control your anger?", negative: false },
  { id: "anger_05", category: "ANGER", question: "Did you feel frustrated?", negative: true },
  { id: "anger_06", category: "ANGER", question: "Did you react aggressively to situations?", negative: true },
  { id: "anger_07", category: "ANGER", question: "Did you feel impatient today?", negative: true },
  { id: "anger_08", category: "ANGER", question: "How often did you feel upset with others?", negative: true },
  { id: "anger_09", category: "ANGER", question: "Did you feel like shouting or arguing?", negative: true },
  { id: "anger_10", category: "ANGER", question: "Did anger affect your mood?", negative: true },

  // SOCIAL (10)
  { id: "social_01", category: "SOCIAL", question: "How connected did you feel with others?", negative: false },
  { id: "social_02", category: "SOCIAL", question: "Did you enjoy conversations today?", negative: false },
  { id: "social_03", category: "SOCIAL", question: "Did you feel supported by people around you?", negative: false },
  { id: "social_04", category: "SOCIAL", question: "How comfortable were you interacting socially?", negative: false },
  { id: "social_05", category: "SOCIAL", question: "Did you avoid social interactions?", negative: true },
  { id: "social_06", category: "SOCIAL", question: "Did you feel valued by others?", negative: false },
  { id: "social_07", category: "SOCIAL", question: "Did you feel understood by others?", negative: false },
  { id: "social_08", category: "SOCIAL", question: "How often did you communicate with friends/family?", negative: false },
  { id: "social_09", category: "SOCIAL", question: "Did you feel isolated?", negative: true },
  { id: "social_10", category: "SOCIAL", question: "How satisfied are you with your relationships?", negative: false },

  // SELF (10)
  { id: "self_01", category: "SELF", question: "How confident did you feel today?", negative: false },
  { id: "self_02", category: "SELF", question: "Did you feel good about yourself?", negative: false },
  { id: "self_03", category: "SELF", question: "Did you feel capable of handling problems?", negative: false },
  { id: "self_04", category: "SELF", question: "How often did you doubt yourself?", negative: true },
  { id: "self_05", category: "SELF", question: "Did you feel proud of your actions?", negative: false },
  { id: "self_06", category: "SELF", question: "Did you feel like a failure?", negative: true },
  { id: "self_07", category: "SELF", question: "How motivated were you to improve yourself?", negative: false },
  { id: "self_08", category: "SELF", question: "Did you feel satisfied with your progress?", negative: false },
  { id: "self_09", category: "SELF", question: "How positive was your self-talk?", negative: false },
  { id: "self_10", category: "SELF", question: "Did you feel insecure?", negative: true },

  // FOCUS (5)
  { id: "focus_01", category: "FOCUS", question: "How well could you concentrate today?", negative: false },
  { id: "focus_02", category: "FOCUS", question: "Did you complete your tasks on time?", negative: false },
  { id: "focus_03", category: "FOCUS", question: "Did distractions affect your work?", negative: true },
  { id: "focus_04", category: "FOCUS", question: "How organized were you today?", negative: false },
  { id: "focus_05", category: "FOCUS", question: "Did you feel mentally sharp?", negative: false },

  // LIFESTYLE (5)
  { id: "life_01", category: "LIFESTYLE", question: "Did you exercise today?", negative: false },
  { id: "life_02", category: "LIFESTYLE", question: "How healthy was your diet today?", negative: false },
  { id: "life_03", category: "LIFESTYLE", question: "Did you take breaks when needed?", negative: false },
  { id: "life_04", category: "LIFESTYLE", question: "Did you spend time on hobbies?", negative: false },
  { id: "life_05", category: "LIFESTYLE", question: "How balanced was your day?", negative: false },
];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** pick N in [min,max] with light category variety */
export function pickRandomQuestions(min = 5, max = 10): MoodQuestion[] {
  const target = Math.floor(Math.random() * (max - min + 1)) + min;

  const byCat = QUESTION_BANK.reduce<Record<string, MoodQuestion[]>>((acc, q) => {
    (acc[q.category] ||= []).push(q);
    return acc;
  }, {});

  const cats = shuffle(Object.keys(byCat));
  const picked: MoodQuestion[] = [];
  const used = new Set<string>();

  // one per category first
  for (const c of cats) {
    if (picked.length >= target) break;
    const q = shuffle(byCat[c]).find((x) => !used.has(x.id));
    if (!q) continue;
    picked.push(q);
    used.add(q.id);
  }

  // fill remainder
  if (picked.length < target) {
    const rest = shuffle(QUESTION_BANK.filter((q) => !used.has(q.id)));
    picked.push(...rest.slice(0, target - picked.length));
  }

  return picked;
}

/** 1..5 score where higher always means better wellbeing */
export function normalizedScore(value: number, negative: boolean) {
  const v = Math.max(1, Math.min(5, value));
  return negative ? 6 - v : v;
}