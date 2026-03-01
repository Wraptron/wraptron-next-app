"use client";

import Header from "@/components/header";
import SideNav from "@/components/sidenav";
import ProtectedRoute from "@/components/protected-route";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { PageTitleProvider } from "@/contexts/page-title-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { SheetPushProvider, useSheetPush } from "@/contexts/sheet-push-context";
import { cn } from "@/lib/utils";

import "./globals.css";

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const { sheetWidthPx } = useSheetPush() ?? { sheetWidthPx: 0 };

  // Routes without sidebar/header - explicitly check for home page
  const isHomePage =
    pathname === "/" || pathname === null || pathname === undefined;
  const isLoginPage = pathname?.startsWith("/login") ?? false;
  const isSignupPage = pathname?.startsWith("/signup") ?? false;
  const shouldHideSidebar = isHomePage || isLoginPage || isSignupPage;
  const shouldHideHeader = isHomePage || isLoginPage || isSignupPage;

  // Early return for routes without sidebar/header
  if (shouldHideSidebar) {
    return (
      <main className="h-screen w-screen overflow-auto">
        <div className="flex flex-row h-full w-full">
          <div className="flex flex-col w-full h-full">{children}</div>
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
          isCollapsed ? "ml-16" : "ml-64",
        )}
      >
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div
          id="main-content-portal"
          className="flex-1 overflow-y-auto ml-4 mt-4 pb-4 relative min-h-0 transition-[margin] duration-300 ease-in-out"
          style={{ marginRight: sheetWidthPx > 0 ? sheetWidthPx : 16 }}
        >
          {children}
        </div>
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
            <CurrencyProvider>
              <PageTitleProvider>
                <SidebarProvider>
                  <SheetPushProvider>
                    <MainContent>{children}</MainContent>
                  </SheetPushProvider>
                </SidebarProvider>
              </PageTitleProvider>
            </CurrencyProvider>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
