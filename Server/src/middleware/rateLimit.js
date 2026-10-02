import rateLimit from "express-rate-limit";

// The integration test suite runs hundreds of requests against one shared
// Express app instance (one IP, as far as the limiter is concerned) within
// seconds — real traffic these limits are designed for never looks like
// that. Skipping rate limiting under NODE_ENV=test changes nothing about
// production behavior (that env value is only ever set by tests/setup.js),
// and the alternative — hand-budgeting how many auth/sensitive calls each
// test file is "allowed" to make — produces fragile tests that fail with a
// confusing 429 instead of a real assertion the moment someone adds one more
// `it()` block.
const skipInTest = () => process.env.NODE_ENV === "test";

// Auth routes: 15 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

// General API: 100 requests per minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: "Too many requests, please slow down",
  },
});

// Sensitive/cost-bearing actions (contact reveal, payment-intent creation):
// 20 requests per 15 minutes per IP
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
