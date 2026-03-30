import { api } from "@/lib/api";

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export async function createJournalEntry(title: string, content: string) {
  const res = await api.post("/api/journal", { title, content });
  return res.data.entry as JournalEntry;
}

export async function listJournalEntries() {
  const res = await api.get("/api/journal");
  return res.data.entries as JournalEntry[];
}

export async function deleteJournalEntry(id: string) {
  const res = await api.delete(`/api/journal/${id}`);
  return res.data as { message: string };
}