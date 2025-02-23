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
  title: "Voice AI Agent Builder & Tester",
  description:
    "Build, fine-tune, and test your Voice AI Agent with ElevenLabs. Customize agent behavior through real-time conversation and form configuration.",
  keywords: [
    "Voice AI",
    "Conversational AI",
    "ElevenLabs",
    "AI Agent Builder",
    "Voice Assistant",
    "AI Testing Platform",
  ],
  openGraph: {
    title: "Voice AI Agent Builder & Tester",
    description:
      "Interactive platform for building and testing Voice AI Agents with ElevenLabs technology",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
