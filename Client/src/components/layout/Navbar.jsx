import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { LogOut, User, Menu, X, Plus, LayoutDashboard, ClipboardList, ShoppingCart, Package, Heart } from "lucide-react";
import NotificationBell from "../ui/NotificationBell";
import { useCart } from "../../context/CartContext";
import logo from "../../assets/logo.png";

const NAV_LINKS = [
  { name: "Pets", path: "/marketplace" },
  { name: "Store", path: "/products" },
  { name: "Campaigns", path: "/campaigns" },
  { name: "Shelters", path: "/shelters" },
  { name: "Ecosystem", path: "/ecosystem" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="w-full">
      {/* Announcement bar — scrolls away with the page, header below is sticky */}
      <div className="bg-secondary text-light text-center py-2.5 px-5 text-[12px] tracking-wider font-medium">
        Free delivery over $75 &nbsp;·&nbsp; Every order supports a partner shelter
      </div>

      <header className="sticky top-0 z-1000 bg-light/92 backdrop-blur-xl border-b border-[#E8E2D8]">
        <nav className="max-w-7xl mx-auto px-7 py-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            <img src={logo} alt="PetCenter" className="w-9 h-9 object-contain" />
            <span className="font-heading text-[22px] font-semibold text-[#292925] tracking-tight">PetCenter</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-7 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`pb-0.5 border-b transition-colors ${
                    active ? "text-[#292925] border-primary" : "text-secondary border-transparent hover:text-[#292925]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="hidden xl:flex items-center gap-3.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-5">
                <Link to="/create-listing" className="btn btn-primary px-5 py-2.5 text-xs font-semibold">
                  <Plus size={16} /> Post Ad
                </Link>
                <div className="flex items-center gap-4 border-l border-[#E8E2D8] pl-5 ml-1">
                  {user.role === "admin" && (
                    <Link to="/admin" className="text-secondary hover:text-primary transition-colors" title="Admin Dashboard">
                      <LayoutDashboard size={19} />
                    </Link>
                  )}
                  <Link to="/my-listings" className="text-secondary hover:text-primary transition-colors" title="My Listings">
                    <ClipboardList size={19} />
                  </Link>
                  <Link to="/favorites" className="text-secondary hover:text-primary transition-colors" title="My Favorites">
                    <Heart size={19} />
                  </Link>
                  <Link to="/orders" className="text-secondary hover:text-primary transition-colors" title="My Orders">
                    <Package size={19} />
                  </Link>
                  <Link to="/cart" className="relative text-secondary hover:text-primary transition-colors" title="Shopping Cart">
                    <ShoppingCart size={19} />
                    {itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-light">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                  <span className="text-secondary hover:text-primary transition-colors">
                    <NotificationBell />
                  </span>
                  <Link to="/dashboard" className="text-secondary hover:text-primary transition-colors" title="Dashboard">
                    <User size={19} />
                  </Link>
                  <button onClick={handleLogout} className="text-[#8a8a7e] hover:text-primary transition-colors cursor-pointer" title="Logout">
                    <LogOut size={19} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <Link to="/cart" className="relative mr-1 text-secondary hover:text-primary transition-colors" title="Shopping Cart">
                  <ShoppingCart size={19} />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-light">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link to="/login" className="font-medium text-sm text-secondary hover:text-[#292925] px-1 py-2 transition-colors">
                  Log in
                </Link>
                <Motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/register" className="btn btn-primary px-6 py-2.5 text-sm">
                    Join now
                  </Link>
                </Motion.div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="xl:hidden p-2.5 rounded-xl bg-[#F2EFE7] text-[#292925] hover:bg-[#E8E2D8] transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <Motion.div
                initial={{ opacity: 0, x: "100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-0 top-0 left-0 w-full h-screen bg-light z-999 flex flex-col p-10 pt-28 overflow-y-auto"
              >
                <div className="flex flex-col gap-6">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="text-3xl font-heading font-medium text-[#292925] tracking-tight"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-12 pt-12 border-t border-[#E8E2D8]">
                  {user ? (
                    <div className="flex flex-col gap-6">
                      <Link to="/create-listing" className="btn btn-primary py-4 text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                        Post a New Ad
                      </Link>
                      <div className="flex flex-col gap-3">
                        <Link to="/cart" className="w-full py-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center gap-3 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                          <ShoppingCart size={20} /> Cart {itemCount > 0 && `(${itemCount})`}
                        </Link>
                        {user.role === "admin" && (
                          <Link to="/admin" className="w-full py-4 bg-secondary/10 border border-secondary/20 text-secondary rounded-2xl flex items-center justify-center gap-3 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                            <LayoutDashboard size={20} /> Admin Dashboard
                          </Link>
                        )}
                        <div className="flex gap-4">
                          <Link to="/favorites" className="flex-1 py-4 bg-[#F2EFE7] text-primary rounded-2xl flex items-center justify-center gap-3 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                            <Heart size={20} /> Favorites
                          </Link>
                          <Link to="/orders" className="flex-1 py-4 bg-primary/5 border border-primary/10 text-primary rounded-2xl flex items-center justify-center gap-3 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                            <Package size={20} /> Orders
                          </Link>
                        </div>
                        <Link to="/my-listings" className="w-full py-4 bg-[#F7F4ED] border border-[#E8E2D8] rounded-2xl flex items-center justify-center gap-3 font-semibold text-secondary" onClick={() => setIsMobileMenuOpen(false)}>
                          <ClipboardList size={20} /> My Listings
                        </Link>
                        <Link to="/dashboard" className="w-full py-4 bg-[#F7F4ED] border border-[#E8E2D8] rounded-2xl flex items-center justify-center gap-3 font-semibold text-secondary" onClick={() => setIsMobileMenuOpen(false)}>
                          <User size={20} /> Dashboard
                        </Link>
                        <button onClick={handleLogout} className="w-full py-4 bg-primary/5 rounded-2xl flex items-center justify-center gap-3 font-semibold text-primary">
                          <LogOut size={20} /> Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Link to="/cart" className="w-full py-4 bg-[#F7F4ED] border border-[#E8E2D8] text-secondary rounded-2xl flex items-center justify-center gap-3 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                        <ShoppingCart size={20} /> Cart {itemCount > 0 && `(${itemCount})`}
                      </Link>
                      <Link to="/login" className="w-full py-4 border border-[#E8E2D8] rounded-2xl text-center font-semibold text-[#292925]" onClick={() => setIsMobileMenuOpen(false)}>
                        Log in
                      </Link>
                      <Link to="/register" className="btn btn-primary py-4 text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
    </div>
  );
};

export default Navbar;
