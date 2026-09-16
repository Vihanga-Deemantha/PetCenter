import React from "react";
import HeroSection from "../components/sections/HeroSection.jsx";
import ValueStrip from "../components/sections/ValueStrip.jsx";
import FeaturedPetsSection from "../components/sections/FeaturedPetsSection.jsx";
import StorePreviewSection from "../components/sections/StorePreviewSection.jsx";
import EcosystemSpotlight from "../components/sections/EcosystemSpotlight.jsx";
import DonationImpactSection from "../components/sections/DonationImpactSection.jsx";
import SheltersPreviewSection from "../components/sections/SheltersPreviewSection.jsx";
import HowItWorksSection from "../components/sections/HowItWorksSection.jsx";
import TrustSection from "../components/sections/TrustSection.jsx";
import NewsletterSection from "../components/sections/NewsletterSection.jsx";
import HomeDogMascot from "../components/home/HomeDogMascot.jsx";

const Home = () => {
  return (
    <div className="home-page overflow-hidden">
      <HeroSection />
      <ValueStrip />
      <FeaturedPetsSection />
      <StorePreviewSection />
      <EcosystemSpotlight />
      <DonationImpactSection />
      <SheltersPreviewSection />
      <HowItWorksSection />
      <TrustSection />
      <NewsletterSection />
      <HomeDogMascot />
    </div>
  );
};

export default Home;
