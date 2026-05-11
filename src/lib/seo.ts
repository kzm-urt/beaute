import type { Metadata } from "next";
import { LEGAL_INFO, PUBLIC_SITE_URL } from "@/lib/legalInfo";

export const SITE_NAME = "beautia";
export const SITE_TITLE = "beautia | パーソナル美容サーチ";
export const SITE_DESCRIPTION =
  "beautiaは、顔・メイク写真分析、成分解析、診断後のおすすめコスメ、商品検索、保存、比較、美容ログをひとつにまとめるパーソナル美容サーチです。";
export const SITE_URL = PUBLIC_SITE_URL;
export const OG_IMAGE = "/images/beautia-hero-still-life-wide.png";
export const OG_IMAGE_ALT = "beautiaの美容商品とスキンケアを想起させる上質なビジュアル";

export const SEO_KEYWORDS = [
  "beautia",
  "美容",
  "コスメ",
  "スキンケア",
  "ヘアケア",
  "美容アプリ",
  "顔診断",
  "顔面診断",
  "AI顔診断",
  "メイク診断",
  "パーソナルカラー診断",
  "黄金比診断",
  "おすすめコスメ",
  "コスメ診断",
  "SNS診断",
  "美容商品検索",
  "成分解析",
  "コスメ比較",
  "楽天ランキング",
  "パーソナル美容",
  "美容ログ",
  "AI美容相談",
];

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  noIndex = false,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const ogTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: absoluteUrl(path),
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
      title: ogTitle,
      description,
      images: [OG_IMAGE],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
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
  };
}

export const FAQ_ITEMS = [
  {
    question: "beautiaでは何ができますか？",
    answer:
      "美容商品の検索、ランキング確認、保存・比較、成分解析、美容ログ、登録内容をもとにしたパーソナル相談ができます。",
  },
  {
    question: "顔・メイク写真分析では何が分かりますか？",
    answer:
      "顔写真から、写真上の印象、黄金比バランスの見え方、似合いやすいメイク方向、SNSで共有しやすい診断タイプ、診断後のおすすめコスメ候補を整理します。",
  },
  {
    question: "無料でも使えますか？",
    answer:
      "無料でも商品検索、ランキング、基本的な保存、パーソナル相談、週1回の写真分析を利用できます。PROでは写真分析や相談回数、パーソナル機能が広がります。",
  },
  {
    question: "PROプランはいくらですか？",
    answer: `PROプランは月額${LEGAL_INFO.proPrice}（税込）です。${LEGAL_INFO.proTrialDays}日間の無料トライアルがあります。`,
  },
  {
    question: "美容の効果を保証するサービスですか？",
    answer:
      "beautiaの表示や解析は参考情報です。医療的な診断や効果の保証ではないため、不安がある場合は専門家へ相談してください。",
  },
];

export function getBaseStructuredData() {
  const logoUrl = absoluteUrl("/icons/beautia-mark-20260510.png");
  const proPrice = LEGAL_INFO.proPrice.replace(/[^\d]/g, "") || "500";

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: LEGAL_INFO.operatorName,
      url: SITE_URL,
      logo: logoUrl,
      email: LEGAL_INFO.supportEmail,
      brand: {
        "@type": "Brand",
        name: SITE_NAME,
        logo: logoUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: "パーソナル美容サーチ beautia",
      url: SITE_URL,
      inLanguage: "ja-JP",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?tab=search&q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "LifestyleApplication",
      featureList: [
        "AI顔・メイク写真分析",
        "黄金比バランスの見え方",
        "SNS向け診断レポート",
        "診断後のおすすめコスメ提案",
        "美容商品の検索・保存・比較",
        "成分解析",
        "美容ログ",
      ],
      operatingSystem: "Web",
      inLanguage: "ja-JP",
      description: SITE_DESCRIPTION,
      image: absoluteUrl(OG_IMAGE),
      offers: {
        "@type": "Offer",
        price: proPrice,
        priceCurrency: "JPY",
        availability: "https://schema.org/InStock",
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}/guide#faq`,
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}

export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
