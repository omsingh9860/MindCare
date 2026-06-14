import mongoose from "mongoose";
import { TrustedContact } from "../models/TrustedContact.js";
import { sendCrisisEmail, type CrisisEmailParams } from "./mailer.js";

async function sendWithRetry(email: string, payload: CrisisEmailParams, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await sendCrisisEmail(email, payload);
    } catch (err) {
      console.error(`[CrisisAlert] Email send attempt ${attempt} failed`, {
        to: email,
        error: err instanceof Error ? err.message : String(err),
      });

      if (attempt > retries) throw err;

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

export async function startAutoAlertForHighRisk(
  userId: string,
  entryTitle: string,
  entryContent: string,
  matchedRiskPhrases: string[]
): Promise<void> {
  try {
    const contacts = await TrustedContact.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).limit(3);

    console.log("[CrisisAlert] Contacts found:", contacts.map((c) => c.email));

    const triggeredAt = new Date();
    const journalSnippet = entryContent.slice(0, 280).trim();

    if (contacts.length === 0) {
      console.warn("[CrisisAlert] High-risk alert skipped: no trusted contacts.", {
        userId,
        entryTitle,
        matchedRiskPhrases,
      });
      return;
    }

    console.log("[CrisisAlert] High-risk alert triggered.", {
      userId,
      entryTitle,
      matchedRiskPhrases,
      contacts: contacts.length,
      triggeredAt: triggeredAt.toISOString(),
    });

    const payload: CrisisEmailParams = {
      userName: "A MindCare user",
      triggeredAt,
      timezone: "IST",
      delaySeconds: 0,
      riskPhrases: matchedRiskPhrases,
      journalSnippet,
    };

    await Promise.all(contacts.map((contact) => sendWithRetry(contact.email, payload)));

    console.log("[CrisisAlert] High-risk alert email dispatch completed.", {
      userId,
      contacts: contacts.length,
    });
  } catch (error) {
    console.error("[CrisisAlert] Failed to trigger high-risk auto-alert.", {
      userId,
      entryTitle,
      matchedRiskPhrases,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}