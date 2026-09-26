import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/auth";
import "./globals.css";
import { AuthSessionProvider } from "./components/AuthSessionProvider";
import { Connection } from "./components/connectionForms/Connection";





export const metadata: Metadata = {
  title: "MirrorTalk",
  description: "Entraînez-vous aux entretiens en direct et gardez une transcription de votre échange.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <html lang="fr">
      <body>
        <AuthSessionProvider accountName={session?.user.name?.trim() || null}>
          <Connection isAuthenticated={Boolean(session)} />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
