import mongoose from "mongoose";
import { Achievement, BADGE_CATALOG, type BadgeType } from "../models/Achievement.js";
import { UserStreak } from "../models/UserStreak.js";
import { Leaderboard } from "../models/Leaderboard.js";
import { MeditationSession } from "../models/MeditationSession.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { MoodAssessment } from "../models/MoodAssessment.js";

/**
 * Generate a fun anonymized alias from a userId for privacy-first leaderboard
 */
function generateAlias(userId: string): string {
  const animals = ["Panda", "Owl", "Fox", "Deer", "Otter", "Eagle", "Wolf", "Bear", "Lynx", "Hawk"];
  const adjectives = ["Calm", "Brave", "Wise", "Kind", "Swift", "Zen", "Bright", "Serene", "Bold", "Gentle"];
  const idx = parseInt(userId.slice(-4), 16);
  const animal = animals[idx % animals.length];
  const adj = adjectives[Math.floor(idx / animals.length) % adjectives.length];
  return `${adj} ${animal}`;
}

/**
 * Update or create a leaderboard entry for a user
 */
async function upsertLeaderboard(userId: string): Promise<void> {
  const oid = new mongoose.Types.ObjectId(userId);

  // Count sessions and entries for points
  const [meditationCount, journalCount, moodCount] = await Promise.all([
    MeditationSession.countDocuments({ userId: oid }),
    JournalEntry.countDocuments({ userId: oid }),
    MoodAssessment.countDocuments({ userId: oid }),
  ]);

  const achievementDocs = await Achievement.find({ userId: oid });
  const achievementPoints = achievementDocs.reduce((sum, a) => sum + a.points, 0);

  const meditationPoints = meditationCount * 5;
  const journalPoints = journalCount * 10;
  const moodPoints = moodCount * 20;
  const totalPoints = meditationPoints + journalPoints + moodPoints + achievementPoints;

  const existing = await Leaderboard.findOne({ userId: oid });
  const displayName = existing?.displayName || generateAlias(userId);

  await Leaderboard.findOneAndUpdate(
    { userId: oid },
    {
      userId: oid,
      totalPoints,
      meditationPoints,
      journalPoints,
      moodPoints,
      achievementPoints,
      displayName,
    },
    { upsert: true, new: true }
  );
}

/**
 * Unlock a badge for the user if not already unlocked.
 * Returns true if newly unlocked.
 */
async function unlockBadge(userId: string, badge: BadgeType): Promise<boolean> {
  const oid = new mongoose.Types.ObjectId(userId);
  const catalog = BADGE_CATALOG[badge];
  if (!catalog) return false;

  const existing = await Achievement.findOne({ userId: oid, badge });
  if (existing) return false;

  await Achievement.create({
    userId: oid,
    badge,
    unlockedAt: new Date(),
    points: catalog.points,
  });

  return true;
}

/**
 * Check if all non-wellness-warrior badges are unlocked and if so, unlock the wellness warrior badge
 */
async function checkWellnessWarrior(userId: string): Promise<void> {
  const oid = new mongoose.Types.ObjectId(userId);
  const allBadges: BadgeType[] = [
    "meditation_10",
    "meditation_50",
    "meditation_100",
    "journal_5",
    "journal_15",
    "journal_30",
    "checkin_7_streak",
    "checkin_30_streak",
  ];

  const unlocked = await Achievement.find({ userId: oid, badge: { $in: allBadges } });
  if (unlocked.length === allBadges.length) {
    await unlockBadge(userId, "wellness_warrior");
  }
}

/**
 * Update a streak counter (meditation/journal/mood) given today's activity.
 * Returns the new streak value.
 */
async function updateStreak(
  userId: string,
  type: "meditation" | "journal" | "mood"
): Promise<number> {
  const oid = new mongoose.Types.ObjectId(userId);
  let doc = await UserStreak.findOne({ userId: oid });
  if (!doc) {
    doc = await UserStreak.create({ userId: oid });
  }

  const lastDateField = `${type}LastDate` as keyof typeof doc;
  const streakField = `${type}Streak` as keyof typeof doc;
  const bestStreakField = `${type}BestStreak` as keyof typeof doc;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = doc[lastDateField] as Date | null;

  let currentStreak = doc[streakField] as number;

  if (lastDate) {
    const last = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffMs = today.getTime() - last.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already logged today — no change
      return currentStreak;
    } else if (diffDays === 1) {
      // Consecutive day
      currentStreak += 1;
    } else {
      // Streak broken
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  const bestStreak = doc[bestStreakField] as number;
  const newBest = Math.max(bestStreak, currentStreak);

  await UserStreak.findOneAndUpdate(
    { userId: oid },
    {
      [streakField]: currentStreak,
      [bestStreakField]: newBest,
      [lastDateField]: today,
    }
  );

  return currentStreak;
}

/**
 * Process achievements after a meditation session is logged.
 */
export async function processMeditationAchievements(userId: string): Promise<BadgeType[]> {
  const oid = new mongoose.Types.ObjectId(userId);
  const unlocked: BadgeType[] = [];

  const count = await MeditationSession.countDocuments({ userId: oid });

  const meditationBadges: [number, BadgeType][] = [
    [10, "meditation_10"],
    [50, "meditation_50"],
    [100, "meditation_100"],
  ];

  for (const [threshold, badge] of meditationBadges) {
    if (count >= threshold) {
      const isNew = await unlockBadge(userId, badge);
      if (isNew) unlocked.push(badge);
    }
  }

  await updateStreak(userId, "meditation");
  await checkWellnessWarrior(userId);
  await upsertLeaderboard(userId);

  return unlocked;
}

/**
 * Process achievements after a journal entry is created.
 */
export async function processJournalAchievements(userId: string): Promise<BadgeType[]> {
  const oid = new mongoose.Types.ObjectId(userId);
  const unlocked: BadgeType[] = [];

  const count = await JournalEntry.countDocuments({ userId: oid });

  const journalBadges: [number, BadgeType][] = [
    [5, "journal_5"],
    [15, "journal_15"],
    [30, "journal_30"],
  ];

  for (const [threshold, badge] of journalBadges) {
    if (count >= threshold) {
      const isNew = await unlockBadge(userId, badge);
      if (isNew) unlocked.push(badge);
    }
  }

  await updateStreak(userId, "journal");
  await checkWellnessWarrior(userId);
  await upsertLeaderboard(userId);

  return unlocked;
}

/**
 * Process achievements after a mood check-in.
 */
export async function processMoodAchievements(userId: string): Promise<BadgeType[]> {
  const unlocked: BadgeType[] = [];

  const moodStreak = await updateStreak(userId, "mood");

  const streakBadges: [number, BadgeType][] = [
    [7, "checkin_7_streak"],
    [30, "checkin_30_streak"],
  ];

  for (const [threshold, badge] of streakBadges) {
    if (moodStreak >= threshold) {
      const isNew = await unlockBadge(userId, badge);
      if (isNew) unlocked.push(badge);
    }
  }

  await checkWellnessWarrior(userId);
  await upsertLeaderboard(userId);

  return unlocked;
}

export { upsertLeaderboard, generateAlias };
