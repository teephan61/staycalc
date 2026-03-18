import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://phylix-staycalc.vercel.app"),
  title: {
    default: "StayCalc | Phylix Tech",
    template: "%s | Phylix Tech",
  },
  description:
    "Compare short-term rental scenarios with a calmer, more realistic view of profit, risk, and break-even pressure.",
  applicationName: "StayCalc",
  keywords: [
    "StayCalc",
    "Phylix Tech",
    "short-term rental calculator",
    "Airbnb calculator",
    "rental comparison tool",
    "break-even occupancy calculator",
    "Airbnb arbitrage calculator",
    "rental profit calculator",
  ],
  authors: [{ name: "Tee" }],
  creator: "Tee",
  publisher: "Phylix Tech",
  category: "finance",
  openGraph: {
    title: "StayCalc | Phylix Tech",
    description:
      "Compare short-term rental scenarios with realistic cost assumptions, break-even pressure, and adjusted profit.",
    url: "https://phylix-staycalc.vercel.app",
    siteName: "StayCalc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StayCalc | Phylix Tech",
    description:
      "A calmer, more realistic tool for comparing short-term rental scenarios.",
  },
  alternates: {
    canonical: "https://phylix-staycalc.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}