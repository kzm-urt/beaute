import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "パスワード再設定",
  description: "beautiaのパスワード再設定ページです。",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
