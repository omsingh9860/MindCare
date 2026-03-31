import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";
import { MoodAssessment } from "../models/MoodAssessment";
import { JournalEntry } from "../models/JournalEntry";
import { MeditationSession } from "../models/MeditationSession";
import { Achievement } from "../models/Achievement";
import { UserStreak } from "../models/UserStreak";
import { AnalyticsCache } from "../models/AnalyticsCache";

const MOOD_SCORE_MAP: Record<string, number> = {
  "Very Good": 9,
  Good: 7,
  Neutral: 5,
  "Not Good": 3,
  "Very Bad": 1,
  Excellent: 9,
  Fair: 5,
  Poor: 3,
  "Very Poor": 1,
  "Very Energetic": 9,
  Energetic: 7,
  Moderate: 5,
  "Low Energy": 3,
  Exhausted: 1,
  "Not at all": 9,
  "A little": 7,
  Moderately: 5,
  Very: 3,
  Extremely: 1,
};

function computeScore(answers: Record<string, string>): number | null {
  const values = Object.values(answers)
    .map((a) => MOOD_SCORE_MAP[a])
    .filter((n): n is number => typeof n === "number");

  if (values.length === 0) return null;
  const avg = values.reduce((s, n) => s + n, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

function getDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getCachedOrCompute<T>(
  userId: string,
  key: string,
  ttlMinutes: number,
  compute: () => Promise<T>
): Promise<T> {
  const oid = new mongoose.Types.ObjectId(userId);
  const existing = await AnalyticsCache.findOne({ userId: oid, cacheKey: key });
  if (existing && existing.expiresAt > new Date()) {
    return existing.data as T;
  }

  const data = await compute();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await AnalyticsCache.findOneAndUpdate(
    { userId: oid, cacheKey: key },
    { userId: oid, cacheKey: key, data: data as Record<string, unknown>, expiresAt },
    { upsert: true }
  );

  return data;
}

export async function getMoodTrends(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const periodParam = (req.query.period as string) || "30";
    const period = [7, 30, 90].includes(Number(periodParam)) ? Number(periodParam) : 30;

    const cacheKey = `mood-trends-${period}`;

    const data = await getCachedOrCompute(req.userId, cacheKey, 0, async () => {
      const oid = new mongoose.Types.ObjectId(req.userId!);
      const since = getDaysAgo(period);

      const moods = await MoodAssessment.find({
        userId: oid,
        createdAt: { $gte: since },
      })
        .sort({ createdAt: 1 })
        .select("answers notes createdAt");

      // Daily aggregated mood scores
      const dailyMap: Record<string, { scores: number[]; count: number }> = {};

      for (const m of moods) {
        const score = computeScore(m.answers as Record<string, string>);
        if (score === null) continue;

        const dateStr = new Date(m.createdAt).toISOString().slice(0, 10);
        if (!dailyMap[dateStr]) dailyMap[dateStr] = { scores: [], count: 0 };
        dailyMap[dateStr].scores.push(score);
        dailyMap[dateStr].count++;
      }

      const dailyTrends = Object.entries(dailyMap)
        .map(([date, val]) => ({
          date,
          avgScore: Math.round((val.scores.reduce((s, n) => s + n, 0) / val.scores.length) * 10) / 10,
          count: val.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Emotion frequency distribution
      const emotionFreq: Record<string, number> = {};
      for (const m of moods) {
        for (const answer of Object.values(m.answers as Record<string, string>)) {
          emotionFreq[answer] = (emotionFreq[answer] || 0) + 1;
        }
      }

      const emotionDistribution = Object.entries(emotionFreq)
        .map(([emotion, count]) => ({ emotion, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Weekly averages
      const weeklyMap: Record<string, { scores: number[]; count: number }> = {};
      for (const m of moods) {
        const score = computeScore(m.answers as Record<string, string>);
        if (score === null) continue;
        const d = new Date(m.createdAt);
        // ISO week key
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const weekKey = weekStart.toISOString().slice(0, 10);
        if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { scores: [], count: 0 };
        weeklyMap[weekKey].scores.push(score);
        weeklyMap[weekKey].count++;
      }

      const weeklyAverages = Object.entries(weeklyMap)
        .map(([week, val]) => ({
          week,
          avgScore: Math.round((val.scores.reduce((s, n) => s + n, 0) / val.scores.length) * 10) / 10,
          count: val.count,
        }))
        .sort((a, b) => a.week.localeCompare(b.week));

      return { dailyTrends, emotionDistribution, weeklyAverages, period };
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getTriggers(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const data = await getCachedOrCompute(req.userId, "triggers", 0, async () => {
      const oid = new mongoose.Types.ObjectId(req.userId!);
      const since = getDaysAgo(90);

      const moods = await MoodAssessment.find({
        userId: oid,
        createdAt: { $gte: since },
      })
        .sort({ createdAt: 1 })
        .select("answers createdAt");

      // Identify low-mood days and high-mood days
      const lowMoodThreshold = 4;
      const highMoodThreshold = 7;

      const lowMoodEmotions: Record<string, number> = {};
      const highMoodEmotions: Record<string, number> = {};

      for (const m of moods) {
        const score = computeScore(m.answers as Record<string, string>);
        if (score === null) continue;

        const answers = m.answers as Record<string, string>;
        if (score <= lowMoodThreshold) {
          for (const answer of Object.values(answers)) {
            lowMoodEmotions[answer] = (lowMoodEmotions[answer] || 0) + 1;
          }
        } else if (score >= highMoodThreshold) {
          for (const answer of Object.values(answers)) {
            highMoodEmotions[answer] = (highMoodEmotions[answer] || 0) + 1;
          }
        }
      }

      const triggers = Object.entries(lowMoodEmotions)
        .map(([emotion, count]) => ({
          emotion,
          count,
          type: "risk" as const,
          correlation: "associated with lower mood scores",
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const positiveFactors = Object.entries(highMoodEmotions)
        .map(([emotion, count]) => ({
          emotion,
          count,
          type: "positive" as const,
          correlation: "associated with higher mood scores",
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return { triggers, positiveFactors };
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getInsights(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const oid = new mongoose.Types.ObjectId(req.userId);
    const since30 = getDaysAgo(30);
    const since7 = getDaysAgo(7);

    const [moods7, moods30, meditationCount, journalCount, streaks, achievements] = await Promise.all([
      MoodAssessment.find({ userId: oid, createdAt: { $gte: since7 } }).select("answers createdAt"),
      MoodAssessment.find({ userId: oid, createdAt: { $gte: since30 } }).select("answers createdAt"),
      MeditationSession.countDocuments({ userId: oid, createdAt: { $gte: since30 } }),
      JournalEntry.countDocuments({ userId: oid, createdAt: { $gte: since30 } }),
      UserStreak.findOne({ userId: oid }),
      Achievement.countDocuments({ userId: oid }),
    ]);

    const scores7 = moods7
      .map((m) => computeScore(m.answers as Record<string, string>))
      .filter((s): s is number => s !== null);
    const scores30 = moods30
      .map((m) => computeScore(m.answers as Record<string, string>))
      .filter((s): s is number => s !== null);

    const avg7 = scores7.length > 0 ? scores7.reduce((a, b) => a + b, 0) / scores7.length : null;
    const avg30 = scores30.length > 0 ? scores30.reduce((a, b) => a + b, 0) / scores30.length : null;

    const insights: string[] = [];
    const recommendations: string[] = [];

    if (avg7 !== null && avg30 !== null) {
      if (avg7 > avg30 + 0.5) {
        insights.push("Your mood has been improving over the last week! 📈");
      } else if (avg7 < avg30 - 0.5) {
        insights.push("Your mood has dipped this week compared to your 30-day average.");
        recommendations.push("Consider increasing meditation frequency to help lift your mood.");
      }
    }

    if (meditationCount === 0) {
      recommendations.push("Try adding meditation sessions — even 5 minutes a day makes a difference.");
    } else if (meditationCount >= 10) {
      insights.push(`Great work! You've completed ${meditationCount} meditation sessions this month. 🧘`);
    }

    if (journalCount === 0) {
      recommendations.push("Journaling daily helps process emotions. Try writing just one entry!");
    } else if (journalCount >= 10) {
      insights.push(`You've written ${journalCount} journal entries this month — keep it up! ✍️`);
    }

    if (streaks) {
      const maxStreak = Math.max(streaks.meditationStreak, streaks.journalStreak, streaks.moodStreak);
      if (maxStreak >= 7) {
        insights.push(`You have a ${maxStreak}-day streak! Consistency is the key to mental wellness. 🔥`);
      }
    }

    if (achievements >= 5) {
      insights.push(`You've unlocked ${achievements} achievements — you're a wellness champion! 🏆`);
    }

    if (insights.length === 0) {
      insights.push("Start tracking your mood and meditation to unlock personalized insights.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Keep up your current wellness routine — you're doing great!");
    }

    return res.json({
      insights,
      recommendations,
      stats: {
        avg7DayMood: avg7 !== null ? Math.round(avg7 * 10) / 10 : null,
        avg30DayMood: avg30 !== null ? Math.round(avg30 * 10) / 10 : null,
        meditationSessionsThisMonth: meditationCount,
        journalEntriesThisMonth: journalCount,
        currentStreaks: {
          meditation: streaks?.meditationStreak ?? 0,
          journal: streaks?.journalStreak ?? 0,
          mood: streaks?.moodStreak ?? 0,
        },
        achievementsUnlocked: achievements,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getComparison(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const oid = new mongoose.Types.ObjectId(req.userId);

    const now = new Date();
    const currentPeriodStart = getDaysAgo(30);
    const previousPeriodStart = getDaysAgo(60);

    const [currentMoods, previousMoods, currentMeditation, previousMeditation, currentJournal, previousJournal] =
      await Promise.all([
        MoodAssessment.find({ userId: oid, createdAt: { $gte: currentPeriodStart } }).select("answers"),
        MoodAssessment.find({
          userId: oid,
          createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
        }).select("answers"),
        MeditationSession.countDocuments({ userId: oid, createdAt: { $gte: currentPeriodStart } }),
        MeditationSession.countDocuments({
          userId: oid,
          createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
        }),
        JournalEntry.countDocuments({ userId: oid, createdAt: { $gte: currentPeriodStart } }),
        JournalEntry.countDocuments({
          userId: oid,
          createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
        }),
      ]);

    const calcAvg = (moods: typeof currentMoods) => {
      const scores = moods
        .map((m) => computeScore(m.answers as Record<string, string>))
        .filter((s): s is number => s !== null);
      if (scores.length === 0) return null;
      return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    };

    const currentAvgMood = calcAvg(currentMoods);
    const previousAvgMood = calcAvg(previousMoods);

    return res.json({
      current: {
        period: "Last 30 days",
        avgMoodScore: currentAvgMood,
        meditationSessions: currentMeditation,
        journalEntries: currentJournal,
        checkIns: currentMoods.length,
      },
      previous: {
        period: "30-60 days ago",
        avgMoodScore: previousAvgMood,
        meditationSessions: previousMeditation,
        journalEntries: previousJournal,
        checkIns: previousMoods.length,
      },
      changes: {
        moodChange:
          currentAvgMood !== null && previousAvgMood !== null
            ? Math.round((currentAvgMood - previousAvgMood) * 10) / 10
            : null,
        meditationChange: currentMeditation - previousMeditation,
        journalChange: currentJournal - previousJournal,
        checkInChange: currentMoods.length - previousMoods.length,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function exportReport(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const oid = new mongoose.Types.ObjectId(req.userId);
    const since = getDaysAgo(30);

    const [moods, sessions, entries, achievements, streaks] = await Promise.all([
      MoodAssessment.find({ userId: oid, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .select("answers notes createdAt"),
      MeditationSession.find({ userId: oid, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .select("title minutes createdAt"),
      JournalEntry.find({ userId: oid, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .select("title createdAt"),
      Achievement.find({ userId: oid }).sort({ unlockedAt: -1 }).select("badge points unlockedAt"),
      UserStreak.findOne({ userId: oid }),
    ]);

    const moodScores = moods
      .map((m) => ({ score: computeScore(m.answers as Record<string, string>), date: m.createdAt }))
      .filter((x): x is { score: number; date: Date } => x.score !== null);

    const avgMood =
      moodScores.length > 0
        ? Math.round((moodScores.reduce((s, x) => s + x.score, 0) / moodScores.length) * 10) / 10
        : null;

    const totalMeditationMinutes = sessions.reduce((s, x) => s + (x.minutes || 0), 0);

    // Return JSON report (clients can use this to generate their own PDF or display)
    return res.json({
      generatedAt: new Date().toISOString(),
      reportPeriod: "Last 30 days",
      moodSummary: {
        totalCheckIns: moods.length,
        avgScore: avgMood,
        trend: moodScores.map((x) => ({
          date: x.date.toISOString().slice(0, 10),
          score: x.score,
        })),
      },
      meditationSummary: {
        totalSessions: sessions.length,
        totalMinutes: totalMeditationMinutes,
        totalHours: Math.round((totalMeditationMinutes / 60) * 10) / 10,
        recentSessions: sessions.slice(0, 5).map((s) => ({
          title: s.title,
          minutes: s.minutes,
          date: s.createdAt,
        })),
      },
      journalSummary: {
        totalEntries: entries.length,
        recentEntries: entries.slice(0, 5).map((e) => ({
          title: e.title,
          date: e.createdAt,
        })),
      },
      achievements: {
        unlocked: achievements.map((a) => ({
          badge: a.badge,
          points: a.points,
          unlockedAt: a.unlockedAt,
        })),
        totalPoints: achievements.reduce((s, a) => s + a.points, 0),
      },
      streaks: {
        meditation: { current: streaks?.meditationStreak ?? 0, best: streaks?.meditationBestStreak ?? 0 },
        journal: { current: streaks?.journalStreak ?? 0, best: streaks?.journalBestStreak ?? 0 },
        mood: { current: streaks?.moodStreak ?? 0, best: streaks?.moodBestStreak ?? 0 },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
