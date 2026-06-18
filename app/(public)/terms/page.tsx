import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Terms of Service — Stormo.io",
  description:
    "Stormo Terms of Service. Read our terms and conditions for using the Stormo AI marketing service.",
  openGraph: {
    title: "Terms of Service — Stormo.io",
    description: "Read our terms and conditions for using the Stormo AI marketing service.",
    images: [{ url: "/og-image.png" }],
    url: "https://stormo.io/terms",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Spacer for fixed navbar */}
      <div className="pt-20" />

      <article className="max-w-[700px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
        {/* Page heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
          Terms of <span className="text-primary">Service</span>
        </h1>
        <p className="text-white/50 text-sm mb-14">Last Updated — June 2026</p>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            1. Agreement to Terms
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            By accessing and using Stormo.io and the Stormo application (the
            &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not
            agree to these terms, you may not use Stormo.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            2. Service Access and Use
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo grants you a limited, non-exclusive, non-transferable license to access and use
            the Service for your personal business purposes. You agree not to: copy, modify, or
            create derivative works based on the Service, attempt to reverse engineer or decompile
            the Service, rent, lease, or resell access to the Service, use the Service to compete
            with Stormo, or access the Service through any unauthorized means or bots.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            3. Service Description and Limitations
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo provides AI-powered daily marketing recommendations for ecommerce store owners.
            The Service generates recommendations based on the information you provide during
            onboarding. Results vary based on individual effort, market conditions, product quality,
            and external factors. Stormo does not guarantee any specific sales, revenue, traffic, or
            business results. You are solely responsible for implementing recommendations and
            evaluating their effectiveness for your business.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            4. Disclaimer of Warranties
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo is provided &ldquo;as is&rdquo; without warranties of any kind, either express
            or implied. Stormo disclaims all warranties including merchantability, fitness for a
            particular purpose, and non-infringement. Stormo does not warrant that the Service will
            be uninterrupted, error-free, or meet your specific requirements.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            5. Limitation of Liability
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            To the fullest extent permitted by law, Stormo shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including loss of profits,
            revenue, data, or business opportunity, even if advised of the possibility of such
            damages. Your sole remedy for dissatisfaction with the Service is to stop using it and
            cancel your subscription.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            6. Your Data and Intellectual Property
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            You retain all ownership rights to your store data, onboarding information, and business
            details. Stormo does not own your data. You grant Stormo a license to use your data
            solely to provide the Service, including generating recommendations through the Claude
            API. Stormo owns all rights to the Service platform, including software, features, and
            functionality. You may not reproduce, distribute, or publicly display any part of the
            Service without permission.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            7. User Accounts and Responsibilities
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You
            are responsible for all activity under your account. You agree to notify Stormo
            immediately of any unauthorized access. Stormo reserves the right to refuse service or
            suspend accounts at any time.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            8. Prohibited Conduct
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            You agree not to: post unlawful, threatening, or abusive content, attempt to gain
            unauthorized access to Stormo&apos;s systems, disrupt or interfere with the Service,
            engage in fraudulent activity, violate applicable laws or regulations, or use the
            Service in any way that harms others.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            9. Payment and Billing
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            By subscribing to Stormo you authorize automatic monthly billing of the stated fee.
            Billing occurs on the same date each month. You can cancel your subscription at any
            time. Cancellations take effect at the end of your current billing cycle. Refunds are
            not issued for partially used months. Stormo reserves the right to change pricing with
            30 days written notice.
          </p>
        </section>

        {/* Section 10 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            10. Service Availability and Support
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo aims to maintain reliable service but does not guarantee 100% uptime. Stormo may
            conduct maintenance or updates that temporarily affect service availability. Stormo will
            provide reasonable notice of planned maintenance when possible. Support is available via
            email at{' '}
            <a href="mailto:info@stormo.io" className="text-primary hover:underline">
              info@stormo.io
            </a>
            .
          </p>
        </section>

        {/* Section 11 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            11. Termination and Account Cancellation
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            You may cancel your account at any time through your account settings or by contacting
            info@stormo.io. Stormo may suspend or terminate your account if you violate these Terms
            of Service, engage in fraudulent activity, or violate applicable laws. Upon cancellation
            or termination, you lose access to the Service and your data will be deleted after 60
            days unless legally required to retain it longer.
          </p>
        </section>

        {/* Section 12 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            12. Changes to the Service and Terms
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo may modify the Service or these Terms at any time. Material changes to these
            Terms will be communicated via email. Your continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>
        </section>

        {/* Section 13 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            13. Third-Party Services
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo uses third-party services including Stripe for payments, Claude API for AI
            recommendations, and analytics tools. These services are governed by their own terms of
            service. Stormo is not responsible for third-party service availability or performance.
          </p>
        </section>

        {/* Section 14 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            14. Indemnification
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            You agree to indemnify and hold harmless Stormo from any claims, damages, or losses
            arising from your use of the Service, your violation of these Terms, or your violation
            of applicable laws.
          </p>
        </section>

        {/* Section 15 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            15. Dispute Resolution
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Any disputes arising from these Terms or the Service shall be resolved through good
            faith negotiation. If negotiation fails, disputes shall be resolved through binding
            arbitration in accordance with the American Arbitration Association rules. You agree to
            waive your right to a jury trial and class action participation.
          </p>
        </section>

        {/* Section 16 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            16. Geographic Availability
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Stormo is available only to residents of the United States, Canada, Australia, United
            Kingdom, and New Zealand. By using Stormo you represent that you are a resident of one
            of these countries.
          </p>
        </section>

        {/* Section 17 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            17. Governing Law
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            These Terms are governed by the laws of Wyoming, without regard to conflict of law
            principles. You irrevocably submit to the exclusive jurisdiction of the courts in
            Wyoming.
          </p>
        </section>

        {/* Section 18 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            18. Entire Agreement
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            These Terms of Service, together with the Privacy Policy, constitute the entire
            agreement between you and Stormo and supersede all prior agreements or understandings.
          </p>
        </section>

        {/* Section 19 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            19. Severability
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            If any part of these Terms is found to be unenforceable, that part will be removed and
            the remaining Terms will remain in full force and effect.
          </p>
        </section>

        {/* Section 20 */}
        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-primary mb-4">
            20. Contact Us
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            If you have questions about these Terms of Service, please contact us at{' '}
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
