import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Keep the default <title> short — iOS Add-to-Home-Screen / Spotlight often
  // indexes the document title even when apple-mobile-web-app-title is set.
  title: {
    default: "Marotto",
    template: "%s · Marotto",
  },
  description: "General contracting and IT services in Pittston, PA — home renovations, networking, custom PC builds, and automation.",
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
