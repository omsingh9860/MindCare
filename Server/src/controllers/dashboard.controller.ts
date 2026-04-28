import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { MoodAssessment } from "../models/MoodAssessment.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { MeditationSession } from "../models/MeditationSession.js";

const MOOD_SCORE_MAP: Record<string, number> = {
  "Very Good": 9,
  "Good": 7,
  "Neutral": 5,
  "Not Good": 3,
  "Very Bad": 1,

  "Excellent": 9,
  "Fair": 5,
  "Poor": 3,
  "Very Poor": 1,

  "Very Energetic": 9,
  "Energetic": 7,
  "Moderate": 5,
  "Low Energy": 3,
  "Exhausted": 1,

  "Not at all": 9,
  "A little": 7,
  "Moderately": 5,
  "Very": 3,
  "Extremely": 1,
};

function computeScore(answers: Record<string, string>) {
  const values = Object.values(answers)
    .map((a) => MOOD_SCORE_MAP[a])
    .filter((n): n is number => typeof n === "number");

  if (values.length === 0) return null;
  const avg = values.reduce((s, n) => s + n, 0) / values.length;
  return Math.round(avg * 10) / 10; // 1-9 range
}

/**
 * Normalize mood test score from 1-9 range to 0-10 range
 * Input: 1-9 (from MOOD_SCORE_MAP)
 * Output: 0-10 where 0 = worst wellbeing, 10 = best wellbeing
 */
function normalizeMoodTestScore(score: number | null): number | null {
  if (score === null || score === undefined) return null;
  // Map [1, 9] → [0, 10]
  return Math.round(((score - 1) / 8) * 10 * 10) / 10;
}

/**
 * Normalize journal ML score to 0-10 range
 */
function normalizeJournalScore(
  score: number | undefined,
  emotionType: string | undefined
): number | null {
  if (score === undefined || score === null) return null;

  // If ML returns signed range -3..+3, normalize directly
  if (score >= -3 && score <= 3) {
    return Math.round(((score + 3) / 6) * 10 * 10) / 10; // 0.0 to 10.0
  }

  let normalized = score > 1 ? score / 100 : score;
  normalized = Math.max(0, Math.min(1, normalized));

  if (emotionType === "negative") {
    normalized = 1 - normalized;
  }

  return Math.round(normalized * 10 * 10) / 10; // 0.0 to 10.0
}

/**
 * Combine mood test and journal scores using weighted formula
 * Both inputs should be in 0-10 range
 */
function computeCombinedScore(
  mtScore: number | null,
  journalScore: number | null,
  journalCount: number
): number | null {
  const wMT = mtScore !== null ? 1.0 : 0;
  const wJ = Math.min(1.0, journalCount / 2);

  if (wMT === 0 && wJ === 0) return null;

  const numerator = wMT * (mtScore ?? 0) + wJ * (journalScore ?? 0);
  const denominator = wMT + wJ;

  return Math.round((numerator / denominator) * 10) / 10;
}

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    // Get date range (last 14 days)
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch mood tests and journal entries
    const [moods, journals] = await Promise.all([
      MoodAssessment.find({
        userId: req.userId,
        createdAt: { $gte: fourteenDaysAgo },
      })
        .sort({ createdAt: -1 })
        .select("answers createdAt"),
      JournalEntry.find({
        userId: req.userId,
        createdAt: { $gte: fourteenDaysAgo },
        "ml.status": "completed",
      })
        .sort({ createdAt: -1 })
        .select("ml createdAt"),
    ]);

    // Build daily aggregates
    const dailyMap: Record<
      string,
      { mtScores: number[]; jScores: number[]; jCount: number }
    > = {};

    // Aggregate mood test scores by date
    for (const mood of moods) {
      const moodScore = computeScore(mood.answers as Record<string, string>);
      if (moodScore === null) continue;

      const dateStr = new Date(mood.createdAt).toISOString().slice(0, 10);
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { mtScores: [], jScores: [], jCount: 0 };
      }
      dailyMap[dateStr].mtScores.push(moodScore);
    }

    // Aggregate journal scores by date
    for (const journal of journals) {
      const ml = journal.ml as {
        score?: number;
        emotionType?: string;
      } | undefined;
      const jScore = normalizeJournalScore(ml?.score, ml?.emotionType);

      const dateStr = new Date(journal.createdAt).toISOString().slice(0, 10);
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { mtScores: [], jScores: [], jCount: 0 };
      }
      dailyMap[dateStr].jCount++;
      if (jScore !== null) {
        dailyMap[dateStr].jScores.push(jScore);
      }
    }

    // Compute combined scores per day and build series
    const moodSeries = Object.entries(dailyMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => {
        // Average mood test scores for the day
        const mtAvg =
          data.mtScores.length > 0
            ? Math.round(
                (data.mtScores.reduce((s, n) => s + n, 0) / data.mtScores.length) * 10
              ) / 10
            : null;

        // Normalize mood test to 0-10
        const mtScore = mtAvg !== null ? normalizeMoodTestScore(mtAvg) : null;

        // Average journal scores for the day
        const jAvg =
          data.jScores.length > 0
            ? Math.round(
                (data.jScores.reduce((s, n) => s + n, 0) / data.jScores.length) * 10
              ) / 10
            : null;

        // Compute combined score
        const combinedScore = computeCombinedScore(mtScore, jAvg, data.jCount);

        return {
          date: new Date(date),
          score: combinedScore ?? 0, // Use combined score, fallback to 0
          mtScore,
          jScore: jAvg,
          combinedScore,
        };
      });

    const latestMoodScore =
      moodSeries.length > 0 ? moodSeries[moodSeries.length - 1].score : null;

    // Journal count (this month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const journalThisMonth = await JournalEntry.countDocuments({
      userId: req.userId,
      createdAt: { $gte: monthStart },
    });

    // Meditation (this week)
    const day = (now.getDay() + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);

    const meditationSessions = await MeditationSession.find({
      userId: req.userId,
      createdAt: { $gte: weekStart },
    }).select("minutes");

    const meditationMinutesThisWeek = meditationSessions.reduce(
      (sum, s) => sum + (s.minutes || 0),
      0
    );

    const meditationHoursThisWeek = Math.round(
      (meditationMinutesThisWeek / 60) * 10
    ) / 10;

    return res.json({
      latestMoodScore,
      moodSeries: moodSeries.map((x) => ({
        date: x.date.toISOString(),
        score: x.score,
        mtScore: x.mtScore,
        jScore: x.jScore,
        combinedScore: x.combinedScore,
      })),
      journalThisMonth,
      meditationHoursThisWeek,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
