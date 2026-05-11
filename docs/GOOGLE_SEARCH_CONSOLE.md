# Google Search Console Setup

Last updated: 2026-05-11

## Current Site-side Status

- Production URL: https://beaute-xi.vercel.app
- Sitemap: https://beaute-xi.vercel.app/sitemap.xml
- Robots: https://beaute-xi.vercel.app/robots.txt
- Canonical metadata, Open Graph metadata, Twitter metadata, JSON-LD, and sitemap generation are implemented.
- Search Console HTML tag verification is supported through `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

## Setup Steps

1. Open Google Search Console.
2. Add a URL prefix property for `https://beaute-xi.vercel.app`.
3. Choose HTML tag verification.
4. Copy only the `content` value from the meta tag.
5. Add it to Vercel Production environment variables:

```text
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=PASTE_CONTENT_VALUE_HERE
```

6. Redeploy production.
7. In Search Console, click Verify.
8. Submit this sitemap:

```text
https://beaute-xi.vercel.app/sitemap.xml
```

## First URLs To Inspect

- `https://beaute-xi.vercel.app/`
- `https://beaute-xi.vercel.app/guide`
- `https://beaute-xi.vercel.app/pricing`
- `https://beaute-xi.vercel.app/about`
- `https://beaute-xi.vercel.app/commercial`

## Notes

- `/admin`, `/api`, and `/reset-password` are intentionally blocked from crawl paths.
- `/feedback` is intentionally noindex because it is for beta feedback collection.
- A custom domain can be added later. The same setup should be repeated for the new canonical domain before switching public links.
