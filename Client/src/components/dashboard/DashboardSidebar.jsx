import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DASHBOARD_TABS } from "./dashboardTabs";

export default function DashboardSidebar({ activeTab, onSelect }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-full md:w-64 bg-[#292925] text-light flex flex-col md:sticky md:top-0 md:h-screen shrink-0 z-20">
      <NavLink to="/" className="flex items-center gap-2.5 px-6 py-6 border-b border-white/10">
        <span className="w-8.5 h-8.5 rounded-full bg-accent flex items-center justify-center text-light font-heading text-[17px]">P</span>
        <span className="font-heading text-[19px] font-semibold tracking-tight">PetCenter</span>
      </NavLink>

      <nav className="flex-1 p-4 space-y-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
        {DASHBOARD_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className={`flex items-center gap-3 px-4 py-2.75 rounded-xl text-[13.5px] font-medium transition-colors shrink-0 md:shrink text-left w-full ${
                isActive ? "bg-white/10 text-light" : "text-[#B9B6AC] hover:bg-white/5 hover:text-light"
              }`}
            >
              <Icon size={17} /> {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <NavLink to="/" className="flex items-center gap-3 px-4 py-2.75 rounded-xl text-[13.5px] font-medium text-[#B9B6AC] hover:bg-white/5 hover:text-light transition-colors">
          <ArrowLeft size={17} /> Back to site
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.75 rounded-xl text-[13.5px] font-medium text-[#e0a58f] hover:bg-white/5 transition-colors"
        >
          <LogOut size={17} /> Log out
        </button>
        <button
          onClick={() => onSelect("details")}
          className="w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="w-8.5 h-8.5 rounded-full bg-accent/30 flex items-center justify-center text-light text-xs font-semibold overflow-hidden shrink-0">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className="m-0 text-[13px] font-semibold truncate">{user?.name}</p>
            <p className="m-0 text-[11px] text-[#8a8a80] truncate">View profile</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
