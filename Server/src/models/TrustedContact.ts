import mongoose, { Schema } from "mongoose";

export type TrustedContactDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

const TrustedContactSchema = new Schema<TrustedContactDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
  },
  { timestamps: true }
);

TrustedContactSchema.index({ userId: 1, email: 1 }, { unique: true });

export const TrustedContact = mongoose.model<TrustedContactDoc>(
  "TrustedContact",
  TrustedContactSchema
);