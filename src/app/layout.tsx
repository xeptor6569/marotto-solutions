import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import { getBranding, getSiteUrl } from "@/lib/branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { business, publicSite } = await getBranding();
  // Keep the default <title> short — iOS Add-to-Home-Screen / Spotlight often
  // indexes the document title even when apple-mobile-web-app-title is set.
  const shortName = business.name.split(/\s+/)[0] || business.name;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: shortName,
      template: `%s · ${shortName}`,
    },
    description: publicSite.seoDescription || undefined,
    keywords: publicSite.seoKeywords.length ? publicSite.seoKeywords : undefined,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      siteName: business.name,
      title: publicSite.seoTitle,
      description: publicSite.seoDescription || undefined,
    },
    twitter: {
      card: "summary",
      title: publicSite.seoTitle,
      description: publicSite.seoDescription || undefined,
    },
    applicationName: shortName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: shortName,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111113",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Theme appearance="dark" accentColor="indigo" grayColor="slate" radius="large">
          {children}
          <EnvironmentBanner />
        </Theme>
      </body>
    </html>
  );
}
