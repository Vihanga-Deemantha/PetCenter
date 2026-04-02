import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import ListingDetails from "./pages/ListingDetails";
import Profile from "./pages/Profile";
import MyListings from "./pages/MyListings";
import Products from "./pages/Products";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/AdminDashboard";
import ComingSoon from "./pages/ComingSoon";

import AdminLayout from "./layouts/AdminLayout";

// Wrapper for global pages with Navbar/Footer
const GlobalLayout = () => (
  <div className="min-h-screen bg-white font-body antialiased selection:bg-primary/10 selection:text-primary flex flex-col">
    <Navbar />
    <main className="grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Helper for padding global routes
const PaddedContainer = ({ children }) => (
  <div className="container mx-auto px-5 pt-32 pb-20">{children}</div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Global User Interface */}
          <Route element={<GlobalLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PaddedContainer><Login /></PaddedContainer>} />
            <Route path="/register" element={<PaddedContainer><Register /></PaddedContainer>} />
            <Route path="/marketplace" element={<PaddedContainer><Marketplace /></PaddedContainer>} />
            <Route path="/marketplace/:id" element={<PaddedContainer><ListingDetails /></PaddedContainer>} />
            <Route path="/create-listing" element={<PrivateRoute><PaddedContainer><CreateListing /></PaddedContainer></PrivateRoute>} />
            <Route path="/edit-listing/:id" element={<PrivateRoute><PaddedContainer><EditListing /></PaddedContainer></PrivateRoute>} />
            <Route path="/my-listings" element={<PrivateRoute><PaddedContainer><MyListings /></PaddedContainer></PrivateRoute>} />
            <Route path="/products" element={<PaddedContainer><Products /></PaddedContainer>} />
            <Route path="/unauthorized" element={<PaddedContainer><Unauthorized /></PaddedContainer>} />
            <Route path="/ecosystems" element={<PaddedContainer><ComingSoon /></PaddedContainer>} />
            <Route path="/donations" element={<PaddedContainer><ComingSoon /></PaddedContainer>} />
            <Route path="/about" element={<PaddedContainer><ComingSoon /></PaddedContainer>} />
            <Route path="/profile" element={<PrivateRoute><PaddedContainer><Profile /></PaddedContainer></PrivateRoute>} />
          </Route>

          {/* Admin Shell Interface */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard activeTabOverride="overview" />} />
            <Route path="users" element={<AdminDashboard activeTabOverride="users" />} />
            <Route path="listings" element={<AdminDashboard activeTabOverride="listings" />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
