import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import CookieConsent from "@/components/ui/CookieConsent";
import "./globals.css";
import "leaflet/dist/leaflet.css";


// Only load fonts that are actually referenced in globals.css
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
    default: "LogiFlow — Freight & Fleet Logistics Management Platform",
    template: "%s | LogiFlow Logistics",
  },
  description: "Enterprise logistics platform for freight dispatch, fleet telematics, GPS shipment tracking, e-POD, GST invoicing, and warehouse management.",
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
    title: "LogiFlow — Freight Dispatch & Fleet Telematics Platform",
    description: "Manage freight orders, live vehicle tracking, driver dispatch, warehouse staging, e-POD capture, and GST invoicing from one dashboard.",
    url: siteUrl,
    siteName: "LogiFlow Logistics",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogiFlow — Fleet Logistics & Shipment Tracking",
    description: "Freight dispatch, live GPS tracking, driver management, warehouse staging, e-POD, and GST billing — built for logistics operations teams.",
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
  // Homepage canonical — layout applies to '/'. Subpages override with their own alternates.canonical
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0057FF",
};

// JSON-LD: Organization + LocalBusiness schema for Google Knowledge Panel
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  "name": "Precision Logistics Technologies Pvt. Ltd.",
  "alternateName": "LogiFlow",
  "url": siteUrl,
  "description": "Enterprise autonomous logistics infrastructure connecting industrial shippers, cross-docks, dispatch, real-time IoT sensory tracking, and electric fleet routing across India.",
  "foundingDate": "2024",
  "areaServed": "IN",
  "serviceType": "Freight & Logistics Management",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "IN",
    "streetAddress": "Plot No. 12, Vibhuti Khand, Gomti Nagar",
    "addressLocality": "Lucknow",
    "addressRegion": "Uttar Pradesh",
    "postalCode": "226010"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@logiflow.io",
    "availableLanguage": ["English", "Hindi"]
  },
  "sameAs": []
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {children}
        <CookieConsent />
        <Toaster
          position="top-right"
          theme="light"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'var(--surface-1, #fff)',
              border: '1px solid var(--border, #E6E4DF)',
              color: 'var(--text-high, #141414)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            }
          }}
        />
      </body>
    </html>
  );
}
