import mongoose, { Schema, Document } from "mongoose";

export type BadgeType =
  | "meditation_10"
  | "meditation_50"
  | "meditation_100"
  | "journal_5"
  | "journal_15"
  | "journal_30"
  | "checkin_7_streak"
  | "checkin_30_streak"
  | "wellness_warrior";

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  badge: BadgeType;
  unlockedAt: Date;
  points: number;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    badge: {
      type: String,
      required: true,
      enum: [
        "meditation_10",
        "meditation_50",
        "meditation_100",
        "journal_5",
        "journal_15",
        "journal_30",
        "checkin_7_streak",
        "checkin_30_streak",
        "wellness_warrior",
      ],
    },
    unlockedAt: { type: Date, default: Date.now },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AchievementSchema.index({ userId: 1, badge: 1 }, { unique: true });

export const Achievement = mongoose.model<IAchievement>("Achievement", AchievementSchema);

// Badge catalog with metadata
export const BADGE_CATALOG: Record<
  BadgeType,
  { title: string; description: string; points: number; icon: string }
> = {
  meditation_10: {
    title: "Mindful Beginner",
    description: "Complete 10 meditation sessions",
    points: 50,
    icon: "🧘",
  },
  meditation_50: {
    title: "Meditation Adept",
    description: "Complete 50 meditation sessions",
    points: 150,
    icon: "🌊",
  },
  meditation_100: {
    title: "Zen Master",
    description: "Complete 100 meditation sessions",
    points: 300,
    icon: "🏔️",
  },
  journal_5: {
    title: "Reflective Soul",
    description: "Write 5 journal entries",
    points: 30,
    icon: "📓",
  },
  journal_15: {
    title: "Story Teller",
    description: "Write 15 journal entries",
    points: 80,
    icon: "📖",
  },
  journal_30: {
    title: "Prolific Writer",
    description: "Write 30 journal entries",
    points: 200,
    icon: "✍️",
  },
  checkin_7_streak: {
    title: "Week Warrior",
    description: "Check in 7 days in a row",
    points: 70,
    icon: "🔥",
  },
  checkin_30_streak: {
    title: "Consistency Champion",
    description: "Check in 30 days in a row",
    points: 350,
    icon: "⚡",
  },
  wellness_warrior: {
    title: "Wellness Warrior",
    description: "Earn all other badges",
    points: 500,
    icon: "🏆",
  },
};
