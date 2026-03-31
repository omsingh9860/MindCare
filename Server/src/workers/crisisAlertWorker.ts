import { PendingCrisisAlert } from "../models/PendingCrisisAlert";
import { TrustedContact } from "../models/TrustedContact";
import { sendCrisisEmail } from "../services/mailer";

export function startCrisisAlertWorker() {
  setInterval(async () => {
    try {
      const now = new Date();

      const due = await PendingCrisisAlert.find({
        status: "pending",
        sendAt: { $lte: now },
      }).limit(25);

      for (const alert of due) {
        // mark sent first to avoid duplicates
        alert.status = "sent";
        await alert.save();

        const contacts = await TrustedContact.find({ userId: alert.userId }).limit(3);

        await Promise.all(
          contacts.map((c) =>
            sendCrisisEmail(c.email, {
              userName: alert.userName,
              triggeredAt: alert.triggeredAt,
              timezone: alert.timezone,
              delaySeconds: alert.delaySeconds,
            })
          )
        );
      }
    } catch (e) {
      console.error("[crisisAlertWorker]", e);
    }
  }, 2000);
}