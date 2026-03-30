import { api } from "@/lib/api";

export type MoodAssessment = {
  id: string;
  answers: Record<string, string>;
  notes: string;
  createdAt: string;
};

export async function createMoodAssessment(
  answers: Record<number, string>,
  notes: string
) {
  const res = await api.post("/api/mood", { answers, notes });
  return res.data.assessment as MoodAssessment;
}