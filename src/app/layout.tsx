import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SpectrumClientProvider } from "@/components/SpectrumClientProvider";

export const metadata: Metadata = {
  title: "Brevity | برنامه تحصیلی و یادآور کلاس و تکالیف",
  description: "مدیریت شخصی برنامه کلاسی، تکالیف و ارسال خودکار یادآور تلگرام ۹۰ دقیقه قبل از کلاس",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brevity",
  },
  icons: {
    icon: [
      { url: "/icons/faveicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/PWA.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/PWA-splash.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <head>
        <meta name="apple-mobile-web-app-title" content="Brevity" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased overflow-x-hidden">
        <SpectrumClientProvider>
          {children}
        </SpectrumClientProvider>
      </body>
    </html>
  );
}
