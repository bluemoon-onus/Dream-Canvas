import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "DreamCanvas — 꿈 해석 비주얼 카드",
  description: "아침에 말한 꿈을 AI가 해석해 한 장의 드림카드로 만들어드려요.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
