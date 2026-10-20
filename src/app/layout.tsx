import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Barlow_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import CookieConsent from "@/components/ui/CookieConsent";
import { AnalyticsLoader } from "@/components/AnalyticsLoader";
import "./globals.css";
import "leaflet/dist/leaflet.css";


// "Highway" type (docs/DESIGN_SYSTEM.md): Plex for the interface, Barlow Condensed for figures, Plex Mono for IDs
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logisticsedge.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LogisticsEdge — Freight & Fleet Logistics Management Platform",
    template: "%s | LogisticsEdge",
  },
  description: "Software for road freight in India: take bookings, allocate trucks and drivers, track trips from the driver's phone, close deliveries with proof and raise GST invoices.",
  keywords: [
    "transport management software India",
    "fleet management software",
    "truck tracking without GPS device",
    "trip tracking link",
    "proof of delivery app",
    "GST invoice for transporters",
    "freight booking software",
    "LogisticsEdge"
  ],
  authors: [{ name: "LogisticsEdge Technologies Pvt. Ltd." }],
  creator: "LogisticsEdge Technologies Pvt. Ltd.",
  publisher: "LogisticsEdge Technologies Pvt. Ltd.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "LogisticsEdge — Run your trucks from one screen",
    description: "Bookings, free trucks, trip tracking from the driver's phone, proof of delivery and GST invoices for transporters, fleet owners and 3PLs in India.",
    url: siteUrl,
    siteName: "LogisticsEdge",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "LogisticsEdge: road freight software for India" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LogisticsEdge — Run your trucks from one screen",
    description: "Bookings, free trucks, trip tracking from the driver's phone, proof of delivery and GST invoices for road freight in India.",
    images: ["/og.jpg"],
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
  themeColor: "#0B6B4E",
};

// JSON-LD: Organization and WebSite. Only facts the company has confirmed: name, address and phone
// (the same as on the legal pages). No founding date, ratings or languages until they are confirmed.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LogisticsEdge Technologies Pvt. Ltd.",
  "alternateName": "LogisticsEdge",
  "url": siteUrl,
  "description": "Software for road freight in India: bookings, truck and driver allocation, trip tracking from the driver's phone, proof of delivery and GST invoices.",
  "areaServed": "IN",
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
    "contactType": "customer service",
    "telephone": "+91-522-400-1200",
    "areaServed": "IN"
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LogisticsEdge",
  "url": siteUrl,
  "inLanguage": "en-IN"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${barlowCondensed.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, websiteSchema]) }}
        />
        {children}
        <CookieConsent />
        <AnalyticsLoader />
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
