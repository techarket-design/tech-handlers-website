import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (safe to ship to client). If rotated, update here.
export const VAPID_PUBLIC_KEY =
  "BCge73CJWTdKpEMuIKM7zWgCDLf_DauRyOQNT2xlH9Yprt5L6XqgpBl5e_KYi7VmmCKSUhud7aeGLIPR00J94xk";

const SW_URL = "/push-sw.js";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function pushPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

export function isIosNotInstalled() {
  if (typeof window === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  // @ts-ignore standalone is iOS-specific
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
  return ios && !standalone;
}

export function isInIframe() {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true; // cross-origin access throws — means we're framed
  }
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  const activeScript = existing?.active?.scriptURL || existing?.waiting?.scriptURL || existing?.installing?.scriptURL;
  if (existing && activeScript?.endsWith(SW_URL)) {
    await existing.update().catch(() => undefined);
    await navigator.serviceWorker.ready;
    return existing;
  }

  const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/", updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  return registration;
}

export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: "Push not supported in this browser" };
  if (isInIframe()) {
    return {
      ok: false,
      error: "Open this app in its own browser tab (not the preview iframe) to enable notifications.",
    };
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      return {
        ok: false,
        error:
          perm === "denied"
            ? "Notifications are blocked. Click the 🔒 in the address bar → Notifications → Allow, then try again."
            : "Permission was not granted.",
      };
    }

    const reg = await getRegistration();
    let sub = await reg.pushManager.getSubscription();
    const currentKey = sub?.options.applicationServerKey
      ? btoa(String.fromCharCode(...new Uint8Array(sub.options.applicationServerKey)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")
      : null;
    if (sub && currentKey !== VAPID_PUBLIC_KEY) {
      await sub.unsubscribe();
      await supabase.functions.invoke("push-unsubscribe", { body: { endpoint: sub.endpoint } });
      sub = null;
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const { error } = await supabase.functions.invoke("push-subscribe", {
      body: {
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to enable" };
  }
}

export async function disablePush(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isPushSupported()) return { ok: true };
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.functions.invoke("push-unsubscribe", { body: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

export async function isPushEnabled(): Promise<boolean> {
  if (!isPushSupported() || pushPermission() !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  return !!sub;
}

export async function refreshPushWorker() {
  if (!isPushSupported() || pushPermission() !== "granted") return;
  await getRegistration();
}

export async function showLocalTestNotification() {
  if (!isPushSupported() || pushPermission() !== "granted") return false;
  const reg = await getRegistration();
  await reg.showNotification("Local notification test", {
    body: "If you see this, this device can display app notifications.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: "/admin/account" },
  });
  return true;
}

export async function pushNotify(opts: {
  userIds: string[];
  title: string;
  body?: string;
  url?: string;
  category?: "task_assigned" | "task_due" | "followup_due" | "mention";
}) {
  const { data, error } = await supabase.functions.invoke("client-send-push", { body: opts });
  if (error) throw error;
  return data as { ok?: boolean; sent?: number; dead?: number; skipped?: number; error?: string } | null;
}