import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { MoodAssessment, type MoodAssessmentDoc } from "../models/MoodAssessment.js";
import { processMoodAchievements } from "../services/achievementService.js";
import { predictText, hashInput } from "../services/mlClient.js";
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

    // Fire and forget — run ML analysis in background
    const answersText = Object.entries(doc.answers || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const mlText = `Mood check-in\n${answersText}\n\nNotes: ${doc.notes || ""}`;
    (async () => {
      try {
        const result = await predictText(mlText);
        await MoodAssessment.updateOne(
          { _id: doc._id },
          {
            $set: {
              "ml.status": "completed",
              "ml.modelVersion": "hf-space-v1",
              "ml.inputHash": hashInput(mlText),
              "ml.primaryEmotion": result.primaryEmotion,
              "ml.secondaryEmotion": result.secondaryEmotion,
              "ml.confidence": result.confidence,
              "ml.score": result.score,
              "ml.emotionType": result.emotionType,
              "ml.raw": result.raw,
              "ml.error": undefined,
            },
          }
        );
      } catch (e: any) {
        await MoodAssessment.updateOne(
          { _id: doc._id },
          {
            $set: {
              "ml.status": "failed",
              "ml.error": e?.message || "ML analysis failed",
            },
          }
        );
      }
    })().catch(console.error);

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

    // Reset to pending first
    const doc = await MoodAssessment.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { ml: { status: "pending", source: "assessment" } } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Run ML synchronously so the caller gets the result immediately
    try {
      const answersText = Object.entries(doc.answers || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      const mlText = `Mood check-in\n${answersText}\n\nNotes: ${doc.notes || ""}`;
      const result = await predictText(mlText);
      const updated = await MoodAssessment.findByIdAndUpdate(
        doc._id,
        {
          $set: {
            "ml.status": "completed",
            "ml.modelVersion": "hf-space-v1",
            "ml.inputHash": hashInput(mlText),
            "ml.primaryEmotion": result.primaryEmotion,
            "ml.secondaryEmotion": result.secondaryEmotion,
            "ml.confidence": result.confidence,
            "ml.score": result.score,
            "ml.emotionType": result.emotionType,
            "ml.raw": result.raw,
            "ml.error": undefined,
          },
        },
        { new: true }
      );
      return res.json({ message: "Analysis complete", ml: updated?.ml });
    } catch (mlErr: any) {
      const updated = await MoodAssessment.findByIdAndUpdate(
        doc._id,
        {
          $set: {
            "ml.status": "failed",
            "ml.error": mlErr?.message || "ML analysis failed",
          },
        },
        { new: true }
      );
      return res.json({ message: "Analysis failed", ml: updated?.ml });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}