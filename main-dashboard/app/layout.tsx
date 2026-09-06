import type { Metadata } from "next";
import { Bricolage_Grotesque, Hubot_Sans, Martian_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import ThemeWrapper from "@/providers/theme-provider";
import { Toaster } from "sonner";
import Sidebar from "@/components/sidebar";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const hubot = Hubot_Sans({
  variable: "--font-hubot",
  subsets: ["latin"],
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard - Videon",
  description:
    "Modern APIs for ingesting, transcoding, and streaming video at scale. Ship upload flows, on-demand playback, and live pipelines without building your own media stack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${bricolage.variable} ${hubot.variable} ${martian.variable} antialiased`}
        >
          <ThemeWrapper>
            <QueryProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-6 min-w-0 bg-background text-foreground">
                  {children}
                </main>
              </div>
              <Toaster
                position="top-right"
                theme="system"
                toastOptions={{
                  className:
                    "bg-[#0A0C10] text-white border border-[#23262e]",
                  closeButton: true,
                }}
              />
            </QueryProvider>
          </ThemeWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}