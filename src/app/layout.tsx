import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://beaute.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "beauté | あなただけの美容提案",
    template: "%s | beauté",
  },
  description: "肌・髪・悩みに合わせたAI美容提案。成分解析、バズ動画リンク、使用ログまで。",
  manifest: "/manifest.json",
  applicationName: "beauté",
  keywords: ["美容", "コスメ", "スキンケア", "成分解析", "楽天", "AI"],
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
    description: "AIが肌・髪・悩みに合った美容アイテムを提案。成分解析、楽天商品検索、使用ログまで。",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1A0E08" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Noto+Sans+JP:wght@400;500;600&family=Noto+Serif+JP:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#F8F4EF" }}>{children}</body>
    </html>
  );
}
