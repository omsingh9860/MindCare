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

const ML_TIMEOUT_MS = 10_000;

/** The model version tag stored alongside every prediction */
export const ML_MODEL_VERSION = "hf-space-v1";

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
 * Throws on network error, non-2xx response, or timeout.
 */
export async function predictText(text: string): Promise<MlNormalized> {
  const base = process.env.ML_API_URL ?? DEFAULT_ML_API_URL;
  const endpoint = withPredict(base);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

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
          ? raw["Primary Emotion"]
          : undefined,
      secondaryEmotion:
        typeof raw["Secondary Emotion"] === "string"
          ? raw["Secondary Emotion"]
          : undefined,
      confidence:
        typeof raw["Confidence"] === "number" ? raw["Confidence"] : undefined,
      score:
        typeof raw["Score"] === "number" ? raw["Score"] : undefined,
      emotionType:
        typeof raw["Emotion Type"] === "string"
          ? raw["Emotion Type"]
          : undefined,
      raw,
    };
  } finally {
    clearTimeout(timer);
  }
}
