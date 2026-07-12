"use client";

import { Suspense } from "react";
import Header from "@/components/header";
import SideNav from "@/components/sidenav";
import ProtectedRoute from "@/components/protected-route";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { PageTitleProvider } from "@/contexts/page-title-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { SheetPushProvider } from "@/contexts/sheet-push-context";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogIdentify } from "@/components/posthog/posthog-identify";
import { PostHogPageView } from "@/components/posthog/posthog-pageview";
import { cn } from "@/lib/utils";

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const isHomePage =
    pathname === "/" || pathname === null || pathname === undefined;
  const isLoginPage = pathname?.startsWith("/login") ?? false;
  const isSignupPage = pathname?.startsWith("/signup") ?? false;
  const isCustomerOnboardingPage =
    pathname?.startsWith("/customer-onboarding") ?? false;
  const shouldHideSidebar =
    isHomePage || isLoginPage || isSignupPage || isCustomerOnboardingPage;
  const shouldHideHeader =
    isHomePage || isLoginPage || isSignupPage || isCustomerOnboardingPage;

  if (shouldHideSidebar) {
    return (
      <main className="h-screen w-screen overflow-auto bg-background text-foreground">
        <div className="flex flex-row h-full w-full">
          <div className="flex flex-col w-full h-full min-h-0">{children}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <Suspense fallback={null}>
        <SideNav />
      </Suspense>
      <div
        className={cn(
          "flex flex-col h-full transition-all duration-300 ease-in-out ml-0",
          isCollapsed ? "md:ml-16" : "md:ml-64",
        )}
      >
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div
          id="main-content-portal"
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pb-4 text-foreground"
        >
          {children}
        </div>
      </div>
    </main>
  );
}

export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <PostHogIdentify />
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
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
    </ThemeProvider>
  );
}
