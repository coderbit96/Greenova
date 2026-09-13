import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Greenova — Luxury Retreat & Spa",
    template: "%s · Greenova",
  },
  description:
    "An award-winning luxury retreat where rainforest canopy meets refined hospitality. Reserve suites, villas and spa experiences at Greenova.",
  keywords: ["luxury hotel", "resort booking", "spa retreat", "Greenova", "eco luxury"],
  openGraph: {
    title: "Greenova — Luxury Retreat & Spa",
    description: "Where the rainforest meets refined hospitality.",
    type: "website",
    siteName: "Greenova",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1512" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} min-h-screen flex flex-col`}
        style={
          {
            "--font-sans": "var(--font-inter)",
            "--font-display": "var(--font-cormorant)",
          } as React.CSSProperties
        }
      >
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ style: { fontFamily: "var(--font-inter)" } }}
          />
        </Providers>
      </body>
    </html>
  );
}
