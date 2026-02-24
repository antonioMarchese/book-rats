"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";

interface Props {
  groupId: string;
  inviteUrl: string;
  isAdmin: boolean;
}

export function GroupMenu({ groupId, inviteUrl, isAdmin }: Props) {
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Group options"
            className="w-9 h-9 flex items-center justify-center rounded-full text-lg transition-opacity hover:opacity-70"
            style={{ color: "var(--br-muted)" }}
          >
            ···
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem asChild>
            <Link
              href={`/groups/${groupId}/members`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span>👥</span> Members
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleInvite}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span>🔗</span> Invite
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/groups/${groupId}/edit`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span>✏️</span> Edit club
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clipboard toast */}
      {copied && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-none"
          style={{
            backgroundColor: "var(--br-surface)",
            color: "var(--br-text)",
            border: "1px solid var(--br-border)",
          }}
        >
          ✓ Invite link copied!
        </div>
      )}
    </>
  );
}
