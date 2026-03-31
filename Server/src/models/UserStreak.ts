import mongoose, { Schema, Document } from "mongoose";

export interface IUserStreak extends Document {
  userId: mongoose.Types.ObjectId;
  meditationStreak: number;
  meditationBestStreak: number;
  meditationLastDate: Date | null;
  journalStreak: number;
  journalBestStreak: number;
  journalLastDate: Date | null;
  moodStreak: number;
  moodBestStreak: number;
  moodLastDate: Date | null;
  updatedAt: Date;
}

const UserStreakSchema = new Schema<IUserStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    meditationStreak: { type: Number, default: 0 },
    meditationBestStreak: { type: Number, default: 0 },
    meditationLastDate: { type: Date, default: null },
    journalStreak: { type: Number, default: 0 },
    journalBestStreak: { type: Number, default: 0 },
    journalLastDate: { type: Date, default: null },
    moodStreak: { type: Number, default: 0 },
    moodBestStreak: { type: Number, default: 0 },
    moodLastDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserStreak = mongoose.model<IUserStreak>("UserStreak", UserStreakSchema);
