import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion as Motion } from "framer-motion";
import { PawPrint, LogOut, User, Menu, X,PlusSquare } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="h-20 flex items-center justify-between px-[5%] bg-white/70 backdrop-blur-md sticky top-0 z-[1000] border-b border-black/5">
      <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
        <Motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <PawPrint size={32} className="text-primary" />
        </Motion.div>
        <span className="font-heading font-black text-2xl tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          PetCenter
        </span>
      </Link>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <Link to="/marketplace" className="nav-link">Marketplace</Link>
        <Link to="/products" className="nav-link">Store</Link>
        
        {user ? (
          <div className="flex items-center gap-6">
            <Link to="/create-listing" className="btn btn-primary px-5 py-2.5 text-xs font-black">
              <PlusSquare size={16} /> Post Ad
            </Link>
            <Link to="/my-listings" className="nav-link">My Ads</Link>
            <Link to="/profile" className="flex items-center gap-2 nav-link">
              <User size={18} />
              <span>Profile</span>
            </Link>
            {user.role === "admin" && (
              <Link to="/admin" className="nav-link text-accent">Dashboard</Link>
            )}
            <Motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout} 
              className="text-slate-400 hover:text-rose-500 transition-colors p-2"
            >
              <LogOut size={20} />
            </Motion.button>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <Link to="/login" className="nav-link">Login</Link>
            <Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="btn btn-primary px-8 py-3">Join Now</Link>
            </Motion.div>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden p-2 text-slate-600 outline-none" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Drawer */}
      <Motion.div 
        initial={false}
        animate={{ x: isMobileMenuOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 top-20 bg-white/95 backdrop-blur-xl z-[999] md:hidden flex flex-col p-8 gap-6 border-t border-slate-100"
      >
        <Link to="/marketplace" className="text-2xl font-black text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>Marketplace</Link>
        <Link to="/products" className="text-2xl font-black text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>Pet Store</Link>
        
        <div className="h-px bg-slate-100 my-4" />

        {user ? (
          <>
            <Link to="/my-listings" className="text-xl font-bold text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>My Advertisements</Link>
            <Link to="/profile" className="text-xl font-bold text-slate-600" onClick={() => setIsMobileMenuOpen(false)}>User Profile</Link>
            <Link to="/create-listing" className="btn btn-primary py-5 text-xl" onClick={() => setIsMobileMenuOpen(false)}>Post a New Ad</Link>
            <button 
              onClick={handleLogout} 
              className="mt-auto flex items-center justify-center gap-3 py-4 text-rose-500 font-black text-xl border-t border-slate-100 pt-8"
            >
              <LogOut size={24} /> Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-2xl font-black text-slate-800" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            <Link to="/register" className="btn btn-primary py-5 text-xl" onClick={() => setIsMobileMenuOpen(false)}>Create Account</Link>
          </>
        )}
      </Motion.div>
    </nav>
  );
};

export default Navbar;
