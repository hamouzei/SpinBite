import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpinBite — Spin & Win Restaurant Rewards",
  description:
    "Scan, spin, and win real rewards at your favorite restaurants. Free burgers, pizzas, drinks and more!",
  keywords: ["restaurant rewards", "spin wheel", "free food", "loyalty program"],
  openGraph: {
    title: "SpinBite — Spin & Win Restaurant Rewards",
    description: "Scan, spin, and win real rewards at your favorite restaurants.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0B0B0F" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
