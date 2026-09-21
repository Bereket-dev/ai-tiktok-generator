import type { Metadata, Viewport } from "next";
import Providers from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "አስቂኝ ፎቶ ቡዝ",
  description: "ይቃኙ፣ ይቅረጹ፣ አስቂኝ የኤአይ ፎቶ ያግኙ።",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ፎቶ ቡዝ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c2410c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
