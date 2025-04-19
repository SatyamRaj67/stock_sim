"use client";

import React from "react";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import MarketSection from "@/components/home/MarketSection";
import ImportanceSection from "@/components/home/ImportanceSection";
import ContactSection from "@/components/home/ContactSection";
import Footer from "@/components/layout/footer";

const HomePage = () => {
  return (
    <div className="px-4">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <MarketSection />
      <ImportanceSection />
      <ContactSection />

      <Footer />
    </div>
  );
};

export default HomePage;
