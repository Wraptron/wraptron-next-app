import { pushApi } from "@/lib/api";

const SW_PATH = "/sw.js";
const DISMISS_KEY = "wraptron.pwaPush.dismissedAt";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

export type PushSubscribeResult =
  | { ok: true; subscribed: boolean }
  | { ok: false; reason: string };

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function canUseWebPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isIosChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIosDevice() && /crios/i.test(navigator.userAgent);
}

export function isPwaPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissPwaPrompt(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!canUseWebPush()) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch (err) {
    console.warn("Service worker registration failed:", err);
    return null;
  }
}

export async function getPushStatus(): Promise<{
  enabled: boolean;
  publicKey: string | null;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
}> {
  if (!canUseWebPush()) {
    return {
      enabled: false,
      publicKey: null,
      permission: "unsupported",
      subscribed: false,
    };
  }

  let enabled = false;
  let publicKey: string | null = null;
  try {
    const res = await pushApi.getVapidPublicKey();
    enabled = !!res.enabled && !!res.publicKey;
    publicKey = res.publicKey;
  } catch {
    enabled = false;
  }

  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;

  return {
    enabled,
    publicKey,
    permission: Notification.permission,
    subscribed: !!subscription,
  };
}

export async function enablePushNotifications(): Promise<PushSubscribeResult> {
  if (!canUseWebPush()) {
    return { ok: false, reason: "Push notifications are not supported in this browser." };
  }
  if (isIosDevice() && !isStandalonePwa()) {
    return {
      ok: false,
      reason:
        "On iPhone, add Wraptron to your Home Screen in Safari, then open it from there and allow notifications.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "Notifications were blocked for this site." };
  }

  const registration = await registerPushServiceWorker();
  if (!registration) {
    return { ok: false, reason: "Could not register the notification service." };
  }

  await navigator.serviceWorker.ready;

  const vapid = await pushApi.getVapidPublicKey();
  if (!vapid.enabled || !vapid.publicKey) {
    return { ok: false, reason: "Phone alerts are not configured on the server yet." };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapid.publicKey,
      ) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "The browser did not return a valid push subscription." };
  }

  await pushApi.subscribe({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    user_agent: navigator.userAgent,
  });

  return { ok: true, subscribed: true };
}

export async function syncPushSubscriptionIfGranted(): Promise<void> {
  if (!canUseWebPush()) return;
  if (Notification.permission !== "granted") return;
  if (isIosDevice() && !isStandalonePwa()) return;
  try {
    await enablePushNotifications();
  } catch (err) {
    console.warn("Could not sync push subscription:", err);
  }
}

export async function disablePushNotifications(): Promise<void> {
  if (!canUseWebPush()) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;
  if (!subscription) return;
  try {
    await pushApi.unsubscribe(subscription.endpoint);
  } catch {
    // still unsubscribe locally
  }
  await subscription.unsubscribe();
}
