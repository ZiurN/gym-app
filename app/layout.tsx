import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk } from "next/font/google";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app";
import "./globals.css";

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#0071bc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${familjen.variable} antialiased`}
    >
      <body className="min-h-dvh font-sans">
        <div className="border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              {APP_NAME}
            </Link>
            <AuthHeader />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
