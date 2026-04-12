import { Schema } from "mongoose";

export type MlOutput = {
  status: "pending" | "completed" | "failed";
  source?: "journal" | "assessment";
  inputHash?: string;
  modelVersion?: string;
  primaryEmotion?: string;
  secondaryEmotion?: string;
  confidence?: number;
  score?: number;
  emotionType?: string;
  raw?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  error?: string;
};

export const MlOutputSchema = new Schema(
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
