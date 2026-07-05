import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { StructuredData } from "@/components/seo/StructuredData";
import { BRAND, KEYWORDS, SITE_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShipCheck — Free AI Browser Testing Tool",
  description:
    "Test your website with AI in plain English. ShipCheck runs real browser checks, captures screenshots, and returns pass/fail bug reports. Free visual diff included. No signup.",
  keywords: [...KEYWORDS],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "ShipCheck — Free Visual Regression Testing Tool",
    description:
      "Compare screenshots pixel by pixel. Upload images or capture live URLs. Free, instant, no signup.",
    url: SITE_URL,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipCheck — Visual Regression Testing",
    description: "Free UI diff checker. Compare screenshots online.",
    creator: "@safdarali___",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StructuredData />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
