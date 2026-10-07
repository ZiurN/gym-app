import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk } from "next/font/google";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import "./globals.css";

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
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
      className={`${familjen.variable} antialiased`}
    >
      <body className="min-h-dvh font-sans">
        <div className="border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Mi Regreso al Gym
            </Link>
            <AuthHeader />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
