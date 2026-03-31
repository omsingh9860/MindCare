import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { CrisisSettings } from "../models/CrisisSettings.js";
import { TrustedContact } from "../models/TrustedContact.js";
import { sendCrisisEmail } from "../services/mailer.js";

import { PendingCrisisAlert } from "../models/PendingCrisisAlert.js";

export async function startAutoAlert(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const settings = await CrisisSettings.findOne({ userId: req.userId });
  if (!settings?.enabled) {
    return res.status(400).json({ message: "Crisis alerts are disabled" });
  }
  if (settings.mode !== "auto") {
    return res.status(400).json({ message: "Crisis mode is not auto" });
  }

  const contacts = await TrustedContact.find({ userId: req.userId }).limit(3);
  if (contacts.length === 0) {
    return res.status(400).json({ message: "No trusted contacts added" });
  }

  const cooldownMinutes = 10;
  const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);

  const lastSent = await PendingCrisisAlert.findOne({
    userId: req.userId,
    status: "sent",
    createdAt: { $gte: cutoff },
  } as any).sort({ createdAt: -1 });

  if (lastSent) {
    const sentAt = lastSent.createdAt as Date;
    const retryAt = new Date(sentAt.getTime() + cooldownMinutes * 60 * 1000);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((retryAt.getTime() - Date.now()) / 1000)
    );

    return res.status(429).json({
      message: `Cooldown active. Try again in ${retryAfterSeconds}s.`,
      retryAfterSeconds,
      retryAt,
    });
  }

  const { userName } = req.body as { userName?: string };

  // ✅ recommended: only 1 pending alert per user
  await PendingCrisisAlert.updateMany(
    { userId: req.userId, status: "pending" },
    { $set: { status: "cancelled" } }
  );

  const delaySeconds = settings.delaySeconds ?? 30;
  const triggeredAt = new Date();
  const sendAt = new Date(Date.now() + delaySeconds * 1000);

  const alert = await PendingCrisisAlert.create({
    userId: req.userId,
    status: "pending",
    triggeredAt,
    sendAt,
    userName: userName || "A MindCare user",
    timezone: "IST",
    delaySeconds,
  });

  return res.json({
    message: "Auto alert scheduled",
    alertId: alert._id,
    sendAt: alert.sendAt,
    delaySeconds,
  });
}

export async function cancelAutoAlert(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  const { alertId } = req.params;

  const alert = await PendingCrisisAlert.findOne({ 
    _id: alertId, 
    userId: req.userId 
  } as any);
  
  if (!alert) return res.status(404).json({ message: "Alert not found" });

  if (alert.status === "sent") {
    return res.status(400).json({ message: "Too late to cancel (already sent)" });
  }

  alert.status = "cancelled";
  await alert.save();

  return res.json({ message: "Alert cancelled", alertId: alert._id });
}

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

  const { userName } = req.body as { userName?: string };

  const subject = "MindCare Alert: Someone may need support";
  const text =
    `MindCare Alert:\n\n` +
    `${userName || "A MindCare user"} may need support right now.\n\n` +
    `Please reach out to them as soon as you can.\n\n` +
    `This message was triggered by an in-app safety feature.\n`;

  await Promise.all(contacts.map((c) => sendCrisisEmail(c.email, subject, text)));

  return res.json({ message: "Alert sent", sentTo: contacts.map((c) => c.email) });
}