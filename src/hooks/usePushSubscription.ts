"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

type Status =
  | "unsupported"
  | "denied"
  | "unsubscribed"
  | "subscribed"
  | "loading";

export function usePushSubscription() {
  const [status, setStatus] = useState<Status>("loading");

  // Resolve the current subscription state on mount
  useEffect(() => {
    async function resolve() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      // navigator.serviceWorker.ready hangs indefinitely when no SW is
      // registered (e.g. in development where next-pwa is disabled).
      // Race against a 2 s timeout so the button still renders.
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);

      if (!reg) {
        setStatus("unsubscribed");
        return;
      }

      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "unsubscribed");
    }

    resolve();
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey,
      ) as BufferSource,
    });

    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });

    setStatus("subscribed");
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      setStatus("unsubscribed");
      return;
    }

    await fetch("/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    await sub.unsubscribe();
    setStatus("unsubscribed");
  }, []);

  return { status, subscribe, unsubscribe };
}
