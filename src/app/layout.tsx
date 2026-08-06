import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import { BUSINESS_NAME, getSiteUrl } from "@/lib/marketing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  // Keep the default <title> short — iOS Add-to-Home-Screen / Spotlight often
  // indexes the document title even when apple-mobile-web-app-title is set.
  title: {
    default: "Marotto",
    template: "%s · Marotto",
  },
  description: "General contracting and IT services in Pittston, PA — home renovations, networking, custom PC builds, and automation.",
  keywords: [
    "general contractor Pittston PA",
    "contractor Wilkes-Barre PA",
    "IT services Pittston PA",
    "small business networking Wilkes-Barre",
    "custom PC builds Northeast Pennsylvania",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: BUSINESS_NAME,
    title: "Marotto Solutions | Contracting & IT Services",
    description: "Local general contracting, networking, custom PC, and automation services in Pittston, Wilkes-Barre, and Northeast Pennsylvania.",
  },
  twitter: {
    card: "summary",
    title: "Marotto Solutions | Contracting & IT Services",
    description: "Local contracting and IT services in Pittston, Wilkes-Barre, and Northeast Pennsylvania.",
  },
  applicationName: "Marotto",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Marotto",
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
        </Theme>
      </body>
    </html>
  );
}
