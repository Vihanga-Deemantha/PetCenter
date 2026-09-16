import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { NotificationProvider } from "./context/NotificationContext";
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import ListingDetails from "./pages/ListingDetails";
import Dashboard from "./pages/Dashboard";
import MyListings from "./pages/MyListings";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderDetail from "./pages/OrderDetail";
import Unauthorized from "./pages/Unauthorized";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Help from "./pages/Help";
import Safety from "./pages/Safety";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

// Phase 3 Pages
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import ThankYou from "./pages/ThankYou";
import Shelters from "./pages/Shelters";
import ShelterDetail from "./pages/ShelterDetail";

// Phase 4 Pages
import { BuilderProvider } from "./context/BuilderContext";
import EcosystemPicker from "./pages/EcosystemPicker";
import EcosystemBuilder from "./pages/EcosystemBuilder";
import EcosystemGallery from "./pages/EcosystemGallery";
import GalleryBuildDetail from "./pages/GalleryBuildDetail";

// Admin pages are only ever reached by admins, behind a PrivateRoute role
// check — lazy-loading them keeps their code out of the bundle every
// regular visitor downloads.
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProductManagement = lazy(() => import("./pages/AdminProductManagement"));
const AdminOrdersManagement = lazy(() => import("./pages/AdminOrdersManagement"));
const AdminCampaignManagement = lazy(() => import("./pages/AdminCampaignManagement"));
const AdminDonationManagement = lazy(() => import("./pages/AdminDonationManagement"));
const AdminShelterManagement = lazy(() => import("./pages/AdminShelterManagement"));
const AdminEcosystemManagement = lazy(() => import("./pages/AdminEcosystemManagement"));
const AdminReviewManagement = lazy(() => import("./pages/AdminReviewManagement"));

const AdminRouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-light">
    <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
  </div>
);

// Wrapper for global pages with Navbar/Footer
const GlobalLayout = () => (
  <div className="min-h-screen bg-light font-body antialiased selection:bg-primary/10 selection:text-primary flex flex-col">
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
    <ErrorBoundary>
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <FavoritesProvider>
            <BuilderProvider>
              <Router>
          <Routes>
            {/* Global User Interface */}
            <Route element={<GlobalLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<PaddedContainer><ForgotPassword /></PaddedContainer>} />
              <Route path="/reset-password/:resetToken" element={<PaddedContainer><ResetPassword /></PaddedContainer>} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ListingDetails />} />
              <Route path="/create-listing" element={<PrivateRoute><MyListings /></PrivateRoute>} />
              <Route path="/edit-listing/:id" element={<PrivateRoute><MyListings /></PrivateRoute>} />
              <Route path="/my-listings" element={<PrivateRoute><MyListings /></PrivateRoute>} />
              <Route path="/products" element={<Store />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
              <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
              <Route path="/orders/:orderId" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
              <Route path="/unauthorized" element={<PaddedContainer><Unauthorized /></PaddedContainer>} />
              <Route path="/ecosystems" element={<Navigate to="/ecosystem" replace />} />
              {/* Phase 4 — Ecosystem Builder */}
              <Route path="/ecosystem" element={<EcosystemPicker />} />
              <Route path="/ecosystem/build/:petType" element={<EcosystemBuilder />} />
              <Route path="/ecosystem/gallery" element={<EcosystemGallery />} />
              <Route path="/ecosystem/gallery/:id" element={<GalleryBuildDetail />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/shelters" element={<Shelters />} />
              <Route path="/shelters/:id" element={<ShelterDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<PaddedContainer><Help /></PaddedContainer>} />
              <Route path="/safety" element={<PaddedContainer><Safety /></PaddedContainer>} />
              <Route path="/terms" element={<PaddedContainer><Terms /></PaddedContainer>} />
              <Route path="/privacy" element={<PaddedContainer><Privacy /></PaddedContainer>} />
              <Route path="/contact" element={<PaddedContainer><Contact /></PaddedContainer>} />

              {/* Consolidated account dashboard */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<Navigate to="/dashboard?tab=details" replace />} />
              <Route path="/favorites" element={<Navigate to="/dashboard?tab=favorites" replace />} />
              <Route path="/orders" element={<Navigate to="/dashboard?tab=orders" replace />} />
              <Route path="/my-donations" element={<Navigate to="/dashboard?tab=donations" replace />} />
              <Route path="/ecosystem/my-builds" element={<Navigate to="/dashboard?tab=builds" replace />} />

              <Route path="*" element={<PaddedContainer><NotFound /></PaddedContainer>} />
            </Route>

            {/* Admin Shell Interface — guarded by PrivateRoute. AdminLayout and
                every nested admin page below are lazy-loaded, so one Suspense
                boundary here covers the whole admin subtree (including pages
                rendered later via AdminLayout's own <Outlet/>). */}
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={["admin"]}>
                  <Suspense fallback={<AdminRouteFallback />}>
                    <AdminLayout />
                  </Suspense>
                </PrivateRoute>
              }
            >
              <Route index element={<AdminDashboard activeTabOverride="overview" />} />
              <Route path="users" element={<AdminDashboard activeTabOverride="users" />} />
              <Route path="listings" element={<AdminDashboard activeTabOverride="listings" />} />
              <Route path="products" element={<AdminProductManagement />} />
              <Route path="orders" element={<AdminOrdersManagement />} />
              <Route path="campaigns" element={<AdminCampaignManagement />} />
              <Route path="donations" element={<AdminDonationManagement />} />
              <Route path="shelters" element={<AdminShelterManagement />} />
              <Route path="ecosystem" element={<AdminEcosystemManagement />} />
              <Route path="reviews" element={<AdminReviewManagement />} />
            </Route>

          </Routes>
          </Router>
            </BuilderProvider>
          </FavoritesProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

