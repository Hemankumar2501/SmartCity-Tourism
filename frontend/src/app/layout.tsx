import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WanderWise AI",
  description: "AI-Powered Enterprise Smart Tourism Ecosystem",
};

import { AuthProvider } from "./components/AuthContext";
import { ThemeProvider } from "./components/ThemeContext";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070A13] text-gray-100 font-sans">
        <SessionProviderWrapper>
          <AuthProvider>
            <ThemeProvider>
              <div className="flex-1 flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 flex flex-col relative">
                  {children}
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
