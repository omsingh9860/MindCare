import { api } from "@/lib/api";

export type DashboardSummary = {
  latestMoodScore: number | null;
  moodSeries: { date: string; score: number }[];
  journalThisMonth: number;
  meditationHoursThisWeek: number;
};

export async function getDashboardSummary() {
  const res = await api.get("/api/dashboard/summary");
  return res.data as DashboardSummary;
}