import React from 'react';
import HeroSection from '@/components/homepage/HeroSection';
import PainSection from '@/components/homepage/PainSection';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import ComparisonSection from '@/components/homepage/ComparisonSection';
import PricingSection from '@/components/homepage/PricingSection';
import SocialProofSection from '@/components/homepage/SocialProofSection';
import FinalCTASection from '@/components/homepage/FinalCTASection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Stormo.io — AI Marketing for Ecommerce Store Owners",
  description: "One daily action. Content written. Customers growing. Start for $9.",
  openGraph: {
    title: "Stormo.io — AI Marketing for Ecommerce Store Owners",
    description: "One daily action. Content written. Customers growing. Start for $9.",
    images: [{ url: "/og-image.png" }],
    url: "https://stormo.io",
    type: "website",
  },
};

export default function Homepage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      {/* Offset wrapper for fixed navbar */}
      <div className="pt-20 bg-[#1A1A1A]">
        {/* 2. Hero Section */}
        <HeroSection />
      </div>

      {/* 3. Pain Points Comparative Section */}
      <PainSection />

      {/* 4. Workflow Guide Section */}
      <HowItWorksSection />

      {/* 5. Feature Grid Section */}
      <FeaturesSection />

      {/* 6. Product Comparison Table Section */}
      <ComparisonSection />

      {/* 7. Starter / Growth Pricing Cards Section */}
      <PricingSection />

      {/* 8. Social Proof & Statistics Section */}
      <SocialProofSection />

      {/* 9. Final CTA Band Section */}
      <FinalCTASection />
      
      {/* Note: The 10. Footer Section is rendered globally by PublicLayout wrapper */}
    </div>
  );
}
