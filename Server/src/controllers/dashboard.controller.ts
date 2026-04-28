import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { MoodAssessment } from "../models/MoodAssessment.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { MeditationSession } from "../models/MeditationSession.js";
import { normalizeJournalScore, computeCombinedScore } from "./analytics.controller.js";



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
  return Math.round(avg * 10) / 10; // 1 decimal like 8.2
}

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    // last 14 mood assessments
    const moods = await MoodAssessment.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(14)
      .select("answers createdAt");

    const moodSeries = moods
      .map((m) => ({
        date: m.createdAt,
        score: computeScore(m.answers as Record<string, string>),
      }))
      .filter((x) => x.score !== null)
      .reverse(); // oldest → newest for chart

    const latestMoodScore =
      moodSeries.length > 0 ? moodSeries[moodSeries.length - 1].score : null;

    // journal count (this month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const journalThisMonth = await JournalEntry.countDocuments({
      userId: req.userId,
      createdAt: { $gte: monthStart },
    });
    const now2 = new Date();
const day2 = (now2.getDay() + 6) % 7;
const weekStart2 = new Date(now2);
weekStart2.setDate(now2.getDate() - day2);
weekStart2.setHours(0, 0, 0, 0);

const meditationSessions = await MeditationSession.find({
  userId: req.userId,
  createdAt: { $gte: weekStart2 },
}).select("minutes");

const meditationMinutesThisWeek = meditationSessions.reduce(
  (sum, s) => sum + (s.minutes || 0),
  0
);

const meditationHoursThisWeek = Math.round((meditationMinutesThisWeek / 60) * 10) / 10;

    return res.json({
      latestMoodScore,
      moodSeries: moodSeries.map((x) => ({
        date: x.date.toISOString(),
        score: x.score,
      })),
      journalThisMonth,
      meditationHoursThisWeek,
    });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}