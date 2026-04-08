import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "空手道オーダー予測",
  description: "大学空手道部 女子組手 オーダー管理・予測システム",
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
