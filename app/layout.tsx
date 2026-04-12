import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "試合・選手情報管理",
  description: "大阪大学空手道部 試合・選手情報管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 mb-16 md:mb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
