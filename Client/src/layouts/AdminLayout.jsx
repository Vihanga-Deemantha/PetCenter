import React from "react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Users, Heart, LogOut, ArrowLeft, Package, ClipboardList, Flame, Gift, Landmark, Leaf } from "lucide-react";

const AdminLayout = () => {
  const { user, logout } = useAuth();

  // Protect admin layout globally
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: "Dashboard", path: "/admin", end: true, icon: <LayoutDashboard size={20} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={20} /> },
    { name: "Listings", path: "/admin/listings", icon: <Heart size={20} /> },
    { name: "Products", path: "/admin/products", icon: <Package size={20} /> },
    { name: "Orders", path: "/admin/orders", icon: <ClipboardList size={20} /> },
    { name: "Campaigns", path: "/admin/campaigns", icon: <Flame size={20} /> },
    { name: "Donations", path: "/admin/donations", icon: <Gift size={20} /> },
    { name: "Shelters", path: "/admin/shelters", icon: <Landmark size={20} /> },
    { name: "Ecosystem", path: "/admin/ecosystem", icon: <Leaf size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 md:h-screen z-20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between md:justify-center">
          <NavLink to="/" className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">🐾</span>
            PetCenter <span className="text-primary text-xs tracking-widest uppercase ml-1">Admin</span>
          </NavLink>
        </div>

        <nav className="p-4 flex-1 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all shrink-0 md:shrink border ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700"
                }`
              }
            >
              {item.icon} {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2 hidden md:block">
          <NavLink to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <ArrowLeft size={20} /> Back to Site
          </NavLink>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
