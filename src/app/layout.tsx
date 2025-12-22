"use client";

import Header from "@/components/header";
import SideNav from "@/components/sidenav";
import ProtectedRoute from "@/components/protected-route";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

import "./globals.css";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

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
  } else if (pathname.startsWith("/settings")) {
    return (
      <main className="h-screen w-screen overflow-hidden">
        <div className="flex flex-row h-full">
          <div className="flex flex-col w-full h-full">
            <Header />
            <div className="flex-1 overflow-y-auto ml-20 mr-4 mt-4">{children}</div>
          </div>
        </div>
      </main>
    );
  }

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
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">
        <AuthProvider>
          <ProtectedRoute>
            <SidebarProvider>
              <MainContent>{children}</MainContent>
            </SidebarProvider>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
