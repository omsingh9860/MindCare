import mongoose, { Schema } from "mongoose";
import { MlOutput, MlOutputSchema } from "./MlOutput.js";

export type { MlOutput };

export type MoodAssessmentDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  answers: Record<string, string>;
  notes: string;
  ml?: MlOutput;
  createdAt: Date;
  updatedAt: Date;
};

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