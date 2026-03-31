import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";
import { Achievement, BADGE_CATALOG, type BadgeType } from "../models/Achievement";
import { UserStreak } from "../models/UserStreak";

export async function getUserAchievements(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const oid = new mongoose.Types.ObjectId(req.userId);

    const unlocked = await Achievement.find({ userId: oid }).sort({ unlockedAt: -1 });
    const unlockedBadges = new Set(unlocked.map((a) => a.badge as string));

    const allBadges = Object.entries(BADGE_CATALOG).map(([badge, info]) => ({
      badge,
      ...info,
      unlocked: unlockedBadges.has(badge),
      unlockedAt: unlocked.find((a) => a.badge === badge)?.unlockedAt ?? null,
    }));

    const totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0);

    return res.json({
      achievements: allBadges,
      totalPoints,
      unlockedCount: unlocked.length,
      totalBadges: allBadges.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getBadgesCatalog(_req: AuthRequest, res: Response) {
  try {
    const catalog = Object.entries(BADGE_CATALOG).map(([badge, info]) => ({
      badge,
      ...info,
    }));
    return res.json({ badges: catalog });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function unlockAchievement(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { badge } = req.body as { badge?: string };

    if (!badge || !(badge in BADGE_CATALOG)) {
      return res.status(400).json({ message: "Invalid badge type" });
    }

    const oid = new mongoose.Types.ObjectId(req.userId);
    const existing = await Achievement.findOne({ userId: oid, badge });
    if (existing) {
      return res.status(409).json({ message: "Badge already unlocked" });
    }

    const catalog = BADGE_CATALOG[badge as BadgeType];
    const doc = await Achievement.create({
      userId: oid,
      badge,
      unlockedAt: new Date(),
      points: catalog.points,
    });

    return res.status(201).json({
      message: "Achievement unlocked",
      achievement: {
        badge: doc.badge,
        points: doc.points,
        unlockedAt: doc.unlockedAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCurrentStreaks(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const oid = new mongoose.Types.ObjectId(req.userId);
    const streaks = await UserStreak.findOne({ userId: oid });

    if (!streaks) {
      return res.json({
        meditation: { current: 0, best: 0, lastDate: null },
        journal: { current: 0, best: 0, lastDate: null },
        mood: { current: 0, best: 0, lastDate: null },
      });
    }

    return res.json({
      meditation: {
        current: streaks.meditationStreak,
        best: streaks.meditationBestStreak,
        lastDate: streaks.meditationLastDate,
      },
      journal: {
        current: streaks.journalStreak,
        best: streaks.journalBestStreak,
        lastDate: streaks.journalLastDate,
      },
      mood: {
        current: streaks.moodStreak,
        best: streaks.moodBestStreak,
        lastDate: streaks.moodLastDate,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
