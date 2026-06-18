import React from 'react';
import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: "Simple & Transparent Pricing | Stormo.io",
  description: "Get your complete automated AI marketing copilot and grow your store. No setup fees, no long-term contracts. Try Starter for $9.",
  openGraph: {
    title: "Simple & Transparent Pricing | Stormo.io",
    description: "Get your complete automated AI marketing copilot and grow your store. No setup fees, no long-term contracts. Try Starter for $9.",
    images: [{ url: "/og-image.png" }],
    url: "https://stormo.io/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
