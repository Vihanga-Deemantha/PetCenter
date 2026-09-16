import React, { useEffect, useRef, useState } from "react";
import { googleLogin } from "../../api/auth.api";

let scriptPromise;
const loadGoogleScript = () => {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return scriptPromise;
};

// Renders Google's own Identity Services button (required to trigger the
// real sign-in popup — a hand-styled lookalike can't invoke the ID-token
// flow), sized to match the pill buttons around it as closely as Google's
// customization options allow.
const GoogleSignInButton = ({ onSuccess, onError }) => {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const data = await googleLogin(response.credential);
              onSuccess(data.data.user, data.data.accessToken);
            } catch (err) {
              onError?.(err.response?.data?.message || "Google sign-in failed. Please try again.");
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width: containerRef.current.offsetWidth || 240,
        });
        setReady(true);
      })
      .catch(() => onError?.("Couldn't load Google sign-in — check your connection and try again."));

    return () => {
      cancelled = true;
    };
  }, [clientId, onSuccess, onError]);

  if (!clientId) {
    return (
      <div className="w-full border border-[#cfc8ba] rounded-full py-3.25 text-center text-[13px] text-[#8a8a80] bg-white select-none">
        Google sign-in unavailable
      </div>
    );
  }

  return <div ref={containerRef} className="w-full flex justify-center [&>div]:w-full!" style={{ minHeight: ready ? undefined : 44 }} />;
};

export default GoogleSignInButton;
