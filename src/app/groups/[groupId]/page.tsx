import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoSubscribe } from "./AutoSubscribe";
import { CheckInFeed } from "./CheckInFeed";
import { GroupMenu } from "./GroupMenu";

/** Consecutive-day streak ending on today or yesterday (UTC). */
function computeStreak(datesDescUtc: number[]): number {
  if (datesDescUtc.length === 0) return 0;
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const DAY = 86_400_000;
  const mostRecent = datesDescUtc[0];
  if (mostRecent !== todayUtc && mostRecent !== todayUtc - DAY) return 0;
  let expected = mostRecent;
  let streak = 0;
  for (const d of datesDescUtc) {
    if (d === expected) {
      streak++;
      expected -= DAY;
    } else if (d < expected) break;
  }
  return streak;
}

interface Props {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ notify?: string }>;
}

export default async function GroupPage({ params, searchParams }: Props) {
  const { groupId } = await params;
  const { notify } = await searchParams;
  const user = await requireUser();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      creator: true,
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === user.id);
  if (!isMember) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [checkIns, todayCheckIn, allCheckInDates] = await Promise.all([
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
    prisma.checkIn.findMany({
      where: { groupId },
      select: { userId: true, date: true },
      orderBy: { date: "desc" },
    }),
  ]);

  // ── Compute rankings ─────────────────────────────────────────────────────
  const checkInsByUser = new Map<string, number[]>();
  for (const ci of allCheckInDates) {
    const utc = Date.UTC(
      ci.date.getUTCFullYear(),
      ci.date.getUTCMonth(),
      ci.date.getUTCDate(),
    );
    if (!checkInsByUser.has(ci.userId)) checkInsByUser.set(ci.userId, []);
    checkInsByUser.get(ci.userId)!.push(utc);
  }
  const rankings = group.members
    .map((m) => {
      const dates = checkInsByUser.get(m.userId) ?? [];
      return {
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        checkIns: dates.length,
        streak: computeStreak(dates),
        rank: 0,
      };
    })
    .sort((a, b) => b.checkIns - a.checkIns)
    .map((m, i) => ({ ...m, rank: i + 1 }));
  const leader = rankings[0];
  const currentUserRanking =
    rankings.find((r) => r.userId === user.id) ?? rankings[0];

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
      {notify === "1" && <AutoSubscribe groupId={groupId} />}
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

            {/* ── Ranking strip ─────────────────────────────────────────── */}
            <div
              className="pt-2 mt-1 border-t space-y-0.5"
              style={{ borderColor: "var(--br-border)" }}
            >
              <p className="text-xs" style={{ color: "var(--br-muted)" }}>
                🥇{" "}
                <span style={{ color: "var(--br-text)", fontWeight: 500 }}>
                  {leader.name ?? leader.email}
                </span>
                {leader.userId === user.id && (
                  <span className="ml-1" style={{ color: "var(--br-muted)" }}>
                    {" "}
                    (you)
                  </span>
                )}
                {" · "}
                {leader.checkIns} check-in{leader.checkIns !== 1 ? "s" : ""}
              </p>
              {currentUserRanking.userId !== leader.userId && (
                <p className="text-xs" style={{ color: "var(--br-muted)" }}>
                  You:{" "}
                  <span style={{ color: "var(--br-text)", fontWeight: 500 }}>
                    #{currentUserRanking.rank}
                  </span>
                  {" · "}
                  {currentUserRanking.checkIns} check-in
                  {currentUserRanking.checkIns !== 1 ? "s" : ""}
                  {currentUserRanking.streak > 0 &&
                    ` · ${currentUserRanking.streak} 🔥`}
                </p>
              )}
            </div>
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
