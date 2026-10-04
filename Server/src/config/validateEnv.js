const REQUIRED = [
  "MONGODB_URI",
  "CLIENT_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const MIN_SECRET_LENGTH = 32;

// Pure — returns what's wrong instead of exiting, so it's unit-testable.
export const checkEnv = (env = process.env) => {
  const errors = [];
  const warnings = [];

  for (const key of REQUIRED) {
    if (!env[key]) errors.push(`${key} is not set`);
  }

  const access = env.JWT_ACCESS_SECRET;
  const refresh = env.JWT_REFRESH_SECRET;
  if (access && refresh && access === refresh) {
    errors.push("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values");
  }
  for (const [key, value] of [["JWT_ACCESS_SECRET", access], ["JWT_REFRESH_SECRET", refresh]]) {
    if (!value) continue;
    if (value.length < MIN_SECRET_LENGTH) {
      errors.push(`${key} must be at least ${MIN_SECRET_LENGTH} characters`);
    } else if (/replace_with|changeme|test-.*-secret/i.test(value)) {
      errors.push(`${key} still looks like a placeholder value`);
    }
  }

  if (env.CLIENT_URL && /localhost|127\.0\.0\.1/.test(env.CLIENT_URL)) {
    warnings.push("CLIENT_URL points at localhost — CORS will block the deployed frontend and reset-email links will be broken");
  }
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    warnings.push("STRIPE_SECRET_KEY is a test-mode key — no real payments will be taken");
  }
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    warnings.push("SMTP_USER/SMTP_PASS are not set — password reset emails will fail until they are");
  }

  return { errors, warnings };
};

// Only enforced in production: locally, a missing optional value shouldn't
// stop you from running the server. In production, a missing one should stop
// the deploy loudly rather than boot into a half-working state (e.g. CORS
// silently falling back to localhost, or Stripe crashing mid-request).
export const validateEnv = (env = process.env) => {
  if (env.NODE_ENV !== "production") return;

  const { errors, warnings } = checkEnv(env);
  warnings.forEach((w) => console.warn(`⚠️  ${w}`));

  if (errors.length > 0) {
    console.error("❌ Invalid production configuration:");
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }
};
