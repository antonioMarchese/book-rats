"use client";

import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoSubscribe({ groupId }: { groupId: string }) {
  const { status, subscribe } = usePushSubscription();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Strip the transient ?notify=1 query param from the URL
    router.replace(`/groups/${groupId}`);

    // Prompt the user to allow notifications if not already subscribed or denied
    if (status === "unsubscribed") {
      subscribe();
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
