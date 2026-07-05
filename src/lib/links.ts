export const EXTERNAL_LINKS = {
  portfolio: "https://safdarali.in",
  github: "https://github.com/Safdar-Ali-India",
  linkedin: "https://www.linkedin.com/in/safdarali25/",
  twitter: "https://twitter.com/safdarali___",
} as const;

export const FOOTER_LINKS = [
  { href: EXTERNAL_LINKS.github, label: "GitHub" },
  { href: EXTERNAL_LINKS.linkedin, label: "LinkedIn" },
  { href: EXTERNAL_LINKS.twitter, label: "Twitter" },
  { href: EXTERNAL_LINKS.portfolio, label: "Portfolio" },
] as const;
