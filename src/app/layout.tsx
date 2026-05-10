import type { Metadata, Viewport } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://beaute-xi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "beautia | パーソナル美容サーチ",
    template: "%s | beautia",
  },
  description:
    "beautiaは、iRiseが提供するパーソナル美容サーチです。美容商品の検索、保存、比較、成分解析、美容ログ、パーソナル相談をひとつにまとめます。",
  manifest: "/manifest.json?v=beautia-20260510",
  applicationName: "beautia",
  keywords: ["美容", "コスメ", "スキンケア", "ヘアケア", "成分解析", "楽天", "ランキング", "AI"],
  authors: [{ name: "iRise" }],
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
    title: "beautia",
  },
  openGraph: {
    title: "beautia | パーソナル美容サーチ",
    description:
      "美容商品の検索、保存、比較、成分解析、美容ログ、パーソナル相談をひとつにまとめるWebサービスです。",
    url: appUrl,
    siteName: "beautia",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "beautia | パーソナル美容サーチ",
    description: "美容商品の検索、保存、比較、成分解析、美容ログ、パーソナル相談をひとつにまとめるWebサービスです。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1A0E08",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Noto+Serif+JP:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
