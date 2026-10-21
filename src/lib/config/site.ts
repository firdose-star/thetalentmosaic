/**
 * Brand + metadata constants. Change these once when the boilerplate becomes a
 * real product; every title, OG tag, and footer reads from here.
 */
import { env } from "./env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  shortName: "Talent Mosaic",
  description:
    "Recruit, onboard and manage mentors, book sessions, and capture what happened in each one.",
  url: env.NEXT_PUBLIC_APP_URL,
  locale: "en_US",
  themeColor: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
  links: {
    docs: "/docs",
    support: "mailto:support@example.com",
  },
  /**
   * "Have questions?" contact on Overview (PRD §1). The WhatsApp number and
   * LinkedIn URL are placeholders — an open question in PRD §13.
   */
  communityContact: {
    name: "Firdose",
    whatsappUrl: "https://wa.me/910000000000",
    linkedinUrl: "https://www.linkedin.com/in/firdose",
  },
} as const;

export type SiteConfig = typeof siteConfig;
