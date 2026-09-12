import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { PawPrint, LogOut, User, Menu, X, Plus, LayoutDashboard, ClipboardList, ShoppingCart, Package, ChevronDown, Hammer, Image, Heart } from "lucide-react";
import NotificationBell from "../ui/NotificationBell";
import { useCart } from "../../context/CartContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHomeTransparent = location.pathname === "/" && !isScrolled;

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Pets", path: "/marketplace" },
    { name: "Store", path: "/products" },
    { name: "Campaigns", path: "/campaigns" },
    { name: "Shelters", path: "/shelters" },
    { name: "Ecosystem", path: "/ecosystem" },
    { name: "About", path: "/about" },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-1000 transition-all duration-500 px-[5%] h-20 flex items-center justify-between ${
        isScrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm" 
          : "bg-transparent py-6"
      }`}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
        <Motion.div
          initial={{ rotate: -10 }}
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20"
        >
          <PawPrint size={24} className="text-white" />
        </Motion.div>
        <span className={`font-heading font-black text-2xl tracking-tighter transition-colors ${
          isHomeTransparent ? "text-white" : "text-slate-900"
        }`}>
          PetCenter
        </span>
      </Link>
      
      {/* Desktop Navigation — xl (1280px), not lg (1024px): at 1024-1279px
          this row (logo + 7 links + action icons) doesn't fit and collides */}
      <div className="hidden xl:flex items-center gap-10">
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            to={link.path} 
            className={`relative font-bold text-sm tracking-wide transition-colors group ${
              location.pathname === link.path 
                ? (isHomeTransparent ? "text-white" : "text-primary") 
                : (isHomeTransparent ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-slate-900")
            }`}
          >
            {link.name}
            <span className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 group-hover:w-full ${
              isHomeTransparent ? "bg-white" : "bg-primary"
            } ${
              location.pathname === link.path ? "w-full" : "w-0"
            }`} />
          </Link>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="hidden xl:flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-6">
            <Link to="/create-listing" className="btn btn-primary px-5 py-2.5 text-xs font-black rounded-xl flex items-center gap-2">
              <Plus size={16} /> Post Ad
            </Link>
            
            <div className={`flex items-center gap-4 border-l pl-6 ml-2 transition-colors ${
              isHomeTransparent ? "border-white/20" : "border-slate-200"
            }`}>
              {user.role === "admin" && (
                <Link to="/admin" className={isHomeTransparent ? "text-white/70 hover:text-white transition-colors" : "text-slate-500 hover:text-primary transition-colors"} title="Admin Dashboard">
                  <LayoutDashboard size={20} />
                </Link>
              )}
              <Link to="/my-listings" className={isHomeTransparent ? "text-white/70 hover:text-white transition-colors" : "text-slate-500 hover:text-primary transition-colors"} title="My Listings">
                <ClipboardList size={20} />
              </Link>
              <Link to="/favorites" className={isHomeTransparent ? "text-white/70 hover:text-white transition-colors" : "text-slate-500 hover:text-primary transition-colors"} title="My Favorites">
                <Heart size={20} />
              </Link>
              <Link to="/orders" className={isHomeTransparent ? "text-white/70 hover:text-white transition-colors" : "text-slate-500 hover:text-primary transition-colors"} title="My Orders">
                <Package size={20} />
              </Link>
              <Link to="/cart" className={`relative transition-colors ${isHomeTransparent ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-primary"}`} title="Shopping Cart">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white shadow-xs">
                    {itemCount}
                  </span>
                )}
              </Link>
              <span className={isHomeTransparent ? "text-white/70 hover:text-white transition-colors" : "text-slate-500 hover:text-primary transition-colors"}>
                <NotificationBell />
              </span>
              <Link to="/profile" className={isHomeTransparent ? "text-white/70 hover:text-white transition-colors" : "text-slate-500 hover:text-primary transition-colors"} title="Profile">
                <User size={20} />
              </Link>
              <button 
                onClick={handleLogout} 
                className={isHomeTransparent ? "text-white/50 hover:text-rose-400 transition-colors cursor-pointer" : "text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"}
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/cart" className={`relative mr-2 transition-colors ${
              isHomeTransparent ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-primary"
            }`} title="Shopping Cart">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link to="/login" className={`font-bold text-sm px-4 py-2 transition-colors ${
              isHomeTransparent ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}>
              Login
            </Link>
            <Motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link 
                to="/register" 
                className="btn btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                Join Now
              </Link>
            </Motion.div>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className={`xl:hidden p-3 rounded-xl transition-all ${
          isHomeTransparent 
            ? "bg-white/10 text-white hover:bg-white/20" 
            : "bg-slate-50 text-slate-800 hover:bg-slate-100"
        }`} 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <Motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 top-0 left-0 w-full h-screen bg-white z-999 flex flex-col p-10 pt-28"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className="text-3xl font-black text-slate-900 tracking-tighter" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="mt-12 pt-12 border-t border-slate-100">
              {user ? (
                <div className="flex flex-col gap-6">
                  <Link to="/create-listing" className="btn btn-primary py-5 text-xl rounded-2xl" onClick={() => setIsMobileMenuOpen(false)}>
                    Post a New Ad
                  </Link>
                  <div className="flex flex-col gap-3">
                    <Link to="/cart" className="w-full py-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center gap-3 font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                      <ShoppingCart size={20} /> Cart {itemCount > 0 && `(${itemCount})`}
                    </Link>
                    <Link to="/ecosystem/my-builds" className="w-full py-4 bg-primary/5 border border-primary/10 text-primary rounded-2xl flex items-center justify-center gap-3 font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                      🌿 My Builds
                    </Link>
                    <div className="flex gap-4">
                      <Link to="/favorites" className="flex-1 py-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center gap-3 font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                        <Heart size={20} /> Favorites
                      </Link>
                      <Link to="/orders" className="flex-1 py-4 bg-primary/5 border border-primary/10 text-primary rounded-2xl flex items-center justify-center gap-3 font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                        <Package size={20} /> Orders
                      </Link>
                    </div>
                    <div className="flex gap-4">
                      <Link to="/profile" className="w-full py-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>
                        <User size={20} /> Profile
                      </Link>
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className="w-full py-4 bg-rose-50 rounded-2xl flex items-center justify-center gap-3 font-bold text-rose-500"
                    >
                      <LogOut size={20} /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link to="/cart" className="w-full py-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center gap-3 font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                    <ShoppingCart size={20} /> Cart {itemCount > 0 && `(${itemCount})`}
                  </Link>
                  <Link to="/login" className="w-full py-5 border-2 border-slate-100 rounded-2xl text-center font-bold text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary py-5 text-xl rounded-2xl" onClick={() => setIsMobileMenuOpen(false)}>
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
