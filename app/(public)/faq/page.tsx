import React from 'react';
import type { Metadata } from 'next';
import FAQClient from './FAQClient';

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Stormo.io",
  description: "Have questions about Stormo? Ask our interactive AI Assistant anything about e-commerce growth, pricing, and social media marketing plans.",
  openGraph: {
    title: "Frequently Asked Questions | Stormo.io",
    description: "Have questions about Stormo? Ask our interactive AI Assistant anything about e-commerce growth, pricing, and social media marketing plans.",
    images: [{ url: "/og-image.png" }],
    url: "https://stormo.io/faq",
    type: "website",
  },
};

export default function FAQPage() {
  return <FAQClient />;
}
