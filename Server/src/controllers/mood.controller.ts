import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { MoodAssessment, type MoodAssessmentDoc } from "../models/MoodAssessment.js";
import { processMoodAchievements } from "../services/achievementService.js";
import mongoose from "mongoose";

export async function createMoodAssessment(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { answers, notes } = req.body as {
      answers?: Record<string, string>;
      notes?: string;
    };

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: "answers are required" });
    }

    const doc = await MoodAssessment.create({
      userId: req.userId,
      answers,
      notes: notes?.trim() || "",
      ml: { status: "pending", source: "assessment" },
    });

    // Fire and forget — process achievements without blocking the response
    processMoodAchievements(req.userId).catch((err) =>
      console.error("Achievement processing error:", err)
    );

    return res.status(201).json({
      message: "Mood assessment saved",
      assessment: {
        id: doc._id,
        answers: doc.answers,
        notes: doc.notes,
        ml: doc.ml,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listMoodAssessments(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const items = await MoodAssessment.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("_id answers notes ml createdAt");

    return res.json({
      assessments: items.map((x: MoodAssessmentDoc) => ({
        id: x._id,
        answers: x.answers,
        notes: x.notes,
        ml: x.ml,
        createdAt: x.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function markMoodForAnalysis(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid assessment id" });
    }

    const doc = await MoodAssessment.findOneAndUpdate(
      { _id: id, userId: req.userId },
      {
        $set: {
          ml: { status: "pending", source: "assessment" },
        },
      },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    return res.json({ message: "Marked for analysis", ml: doc.ml });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}