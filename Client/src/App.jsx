import React from "react";
import { createPortal } from "react-dom";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageTransitionDog from "./components/animations/PageTransitionDog";
import InteractiveDog from "./components/animations/InteractiveDog";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import ListingDetails from "./pages/ListingDetails";
import Profile from "./pages/Profile";
import MyListings from "./pages/MyListings";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductManagement from "./pages/AdminProductManagement";
import AdminOrdersManagement from "./pages/AdminOrdersManagement";
import ComingSoon from "./pages/ComingSoon";

import AdminLayout from "./layouts/AdminLayout";

// Wrapper for global pages with Navbar/Footer
const GlobalLayout = () => (
  <div className="min-h-screen bg-white font-body antialiased selection:bg-primary/10 selection:text-primary flex flex-col">
    {/* 🐾 Dog that sweeps across on every route change */}
    <PageTransitionDog />
    <Navbar />
    <main className="grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const DogDockPortal = () =>
  typeof document === "undefined"
    ? null
    : createPortal(
        <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 pointer-events-none" style={{ zIndex: 9999 }}>
          <div className="pointer-events-auto w-72 sm:w-80 md:w-96 transform-gpu drop-shadow-2xl">
            <InteractiveDog compact />
          </div>
        </div>,
        document.body,
      );

// Helper for padding global routes
const PaddedContainer = ({ children }) => (
  <div className="container mx-auto px-5 pt-32 pb-20">{children}</div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <DogDockPortal />
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
              <Route path="/products" element={<PaddedContainer><Store /></PaddedContainer>} />
              <Route path="/products/:id" element={<PaddedContainer><ProductDetail /></PaddedContainer>} />
              <Route path="/cart" element={<PaddedContainer><Cart /></PaddedContainer>} />
              <Route path="/checkout" element={<PrivateRoute><PaddedContainer><Checkout /></PaddedContainer></PrivateRoute>} />
              <Route path="/order-success" element={<PrivateRoute><PaddedContainer><OrderSuccess /></PaddedContainer></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><PaddedContainer><OrderHistory /></PaddedContainer></PrivateRoute>} />
              <Route path="/orders/:id" element={<PrivateRoute><PaddedContainer><OrderDetail /></PaddedContainer></PrivateRoute>} />
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
              <Route path="products" element={<AdminProductManagement />} />
              <Route path="orders" element={<AdminOrdersManagement />} />
            </Route>

          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

