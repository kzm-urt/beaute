import type { Metadata, Viewport } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://beaute-xi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "beauté | あなただけの美容提案",
    template: "%s | beauté",
  },
  description: "肌・髪・悩みに合わせたAI美容提案。成分解析、楽天商品検索、ランキング、保存リスト、使用ログまで。",
  manifest: "/manifest.json",
  applicationName: "beauté",
  keywords: ["美容", "コスメ", "スキンケア", "ヘアケア", "成分解析", "楽天", "ランキング", "AI"],
  authors: [{ name: "beauté" }],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "beauté",
  },
  openGraph: {
    title: "beauté | あなただけの美容提案",
    description: "AIが肌・髪・悩みに合った美容アイテムを提案。成分解析、楽天商品検索、ランキング、使用ログまで。",
    url: appUrl,
    siteName: "beauté",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "beauté | あなただけの美容提案",
    description: "肌・髪・悩みに合わせたAI美容提案。",
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
