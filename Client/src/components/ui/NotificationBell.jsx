import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

const TYPE_ICONS = {
  listing_approved: "✅",
  listing_removed: "🗑️",
  order_status_changed: "📦",
  donation_campaign_closing: "⏰",
  review_received: "⭐",
};

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllAsRead, removeNotification } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) await markRead(notif._id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title="Notifications"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: "currentColor",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: -2,
            right: -2,
            background: "#ef4444",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            borderRadius: "50%",
            minWidth: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 2px",
            border: "2px solid #fff",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 12px)",
          right: 0,
          width: 360,
          maxHeight: 480,
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.14)",
          border: "1px solid #f1f5f9",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              Notifications {unreadCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginLeft: 4 }}>
                  ({unreadCount})
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#6366f1",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 8px",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "#94a3b8",
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>You're all caught up!</div>
                <div style={{ fontSize: 12 }}>No new notifications</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 18px",
                    cursor: notif.link ? "pointer" : "default",
                    background: notif.isRead ? "#fff" : "#faf7ff",
                    borderBottom: "0.5px solid #f1f5f9",
                    transition: "background 0.1s",
                    alignItems: "flex-start",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f9ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = notif.isRead ? "#fff" : "#faf7ff"; }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                    {TYPE_ICONS[notif.type] || "🔔"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <span style={{
                      width: 8,
                      height: 8,
                      background: "#6366f1",
                      borderRadius: "50%",
                      flexShrink: 0,
                      marginTop: 6,
                    }} />
                  )}
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif._id);
                    }}
                    title="Remove"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#cbd5e1",
                      fontSize: 16,
                      padding: "0 2px",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
