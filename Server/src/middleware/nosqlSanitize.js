/**
 * nosqlSanitize.js
 * App-level middleware for NoSQL injection prevention.
 * Recursively strips keys beginning with '$' or containing '.' from req.body, req.query, and req.params.
 * Works around Express v5 read-only req.query issues.
 */

function sanitize(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const clean = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.startsWith("$") || key.includes(".")) {
        // Strip keys containing operators or dots to prevent NoSQL injection
        continue;
      }
      clean[key] = sanitize(obj[key]);
    }
  }
  return clean;
}

export const nosqlSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    try {
      req.query = sanitize(req.query);
    } catch {
      // Workaround for Express v5 getter/read-only req.query
      const cleanQuery = sanitize(req.query);
      Object.defineProperty(req, "query", {
        value: cleanQuery,
        writable: true,
        configurable: true,
      });
    }
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
};
