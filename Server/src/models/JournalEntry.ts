import mongoose, { Schema } from "mongoose";

const JournalEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },

    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    riskReasons: { type: [String], default: [] },
    riskAssessedAt: { type: Date },
  },
  { timestamps: true }
);

export const JournalEntry = mongoose.model("JournalEntry", JournalEntrySchema);