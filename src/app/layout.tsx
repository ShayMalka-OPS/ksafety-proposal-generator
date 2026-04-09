import type { Metadata } from "next";
import { Barlow_Condensed, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";

// Display font — authoritative, condensed, governmental weight
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Body font — precise Swiss grotesque, readable at 13–14px on mobile
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "K-Safety Proposal Generator",
  description: "Professional proposals for the K-Safety smart city platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${barlowCondensed.variable} ${hankenGrotesk.variable} antialiased`}>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
