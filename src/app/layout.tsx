import type { Metadata, Viewport } from "next";
import { Roboto, Caveat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/pwa/register-sw";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "WeWash — Shared Washing Machine Subscriptions",
  description: "Streamlining washing machine access, rotation schedules, payments, and maintenance reporting across university halls.",
  appleWebApp: {
    title: "wewash",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Paints the mobile status bar / browser chrome in the page's mint tone.
  themeColor: "#f0fdfc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${caveat.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="wewash" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
        <RegisterSW />
      </body>
    </html>
  );
}
