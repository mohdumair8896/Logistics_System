import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import CookieConsent from "@/components/ui/CookieConsent";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logiflow.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LogiFlow AI — Next-Gen Autonomous Logistics & Telematics Platform",
    template: "%s | LogiFlow Logistics",
  },
  description: "Enterprise autonomous logistics infrastructure connecting industrial shippers, cross-docks, AI dispatch, real-time IoT sensory tracking, and electric fleet routing.",
  keywords: [
    "autonomous logistics",
    "fleet telematics",
    "freight management system",
    "supply chain software",
    "real-time GPS shipment tracking",
    "cross-dock dispatch",
    "cold chain monitoring",
    "proof of delivery",
    "LogiFlow"
  ],
  authors: [{ name: "LogiFlow Technologies Inc." }],
  creator: "LogiFlow Technologies",
  publisher: "LogiFlow Logistics",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "LogiFlow AI — Autonomous Freight & Fleet Telematics Platform",
    description: "Moving made easy, wherever cargo takes you. Predictive AI dispatch, live IoT sensory tracking, and zero-latency cross-dock consolidation.",
    url: siteUrl,
    siteName: "LogiFlow Logistics",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogiFlow AI — Autonomous Fleet Logistics",
    description: "Enterprise autonomous logistics infrastructure connecting industrial shippers, cross-docks, and final-mile green delivery fleets.",
    creator: "@LogiFlowAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">
        {children}
        <CookieConsent />
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: '#0f172a',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#FAFAF9',
              fontFamily: 'var(--font-geist-sans, sans-serif)',
              fontSize: '13px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }
          }}
        />
      </body>
    </html>
  );
}
