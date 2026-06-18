import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "How It Works — Stormo AI Marketing Manager",
  description:
    "Stormo learns about your store, builds a personalized plan, and gives you one focused marketing action every day. See how it works in 5 simple steps.",
  openGraph: {
    title: "How It Works — Stormo AI Marketing Manager",
    description:
      "Stormo learns about your store, builds a personalized plan, and gives you one focused marketing action every day.",
    images: [{ url: "/og-image.png" }],
    url: "https://stormo.io/how-it-works",
    type: "website",
  },
};

const steps = [
  {
    number: 1,
    title: "Tell Us About Your Store",
    body: "When you sign up Stormo starts with a conversation. Not a form. A real dialogue that learns everything it needs to know about you, your store, your products, your target customer, your goals, and how much time you have each day. The more Stormo knows, the more personalized your plan becomes. This is the foundation everything else is built on.",
  },
  {
    number: 2,
    title: "Stormo Builds Your Personalized Plan",
    body: "Once onboarding is complete Stormo\u2019s AI goes to work. It analyzes your answers and builds a custom customer acquisition strategy designed specifically for your store, your niche, your platform, your customer, and your capacity. No two plans are the same. A Shopify store selling handmade jewelry gets a completely different plan than an Etsy store selling digital downloads.",
  },
  {
    number: 3,
    title: "One Action Every Day",
    body: "Every day Stormo gives you one clear, focused action to complete. Not a list of ten things. Not an overwhelming strategy document. Just one thing, specific, actionable, and designed to move your store forward.",
    bullets: [
      "Write a keyword optimized product description for your best seller",
      "Identify three micro influencers in your niche and send an outreach message",
      "Create one piece of short form video content showcasing your product",
      "Set up your Google Business Profile to improve local search visibility",
      "Write a blog post targeting a search term your ideal customer is already looking for",
      "Optimize your store\u2019s page titles and meta descriptions for search engines",
      "Pin five of your products to a new Pinterest board targeting your niche keyword",
    ],
  },
  {
    number: 4,
    title: "Actions Build On Each Other",
    body: "Each action Stormo gives you is part of a bigger picture. Day by day, week by week, your store builds organic traffic, search visibility, social presence, and customer relationships without spending a dollar on ads. This is the compounding effect of consistency. What feels like a small action on day one becomes a foundation that pays off for months.",
  },
  {
    number: 5,
    title: "Watch Your Results Grow",
    body: "Store owners who follow their Stormo daily plan consistently see:",
    bullets: [
      "More organic traffic from search engines",
      "Better product visibility on their platform",
      "A growing social media presence that attracts buyers",
      "Inbound customers who find them without paid ads",
      "Consistent sales that don\u2019t depend on ad spend",
    ],
    closing:
      "This isn\u2019t about overnight success. It\u2019s about building something real, systematically, one day at a time.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Spacer for fixed navbar */}
      <div className="pt-20" />

      <article className="max-w-[700px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
        {/* Page heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          How It <span className="text-primary">Works</span>
        </h1>
        <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-16">
          Getting more customers shouldn&apos;t be complicated.
        </p>
        <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-20">
          Stormo is your AI marketing manager, working beside you every single day. No agencies. No
          expensive ad budgets. No guesswork. Just a smart, consistent plan built around your store
          and executed one action at a time.
        </p>

        {/* Steps */}
        <div className="space-y-16">
          {steps.map((step) => (
            <section key={step.number} className="relative">
              {/* Step indicator */}
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{step.number}</span>
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 leading-snug">
                    Step {step.number} — {step.title}
                  </h2>
                  <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                    {step.body}
                  </p>

                  {/* Bullet list if present */}
                  {step.bullets && (
                    <ul className="mt-5 space-y-3">
                      {step.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-white/80 text-base leading-relaxed">
                          <span className="text-primary mt-1.5 text-xs">●</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Closing text if present */}
                  {step.closing && (
                    <p className="text-white/90 text-base sm:text-lg leading-relaxed mt-5 italic">
                      {step.closing}
                    </p>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Closing CTA */}
        <section className="text-center mt-24 pt-12 border-t border-white/10">
          <p className="text-white/80 text-lg sm:text-xl mb-4">Ready to get started?</p>
          <p className="text-white/70 text-base sm:text-lg mb-6">
            Your personalized plan is waiting. Sign up today and try Stormo for your first month for
            just $9.
          </p>
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
