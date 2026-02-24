import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckInFeed } from "./CheckInFeed";
import { GroupMenu } from "./GroupMenu";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params;
  const user = await requireUser();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      // Only userId needed — membership check + count. No full user objects required here.
      members: { select: { userId: true } },
      creator: true,
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === user.id);
  if (!isMember) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [checkIns, todayCheckIn] = await Promise.all([
    prisma.checkIn.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.checkIn.findUnique({
      where: { groupId_userId_date: { groupId, userId: user.id, date: today } },
      select: { id: true },
    }),
  ]);

  // Build invite URL from the incoming request host
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const inviteUrl = `${protocol}://${host}/invite/${group.inviteCode}`;

  return (
    <main
      className="min-h-screen safe-top safe-bottom"
      style={{ backgroundColor: "var(--br-bg)" }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--br-border)" }}
      >
        <Link
          href="/dashboard"
          className="text-2xl leading-none"
          style={{ color: "var(--br-muted)" }}
          aria-label="Back to clubs"
        >
          ‹
        </Link>
        <h1
          className="text-lg font-semibold truncate flex-1"
          style={{ color: "var(--br-text)" }}
        >
          {group.title}
        </h1>
        <GroupMenu
          groupId={group.id}
          inviteUrl={inviteUrl}
          isAdmin={group.createdBy === user.id}
        />
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* ── Group hero ────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            backgroundColor: "var(--br-surface)",
            borderColor: "var(--br-border)",
          }}
        >
          {group.photoUrl && (
            <div className="relative w-full h-40">
              <Image
                src={group.photoUrl}
                alt={group.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-4 space-y-1">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--br-text)" }}
            >
              {group.title}
            </h2>
            {group.description && (
              <p className="text-sm" style={{ color: "var(--br-muted)" }}>
                {group.description}
              </p>
            )}
            <p className="text-xs pt-1" style={{ color: "var(--br-muted)" }}>
              {group.members.length} member
              {group.members.length !== 1 ? "s" : ""} · created by{" "}
              {group.creator.name ?? group.creator.email}
            </p>
          </div>
        </div>

        {/* ── Daily check-in CTA ────────────────────────────────────────── */}
        {todayCheckIn ? (
          <div
            className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: "var(--br-surface)",
              color: "var(--br-muted)",
              border: "1px solid var(--br-border)",
            }}
          >
            ✓ Checked in today
          </div>
        ) : (
          <Link
            href={`/groups/${group.id}/checkin`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--br-accent)", color: "#fff" }}
          >
            + Add today&apos;s check-in
          </Link>
        )}

        {/* ── Check-ins feed ────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--br-muted)" }}
          >
            Recent check-ins
          </h3>
          <CheckInFeed checkIns={checkIns} currentUserId={user.id} />
        </section>
      </div>
    </main>
  );
}
