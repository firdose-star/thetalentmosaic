import type { Metadata, Viewport } from "next";
import { Allura, DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";

import { Providers } from "@/providers";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

/**
 * DM Sans is the global typeface, for body text and headings alike.
 *
 * `next/font` self-hosts it at build time: no request to fonts.googleapis.com
 * at runtime, no layout shift from a late swap, and no privacy hop to Google.
 * It is a variable font, so no weight list is needed.
 *
 * The `variable` option exposes `--font-dm-sans`; `globals.css` binds it to
 * Tailwind's `--font-sans` and `--font-heading` in the `@theme inline` block —
 * no per-component font classes, and one line to swap the typeface later.
 */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

/**
 * Brand-only faces for the "The Talent Mosaic" wordmark, matching the logo:
 * a script "The" and serif-italic "Talent Mosaic". Used nowhere else.
 */
const brandSerif = Playfair_Display({
  variable: "--font-brand-serif",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["700"],
  display: "swap",
});

const brandScript = Allura({
  variable: "--font-brand-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — A peer led community of HRs across startups`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: "/brand/talent-mosaic-banner.png", width: 1600, height: 800, alt: "The Talent Mosaic, by Mesa School of Business" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // next-themes writes the theme class before hydration; without this React
      // reports a mismatch on every load.
      suppressHydrationWarning
      className={`${dmSans.variable} ${brandSerif.variable} ${brandScript.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
