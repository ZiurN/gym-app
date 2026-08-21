import type { Metadata, Viewport } from "next";
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
  title: "Mi Regreso al Gym — Plan de entrenamiento y nutrición",
  description:
    "Plan progresivo de 4 semanas para retomar el entrenamiento después de una pausa, con calculadora de calorías y macros y guía de nutrición.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Regreso al Gym",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f8a56",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
