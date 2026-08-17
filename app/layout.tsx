import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drape — Your complete look, before you buy",
  description:
    "AI personal stylist and shopping assistant. Discover outfits chosen for you, try them virtually, and complete your look before you buy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
