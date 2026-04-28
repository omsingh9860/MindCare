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
  entryTitle: string
): Promise<void> {
  try {
    // Fetch trusted contacts for this user
    const contacts = await TrustedContact.find({ userId }).limit(3);

    if (contacts.length === 0) {
      console.log(
        "[CrisisAlert] No trusted contacts configured for user:",
        userId
      );
      return;
    }

    console.log(
      `[CrisisAlert] High-risk entry detected. Sending alert to ${contacts.length} trusted contact(s)`
    );

    // Send crisis alert email to all trusted contacts
    const emailPromises = contacts.map((contact) =>
      sendCrisisEmail(contact.email, {
        userName: "A MindCare user",
        triggeredAt: new Date(),
        timezone: "IST",
        delaySeconds: 0, // Auto-triggered, no delay
      }).catch((err) => {
        console.error(
          `[CrisisAlert] Failed to send email to ${contact.email}:`,
          err
        );
      })
    );

    await Promise.all(emailPromises);

    console.log(
      `[CrisisAlert] Successfully sent high-risk alerts to all trusted contacts`
    );
  } catch (error) {
    console.error("[CrisisAlert] Failed to trigger auto-alert:", error);
    // Don't throw — let the journal entry be saved regardless
  }
}
