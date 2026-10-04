// CLIENT_URL may hold several comma-separated origins (e.g. production + a
// staging domain). Browsers send the Origin header without a trailing slash,
// so a value pasted as "https://app.vercel.app/" would never match in CORS and
// every request would fail with no obvious cause — normalize it here once.
export const getClientOrigins = (env = process.env) =>
  (env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
