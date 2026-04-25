import crypto from "crypto";

export type MlNormalized = {
  primaryEmotion?: string;
  secondaryEmotion?: string;
  confidence?: number;
  score?: number;
  emotionType?: string;
  raw?: Record<string, unknown>;
};

const DEFAULT_ML_API_URL =
  "https://atharva-mohite-ce-ai-mental-health-api.hf.space";

/** Ensure the URL ends with /predict */
function withPredict(base: string): string {
  const clean = base.replace(/\/$/, "");
  return clean.endsWith("/predict") ? clean : `${clean}/predict`;
}

/** SHA-256 hex digest of the input text (for caching / deduplication) */
export function hashInput(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Call the ML /predict endpoint and return normalised camelCase fields.
 * Throws on network error, non-2xx response, or 10-second timeout.
 */
export async function predictText(text: string): Promise<MlNormalized> {
  const base = process.env.ML_API_URL ?? DEFAULT_ML_API_URL;
  const endpoint = withPredict(base);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    // Always try to parse JSON even on error (API may return error details)
    const raw = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!response.ok) {
      throw new Error(`ML API ${response.status}: ${JSON.stringify(raw)}`);
    }

    return {
      primaryEmotion:
        typeof raw["Primary Emotion"] === "string"
          ? (raw["Primary Emotion"] as string)
          : undefined,
      secondaryEmotion:
        typeof raw["Secondary Emotion"] === "string"
          ? (raw["Secondary Emotion"] as string)
          : undefined,
      confidence:
        typeof raw["Confidence"] === "number"
          ? (raw["Confidence"] as number)
          : undefined,
      score:
        typeof raw["Score"] === "number" ? (raw["Score"] as number) : undefined,
      emotionType:
        typeof raw["Emotion Type"] === "string"
          ? (raw["Emotion Type"] as string)
          : undefined,
      raw,
    };
  } finally {
    clearTimeout(timer);
  }
}
