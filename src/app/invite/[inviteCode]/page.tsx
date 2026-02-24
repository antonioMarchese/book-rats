import { joinGroup } from "@/actions/groups";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ inviteCode: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function InvitePage({ params, searchParams }: Props) {
  const { inviteCode } = await params;
  const { error } = await searchParams;

  const group = await prisma.group.findUnique({
    where: { inviteCode },
    include: {
      creator: true,
      _count: { select: { members: true } },
    },
  });

  // Invalid or unknown invite code
  if (!group) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ backgroundColor: "var(--br-bg)" }}
      >
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-5xl">🔍</p>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--br-text)" }}
          >
            Invite not found
          </h1>
          <p className="text-sm" style={{ color: "var(--br-muted)" }}>
            This invite link is invalid or has expired.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-sm"
            style={{ color: "var(--br-accent)" }}
          >
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();

  // If already a member, skip straight to the group page
  if (user) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
    if (membership) redirect(`/groups/${group.id}`);
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: "var(--br-bg)" }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <span className="text-3xl font-bold" style={{ color: "var(--br-text)" }}>
            📚 BookRats
          </span>
        </div>

        {/* Invite card */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            backgroundColor: "var(--br-surface)",
            borderColor: "var(--br-border)",
          }}
        >
          {/* Cover photo */}
          {group.photoUrl ? (
            <div className="relative w-full h-36">
              <Image
                src={group.photoUrl}
                alt={group.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="w-full h-36 flex items-center justify-center text-5xl"
              style={{ backgroundColor: "var(--br-bg)" }}
            >
              📚
            </div>
          )}

          <div className="p-5 space-y-1">
            <p className="text-xs" style={{ color: "var(--br-muted)" }}>
              You&apos;ve been invited to join
            </p>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--br-text)" }}
            >
              {group.title}
            </h1>
            {group.description && (
              <p className="text-sm" style={{ color: "var(--br-muted)" }}>
                {group.description}
              </p>
            )}
            <p className="text-xs pt-1" style={{ color: "var(--br-muted)" }}>
              {group._count.members} member
              {group._count.members !== 1 ? "s" : ""} · hosted by{" "}
              {group.creator.name ?? group.creator.email}
            </p>
          </div>
        </div>

        {/* CTA */}
        {user ? (
          // Authenticated — show join form
          <form action={joinGroup} className="space-y-3">
            <input type="hidden" name="inviteCode" value={inviteCode} />
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--br-accent)", color: "#fff" }}
            >
              Join this club
            </button>
            {error === "invalid" && (
              <p className="text-xs text-center" style={{ color: "var(--br-accent)" }}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        ) : (
          // Not authenticated — prompt sign in, deep-linking back here
          <Link
            href={`/login?next=/invite/${inviteCode}`}
            className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--br-accent)", color: "#fff" }}
          >
            Sign in to join
          </Link>
        )}
      </div>
    </main>
  );
}
