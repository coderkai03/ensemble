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
  title: "Ensemble - AI Project Manager",
  description: "Chat-driven AI assistant for project initialization and management",
};

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800">
      <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
        Ensemble
      </h1>
      <span className="text-xs text-zinc-500 px-2 py-1 bg-zinc-800 rounded">
        AI Project Manager
      </span>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
