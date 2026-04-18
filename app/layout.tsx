import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth";

const geist     = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GPfinanças",
  description: "Controle financeiro para motoristas de aplicativo",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-screen overflow-x-hidden">
        {/* Fixed background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="bg-grid absolute inset-0" />
          <div
            className="animate-orb-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0,212,255,0.6) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="animate-orb-2 absolute -bottom-40 -right-20 w-[700px] h-[700px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, rgba(139,92,246,0.7) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, rgba(0,255,136,0.5) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />
        </div>

        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}