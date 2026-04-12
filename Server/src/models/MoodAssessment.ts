import mongoose, { Schema } from "mongoose";

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

export type MoodAssessmentDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  answers: Record<string, string>;
  notes: string;
  ml?: MlOutput;
  createdAt: Date;
  updatedAt: Date;
};

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

const MoodAssessmentSchema = new Schema<MoodAssessmentDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: Schema.Types.Mixed, required: true }, // flexible object
    notes: { type: String, default: "", trim: true },
    ml: { type: MlOutputSchema, default: () => ({ status: "pending", source: "assessment" }) },
  },
  { timestamps: true }
);

export const MoodAssessment = mongoose.model<MoodAssessmentDoc>(
  "MoodAssessment",
  MoodAssessmentSchema
);