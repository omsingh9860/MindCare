import mongoose, { Schema } from "mongoose";

const MlOutputSchema = new Schema(
  {
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    source: { type: String, enum: ["journal", "assessment"] },
    inputHash: { type: String },
    modelVersion: { type: String },
    primaryEmotion: { type: String },
    secondaryEmotion: { type: String },
    confidence: { type: Number },
    score: { type: Number },
    emotionType: { type: String },
    raw: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  { _id: false, timestamps: true }
);

const JournalEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },

    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    riskReasons: { type: [String], default: [] },
    riskAssessedAt: { type: Date },

    ml: { type: MlOutputSchema, default: () => ({ status: "pending", source: "journal" }) },
  },
  { timestamps: true }
);

export const JournalEntry = mongoose.model("JournalEntry", JournalEntrySchema);