import nodemailer from "nodemailer";

const SENDER_NAME = "PetCenter";
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

// EMAIL_FROM / SMTP_FROM may be a bare address ("no-reply@example.com") or a
// full "Name <no-reply@example.com>" — both senders below add the display name
// themselves, so reduce either form to just the address.
export const extractAddress = (value = "") => {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().replace(/^["']|["']$/g, "");
};

const senderAddress = () =>
  extractAddress(process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER);

// Brevo's transactional-email REST API (HTTPS, port 443). Preferred on hosts
// that block outbound SMTP ports — e.g. Render's free tier blocks 25/465/587.
const sendViaBrevoApi = async ({ to, subject, html }) => {
  const sender = senderAddress();
  if (!sender) {
    throw new Error("EMAIL_FROM is not set — Brevo needs a verified sender address");
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: sender },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).message || "";
    } catch {
      // non-JSON error body — status code alone is still useful
    }
    // Never include the api-key in the message; callers log it.
    throw new Error(`Brevo API ${res.status}${detail ? `: ${detail}` : ""}`);
  }
};

const sendViaSmtp = async ({ to, subject, html }) => {
  const port = parseInt(process.env.SMTP_PORT || "587", 10);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    // 465 is implicit TLS; 587/2525 start plain and upgrade via STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Fail in seconds, not nodemailer's 2-minute default, when the host's SMTP
    // port is blocked or unreachable — otherwise "Forgot password" would spin
    // until the request times out.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: `"${SENDER_NAME}" <${senderAddress()}>`,
    to,
    subject,
    html,
  });
};

/**
 * Send an email. Provider order:
 *   1. Brevo HTTP API  — if BREVO_API_KEY is set
 *   2. SMTP            — if SMTP_USER and SMTP_PASS are set
 *   3. Console log     — local development only
 *
 * @param {object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevoApi({ to, subject, html });
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return sendViaSmtp({ to, subject, html });
  }

  // Graceful fallback for local development: log the email instead of
  // sending it. In production this must NOT happen silently — a deployment
  // with no email provider would otherwise tell every user "check your
  // email" for a password reset that can never arrive, with nothing in the
  // API response to reveal that. Throwing here routes into the same
  // "email could not be sent" failure path a real outage would hit, which
  // callers (e.g. forgotPassword) already surface as a clear error.
  if (process.env.NODE_ENV === "production") {
    throw new Error("No email provider configured — set BREVO_API_KEY (or SMTP_USER/SMTP_PASS)");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 EMAIL (no provider configured — logging to console)");
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body: ${html}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
};

export default sendEmail;
