"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { leaveGroup } from "@/actions/groups";
import { useState, useTransition } from "react";

interface Props {
  groupId: string;
  groupTitle: string;
}

export function GroupCardMenu({ groupId, groupTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setConfirmLeave(false);
  };

  const handleLeaveClick = (e: Event) => {
    e.preventDefault();
    setConfirmLeave(true);
  };

  const handleConfirmLeave = (e: Event) => {
    e.preventDefault();
    startTransition(async () => {
      await leaveGroup(groupId);
    });
  };

  const handleCancelLeave = (e: Event) => {
    e.preventDefault();
    setConfirmLeave(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Options for ${groupTitle}`}
          onClick={(e) => e.preventDefault()} // prevent link navigation
          className="w-8 h-8 flex items-center justify-center rounded-full text-base transition-opacity hover:opacity-70 flex-shrink-0"
          style={{ color: "var(--br-muted)" }}
        >
          ···
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[140px]">
        {confirmLeave ? (
          <>
            <DropdownMenuItem
              onSelect={handleConfirmLeave}
              disabled={isPending}
              className="flex items-center gap-2 cursor-pointer font-semibold"
              style={{ color: "#ef4444" }}
            >
              {isPending ? "Leaving…" : "⚠️ Yes, leave"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleCancelLeave}
              className="flex items-center gap-2 cursor-pointer"
            >
              Cancel
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            onSelect={handleLeaveClick}
            className="flex items-center gap-2 cursor-pointer"
            style={{ color: "#ef4444" }}
          >
            🚪 Leave club
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
