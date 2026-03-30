import { api } from "@/lib/api";

export type TrustedContact = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export async function listContacts() {
  const res = await api.get("/api/contacts");
  return res.data.contacts as TrustedContact[];
}

export async function createContact(name: string, email: string) {
  const res = await api.post("/api/contacts", { name, email });
  return res.data.contact as TrustedContact;
}

export async function updateContact(id: string, name: string, email: string) {
  const res = await api.put(`/api/contacts/${id}`, { name, email });
  return res.data.contact as TrustedContact;
}

export async function deleteContact(id: string) {
  const res = await api.delete(`/api/contacts/${id}`);
  return res.data as { message: string };
}