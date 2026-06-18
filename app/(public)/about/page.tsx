import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Stormo — AI Marketing Manager for Ecommerce Store Owners",
  description:
    "Stormo was built by a team with two decades of ecommerce experience. We help store owners get more customers with a smart, consistent daily action plan — no paid ads required.",
  openGraph: {
    title: "About Stormo — AI Marketing Manager for Ecommerce Store Owners",
    description:
      "Stormo was built by a team with two decades of ecommerce experience. We help store owners get more customers with a smart, consistent daily action plan — no paid ads required.",
    images: [{ url: "/og-image.png" }],
    url: "https://stormo.io/about",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Spacer for fixed navbar */}
      <div className="pt-20" />

      <article className="max-w-[700px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
        {/* Page heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-16 tracking-tight">
          About <span className="text-primary">Stormo</span>
        </h1>

        {/* Section: We've been in the trenches */}
        <section className="mb-14">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-5 leading-snug">
            We&apos;ve been in the trenches.
          </h2>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            The Stormo founding team has spent two decades building online projects, launching side
            hustles, and navigating the world of ecommerce. We know what it feels like to pour
            everything into building a store and then wonder what happens next.
          </p>
        </section>

        {/* Section: The numbers don't lie */}
        <section className="mb-14">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-5 leading-snug">
            The numbers don&apos;t lie.
          </h2>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            Roughly 90% of online stores fail within the first 120 days. Many of them are
            technically open, products listed, store live, but generating zero revenue. The two main
            reasons are poor online marketing performance and an overall lack of search engine
            visibility. Most store owners respond the only way they know how. They run paid ads,
            spend money they don&apos;t have, and when the results don&apos;t come, they walk away.
            The problem was never the store. It was the absence of a plan.
          </p>
        </section>

        {/* Section: We built Stormo because... */}
        <section className="mb-14">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-5 leading-snug">
            We built Stormo because hardworking people deserve better.
          </h2>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            Not shortcuts. Not overnight success promises. Just a realistic, smart, and consistent
            approach to building a business the right way, from the ground up. Stormo was built for
            the store owner who is doing everything right but still waiting for results. For the side
            hustler who built something real and just needs a clear path forward. For anyone who
            believes consistency beats shortcuts every time. Stormo is an AI marketing manager that
            walks store owners from Point A to Point B to Point C, one focused action at a time.
            Every day you get a clear, specific step based on your store, your customer, and where
            you are right now. No guesswork. No expensive ads to start. Just a methodical business
            plan that limits your risk, controls your expenses, and builds something that lasts.
          </p>
        </section>

        {/* Section: We're not here to sell you a dream */}
        <section className="mb-14">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-5 leading-snug">
            We&apos;re not here to sell you a dream.
          </h2>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            We&apos;re here to help you build one, consistently, strategically, and on your own
            terms. We&apos;ve been where you are. That&apos;s exactly why we built this.
          </p>
        </section>

        {/* Closing CTA */}
        <section className="text-center mt-20 pt-12 border-t border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
            Welcome to Stormo.
          </h2>
          <p className="text-white text-lg sm:text-xl font-medium mb-10">
            Let&apos;s get you more customers.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-10 py-4 text-base transition-all duration-200 shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5"
          >
            Start for $9
          </Link>
        </section>
      </article>
    </div>
  );
}
