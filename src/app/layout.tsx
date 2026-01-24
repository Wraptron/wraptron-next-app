"use client";

import Header from "@/components/header";
import SideNav from "@/components/sidenav";
import ProtectedRoute from "@/components/protected-route";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { PageTitleProvider } from "@/contexts/page-title-context";
import { cn } from "@/lib/utils";

import "./globals.css";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  // Public routes (no sidebar/header)
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return (
      <main className="h-screen w-screen overflow-auto">
        <div className="flex flex-row h-full">
          <div className="flex flex-col w-full">
            <div className="h-full">{children}</div>
          </div>
        </div>
      </main>
    );
  }

  // Protected routes (with sidebar and header)
  return (
    <main className="h-screen w-screen overflow-hidden">
      <SideNav />
      <div
        className={cn(
          "flex flex-col h-full transition-all duration-300 ease-in-out",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div className="flex-1 overflow-y-auto ml-4 mr-4 mt-4 pb-4">{children}</div>
      </div>
    </main>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden">
        <AuthProvider>
          <ProtectedRoute>
            <PageTitleProvider>
              <SidebarProvider>
                <MainContent>{children}</MainContent>
              </SidebarProvider>
            </PageTitleProvider>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
