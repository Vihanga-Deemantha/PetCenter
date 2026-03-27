import React from "react";
import { useAuth } from "../context/AuthContext";
import { Activity, Users, ClipboardList, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="admin-dashboard pb-24 px-5">
      <div className="mb-16 py-8 border-b border-slate-200">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-slate-900">Admin Control Center</h1>
        <p className="text-slate-500 text-lg font-medium">Welcome back, <span className="text-primary font-black">{user?.name}</span>. Here's your high-level pet hub overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Total Users", value: "1,280", icon: <Users size={24} />, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
          { label: "Pet Listings", value: "450", icon: <ClipboardList size={24} />, color: "bg-rose-50 text-rose-600 border-rose-100" },
          { label: "Store Sales", value: "$12,400", icon: <TrendingUp size={24} />, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { label: "Site Traffic", value: "8.5k", icon: <Activity size={24} />, color: "bg-amber-50 text-amber-600 border-amber-100" }
        ].map((stat, i) => (
          <Motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 bg-white border-slate-100 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-[20px] border shadow-sm ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      <Motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-card mt-12 p-12 md:p-20 text-center bg-slate-50 border-slate-200 border-dashed border-2"
      >
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
          <Activity size={40} className="animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Advanced Analytics Pending</h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto text-lg leading-relaxed">
          Full administrative scale management for user moderation, deep-product analytics, and regional reports is scheduled for upcoming platform expansions.
        </p>
      </Motion.div>
    </div>
  );
};

export default AdminDashboard;
