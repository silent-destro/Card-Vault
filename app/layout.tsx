import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardVault — Digital Business Cards for Indian Businesses",
  description: "Create a stunning digital business card in 5 minutes. Share it via WhatsApp, QR, or link. Collect 5-star reviews automatically. AI-powered for Indian small businesses.",
  keywords: "digital business card, digital visiting card, online business card India, QR card, AI review",
  openGraph: {
    title: "CardVault — Your Business in One Tap",
    description: "Create your digital business card in 5 minutes. Share it anywhere. Watch your reviews grow automatically.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
