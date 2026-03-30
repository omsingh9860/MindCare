import { api } from "@/lib/api";

export async function logMeditation(title: string, minutes: number) {
  const res = await api.post("/api/meditation/log", { title, minutes });
  return res.data as { message: string };
}