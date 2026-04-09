import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | AuraSales",
  description: "Terms of Service for AuraSales, including account rules, subscriptions, credits, acceptable use, disclaimers, and liability limits.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using AuraSales, you agree to these Terms of Service and our Privacy Policy.",
      "If you do not agree, you may not use the platform.",
    ],
  },
  {
    title: "2. Description of Service",
    body: [
      "AuraSales provides sales analytics, forecasting, AI-generated insights, translation, anomaly detection, market intelligence, and related productivity tools.",
      "We may update, add, or remove features from time to time.",
    ],
  },
  {
    title: "3. Account Registration",
    body: [
      "You must provide accurate and complete information when creating an account.",
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.",
      "You must notify us promptly if you believe your account has been compromised.",
    ],
  },
  {
    title: "4. Eligibility",
    body: [
      "AuraSales is intended for users who are able to enter into a binding agreement under applicable law.",
      "You may not use the platform if doing so would violate any law or regulation that applies to you.",
    ],
  },
  {
    title: "5. Subscription Plans and Credits",
    body: [
      "AuraSales may offer Free, Pro, and Enterprise plans or similar tiers.",
      "Free accounts may include a fixed credit allowance and limited features.",
      "Pro accounts may include unlimited credits or additional features, subject to the plan description shown at the time of purchase.",
      "Enterprise pricing and features may be offered through direct contact or custom agreement.",
    ],
  },
  {
    title: "6. Payments, Billing, and Renewals",
    body: [
      "If you purchase a paid plan, you authorize us and our payment processor to charge your payment method for applicable fees, taxes, and recurring charges where applicable.",
      "Subscription fees are billed in advance unless otherwise stated.",
      "You are responsible for keeping billing information current.",
    ],
  },
  {
    title: "7. Refunds",
    body: [
      "Unless required by law or expressly stated otherwise, fees are non-refundable.",
      "If you believe you were charged in error, contact support as soon as possible.",
    ],
  },
  {
    title: "8. Acceptable Use",
    body: [
      "You agree not to use AuraSales to upload unlawful content, infringe intellectual property rights, distribute malware, interfere with the platform, or attempt unauthorized access.",
      "You may not reverse engineer, scrape, or abuse the service in a way that harms us, our users, or third parties.",
    ],
  },
  {
    title: "9. Customer Data and Uploads",
    body: [
      "You retain ownership of the data you upload.",
      "You grant AuraSales a limited right to process your data solely to provide the service, generate analytics, improve performance, and support security and compliance.",
      "You are responsible for ensuring you have the legal right to upload and process the data you submit.",
    ],
  },
  {
    title: "10. AI-Generated Content",
    body: [
      "Some outputs may be generated or assisted by AI systems and may contain errors, omissions, or incomplete information.",
      "AI-generated insights, translations, forecasts, and recommendations are provided for informational purposes only and should not be treated as legal, financial, or professional advice.",
      "You should review AI outputs before relying on them.",
    ],
  },
  {
    title: "11. Third-Party Services",
    body: [
      "AuraSales may integrate with third-party services such as authentication providers, payment processors, email providers, AI providers, or analytics tools.",
      "Your use of third-party services may be governed by their own terms and privacy policies.",
    ],
  },
  {
    title: "12. Intellectual Property",
    body: [
      "AuraSales, including its design, branding, software, and content, is owned by us or our licensors and is protected by intellectual property laws.",
      "You may not use our trademarks or branding without permission.",
    ],
  },
  {
    title: "13. Service Availability",
    body: [
      "We strive to keep AuraSales available, but we do not guarantee uninterrupted or error-free service.",
      "Maintenance, outages, third-party failures, or network issues may affect access.",
    ],
  },
  {
    title: "14. Suspension and Termination",
    body: [
      "We may suspend or terminate your access if we believe you violated these Terms, abused the platform, or created risk for us or other users.",
      "You may stop using the service at any time. Some obligations, like payment obligations and legal rights, may survive termination.",
    ],
  },
  {
    title: "15. Disclaimer of Warranties",
    body: [
      "AuraSales is provided on an 'as is' and 'as available' basis.",
      "We disclaim warranties to the fullest extent permitted by law, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
    ],
  },
  {
    title: "16. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, AuraSales and its affiliates will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or business opportunities.",
      "Our total liability for any claim related to the service will not exceed the amount you paid us for the service in the twelve months before the claim, or the minimum amount permitted by law if greater.",
    ],
  },
  {
    title: "17. Indemnification",
    body: [
      "You agree to indemnify and hold AuraSales harmless from claims, losses, liabilities, and expenses arising from your misuse of the service, your content, or your violation of these Terms or applicable law.",
    ],
  },
  {
    title: "18. Changes to the Service or Terms",
    body: [
      "We may change the service or update these Terms from time to time.",
      "If changes are material, we may notify you through the website or by email. Continued use after the update means you accept the revised Terms.",
    ],
  },
  {
    title: "19. Governing Law",
    body: [
      "These Terms are governed by the laws applicable to the jurisdiction in which AuraSales operates, without regard to conflict-of-law principles, unless local law requires otherwise.",
    ],
  },
  {
    title: "20. Contact Information",
    body: [
      "If you have questions about these Terms, contact us at salesanalyzer500@gmail.com.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">AuraSales Legal</p>
          <h1 className="mt-3 text-4xl font-bold">Terms of Service</h1>
          <p className="mt-3 text-sm text-slate-400">Last updated: April 2, 2026</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            These Terms of Service govern your use of AuraSales across the website, dashboard, authentication flows, uploads, AI features, translation tools, and related services.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-xl font-semibold text-cyan-300">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-800 pt-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-cyan-300 transition">
            Back to Home
          </Link>
          <Link href="/privacy-policy" className="hover:text-cyan-300 transition">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
