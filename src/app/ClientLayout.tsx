"use client";

import { Suspense, useEffect } from "react";
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
import { AttendanceReminderBanner } from "@/components/attendance-reminder-banner";
import { PwaPushSetup } from "@/components/pwa-push-setup";
import { registerPushServiceWorker } from "@/lib/web-push-client";
import { cn } from "@/lib/utils";

function ServiceWorkerRegistrar() {
  useEffect(() => {
    void registerPushServiceWorker();
  }, []);
  return null;
}

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const isHomePage =
    pathname === "/" || pathname === null || pathname === undefined;
  const isLoginPage = pathname?.startsWith("/login") ?? false;
  const isSignupPage = pathname?.startsWith("/signup") ?? false;
  const isCustomerOnboardingPage =
    pathname?.startsWith("/customer-onboarding") ?? false;
  const isInvitePage = pathname?.startsWith("/invite") ?? false;
  const isForgotPasswordPage =
    pathname?.startsWith("/forgot-password") ?? false;
  const isResetPasswordPage =
    pathname?.startsWith("/reset-password") ?? false;
  // Formfield app hidden — restore by uncommenting
  // const isFormfieldBuilder = pathname === "/formfield";
  // const isPublishedFormPage = pathname?.startsWith("/formfield/f") ?? false;
  const shouldHideSidebar =
    isHomePage ||
    isLoginPage ||
    isSignupPage ||
    isCustomerOnboardingPage ||
    isInvitePage ||
    isForgotPasswordPage ||
    isResetPasswordPage;
    // || isFormfieldBuilder
    // || isPublishedFormPage;
  const shouldHideHeader =
    isHomePage ||
    isLoginPage ||
    isSignupPage ||
    isCustomerOnboardingPage ||
    isInvitePage ||
    isForgotPasswordPage ||
    isResetPasswordPage;
    // || isPublishedFormPage;

  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {!shouldHideSidebar ? (
        <Suspense fallback={null}>
          <SideNav />
        </Suspense>
      ) : null}
      <div
        className={cn(
          "flex h-full flex-col transition-all duration-300 ease-in-out ml-0",
          !shouldHideSidebar && (isCollapsed ? "md:ml-16" : "md:ml-64"),
        )}
      >
        {!shouldHideHeader ? (
          <div className="shrink-0">
            <Header />
            <PwaPushSetup />
            <AttendanceReminderBanner />
          </div>
        ) : null}
        <div
          id="main-content-portal"
          className={cn(
            "relative flex min-h-0 flex-1 flex-col bg-background text-foreground",
            "overflow-y-auto pb-4",
            // isFormfieldBuilder ? "overflow-hidden" : "overflow-y-auto pb-4", // Formfield app hidden
          )}
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
      <ServiceWorkerRegistrar />
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
