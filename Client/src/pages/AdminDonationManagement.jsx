import React, { useState, useEffect } from "react";
import { Search, Download, RefreshCw, Gift } from "lucide-react";
import { getAdminDonations } from "../api/donation.api";

const AdminDonationManagement = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminDonations();
      setDonations(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadCSV = () => {
    const headers = ["Donation ID", "Campaign Title", "Donor Name", "Amount (USD)", "Status", "Date", "Message"];
    const rows = donations.map((d) => [
      d._id,
      d.campaignId?.title || "Unknown Campaign",
      d.displayName,
      (d.amount / 100).toFixed(2),
      d.status,
      new Date(d.createdAt).toLocaleString(),
      d.message || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `donations_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = donations.filter((d) =>
    d.displayName.toLowerCase().includes(search.toLowerCase()) ||
    (d.campaignId?.title || "").toLowerCase().includes(search.toLowerCase()) ||
    d.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Donations</h1>
          <p className="text-sm text-slate-400 font-semibold">Track campaign donor transactions and download reports.</p>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={donations.length === 0}
          className="btn btn-primary bg-gradient-to-br from-secondary to-accent shadow-rose-500/20 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 self-start cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Export CSV Report
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by donor, campaign, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
        />
      </div>

      {/* Donations Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={24} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 font-semibold bg-white/50">
          No donations found.
        </div>
      ) : (
        <div className="glass-card bg-white border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-5">Donor</th>
                <th className="p-5">Campaign</th>
                <th className="p-5">Amount (USD)</th>
                <th className="p-5">Status</th>
                <th className="p-5">Date</th>
                <th className="p-5">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold text-sm">
              {filtered.map((don) => (
                <tr key={don._id} className="hover:bg-slate-50/30">
                  <td className="p-5">
                    <div className="font-black text-slate-900">{don.displayName}</div>
                    {don.userId && (
                      <div className="text-[10px] text-slate-400 font-bold">{don.userId.email}</div>
                    )}
                  </td>
                  <td className="p-5 text-xs text-slate-500 font-bold max-w-xs truncate">{don.campaignId?.title || "Unknown Campaign"}</td>
                  <td className="p-5 font-black text-secondary">${(don.amount / 100).toFixed(2)}</td>
                  <td className="p-5">
                    <span className={`badge ${
                      don.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                      don.status === "pending" ? "bg-amber-50 text-amber-600" :
                      don.status === "failed" ? "bg-rose-50 text-rose-600" :
                      "bg-slate-100 text-slate-500" // refunded
                    }`}>
                      {don.status}
                    </span>
                  </td>
                  <td className="p-5 text-xs text-slate-400 font-bold">{new Date(don.createdAt).toLocaleString()}</td>
                  <td className="p-5 text-xs text-slate-500 max-w-xs truncate font-medium">{don.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDonationManagement;
