import nodemailer from "nodemailer";

export type CrisisEmailParams = {
  userName: string;
  triggeredAt: Date | string | number;
  timezone?: string;
  delaySeconds: number;
};

// ✅ support BOTH naming styles
const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;  
if (!emailUser || !emailPass) {
  console.warn(
    
    "[mailer] SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_PASS) not set. Emails will fail until configured."
  );
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});


/**
 * Plain text fallback (recommended even if you mainly use HTML)
 */
export function buildCrisisAlertEmailText(params: CrisisEmailParams) {
  const tz = params.timezone || "local time";
  const when = new Date(params.triggeredAt).toLocaleString();

  const userName = params.userName;

  return [
    "MindCare Crisis Alert",
    "",
    "Hi,",
    "",
    "This is an automated message from MindCare.",
    "",
    `${userName} listed you as a trusted contact.`,
    `MindCare detected a possible crisis risk at ${when} (${tz}).`,
    "",
    `This alert was sent after a ${params.delaySeconds}-second safety delay to allow cancellation.`,
    "",
    "What you can do now:",
    `1) Call or message ${userName} and check in.`,
    "2) If you believe they may be in immediate danger, contact local emergency services.",
    "",
    "Important:",
    "- MindCare is not an emergency service.",
    "- This alert can be a false alarm.",
    "",
    "— MindCare",
    "",
  ].join("\n");
}

/**
 * HTML template (your design), NO private journal text included.
 */
export function buildCrisisAlertEmailHtml(params: CrisisEmailParams) {
  const tz = params.timezone || "local time";
  const when = new Date(params.triggeredAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Basic HTML escaping for username
  const safeName = params.userName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#f4f6f9; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" style="background:#fff; border-radius:10px; margin-top:20px; box-shadow:0 4px 12px rgba(0,0,0,0.1)">
            <tr>
              <td style="background:linear-gradient(135deg,#ff6b6b,#ff4d4d); color:white; text-align:center; padding:20px; border-radius:10px 10px 0 0;">
                <h2 style="margin:0;">MindCare Crisis Alert</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:20px; color:#333;">
                <p style="margin-top:0;">Hi,</p>

                <p>This is an <strong style="color:#ff4d4d;">automated alert</strong> from <strong>MindCare</strong>.</p>

                <p><strong>${safeName}</strong> listed you as a <span style="color:#4a90e2;">trusted contact</span>.</p>

                <p style="background:#fff3cd; padding:10px; border-left:5px solid #ffc107;">
                  <strong>Possible crisis detected</strong><br/>
                  <strong>Time:</strong> ${when} (${tz})
                </p>

                <p style="font-size:13px; color:#666;">
                  This alert was sent after <strong>${params.delaySeconds}s</strong> to allow cancellation.
                </p>

                <div style="background:#f1f8ff; padding:15px; border-radius:8px;">
                  <h3 style="margin-top:0;">What you can do:</h3>
                  <ul style="margin:0; padding-left:18px;">
                    <li><strong>Call or message</strong> ${safeName} and check in</li>
                    <li>If urgent, contact local emergency services</li>
                  </ul>
                </div>

                <p style="font-size:13px; color:#777;">
                  <strong>Important:</strong> MindCare is not an emergency service. This alert can be a false alarm.
                </p>

                <p>— <strong>MindCare</strong></p>
              </td>
            </tr>
          </table>

          <p style="font-size:12px; color:#888; margin:16px 0 0;">
            You received this because you were added as a trusted contact in MindCare.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildCrisisAlertEmailSubject(userName: string) {
  // Keep it clear & professional
  return `MindCare alert: please check in with ${userName}`;
}

/**
 * Main send function used by your crisis flow.
 * - Sends HTML + text fallback
 * - Does NOT include any private journal content
 */
export async function sendCrisisEmail(
  to: string,
  paramsOrSubject: CrisisEmailParams | string,
  maybeText?: string
) {
  if (!emailUser) throw new Error("SMTP_USER/EMAIL_USER is not configured");
  if (!emailPass) throw new Error("SMTP_PASS/EMAIL_PASS is not configured");

  // OLD style: (to, subject, text)
  if (typeof paramsOrSubject === "string") {
    const subject = paramsOrSubject;
    const text = maybeText || "";
    await transporter.sendMail({
      from: `"MindCare" <${emailUser}>`,
      to,
      subject,
      text,
    });
    return;
  }

  // NEW style: (to, params)
  const params = paramsOrSubject;
  await transporter.sendMail({
    from: `"MindCare" <${emailUser}>`,
    to,
    subject: buildCrisisAlertEmailSubject(params.userName),
    text: buildCrisisAlertEmailText(params),
    html: buildCrisisAlertEmailHtml(params),
  });
}