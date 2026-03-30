import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { CrisisSettings } from "../models/CrisisSettings";
import { TrustedContact } from "../models/TrustedContact";
import { sendCrisisEmail } from "../services/mailer";

export async function getSettings(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const doc =
    (await CrisisSettings.findOne({ userId: req.userId })) ||
    (await CrisisSettings.create({ userId: req.userId }));

  return res.json({
    settings: {
      enabled: doc.enabled,
      mode: doc.mode,
      delaySeconds: doc.delaySeconds,
    },
  });
}

export async function updateSettings(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const { enabled, mode, delaySeconds } = req.body as {
    enabled?: boolean;
    mode?: "manual" | "auto";
    delaySeconds?: number;
  };

  const doc =
    (await CrisisSettings.findOne({ userId: req.userId })) ||
    (await CrisisSettings.create({ userId: req.userId }));

  if (typeof enabled === "boolean") doc.enabled = enabled;
  if (mode === "manual" || mode === "auto") doc.mode = mode;
  if (typeof delaySeconds === "number") doc.delaySeconds = delaySeconds;

  // enforce safe limits
  if (doc.delaySeconds < 10) doc.delaySeconds = 10;
  if (doc.delaySeconds > 300) doc.delaySeconds = 300;

  await doc.save();

  return res.json({
    message: "Settings updated",
    settings: { enabled: doc.enabled, mode: doc.mode, delaySeconds: doc.delaySeconds },
  });
}

export async function sendAlert(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const settings = await CrisisSettings.findOne({ userId: req.userId });
  if (!settings?.enabled) {
    return res.status(400).json({ message: "Crisis alerts are disabled" });
  }

  const contacts = await TrustedContact.find({ userId: req.userId }).limit(3);
  if (contacts.length === 0) {
    return res.status(400).json({ message: "No trusted contacts added" });
  }

  const { userName, userEmail } = req.body as { userName?: string; userEmail?: string };

  const subject = "MindCare Alert: Someone may need support";
  const text =
    `MindCare Alert:\n\n` +
    `${userName || "A MindCare user"} may need support right now.\n\n` +
    `Please reach out to them as soon as you can.\n\n` +
    `User email: ${userEmail || "N/A"}\n\n` +
    `This message was triggered by an in-app safety feature.\n`;

  await Promise.all(contacts.map((c) => sendCrisisEmail(c.email, subject, text)));

  return res.json({ message: "Alert sent", sentTo: contacts.map((c) => c.email) });
}