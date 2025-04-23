"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Separator } from "@/components/ui/separator";

// --- Import Skeletons from their respective component files ---
import { HeroSectionSkeleton } from "@/components/home/HeroSection";
import { StatsSectionSkeleton } from "@/components/home/StatsSection";
import { FeaturesSectionSkeleton } from "@/components/home/FeaturesSection";
import { MarketSectionSkeleton } from "@/components/home/MarketSection";
import { ImportanceSectionSkeleton } from "@/components/home/ImportanceSection";
import { ContactSectionSkeleton } from "@/components/home/ContactSection";
import { FooterSkeleton } from "@/components/layout/footer";

// --- Dynamically Import Components using imported skeletons ---
const HeroSection = dynamic(() => import("@/components/home/HeroSection"), {
  loading: () => <HeroSectionSkeleton />,
});

const StatsSection = dynamic(() => import("@/components/home/StatsSection"), {
  loading: () => <StatsSectionSkeleton />,
});

const FeaturesSection = dynamic(
  () => import("@/components/home/FeaturesSection"),
  {
    loading: () => <FeaturesSectionSkeleton />,
  },
);

const MarketSection = dynamic(() => import("@/components/home/MarketSection"), {
  loading: () => <MarketSectionSkeleton />,
});

const ImportanceSection = dynamic(
  () => import("@/components/home/ImportanceSection"),
  {
    loading: () => <ImportanceSectionSkeleton />,
  },
);

const ContactSection = dynamic(
  () => import("@/components/home/ContactSection"),
  {
    loading: () => <ContactSectionSkeleton />,
  },
);

const Footer = dynamic(() => import("@/components/layout/footer"), {
  loading: () => <FooterSkeleton />,
});

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
