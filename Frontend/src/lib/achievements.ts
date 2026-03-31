import { api } from "@/lib/api";

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

export type AchievementBadge = {
  badge: BadgeType;
  title: string;
  description: string;
  points: number;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type UserAchievementsResponse = {
  achievements: AchievementBadge[];
  totalPoints: number;
  unlockedCount: number;
  totalBadges: number;
};

export type StreakData = {
  current: number;
  best: number;
  lastDate: string | null;
};

export type CurrentStreaksResponse = {
  meditation: StreakData;
  journal: StreakData;
  mood: StreakData;
};

export async function getUserAchievements(): Promise<UserAchievementsResponse> {
  const res = await api.get("/api/achievements/user");
  return res.data;
}

export async function getBadgesCatalog(): Promise<{ badges: Omit<AchievementBadge, "unlocked" | "unlockedAt">[] }> {
  const res = await api.get("/api/achievements/badges");
  return res.data;
}

export async function getCurrentStreaks(): Promise<CurrentStreaksResponse> {
  const res = await api.get("/api/achievements/streaks/current");
  return res.data;
}
