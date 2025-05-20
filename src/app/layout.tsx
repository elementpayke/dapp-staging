import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "@coinbase/onchainkit/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | ElementPay - Crypto Payments Made Simple",
    default: "ElementPay - Crypto Payments Made Simple",
  },
  description:
    "Use your crypto for everyday purchases with ElementPay. Make instant payments, create virtual cards, and connect all your wallets in one place.",
  keywords: [
    "crypto payments",
    "virtual cards",
    "ElementPay",
    "M-PESA crypto",
    "crypto to fiat",
    "crypto Kenya",
    "pay with crypto",
    "borderless payments",
    "wallet to wallet payments",
    "USDC payments",
  ],
  authors: [{ name: "ElementPay", url: "https://www.elementpay.net" }],
  generator: "Next.js",
  applicationName: "ElementPay",
  alternates: {
    canonical: "https://www.elementpay.net",
  },
  openGraph: {
    title: "ElementPay - Crypto Payments Made Simple",
    description:
      "Connect your wallet and pay for anything—from coffee to groceries—instantly with crypto. No delays, no high fees.",
    url: "https://www.elementpay.net",
    siteName: "ElementPay",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElementPay - Crypto Payments Made Simple",
    description:
      "Use your crypto for everyday payments. Create virtual cards, pay to M-PESA or banks, and link all your wallets with ease.",
    site: "@elementpayhq",
    creator: "@elementpayhq",
  },
};

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
