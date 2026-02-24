import { Prisma } from "@/generated/prisma/client";
import Image from "next/image";

type CheckInWithUser = Prisma.CheckInGetPayload<{ include: { user: true } }>;

interface Props {
  checkIns: CheckInWithUser[];
  currentUserId: string;
}

function formatDateLabel(date: Date): string {
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - d.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function CheckInFeed({ checkIns, currentUserId }: Props) {
  if (checkIns.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center border"
        style={{
          backgroundColor: "var(--br-surface)",
          borderColor: "var(--br-border)",
        }}
      >
        <p className="text-3xl mb-2">📖</p>
        <p className="text-sm" style={{ color: "var(--br-muted)" }}>
          No check-ins yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {checkIns.map((checkIn) => {
        const isOwn = checkIn.userId === currentUserId;
        const dateLabel = formatDateLabel(new Date(checkIn.date));

        return (
          <li
            key={checkIn.id}
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: "var(--br-surface)",
              borderColor: "var(--br-border)",
            }}
          >
            {/* ── Photo ──────────────────────────────────────────────────── */}
            {checkIn.pictureUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={checkIn.pictureUrl}
                  alt={`${checkIn.user.name ?? checkIn.user.email}'s reading photo`}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="p-4 space-y-3">
              {/* ── Author row ───────────────────────────────────────────── */}
              <div className="flex items-center gap-3">
                {checkIn.user.avatarUrl ? (
                  <Image
                    src={checkIn.user.avatarUrl}
                    alt={checkIn.user.name ?? "Member"}
                    width={36}
                    height={36}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: "var(--br-bg)",
                      color: "var(--br-muted)",
                    }}
                  >
                    {(checkIn.user.name ?? checkIn.user.email)[0].toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--br-text)" }}
                  >
                    {checkIn.user.name ?? checkIn.user.email}
                    {isOwn && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: "var(--br-muted)" }}
                      >
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "var(--br-muted)" }}>
                    {dateLabel}
                  </p>
                </div>
              </div>

              {/* ── Check-in title ───────────────────────────────────────── */}
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--br-text)" }}
              >
                {checkIn.title}
              </p>

              {/* ── Book title ───────────────────────────────────────────── */}
              {checkIn.bookTitle && (
                <p className="text-sm" style={{ color: "var(--br-muted)" }}>
                  📖 {checkIn.bookTitle}
                </p>
              )}

              {/* ── Stats strip ──────────────────────────────────────────── */}
              {(checkIn.pagesRead > 0 || checkIn.chaptersRead > 0) && (
                <div className="flex gap-4">
                  {checkIn.pagesRead > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "var(--br-bg)",
                        color: "var(--br-muted)",
                      }}
                    >
                      {checkIn.pagesRead} page{checkIn.pagesRead !== 1 ? "s" : ""}
                    </span>
                  )}
                  {checkIn.chaptersRead > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "var(--br-bg)",
                        color: "var(--br-muted)",
                      }}
                    >
                      {checkIn.chaptersRead} chapter{checkIn.chaptersRead !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}

              {/* ── Notes ────────────────────────────────────────────────── */}
              {checkIn.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--br-text)" }}
                >
                  {checkIn.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
