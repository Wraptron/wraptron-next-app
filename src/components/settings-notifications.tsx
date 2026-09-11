"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Download, Smartphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  canUseWebPush,
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
  isIosChrome,
  isIosDevice,
  isStandalonePwa,
  registerPushServiceWorker,
} from "@/lib/web-push-client";

export function SettingsNotifications() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [status, setStatus] = useState<{
    enabled: boolean;
    permission: NotificationPermission | "unsupported";
    subscribed: boolean;
  }>({
    enabled: false,
    permission: "default",
    subscribed: false,
  });

  const refresh = useCallback(async () => {
    setStandalone(isStandalonePwa());
    const next = await getPushStatus();
    setStatus({
      enabled: next.enabled,
      permission: next.permission,
      subscribed: next.subscribed,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await registerPushServiceWorker();
      if (cancelled) return;
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await enablePushNotifications();
      if (!result.ok) setError(result.reason);
      await refresh();
    } catch {
      setError("Could not enable phone notifications.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      await disablePushNotifications();
      await refresh();
    } catch {
      setError("Could not turn off phone notifications.");
    } finally {
      setBusy(false);
    }
  };

  const iosNeedsInstall = isIosDevice() && !standalone;
  const alertsOn = status.permission === "granted" && status.subscribed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription className="mt-2">
          Install Wraptron from the browser and allow notifications so attendance
          reminders can reach your phone even when the app is closed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking this device…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={standalone ? "default" : "outline"}>
                {standalone ? "Installed app" : "Browser tab"}
              </Badge>
              <Badge variant={alertsOn ? "default" : "outline"}>
                {alertsOn ? "Phone alerts on" : "Phone alerts off"}
              </Badge>
            </div>

            {isIosChrome() ? (
              <p className="text-sm text-muted-foreground">
                iPhone Chrome cannot receive these alerts. Open Wraptron in Safari,
                tap Share, then Add to Home Screen.
              </p>
            ) : iosNeedsInstall ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  iPhone / iPad
                </p>
                <p className="mt-1 text-muted-foreground">
                  Tap the Share button, choose Add to Home Screen, then open Wraptron
                  from the new icon and tap Allow notifications.
                </p>
              </div>
            ) : !canUseWebPush() ? (
              <p className="text-sm text-muted-foreground">
                This browser does not support web push notifications.
              </p>
            ) : !status.enabled ? (
              <p className="text-sm text-muted-foreground">
                Phone alerts are not configured on the server yet. Add VAPID keys to
                the backend environment.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {alertsOn
                  ? "This device will receive lock-screen attendance reminders when Wraptron is closed."
                  : "Allow notifications on this device. On Android you can also install Wraptron from the browser menu."}
              </p>
            )}

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {status.enabled && canUseWebPush() && !alertsOn ? (
                <Button onClick={() => void handleEnable()} disabled={busy}>
                  <Bell className="h-4 w-4" />
                  Allow notifications
                </Button>
              ) : null}
              {alertsOn ? (
                <Button
                  variant="outline"
                  onClick={() => void handleDisable()}
                  disabled={busy}
                >
                  <BellOff className="h-4 w-4" />
                  Turn off on this device
                </Button>
              ) : null}
              {!standalone && !isIosDevice() ? (
                <p className="self-center text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Chrome / Edge: menu → Install app
                </p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
