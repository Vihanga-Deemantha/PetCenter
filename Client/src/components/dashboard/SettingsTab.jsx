import React, { useState } from "react";
import { Lock, Bell, Download, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { changePassword, updateProfile } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { setAccessToken } from "../../api/tokenStore";

export default function SettingsTab() {
  return (
    <div>
      <div className="mb-7">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Dashboard</p>
        <h1 className="font-heading text-[30px] sm:text-[36px] font-medium tracking-tight text-[#292925]">Settings</h1>
      </div>

      <div className="flex flex-col gap-6">
        <PasswordCard />
        <NotificationsCard />
        <DataCard />
      </div>
    </div>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await changePassword(form.currentPassword, form.newPassword);
      // The server invalidates every existing session (including this tab's)
      // on a password change and issues a fresh access token in the response
      // specifically so this tab can keep going without an extra login.
      if (res.data?.accessToken) setAccessToken(res.data.accessToken);
      setSuccess("Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-7 sm:p-8">
      <div className="flex items-center gap-2.5 mb-5">
        <Lock size={17} className="text-primary" />
        <h2 className="m-0 font-heading text-lg font-medium text-[#292925]">Change password</h2>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#E9EDE4] text-[#40543C] rounded-xl mb-5 text-sm font-medium">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-5 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <input
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={onChange}
          placeholder="Current password"
          required
          className="w-full px-4.5 py-3 rounded-xl bg-light border border-border focus:border-accent outline-none text-sm font-medium transition-colors"
        />
        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={onChange}
          placeholder="New password"
          required
          minLength={6}
          className="w-full px-4.5 py-3 rounded-xl bg-light border border-border focus:border-accent outline-none text-sm font-medium transition-colors"
        />
        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={onChange}
          placeholder="Confirm new password"
          required
          minLength={6}
          className="w-full px-4.5 py-3 rounded-xl bg-light border border-border focus:border-accent outline-none text-sm font-medium transition-colors"
        />
        <button type="submit" disabled={submitting} className="btn btn-primary px-6 py-2.75 text-sm">
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

const NOTIFICATION_DEFAULTS = { orderUpdates: true, campaignUpdates: true, productDrops: false };

function NotificationsCard() {
  const { user, updateUser } = useAuth();
  const [toggles, setToggles] = useState({ ...NOTIFICATION_DEFAULTS, ...user?.notificationPreferences });
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");

  const toggle = async (key) => {
    const next = { ...toggles, [key]: !toggles[key] };
    setToggles(next);
    setSavingKey(key);
    setError("");
    try {
      const res = await updateProfile({ notificationPreferences: next });
      updateUser(res.data);
    } catch {
      setToggles((prev) => ({ ...prev, [key]: !prev[key] })); // Revert on failure
      setError("Couldn't save that change. Please try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const items = [
    { key: "orderUpdates", label: "Order updates", desc: "Shipping and delivery status changes" },
    { key: "campaignUpdates", label: "Campaign updates", desc: "News from campaigns you've supported" },
    { key: "productDrops", label: "New arrivals", desc: "New products in the store" },
  ];

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-7 sm:p-8">
      <div className="flex items-center gap-2.5 mb-5">
        <Bell size={17} className="text-primary" />
        <h2 className="m-0 font-heading text-lg font-medium text-[#292925]">Notifications</h2>
      </div>
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-5 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <div>
              <p className="m-0 text-sm font-semibold text-[#292925]">{item.label}</p>
              <p className="m-0 mt-0.5 text-[12.5px] text-[#8a8a80]">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              disabled={savingKey === item.key}
              className={`w-10.5 h-6 rounded-full shrink-0 transition-colors relative disabled:opacity-60 ${toggles[item.key] ? "bg-secondary" : "bg-border"}`}
            >
              <span className={`absolute top-0.75 w-4.5 h-4.5 rounded-full bg-white transition-all ${toggles[item.key] ? "left-5.25" : "left-0.75"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataCard() {
  const [msg, setMsg] = useState("");
  return (
    <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-7 sm:p-8">
      <div className="flex items-center gap-2.5 mb-5">
        <Download size={17} className="text-primary" />
        <h2 className="m-0 font-heading text-lg font-medium text-[#292925]">Your data</h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setMsg("To download a copy of your data, please contact support.")}
          className="btn border border-border text-secondary hover:bg-light px-5 py-2.5 text-sm"
        >
          <Download size={15} /> Download my data
        </button>
        <button
          onClick={() => setMsg("To delete your account, please contact support.")}
          className="btn bg-rose-50 text-rose-600 hover:bg-rose-100 px-5 py-2.5 text-sm"
        >
          <Trash2 size={15} /> Delete account
        </button>
      </div>
      {msg && <p className="mt-4 text-[12.5px] text-[#8a8a80]">{msg}</p>}
    </div>
  );
}
