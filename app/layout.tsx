import type { Metadata } from "next";
import "./globals.css";
import { Connection } from "./components/connectionForms/Connection";





export const metadata: Metadata = {
  title: "MirrorTalk",
  description: "Entraînez-vous aux entretiens en direct et gardez une transcription de votre échange.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Connection />
        {children}
      </body>
    </html>
  );
}
