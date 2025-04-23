import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
// import Script from "next/script";

import { TRPCReactProvider } from "trpc/react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme-provider";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "SmartStock - Your Smart Trading Partner",
  description: "SmartStock - Your Smart Trading Partner",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <head>
        {/* {process.env.NODE_ENV === "development" && (
          <Script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
            strategy="afterInteractive"
          />
        )} */}
      </head>
      <body>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCReactProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar variant="inset" />
                <SidebarInset>
                  <SiteHeader />
                  <main>
                    <Toaster />
                    {children}
                    <Analytics />
                    <SpeedInsights />
                  </main>
                </SidebarInset>
              </SidebarProvider>
              {/* {process.env.NODE_ENV === "development" && <ReactQueryDevtools />} */}
            </TRPCReactProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
