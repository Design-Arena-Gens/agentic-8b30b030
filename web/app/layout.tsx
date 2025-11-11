import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Human Muse Agent",
  description:
    "Agentic studio that crafts human figure art and publishes polished posts to Instagram.",
  metadataBase: new URL("https://agentic-8b30b030.vercel.app"),
  openGraph: {
    title: "Human Muse Agent",
    description:
      "Craft stylised human artwork, build captions, and push straight to Instagram.",
    url: "https://agentic-8b30b030.vercel.app",
    siteName: "Human Muse Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "Human Muse Agent",
    description:
      "Generate figure drawings, cinematic portraits, and ready-to-post Instagram content in one flow.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
