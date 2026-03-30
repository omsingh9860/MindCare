import nodemailer from "nodemailer";

let transport: nodemailer.Transporter | null = null;

function getEnvOptional(name: string) {
  return process.env[name];
}

function createTransport() {
  const host = getEnvOptional("SMTP_HOST");
  const port = getEnvOptional("SMTP_PORT");
  const user = getEnvOptional("SMTP_USER");
  const pass = getEnvOptional("SMTP_PASS");

  if (!host || !port || !user || !pass) {
    // Don't crash the server; just fail when trying to send.
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendCrisisEmail(to: string, subject: string, text: string) {
  if (!transport) {
    transport = createTransport();
  }

  if (!transport) {
    throw new Error(
      "Email is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in Server/.env"
    );
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
  await transport.sendMail({ from, to, subject, text });
}