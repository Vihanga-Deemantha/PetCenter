import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { getMe, logoutUser, refreshToken } from "../api/auth.api";
import { setAccessToken, clearAccessToken } from "../api/tokenStore";

const AuthContext = createContext(null);

// React Strict Mode intentionally mounts effects twice in development. A
// refresh token is rotated on every use, so two parallel bootstrap refreshes
// can invalidate each other. Share one promise for the lifetime of this app
// session and perform the rotation exactly once.
let sessionBootstrapPromise = null;

const bootstrapSession = () => {
  sessionBootstrapPromise ||= (async () => {
    const refreshRes = await refreshToken();
    setAccessToken(refreshRes.data.accessToken);
    const meRes = await getMe();
    return meRes.data;
  })();
  return sessionBootstrapPromise;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // On mount: the access token lives in memory only, so a page reload always
  // starts with none. Silently exchange the httpOnly refresh-token cookie for
  // a fresh one (this is a no-op 401 if the user was never logged in).
  useEffect(() => {
    const verify = async () => {
      try {
        const currentUser = await bootstrapSession();
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (err) {
        // A 401 means there's genuinely no valid session — clear it. Any
        // other failure (network blip, transient 500) is not proof the user
        // is logged out, so leave the optimistically-cached user alone
        // rather than bouncing them to a logged-out state.
        if (err.response?.status === 401) {
          clearAccessToken();
          localStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = useCallback((userData, accessToken) => {
    setAccessToken(accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    clearAccessToken();
    sessionBootstrapPromise = null;
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem("user", JSON.stringify(merged));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
