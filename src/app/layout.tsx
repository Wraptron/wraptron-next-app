"use client";

import type { Metadata } from "next";

import Header from "@/components/header";
import SideNav from "@/components/sidenav";
import { usePathname } from "next/navigation";

import "./globals.css";

const metadata: Metadata = {
  title: "Wraptron Studio",
  description: "Create yoru app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return (
      <html lang="en">
        <body>
          <main>
            <div className="flex flex-row">
              <div className="flex flex-col w-full">
                <div>{children}</div>
              </div>
            </div>
          </main>
        </body>
      </html>
    );
  }
  return (
    <html lang="en">
      <body>
        <main>
          <div className="flex flex-row">
            <SideNav />
            <div className="flex flex-col w-full">
              <Header />
              <div>{children}</div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
