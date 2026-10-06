import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DASHBOARD_TABS } from "./dashboardTabs";
import logo from "../../assets/logo.png";

export default function DashboardSidebar({ activeTab, onSelect }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="z-20 w-full shrink-0 bg-[#292925] text-light md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col">
      <NavLink to="/" className="hidden items-center gap-2.5 border-b border-white/10 px-6 py-6 md:flex">
        <img src={logo} alt="PetCenter" className="h-9 w-9 shrink-0 object-contain" />
        <span className="font-heading text-[19px] font-semibold tracking-tight">PetCenter</span>
      </NavLink>

      <nav className="flex gap-1.5 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-1 md:flex-col md:gap-0 md:space-y-1 md:overflow-visible md:p-4">
        {DASHBOARD_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className={`flex w-auto shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.75 text-left text-[13px] font-medium whitespace-nowrap transition-colors md:w-full md:shrink md:gap-3 md:text-[13.5px] ${
                isActive ? "bg-white/10 text-light" : "text-[#B9B6AC] hover:bg-white/5 hover:text-light"
              }`}
            >
              <Icon size={17} /> {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="hidden space-y-1 border-t border-white/10 p-4 md:block">
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
