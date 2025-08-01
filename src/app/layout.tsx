import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "@coinbase/onchainkit/styles.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Web3ErrorBoundary from "@/components/shared/Web3ErrorBoundary";

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
    template: "%s | ElementPay - Crypto Micro Payments Made Simple",
    default: "ElementPay - Crypto Micro Payments Made Simple",
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  description:
    "Use your crypto for everyday purchases with ElementPay. Make instant payments, and connect all your wallets in one place.",
  keywords: [
    "crypto payments",
    "off-ramp in kenya",
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
    title: "ElementPay - Crypto Micro Payments Made Simple",
    description:
      "Connect your wallet and pay for anything—from coffee to groceries—instantly with crypto. No delays, no high fees.",
    url: "https://www.elementpay.net",
    siteName: "ElementPay",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElementPay - Crypto Micro Payments Made Simple",
    description:
      "Use your crypto for everyday payments pay to M-PESA or banks, and link all your wallets with ease.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Standard favicon for all browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* High-res PNG for modern browsers and pinned tabs */}
        <link rel="icon" type="image/png" href="/elementpay.png" sizes="256x256" />
        {/* Optional: Apple Touch Icon for iOS */}
        <link rel="apple-touch-icon" href="/elementpay.png" sizes="180x180" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Web3ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Providers>{children}</Providers>
            <Toaster />
          </ThemeProvider>
        </Web3ErrorBoundary>
      </body>
    </html>
  );
}
