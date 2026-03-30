import mongoose, { Schema } from "mongoose";

export type CrisisMode = "manual" | "auto";

export type CrisisSettingsDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  enabled: boolean;
  mode: CrisisMode;
  delaySeconds: number; // auto mode countdown
  createdAt: Date;
  updatedAt: Date;
};

const CrisisSettingsSchema = new Schema<CrisisSettingsDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    mode: { type: String, enum: ["manual", "auto"], default: "manual" },
    delaySeconds: { type: Number, default: 30, min: 10, max: 300 },
  },
  { timestamps: true }
);

export const CrisisSettings = mongoose.model<CrisisSettingsDoc>(
  "CrisisSettings",
  CrisisSettingsSchema
);