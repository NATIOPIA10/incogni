import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { GlobalNotifier } from "@/components/ui/GlobalNotifier";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#0B0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: "Incogni",
  description: "Ethereal Connectivity - A safe space for university dating.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Incogni",
  },
  icons: {
    icon: [
      { url: "/icon.png?v=1" },
      { url: "/favicon.png?v=1", sizes: "32x32", type: "image/png" },
    ],
    shortcut: ["/icon.png?v=1"],
    apple: [
      { url: "/icon.png?v=1" },
    ],
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    console.error("RootLayout auth check failed:", err)
  }

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#0B0E14] text-[#e1e2eb] font-sans" suppressHydrationWarning>
        {user && <GlobalNotifier userId={user.id} />}
        {children}
      </body>
    </html>
  );
}
