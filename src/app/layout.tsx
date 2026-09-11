import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import "@fontsource-variable/plus-jakarta-sans";

import { PwaServiceWorker } from "@/components/shared/pwa-service-worker";

import { QueryProvider } from "./query-provider";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Hunting OS",
  title: {
    default: "Web3 Hunting OS",
    template: "%s · Web3 Hunting OS",
  },
  description: "A private workspace for Web3 hunting activities.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hunting OS",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/web3-hunting-os-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0f11",
  colorScheme: "dark",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <PwaServiceWorker />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
