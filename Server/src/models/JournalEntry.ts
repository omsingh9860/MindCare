import mongoose, { Schema } from "mongoose";
import { MlOutputSchema } from "./MlOutput.js";

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