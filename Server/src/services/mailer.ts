import nodemailer from "nodemailer";

export type CrisisEmailParams = {
  userName: string;
  triggeredAt: Date | string | number;
  timezone?: string;
  delaySeconds: number;
  locationLink?: string; // Optional: Google Maps link or similar
};

const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
  console.warn("[mailer] SMTP credentials missing. Critical alerts will fail.");
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: emailUser, pass: emailPass },
});

/**
 * Text-Only: Structured as a formal Incident Report
 */
export function buildCrisisAlertEmailText(params: CrisisEmailParams): string {
  const tz = params.timezone || "local time";
  const when = new Date(params.triggeredAt).toLocaleString();

  return [
    "MINDCARE SAFETY NETWORK: PRIORITY ALERT",
    "==========================================",
    "INCIDENT SUMMARY",
    `Subject User:   ${params.userName}`,
    `Alert Type:     Crisis Response Triggered`,
    `Timestamp:      ${when} (${tz})`,
    `Safety Delay:   ${params.delaySeconds} seconds (Unresolved)`,
    params.locationLink ? `Last Location:  ${params.locationLink}` : "",
    "",
    "NOTIFICATION DETAILS:",
    "This automated transmission was initiated because the subject user did not respond to a safety check-in within the allotted time. As a designated Trusted Contact, your immediate intervention is required.",
    "",
    "PROTOCOL FOR CONTACTS:",
    "1. ATTEMPT VERIFICATION: Call the user immediately. If they answer, verify their safety and stay on the line.",
    "2. EMERGENCY ESCALATION: If the user is unreachable and you believe they are in immediate danger, contact local emergency services. Provide them with the user's name and the timestamp of this alert.",
    "3. COORDINDATE: Contact other family members or shared responders if applicable.",
    "",
    "DISCLAIMER:",
    "MindCare is a digital monitoring aid. We do not dispatch emergency personnel directly. This notification is based on system-detected events and may be a false alarm; however, it should be treated with high priority until safety is verified.",
    "",
    "— MindCare Safety Operations",
  ].filter(Boolean).join("\n");
}

/**
 * HTML: High-Urgency Corporate/Medical Aesthetic
 */
export function buildCrisisAlertEmailHtml(params: CrisisEmailParams): string {
  const tz = params.timezone || "local time";
  const when = new Date(params.triggeredAt).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const safeName = params.userName.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m] || m));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MindCare Safety Alert</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px; background-color:#ffffff; border-radius:4px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color:#b91c1c; padding:20px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:20px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Priority Safety Notification</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 40px;">
              <p style="margin-top:0; font-size:16px; color:#111827;"><strong>Attention:</strong> You are receiving this alert as the primary emergency contact for <strong>${safeName}</strong>.</p>
              
              <div style="background-color:#fef2f2; border:1px solid #fee2e2; border-radius:6px; padding:20px; margin:24px 0;">
                <table width="100%" style="font-size:14px; color:#4b5563;">
                  <tr>
                    <td style="padding-bottom:8px; width:120px;"><strong>Event Detected:</strong></td>
                    <td style="padding-bottom:8px; color:#111827;">Crisis Risk Alert</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;"><strong>Timestamp:</strong></td>
                    <td style="padding-bottom:8px; color:#111827;">${when} (${tz})</td>
                  </tr>
                  <tr>
                    <td><strong>Safety Delay:</strong></td>
                    <td style="color:#111827;">${params.delaySeconds}s (Expired without response)</td>
                  </tr>
                </table>
              </div>

              <h3 style="font-size:16px; color:#111827; margin:30px 0 15px; border-bottom:1px solid #e5e7eb; padding-bottom:10px;">Required Response Protocol</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:15px;">
                    <div style="display:inline-block; width:24px; height:24px; background:#b91c1c; color:#fff; text-align:center; border-radius:50%; font-size:14px; line-height:24px; margin-right:10px;">1</div>
                    <strong style="color:#111827;">Immediate Contact:</strong> Call ${safeName} now.
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:15px;">
                    <div style="display:inline-block; width:24px; height:24px; background:#b91c1c; color:#fff; text-align:center; border-radius:50%; font-size:14px; line-height:24px; margin-right:10px;">2</div>
                    <strong style="color:#111827;">Emergency Services:</strong> If you cannot reach the user and suspect a life-threatening situation, dial emergency services (911 or local equivalent).
                  </td>
                </tr>
              </table>

              ${params.locationLink ? `
              <div style="margin-top:20px; text-align:center;">
                <a href="${params.locationLink}" style="background-color:#111827; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:6px; font-weight:500; font-size:14px; display:inline-block;">View Last Known Location</a>
              </div>` : ''}

              <div style="margin-top:40px; padding-top:20px; border-top:1px solid #f3f4f6; font-size:12px; color:#6b7280; line-height:1.5;">
                <p><strong>About this alert:</strong> MindCare monitoring systems detected behavioral or input patterns indicative of a crisis. This notification is dispatched when a user fails to acknowledge a safety check-in prompt within the pre-configured window.</p>
                <p style="margin-bottom:0;">MindCare does not provide direct emergency dispatch. If this is an emergency, contact authorities immediately.</p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color:#f9fafb; padding:20px; text-align:center; font-size:11px; color:#9ca3af;">
              MindCare Safety Operations Center | Confidential Communication
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildCrisisAlertEmailSubject(userName: string): string {
  return `ALERT: Safety Verification Required for ${userName}`;
}

export async function sendCrisisEmail(
  to: string,
  paramsOrSubject: CrisisEmailParams | string,
  maybeText?: string
) {
  if (!emailUser || !emailPass) throw new Error("SMTP credentials not configured.");

  if (typeof paramsOrSubject === "string") {
    return await transporter.sendMail({
      from: `"MindCare Safety" <${emailUser}>`,
      to,
      subject: paramsOrSubject,
      text: maybeText || "",
    });
  }

  const params = paramsOrSubject;
  return await transporter.sendMail({
    from: `"MindCare Safety" <${emailUser}>`,
    to,
    subject: buildCrisisAlertEmailSubject(params.userName),
    text: buildCrisisAlertEmailText(params),
    html: buildCrisisAlertEmailHtml(params),
  });
}