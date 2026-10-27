/**
 * Brand + metadata constants. Change these once when the boilerplate becomes a
 * real product; every title, OG tag, and footer reads from here.
 */
import { env } from "./env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  shortName: "Talent Mosaic",
  description:
    "A private, peer-led community of HR professionals across startups — people, resources, roles and catchups in one place. By Mesa School of Business.",
  url: env.NEXT_PUBLIC_APP_URL,
  locale: "en_US",
  themeColor: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
  links: {
    docs: "/docs",
    support: "mailto:firdose@mesaschool.co",
  },
  /**
   * "Have questions?" contact on Overview (PRD §1). Set either link to null
   * to hide its button.
   */
  communityContact: {
    name: "Firdose",
    email: "firdose@mesaschool.co",
    whatsappUrl: "https://wa.me/919916577315" as string | null,
    linkedinUrl: "https://www.linkedin.com/in/firdose-fathima" as string | null,
  },
} as const;

export type SiteConfig = typeof siteConfig;
