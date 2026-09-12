import React from "react";
import { createPortal } from "react-dom";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { NotificationProvider } from "./context/NotificationContext";
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
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
import MyDonations from "./pages/MyDonations";
import AdminCampaignManagement from "./pages/AdminCampaignManagement";
import AdminDonationManagement from "./pages/AdminDonationManagement";
import AdminShelterManagement from "./pages/AdminShelterManagement";
import AdminEcosystemManagement from "./pages/AdminEcosystemManagement";

// Phase 4 Pages
import { BuilderProvider } from "./context/BuilderContext";
import EcosystemPicker from "./pages/EcosystemPicker";
import EcosystemBuilder from "./pages/EcosystemBuilder";
import MyBuilds from "./pages/MyBuilds";
import EcosystemGallery from "./pages/EcosystemGallery";
import GalleryBuildDetail from "./pages/GalleryBuildDetail";
import Favorites from "./pages/Favorites";

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

// The mascot is a large (up to 384px) fixed-position overlay — fun on the
// homepage, but on every other page it sits directly on top of "Add to
// Cart" buttons, product cards, and form controls. Confining it to "/" keeps
// the feature without it fighting for clicks on commerce pages.
const DogDockPortal = () => {
  const location = useLocation();
  if (location.pathname !== "/" || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 pointer-events-none" style={{ zIndex: 9999 }}>
      <div className="pointer-events-auto w-72 sm:w-80 md:w-96 transform-gpu drop-shadow-2xl">
        <InteractiveDog compact />
      </div>
    </div>,
    document.body,
  );
};

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
          <DogDockPortal />
          <Routes>
            {/* Global User Interface */}
            <Route element={<GlobalLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<PaddedContainer><Login /></PaddedContainer>} />
              <Route path="/register" element={<PaddedContainer><Register /></PaddedContainer>} />
              <Route path="/forgot-password" element={<PaddedContainer><ForgotPassword /></PaddedContainer>} />
              <Route path="/reset-password/:resetToken" element={<PaddedContainer><ResetPassword /></PaddedContainer>} />
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
              <Route path="/orders/:orderId" element={<PrivateRoute><PaddedContainer><OrderDetail /></PaddedContainer></PrivateRoute>} />
              <Route path="/unauthorized" element={<PaddedContainer><Unauthorized /></PaddedContainer>} />
              <Route path="/ecosystems" element={<Navigate to="/ecosystem" replace />} />
              {/* Phase 4 — Ecosystem Builder */}
              <Route path="/ecosystem" element={<PaddedContainer><EcosystemPicker /></PaddedContainer>} />
              <Route path="/ecosystem/build/:petType" element={<PaddedContainer><EcosystemBuilder /></PaddedContainer>} />
              <Route path="/ecosystem/my-builds" element={<PrivateRoute><PaddedContainer><MyBuilds /></PaddedContainer></PrivateRoute>} />
              <Route path="/ecosystem/gallery" element={<PaddedContainer><EcosystemGallery /></PaddedContainer>} />
              <Route path="/ecosystem/gallery/:id" element={<PaddedContainer><GalleryBuildDetail /></PaddedContainer>} />
              <Route path="/campaigns" element={<PaddedContainer><Campaigns /></PaddedContainer>} />
              <Route path="/campaigns/:id" element={<PaddedContainer><CampaignDetail /></PaddedContainer>} />
              <Route path="/thank-you" element={<PaddedContainer><ThankYou /></PaddedContainer>} />
              <Route path="/shelters" element={<PaddedContainer><Shelters /></PaddedContainer>} />
              <Route path="/shelters/:id" element={<PaddedContainer><ShelterDetail /></PaddedContainer>} />
              <Route path="/my-donations" element={<PrivateRoute><PaddedContainer><MyDonations /></PaddedContainer></PrivateRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<PaddedContainer><Help /></PaddedContainer>} />
              <Route path="/safety" element={<PaddedContainer><Safety /></PaddedContainer>} />
              <Route path="/terms" element={<PaddedContainer><Terms /></PaddedContainer>} />
              <Route path="/privacy" element={<PaddedContainer><Privacy /></PaddedContainer>} />
              <Route path="/contact" element={<PaddedContainer><Contact /></PaddedContainer>} />
              <Route path="/profile" element={<PrivateRoute><PaddedContainer><Profile /></PaddedContainer></PrivateRoute>} />
              <Route path="/favorites" element={<PrivateRoute><PaddedContainer><Favorites /></PaddedContainer></PrivateRoute>} />
              <Route path="*" element={<PaddedContainer><NotFound /></PaddedContainer>} />
            </Route>

            {/* Admin Shell Interface — guarded by PrivateRoute */}
            <Route path="/admin" element={<PrivateRoute roles={["admin"]}><AdminLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard activeTabOverride="overview" />} />
              <Route path="users" element={<AdminDashboard activeTabOverride="users" />} />
              <Route path="listings" element={<AdminDashboard activeTabOverride="listings" />} />
              <Route path="products" element={<AdminProductManagement />} />
              <Route path="orders" element={<AdminOrdersManagement />} />
              <Route path="campaigns" element={<AdminCampaignManagement />} />
              <Route path="donations" element={<AdminDonationManagement />} />
              <Route path="shelters" element={<AdminShelterManagement />} />
              <Route path="ecosystem" element={<AdminEcosystemManagement />} />
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

