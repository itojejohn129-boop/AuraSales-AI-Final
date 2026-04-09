import type { Metadata } from "next";

import { SalesDataProvider } from "@/lib/sales-data-context";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { AuraTestRunner } from "@/components/providers/AuraTestRunner";
import { SiteTranslatorProvider } from "@/components/providers/SiteTranslatorProvider";
import { RoutePrefetcher } from "@/components/providers/RoutePrefetcher";
import AuraHeaderWrapper from "@/components/AuraHeaderWrapper";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA | The Engineering Intelligence Dashboard",
  description: "AURA is the all-in-one engineering intelligence dashboard for predictive revenue, market sentiment, and voice-driven business control. Secure, AI-powered, and built for growth.",
  metadataBase: new URL("https://aura.example.com"),
  openGraph: {
    title: "AURA | The Engineering Intelligence Dashboard",
    description: "AURA is the all-in-one engineering intelligence dashboard for predictive revenue, market sentiment, and voice-driven business control. Secure, AI-powered, and built for growth.",
    url: "https://aura.example.com/",
    siteName: "AURA",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "AURA Engineering Intelligence Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-50 antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
        <SiteTranslatorProvider>
          <RoutePrefetcher />
          <ErrorBoundary>
            <AuraHeaderWrapper />
            <SalesDataProvider>
              <AuraTestRunner />
              {children}
            </SalesDataProvider>
            <Footer />
            <ToasterProvider />
          </ErrorBoundary>
        </SiteTranslatorProvider>
      </body>
    </html>
  );
}
