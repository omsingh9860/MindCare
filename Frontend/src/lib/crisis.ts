import { api } from "@/lib/api";

export type CrisisSettings = {
  enabled: boolean;
  mode: "manual" | "auto";
  delaySeconds: number;
};

export async function getCrisisSettings() {
  const res = await api.get("/api/crisis/settings");
  return res.data.settings as CrisisSettings;
}

export async function updateCrisisSettings(settings: Partial<CrisisSettings>) {
  const res = await api.put("/api/crisis/settings", settings);
  return res.data.settings as CrisisSettings;
}

export async function sendCrisisAlert(userName?: string, userEmail?: string) {
  const res = await api.post("/api/crisis/alert", { userName, userEmail });
  return res.data as { message: string; sentTo: string[] };
}