import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "beauté | あなただけの美容提案",
  description: "肌・髪・悩みに合わせたAI美容提案。成分解析、バズ動画リンク、使用ログまで。",
  openGraph: {
    title: "beauté",
    description: "AIがあなたの肌に合った美容アイテムを提案",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
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
