import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nine Eight Pulse | POS for Restaurants & Bars",
  description:
    "Nine Eight Pulse is the all-in-one point of sale platform for restaurants, bars and hospitality businesses. Manage inventory, tills, staff and sales — powered by Nine Eight Koncepts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
