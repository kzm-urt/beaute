import type { Metadata, Viewport } from "next";
import {
  getBaseStructuredData,
  OG_IMAGE,
  OG_IMAGE_ALT,
  safeJsonLd,
  SEO_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json?v=beautia-20260510",
  applicationName: SITE_NAME,
  keywords: SEO_KEYWORDS,
  authors: [{ name: "iRise" }],
  creator: "iRise",
  publisher: "iRise",
  category: "beauty",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icons/beautia-mark-20260510.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/beautia-icon-192-20260510.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon-20260510.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1774,
        height: 887,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1A0E08",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = getBaseStructuredData();

  return (
    <html lang="ja">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no, address=no, email=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Noto+Serif+JP:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
