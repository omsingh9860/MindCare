import { api } from "@/lib/api";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  age: number | "";
};

export async function getProfile() {
  const res = await api.get("/api/profile");
  return res.data.profile as UserProfile;
}

export async function updateProfile(profile: Partial<UserProfile>) {
  const res = await api.put("/api/profile", profile);
  return res.data.profile as UserProfile;
}