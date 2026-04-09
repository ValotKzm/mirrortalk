import type { Metadata } from "next";
import "./globals.css";
import { Connection } from "./components/connectionForms/Connection";





export const metadata: Metadata = {
  title: "MirrorTalk",
  description: "Contruct your future",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Connection />
        {children}
      </body>
    </html>
  );
}
