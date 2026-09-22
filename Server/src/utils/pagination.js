// Clamps a client-supplied `limit` query param to a sane range so a public,
// unauthenticated list endpoint can't be told to return (and have Mongo sort/
// scan) an unbounded number of documents in one request.
export const clampLimit = (value, { max = 100, fallback = 10 } = {}) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
};

// Same idea for `page` — guards against negative/zero/NaN producing a
// negative `skip` that some Mongo drivers reject outright.
export const clampPage = (value) => {
  const n = parseInt(value, 10);
  return !Number.isFinite(n) || n < 1 ? 1 : n;
};
