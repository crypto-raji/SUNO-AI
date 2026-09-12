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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
