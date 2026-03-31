import mongoose, { Schema, Document } from "mongoose";

export interface ILeaderboard extends Document {
  userId: mongoose.Types.ObjectId;
  totalPoints: number;
  meditationPoints: number;
  journalPoints: number;
  moodPoints: number;
  achievementPoints: number;
  isPublic: boolean;
  displayName: string; // anonymized alias
  updatedAt: Date;
}

const LeaderboardSchema = new Schema<ILeaderboard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    totalPoints: { type: Number, default: 0, index: true },
    meditationPoints: { type: Number, default: 0 },
    journalPoints: { type: Number, default: 0 },
    moodPoints: { type: Number, default: 0 },
    achievementPoints: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: false },
    displayName: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Leaderboard = mongoose.model<ILeaderboard>("Leaderboard", LeaderboardSchema);
