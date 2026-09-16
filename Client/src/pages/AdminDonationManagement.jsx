import React, { useState, useEffect } from "react";
import { Search, Download, RefreshCw } from "lucide-react";
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
    URL.revokeObjectURL(url);
  };

  const filtered = donations.filter((d) =>
    d.displayName.toLowerCase().includes(search.toLowerCase()) ||
    (d.campaignId?.title || "").toLowerCase().includes(search.toLowerCase()) ||
    d.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-7 border-b border-border">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Admin</p>
          <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#292925]">Donations</h1>
          <p className="text-sm text-[#8a8a80] mt-1">Track campaign donor transactions and download reports.</p>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={donations.length === 0}
          className="btn btn-primary self-start cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Export CSV report
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a80]" size={16} />
        <input
          type="text"
          placeholder="Search by donor, campaign, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.75 rounded-xl border border-border bg-white focus:border-accent text-sm outline-none"
        />
      </div>

      {/* Donations Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={24} className="animate-spin text-[#c9c2b3]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-[22px] p-12 text-center text-[#8a8a80] font-medium">
          No donations found.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[22px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-border bg-light/60 text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80]">
                <th className="p-5">Donor</th>
                <th className="p-5">Campaign</th>
                <th className="p-5">Amount (USD)</th>
                <th className="p-5">Status</th>
                <th className="p-5">Date</th>
                <th className="p-5">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[#3f3f38] text-sm">
              {filtered.map((don) => (
                <tr key={don._id} className="hover:bg-light/40">
                  <td className="p-5">
                    <div className="font-semibold text-[#292925]">{don.displayName}</div>
                    {don.userId && (
                      <div className="text-[10px] text-[#8a8a80] font-medium">{don.userId.email}</div>
                    )}
                  </td>
                  <td className="p-5 text-xs text-[#6e6e64] font-medium max-w-xs truncate">{don.campaignId?.title || "Unknown Campaign"}</td>
                  <td className="p-5 font-semibold text-secondary">${(don.amount / 100).toFixed(2)}</td>
                  <td className="p-5">
                    <span className={`badge ${
                      don.status === "completed" ? "bg-[#E9EDE4] text-[#40543C]" :
                      don.status === "pending" ? "bg-[#F7E9DF] text-[#8f4a28]" :
                      don.status === "failed" ? "bg-rose-50 text-rose-600" :
                      "bg-[#EFEBE2] text-[#6e6e64]" // refunded
                    }`}>
                      {don.status}
                    </span>
                  </td>
                  <td className="p-5 text-xs text-[#8a8a80] font-medium">{new Date(don.createdAt).toLocaleString()}</td>
                  <td className="p-5 text-xs text-[#6e6e64] max-w-xs truncate">{don.message || "—"}</td>
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
