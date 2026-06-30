import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://hihenry.vercel.app";
const DESCRIPTION =
  "Agenda, notas de voz y nómina del equipo en una PWA mobile-first para CEOs.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "HiHenry — Agenda del CEO",
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: "HiHenry",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HiHenry",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "HiHenry",
    title: "HiHenry — Agenda del CEO",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "HiHenry" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HiHenry — Agenda del CEO",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#06080f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
