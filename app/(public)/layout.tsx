'use client';

import React from 'react';
import Navbar from '@/components/homepage/Navbar';
import HomepageFooter from '@/components/homepage/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <HomepageFooter />
    </div>
  );
}
