"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Download, Smartphone, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { buildNavAccess, canAccessInternalNav } from "@/lib/nav-access";
import { Button } from "@/components/ui/button";
import {
  canUseWebPush,
  dismissPwaPrompt,
  enablePushNotifications,
  isIosChrome,
  isIosDevice,
  isPwaPromptDismissed,
  isStandalonePwa,
  registerPushServiceWorker,
  syncPushSubscriptionIfGranted,
} from "@/lib/web-push-client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaPushSetup() {
  const { user, isAuthenticated } = useAuth();
  const { permissions, isOwner, isSuperAdmin } = useOrganization();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [standalone, setStandalone] = useState(false);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);

  const isStaff = useMemo(
    () =>
      canAccessInternalNav(
        buildNavAccess({
          permissions,
          isOwner: isOwner || isSuperAdmin,
          globalRole: user?.global_role ?? user?.role,
        }),
      ),
    [permissions, isOwner, isSuperAdmin, user?.global_role, user?.role],
  );

  useEffect(() => {
    void registerPushServiceWorker();
    setStandalone(isStandalonePwa());
    setDismissed(isPwaPromptDismissed());
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isStaff) return;
    void syncPushSubscriptionIfGranted();
  }, [isAuthenticated, isStaff]);

  const needsIosInstall = isIosDevice() && !standalone && !isIosChrome();
  const needsSafariInstead = isIosChrome();
  const canInstall = !!installEvent && !standalone;
  const canEnablePush =
    canUseWebPush() &&
    permission !== "granted" &&
    permission !== "unsupported" &&
    (!isIosDevice() || standalone);

  const visible =
    isAuthenticated &&
    isStaff &&
    !dismissed &&
    (needsIosInstall || needsSafariInstead || canInstall || canEnablePush);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    setBusy(true);
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } finally {
      setBusy(false);
    }
  }, [installEvent]);

  const handleAllow = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await enablePushNotifications();
      if (result.ok) {
        setPermission("granted");
        setMessage(null);
      } else {
        setMessage(result.reason);
        if (typeof Notification !== "undefined") {
          setPermission(Notification.permission);
        }
      }
    } catch {
      setMessage("Could not enable notifications. Try again from Settings.");
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDismiss = () => {
    dismissPwaPrompt();
    setDismissed(true);
  };

  if (!visible) return null;

  const title = needsSafariInstead
    ? "Open Wraptron in Safari"
    : needsIosInstall
      ? "Add Wraptron to your Home Screen"
      : canInstall
        ? "Install Wraptron"
        : "Allow phone notifications";

  const description = needsSafariInstead
    ? "iPhone Chrome cannot receive lock-screen alerts. Open this site in Safari, tap Share, then Add to Home Screen."
    : needsIosInstall
      ? "Tap Share, then Add to Home Screen. Open the app from the icon and allow notifications so attendance reminders can reach you when Wraptron is closed."
      : canInstall
        ? "Install the app, then allow notifications. Attendance reminders can then ping your phone even when Wraptron is closed."
        : "Turn on notifications so check-in and check-out reminders can appear on this device.";

  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2.5 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">{title}</p>
            <p className="text-xs text-blue-900/80 dark:text-blue-100/80">
              {message ?? description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canInstall ? (
            <Button
              type="button"
              size="sm"
              className="h-8"
              disabled={busy}
              onClick={() => void handleInstall()}
            >
              <Download className="h-3.5 w-3.5" />
              Install app
            </Button>
          ) : null}
          {canEnablePush ? (
            <Button
              type="button"
              size="sm"
              className="h-8"
              disabled={busy}
              onClick={() => void handleAllow()}
            >
              <Bell className="h-3.5 w-3.5" />
              Allow notifications
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-blue-900 hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/60"
            aria-label="Dismiss install prompt"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
