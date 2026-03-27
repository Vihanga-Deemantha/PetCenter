import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";

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

// App.css import removed as all styles are in index.css

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-body antialiased selection:bg-primary/10 selection:text-primary">
          <Navbar />
          <main className="container mx-auto px-5 pt-28 pb-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ListingDetails />} />
              <Route path="/create-listing" element={<PrivateRoute><CreateListing /></PrivateRoute>} />
              <Route path="/edit-listing/:id" element={<PrivateRoute><EditListing /></PrivateRoute>} />
              <Route path="/my-listings" element={<PrivateRoute><MyListings /></PrivateRoute>} />
              <Route path="/products" element={<Products />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute roles={["admin"]}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
