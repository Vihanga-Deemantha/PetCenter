import nodemailer from "nodemailer";

/**
 * Send an email using configured SMTP settings.
 * Falls back to console logging if SMTP is not configured (for dev/demo).
 *
 * @param {object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  // Graceful fallback for local development: log the email instead of
  // sending it. In production this must NOT happen silently — a deployment
  // with no SMTP configured would otherwise tell every user "check your
  // email" for a password reset that can never arrive, with nothing in the
  // API response to reveal that. Throwing here routes into the same
  // "email could not be sent" failure path a real SMTP outage would hit,
  // which callers (e.g. forgotPassword) already surface as a clear error.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured — cannot send email in production");
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL (SMTP not configured — logging to console)");
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${html}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"PetCenter" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
