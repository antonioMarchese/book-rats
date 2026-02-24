"use client";
import { useEffect, useState, useTransition } from "react";

interface Props {
  dismiss: () => Promise<void>;
}

type Platform = "ios" | "android" | "desktop" | "standalone" | "unknown";

function detectPlatform(): Platform {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return "standalone";
  }
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export default function PwaBanner({ dismiss }: Props) {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);
    if (detected === "standalone") {
      // Already installed — silently dismiss without showing the banner
      dismiss();
    }
  }, [dismiss]);

  const handleDismiss = () => {
    startTransition(async () => {
      await dismiss();
    });
  };

  // Render nothing until platform is detected, or if already installed
  if (platform === "unknown" || platform === "standalone") return null;

  const steps =
    platform === "ios"
      ? [
          <>Tap the <strong>Share</strong> button (□↑) in Safari</>,
          <>Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></>,
        ]
      : [
          <>Tap the <strong>⋮</strong> menu in Chrome</>,
          <>Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong></>,
        ];

  return (
    <div
      className="relative rounded-2xl border p-4 space-y-3"
      style={{
        backgroundColor: "var(--br-surface)",
        borderColor: "var(--br-border)",
      }}
    >
      {/* Dismiss × */}
      <button
        onClick={handleDismiss}
        disabled={isPending}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-lg leading-none transition-opacity hover:opacity-60 disabled:opacity-40"
        style={{ color: "var(--br-muted)" }}
      >
        ✕
      </button>

      {/* Heading */}
      <p className="font-bold text-base pr-6" style={{ color: "var(--br-text)" }}>
        📲 Install BookRats
      </p>

      {/* Steps */}
      <ol className="space-y-1 text-sm list-decimal list-inside" style={{ color: "var(--br-muted)" }}>
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      {/* Got it button */}
      <button
        onClick={handleDismiss}
        disabled={isPending}
        className="w-full py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "var(--br-accent)", color: "#fff" }}
      >
        {isPending ? "Saving…" : "Got it"}
      </button>
    </div>
  );
}
