import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | AuraSales",
  description: "Privacy Policy for AuraSales, covering data collection, AI processing, account information, analytics, payments, and user rights.",
};

const sections = [
  {
    title: "1. Overview",
    body: [
      "AuraSales is a sales analytics platform that helps users upload sales data, generate insights, forecast revenue, translate content, and access AI-powered tools.",
      "This Privacy Policy explains how we collect, use, share, and protect information when you use our website, dashboard, APIs, and related services.",
      "By using AuraSales, you agree to the practices described in this policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "Account information such as your name, email address, login credentials, company details, and profile preferences.",
      "Sales data and uploaded files, including CSV, Excel, JSON, and other records you submit for analysis.",
      "Usage data such as device type, browser type, IP address, pages visited, session activity, and feature usage.",
      "Payment and billing information if you subscribe to a paid plan or contact sales.",
      "Communication data such as support requests, email messages, and feedback you send us.",
    ],
  },
  {
    title: "3. How We Use Information",
    body: [
      "To create and manage your account and authenticate sign-in sessions.",
      "To process uploaded sales data and generate reports, forecasts, recommendations, charts, and alerts.",
      "To send strategy emails, notifications, onboarding messages, and service-related updates.",
      "To provide translation, AI analysis, anomaly detection, and other product features.",
      "To improve the performance, reliability, security, and usability of AuraSales.",
    ],
  },
  {
    title: "4. AI and Automated Processing",
    body: [
      "AuraSales uses automated systems and third-party AI services to analyze your uploaded data and generate insights.",
      "Depending on the feature you use, your data may be sent to trusted service providers that help us process translation, forecasting, messaging, or analytics requests.",
      "We try to limit the amount of information sent to those services and use it only to deliver the feature you requested.",
    ],
  },
  {
    title: "5. Sharing and Disclosure",
    body: [
      "We do not sell your personal information.",
      "We may share information with service providers that help us operate the platform, including hosting, authentication, payments, email delivery, analytics, and AI processing.",
      "We may disclose information if required by law, to protect our rights, to prevent abuse, or to respond to valid legal requests.",
    ],
  },
  {
    title: "6. Third-Party Services",
    body: [
      "AuraSales may use services such as Supabase for authentication and storage, Stripe for payments, SendGrid or other email providers for messaging, and AI providers for translations or analysis.",
      "These providers have their own privacy practices and terms. We encourage you to review their policies.",
    ],
  },
  {
    title: "7. Data Retention",
    body: [
      "We keep data only as long as necessary to provide the service, satisfy legal obligations, resolve disputes, and enforce agreements.",
      "Uploaded files, generated outputs, and logs may be retained for a limited time to support product functionality, troubleshooting, security, and audit needs.",
    ],
  },
  {
    title: "8. Security",
    body: [
      "We use reasonable administrative, technical, and organizational safeguards to protect your information.",
      "No system is perfectly secure, so we cannot guarantee absolute security. You are responsible for protecting your account credentials.",
    ],
  },
  {
    title: "9. Your Choices and Rights",
    body: [
      "You may update account information through your profile or by contacting us.",
      "You may request access, correction, or deletion of certain personal information, subject to legal and operational limits.",
      "You may also disable cookies or browser storage where supported by your browser settings, though some features may not function properly.",
    ],
  },
  {
    title: "10. Cookies and Local Storage",
    body: [
      "AuraSales may use cookies and local storage to remember language preferences, session state, theme settings, and dashboard preferences.",
      "These technologies help the website work smoothly and improve your experience.",
    ],
  },
  {
    title: "11. Children's Privacy",
    body: [
      "AuraSales is intended for business and professional use and is not directed to children under 13.",
      "We do not knowingly collect personal information from children under 13.",
    ],
  },
  {
    title: "12. International Users",
    body: [
      "If you access AuraSales from outside your country, your information may be transferred to and processed in other countries where our service providers operate.",
      "By using the service, you consent to that transfer where allowed by law.",
    ],
  },
  {
    title: "13. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time.",
      "When we do, we will revise the date at the top of the page and, when appropriate, notify you through the service or by email.",
    ],
  },
  {
    title: "14. Contact Us",
    body: [
      "If you have questions about this Privacy Policy or your data, contact us at salesanalyzer500@gmail.com.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">AuraSales Legal</p>
          <h1 className="mt-3 text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-400">Last updated: April 2, 2026</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This Privacy Policy explains how AuraSales handles your information across the website, dashboard, authentication pages, uploads, AI analysis, translation, and related services.
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
          <Link href="/terms-of-service" className="hover:text-cyan-300 transition">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
