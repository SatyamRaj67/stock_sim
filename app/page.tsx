"use client";

import React from "react";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import MarketSection from "@/components/home/MarketSection";
import ImportanceSection from "@/components/home/ImportanceSection";
import ContactSection from "@/components/home/ContactSection";
import Footer from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";

const HomePage = () => {
  return (
    <div className="px-2 md:px-6">
      <HeroSection />
      <Separator />
      <StatsSection />
      <Separator />
      <FeaturesSection />
      <Separator />
      <MarketSection />
      <Separator />
      <ImportanceSection />
      <Separator />
      <ContactSection />

      <Footer />
    </div>
  );
};

export default HomePage;
