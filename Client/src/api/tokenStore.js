// The access token lives in memory only — never localStorage — so it isn't
// readable by any injected/third-party script via the DOM or devtools storage
// tab. It's short-lived (15m) and gets rehydrated on page load by silently
// exchanging the httpOnly refresh-token cookie for a new one (see
// AuthContext). This is a plain module (not React state) because the axios
// interceptors that need it run outside the React tree.
let accessToken = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const clearAccessToken = () => {
  accessToken = null;
};
