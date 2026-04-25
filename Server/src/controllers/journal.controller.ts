import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { JournalEntry } from "../models/JournalEntry.js";
import { assessRisk } from "../services/riskDetector.js";
import { processJournalAchievements } from "../services/achievementService.js";
import { predictText, hashInput, ML_MODEL_VERSION } from "../services/mlClient.js";
import mongoose from "mongoose";



export async function deleteEntry(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid entry id" });
    }

    const deleted = await JournalEntry.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Entry not found" });
    }

    return res.json({ message: "Entry deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createEntry(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    
    const { title, content } = req.body as { title?: string; content?: string };
    const risk = assessRisk(`${title}\n\n${content}`);
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const entry = await JournalEntry.create({
  userId: req.userId,
  title: title.trim(),
  content: content.trim(),
  riskLevel: risk.riskLevel,
  riskReasons: risk.reasons,
  riskAssessedAt: new Date(),
  ml: { status: "pending", source: "journal" },
});

    // Fire and forget — process achievements without blocking the response
    processJournalAchievements(req.userId).catch((err) =>
      console.error("Achievement processing error:", err)
    );

    // Fire and forget — run ML analysis in background
    const mlText = `${entry.title}\n\n${entry.content}`;
    (async () => {
      try {
        const result = await predictText(mlText);
        await JournalEntry.updateOne(
          { _id: entry._id },
          {
            $set: {
              "ml.status": "completed",
              "ml.modelVersion": ML_MODEL_VERSION,
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
        await JournalEntry.updateOne(
          { _id: entry._id },
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
      message: "Entry saved",
      risk: { level: entry.riskLevel, reasons: entry.riskReasons },
      entry: {
        id: entry._id,
        title: entry.title,
        content: entry.content,
        ml: entry.ml,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listEntries(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const entries = await JournalEntry.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("_id title content ml createdAt updatedAt");

    return res.json({
      entries: entries.map((e) => ({
        id: e._id,
        title: e.title,
        content: e.content,
        ml: e.ml,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function markJournalForAnalysis(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid entry id" });
    }

    // Reset to pending first
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { ml: { status: "pending", source: "journal" } } },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    // Run ML synchronously so the caller gets the result immediately
    try {
      const mlText = `${entry.title}\n\n${entry.content}`;
      const result = await predictText(mlText);
      const updated = await JournalEntry.findByIdAndUpdate(
        entry._id,
        {
          $set: {
            "ml.status": "completed",
            "ml.modelVersion": ML_MODEL_VERSION,
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
      const updated = await JournalEntry.findByIdAndUpdate(
        entry._id,
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
