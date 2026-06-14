import mongoose from "mongoose";
import { TrustedContact } from "../models/TrustedContact.js";
import { sendCrisisEmail } from "./mailer.js";

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

    const emailPromises = contacts.map((contact) =>
      sendCrisisEmail(contact.email, {
        userName: "A MindCare user",
        triggeredAt,
        timezone: "IST",
        delaySeconds: 0,
        riskPhrases: matchedRiskPhrases,
        journalSnippet,
      })
    );

    await Promise.all(emailPromises);

    console.log("[CrisisAlert] High-risk alert email dispatch completed.", {
      userId,
      contacts: contacts.length,
    });
  } catch (error) {
    console.error("[CrisisAlert] Failed to trigger high-risk auto-alert.", error);
  }
}