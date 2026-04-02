import React from "react";
import HeroSection from "../components/sections/HeroSection.jsx";
import FeatureStrip from "../components/sections/FeatureStrip.jsx";
import FeaturedPetsSection from "../components/sections/FeaturedPetsSection.jsx";
import EcosystemSpotlight from "../components/sections/EcosystemSpotlight.jsx";
import StorePreviewSection from "../components/sections/StorePreviewSection.jsx";
import DonationImpactSection from "../components/sections/DonationImpactSection.jsx";
import HowItWorksSection from "../components/sections/HowItWorksSection.jsx";
import TrustSection from "../components/sections/TrustSection.jsx";
import CTASection from "../components/sections/CTASection.jsx";

const Home = () => {
  return (
    <div className="home-page overflow-hidden">
      <HeroSection />
      <FeatureStrip />
      <FeaturedPetsSection />
      <EcosystemSpotlight />
      <StorePreviewSection />
      <DonationImpactSection />
      <HowItWorksSection />
      <TrustSection />
      <CTASection />
    </div>
  );
};

export default Home;
