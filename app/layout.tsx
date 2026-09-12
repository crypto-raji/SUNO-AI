import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sona AI — Turn information into something you can listen to",
  description:
    "Sona AI helps you understand, process, summarize, and turn written information into useful audio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased bg-ink-950 text-paper-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
