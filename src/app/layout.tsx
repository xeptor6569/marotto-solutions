import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import { getAppearancePreference } from "@/lib/appearance";
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

export async function generateViewport(): Promise<Viewport> {
  const { branding } = await getBranding();
  const pref = await getAppearancePreference(branding.theme.defaultAppearance);

  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor:
      pref === "light"
        ? "#ffffff"
        : pref === "dark"
          ? "#111113"
          : [
              { media: "(prefers-color-scheme: dark)", color: "#111113" },
              { media: "(prefers-color-scheme: light)", color: "#ffffff" },
            ],
  };
}

/**
 * Applies the visitor's light/dark choice before first paint. The cookie (or
 * the configured default) resolves to a `light`/`dark` class on <html>, which
 * Radix Theme (appearance="inherit") picks up. Runs synchronously so there is
 * never a flash of the wrong theme, including in system mode where only the
 * browser knows the OS preference.
 */
const appearanceInitScript = `(function(){try{
var m=document.cookie.match(/(?:^|;\\s*)appearance=(light|dark|system)/);
var pref=m?m[1]:(document.documentElement.dataset.defaultAppearance||'system');
var resolved=pref==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):pref;
var root=document.documentElement;
root.classList.remove('light','dark');
root.classList.add(resolved);
root.style.colorScheme=resolved;
}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { branding } = await getBranding();
  const theme = branding.theme;
  const pref = await getAppearancePreference(theme.defaultAppearance);
  // SSR class for the explicit choices; system mode is resolved by the init
  // script (dark is the no-JS fallback, matching the app's historical look).
  const ssrClass = pref === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={ssrClass}
      style={{ colorScheme: ssrClass }}
      data-default-appearance={theme.defaultAppearance}
    >
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
        <Theme
          appearance="inherit"
          accentColor={theme.accentColor}
          grayColor={theme.grayColor}
          radius={theme.radius}
        >
          {children}
          <EnvironmentBanner />
        </Theme>
      </body>
    </html>
  );
}
