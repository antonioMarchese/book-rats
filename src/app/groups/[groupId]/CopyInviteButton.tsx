"use client";

import { useState } from "react";

interface Props {
  inviteUrl: string;
}

export function CopyInviteButton({ inviteUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard without user gesture
      window.prompt("Copy this invite link:", inviteUrl);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 w-full py-3 rounded-xl font-medium text-sm border transition-colors cursor-pointer"
      style={{
        color: copied ? "#4ade80" : "var(--br-text)",
        borderColor: copied ? "#4ade80" : "var(--br-border)",
        backgroundColor: "var(--br-surface)",
      }}
    >
      <span className="text-base">{copied ? "✓" : "🔗"}</span>
      {copied ? "Invite link copied!" : "Copy invite link"}
    </button>
  );
}
