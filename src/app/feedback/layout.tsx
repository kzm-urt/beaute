import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "フィードバック",
  description: "beautiaのベータテスト用フィードバックフォームです。",
  path: "/feedback",
  noIndex: true,
});

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return children;
}
