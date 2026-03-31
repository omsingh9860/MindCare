import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { MoodAssessment, type MoodAssessmentDoc } from "../models/MoodAssessment";
import { processMoodAchievements } from "../services/achievementService";

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
      .select("_id answers notes createdAt");

    return res.json({
      assessments: items.map((x: MoodAssessmentDoc) => ({
        id: x._id,
        answers: x.answers,
        notes: x.notes,
        createdAt: x.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}