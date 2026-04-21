import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSerwistProvider } from "./serwist-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Easy Grocer",
  title: {
    default: "Easy Grocer",
    template: "%s | Easy Grocer",
  },
  description:
    "Build personalized weekly meal plans and send groceries to Walmart+.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Easy Grocer",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f5f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppSerwistProvider>{children}</AppSerwistProvider>
      </body>
    </html>
  );
}
