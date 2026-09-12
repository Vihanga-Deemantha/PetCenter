// Escapes regex metacharacters in user-supplied search input before it's used
// to build a RegExp. Without this, a crafted pattern (e.g. nested quantifiers)
// passed straight into `new RegExp(userInput)` on a public, unauthenticated
// endpoint can cause catastrophic backtracking and hang the event loop.
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default escapeRegExp;
