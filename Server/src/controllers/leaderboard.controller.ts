import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import mongoose from "mongoose";
import { Leaderboard } from "../models/Leaderboard";
import { generateAlias } from "../services/achievementService";

export async function getLeaderboard(_req: AuthRequest, res: Response) {
  try {
    // Return top 10 public entries (anonymized)
    const top10 = await Leaderboard.find({ isPublic: true })
      .sort({ totalPoints: -1 })
      .limit(10)
      .select("displayName totalPoints meditationPoints journalPoints moodPoints achievementPoints");

    return res.json({
      leaderboard: top10.map((entry, index) => ({
        rank: index + 1,
        displayName: entry.displayName,
        totalPoints: entry.totalPoints,
        breakdown: {
          meditation: entry.meditationPoints,
          journal: entry.journalPoints,
          mood: entry.moodPoints,
          achievements: entry.achievementPoints,
        },
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getUserLeaderboardStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const oid = new mongoose.Types.ObjectId(req.userId);
    const entry = await Leaderboard.findOne({ userId: oid });

    if (!entry) {
      return res.json({
        isPublic: false,
        totalPoints: 0,
        rank: null,
        displayName: generateAlias(req.userId),
      });
    }

    // Calculate rank among public entries if the user is public
    let rank: number | null = null;
    if (entry.isPublic) {
      const above = await Leaderboard.countDocuments({
        isPublic: true,
        totalPoints: { $gt: entry.totalPoints },
      });
      rank = above + 1;
    }

    return res.json({
      isPublic: entry.isPublic,
      totalPoints: entry.totalPoints,
      rank,
      displayName: entry.displayName,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function toggleLeaderboardVisibility(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const oid = new mongoose.Types.ObjectId(req.userId);
    const { isPublic } = req.body as { isPublic?: boolean };

    if (typeof isPublic !== "boolean") {
      return res.status(400).json({ message: "isPublic (boolean) is required" });
    }

    const entry = await Leaderboard.findOneAndUpdate(
      { userId: oid },
      {
        isPublic,
        $setOnInsert: {
          userId: oid,
          displayName: generateAlias(req.userId),
          totalPoints: 0,
          meditationPoints: 0,
          journalPoints: 0,
          moodPoints: 0,
          achievementPoints: 0,
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      message: `Leaderboard visibility set to ${isPublic ? "public" : "private"}`,
      isPublic: entry.isPublic,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
