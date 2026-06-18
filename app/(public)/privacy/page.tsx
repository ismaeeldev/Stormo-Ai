import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy Policy — Stormo.io",
  description:
    "Stormo Privacy Policy. Learn how we collect, use, and protect your information when you use the Stormo service.",
  openGraph: {
    title: "Privacy Policy — Stormo.io",
    description: "Learn how we collect, use, and protect your information when you use the Stormo service.",
    images: [{ url: "/og-image.png" }],
    url: "https://stormo.io/privacy",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Spacer for fixed navbar */}
      <div className="pt-20" />

      <article className="max-w-[700px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
        {/* Page heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
          Privacy <span className="text-primary">Policy</span>
        </h1>
        <p className="text-white/50 text-sm mb-14">Last Updated — June 2026</p>

        {/* Overview */}
        <section className="mb-12">
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            Stormo (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our,&rdquo; or
            &ldquo;Company&rdquo;) operates the Stormo.io website and the Stormo application
            (collectively, the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you visit our Service.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            1. Information We Collect
          </h2>
          <p className="text-white/85 text-base leading-relaxed mb-4">
            We collect information you voluntarily provide when you sign up for Stormo, including:
            Store URL and platform information, product descriptions and pricing, target customer
            demographics, marketing history and results, business goals and timelines, email address
            and account credentials.
          </p>
          <p className="text-white/85 text-base leading-relaxed mb-4">
            We also collect information automatically when you use Stormo: Usage data and feature
            interaction, device information, IP address and location data, cookie and tracking data.
          </p>
          <p className="text-white/85 text-base leading-relaxed">
            Third-party services we use may also collect data on your behalf: Stripe for payment
            processing, Claude API for AI-powered recommendations, analytics tools for user behavior
            tracking, email service providers.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            2. How We Use Your Information
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            We use the information we collect to: provide and improve the Stormo Service, personalize
            your daily action plans, process payments and send billing information, communicate with
            you about your account, analyze usage patterns and optimize features, comply with legal
            obligations.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            3. Claude API and Data Processing
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Your onboarding answers and store information are sent to Claude API to generate your
            personalized daily action plans. By using Stormo you agree to this data being processed
            by Anthropic&apos;s Claude API. We recommend reviewing Anthropic&apos;s privacy policy at
            anthropic.com to understand how they handle data processed through the API. Your data is
            used solely for generating your action plan and not for training Claude models.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            4. Payment Processing with Stripe
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stripe processes all payment information on your behalf. Stripe only receives payment
            details (card information, billing address, email). Stripe does not receive or store your
            store data, onboarding answers, or business information. We do not retain your full
            credit card details. Please review Stripe&apos;s privacy policy at stripe.com for
            details on how they handle payment data.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            5. Data Sharing and Contractors
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            We do not sell your data for any monetary reason. We may share your information with: our
            development team and contractors (including Muhammad Ismaeel and future team members) who
            help build and maintain Stormo under confidentiality agreements. All contractors who
            access user data are required to sign non-disclosure agreements (NDAs) protecting your
            information. Future employees or team members who need access to provide the Service.
            Third-party service providers (Stripe, Claude API, analytics providers) as necessary to
            operate Stormo. Legal authorities if required by law.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            6. Data Retention and Deletion
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            We retain your user data for 60 days after you delete your account. After 60 days we
            permanently delete your onboarding answers, store information, and usage data. Payment
            and tax records required by law may be retained longer for legal and financial compliance
            purposes. You can request deletion of your account at any time by contacting
            info@stormo.io.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            7. Legal Requests and Compliance
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            If we receive a legal request (subpoena, court order, or government request) for your
            data, we will make reasonable efforts to notify you of the request unless legally
            prohibited from doing so. We will comply with valid legal requests as required by law.
            You have the right to challenge any legal request in court.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            8. Data Security
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            We implement reasonable security measures to protect your data. However, no method of
            transmission over the internet is completely secure. We cannot guarantee absolute
            security of your information.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            9. Your Rights
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            You have the right to: access the information we hold about you, request correction of
            inaccurate data, request deletion of your account and associated data, opt out of
            certain data uses. To exercise these rights, contact us at info@stormo.io.
          </p>
        </section>

        {/* Section 10 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            10. Availability
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo is currently available to residents of the United States, Canada, Australia,
            United Kingdom, and New Zealand only.
          </p>
        </section>

        {/* Section 11 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            11. Changes to This Policy
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of any material
            changes by updating the &ldquo;Last Updated&rdquo; date and posting the revised policy
            on our Service.
          </p>
        </section>

        {/* Section 12 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            12. Contact Us
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:info@stormo.io" className="text-primary hover:underline">
              info@stormo.io
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
