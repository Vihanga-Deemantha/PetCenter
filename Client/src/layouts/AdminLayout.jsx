import React from "react";
import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Users, Heart, LogOut, ArrowLeft, Package, ClipboardList, Flame, Gift, Landmark, Leaf, Star } from "lucide-react";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Protect admin layout globally
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin", end: true, icon: <LayoutDashboard size={18} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={18} /> },
    { name: "Listings", path: "/admin/listings", icon: <Heart size={18} /> },
    { name: "Products", path: "/admin/products", icon: <Package size={18} /> },
    { name: "Orders", path: "/admin/orders", icon: <ClipboardList size={18} /> },
    { name: "Campaigns", path: "/admin/campaigns", icon: <Flame size={18} /> },
    { name: "Donations", path: "/admin/donations", icon: <Gift size={18} /> },
    { name: "Shelters", path: "/admin/shelters", icon: <Landmark size={18} /> },
    { name: "Ecosystem", path: "/admin/ecosystem", icon: <Leaf size={18} /> },
    { name: "Reviews", path: "/admin/reviews", icon: <Star size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-light flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#292925] text-light flex flex-col md:sticky md:top-0 md:h-screen z-20 shrink-0">
        <NavLink to="/" className="flex items-center gap-2.5 px-6 py-6 border-b border-white/10">
          <span className="w-8.5 h-8.5 rounded-full bg-accent flex items-center justify-center text-light font-heading text-[17px]">P</span>
          <span>
            <span className="block font-heading text-[19px] font-semibold tracking-tight leading-tight">PetCenter</span>
            <span className="block text-[11px] tracking-[0.14em] uppercase text-accent">Admin</span>
          </span>
        </NavLink>

        <nav className="p-4 flex-1 space-y-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.75 rounded-xl text-[13.5px] font-medium transition-colors shrink-0 md:shrink ${
                  isActive ? "bg-white/10 text-light" : "text-[#B9B6AC] hover:bg-white/5 hover:text-light"
                }`
              }
            >
              {item.icon} {item.name}
            </NavLink>
          ))}
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
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
