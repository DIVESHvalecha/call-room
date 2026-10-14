import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import StudioBackground from "@/components/StudioBackground";
import Ticker from "@/components/Ticker";

const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-barlow" });
const cond = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], style: ["italic", "normal"], variable: "--font-cond" });

export const viewport: Viewport = {
  themeColor: "#0A0F2C",
};

export const metadata: Metadata = {
  title: "Call Room — Predict Rare, Collect Rare",
  description: "Live second-screen cricket companion. Live demo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${cond.variable} antialiased`}>
        <StudioBackground />
        <Ticker />
        <div className="app-col">{children}</div>
      </body>
    </html>
  );
}
