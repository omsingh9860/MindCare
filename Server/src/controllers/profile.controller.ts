import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User";

export async function getProfile(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(req.userId).select("name email phone age");
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      age: user.age ?? "",
    },
  });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const { name, phone, age } = req.body as {
    name?: string;
    phone?: string;
    age?: number | string;
  };

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (typeof name === "string") user.name = name.trim();
  if (typeof phone === "string") user.phone = phone.trim();

  if (age === "" || age === null || typeof age === "undefined") {
    user.age = undefined as any;
  } else {
    const n = typeof age === "string" ? Number(age) : age;
    if (!Number.isFinite(n) || n < 0 || n > 120) {
      return res.status(400).json({ message: "Age must be a number between 0 and 120" });
    }
    user.age = n;
  }

  await user.save();

  return res.json({
    message: "Profile updated",
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      age: user.age ?? "",
    },
  });
}