import { createPageMetadata, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";
import BeauteApp from "@/components/features/BeauteApp";

export const metadata = createPageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return <BeauteApp />;
}
