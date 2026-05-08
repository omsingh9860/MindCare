import { TrustedContact } from "../models/TrustedContact.js";
import { sendCrisisEmail } from "./mailer.js";

/**
 * Auto-trigger crisis alert when high-risk content is detected
 * Sends immediate email notifications to all trusted contacts
 *
 * @param userId - User ID who created the high-risk entry
 * @param entryTitle - Title of the journal entry (for email context)
 */
export async function startAutoAlertForHighRisk(
  userId: string,
  entryTitle: string,
  entryContent: string,
  matchedRiskPhrases: string[]
): Promise<void> {
  try {
    // Fetch trusted contacts for this user
    const contacts = await TrustedContact.find({ userId }).limit(3);
    const triggeredAt = new Date();
    const journalSnippet = entryContent.slice(0, 280).trim();

    if (contacts.length === 0) {
      console.warn(
        "[CrisisAlert] High-risk alert skipped: no trusted contacts.",
        { userId, entryTitle, matchedRiskPhrases }
      );
      return;
    }

    console.log("[CrisisAlert] High-risk alert triggered.", {
      userId,
      entryTitle,
      matchedRiskPhrases,
      contacts: contacts.length,
      triggeredAt: triggeredAt.toISOString(),
    });

    // Send crisis alert email to all trusted contacts
    const emailPromises = contacts.map((contact) =>
      sendCrisisEmail(contact.email, {
        userName: "A MindCare user",
        triggeredAt,
        timezone: "IST",
        delaySeconds: 0, // Auto-triggered, no delay
        riskPhrases: matchedRiskPhrases,
        journalSnippet,
      }).catch((err) => {
        console.error("[CrisisAlert] Failed to send high-risk email.", {
          userId,
          to: contact.email,
          entryTitle,
          matchedRiskPhrases,
          error: err instanceof Error ? err.message : String(err),
        });
      })
    );

    await Promise.all(emailPromises);

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
    // Don't throw — let the journal entry be saved regardless
  }
}
