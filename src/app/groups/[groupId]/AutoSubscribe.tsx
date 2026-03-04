"use client";

import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AutoSubscribe({ groupId }: { groupId: string }) {
  const { status, subscribe } = usePushSubscription();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    // Strip the transient ?notify=1 query param from the URL
    router.replace(`/groups/${groupId}`);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnable = async () => {
    setDismissed(true);
    await subscribe();
  };

  // iOS requires pushManager.subscribe() to be triggered by a user gesture.
  // Auto-calling subscribe() from useEffect silently fails on iOS — show a
  // tappable banner instead so the tap itself is the gesture.
  if (dismissed || status !== "unsubscribed") return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm"
      style={{
        backgroundColor: "var(--br-surface)",
        border: "1px solid var(--br-border)",
        color: "var(--br-text)",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <span>🔔</span>
      <span className="flex-1">Get notified when members check in?</span>
      <button
        onClick={handleEnable}
        className="px-3 py-1 rounded-lg text-white text-xs font-medium shrink-0"
        style={{ backgroundColor: "var(--br-accent)" }}
      >
        Enable
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs shrink-0"
        style={{ color: "var(--br-muted)" }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
