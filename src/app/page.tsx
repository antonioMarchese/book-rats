import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const user = await requireUser();

  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId: user.id } },
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main
      className="min-h-screen safe-top safe-bottom"
      style={{ backgroundColor: "var(--br-bg)" }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: "var(--br-border)" }}
      >
        <span className="text-xl font-bold" style={{ color: "var(--br-text)" }}>
          📚 BookRats
        </span>
        <div className="flex items-center gap-3">
          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={user.name ?? "Avatar"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70"
              style={{
                color: "var(--br-muted)",
                borderColor: "var(--br-border)",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="flex justify-between flex-wrap">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--br-text)" }}
            >
              Hello, {user.name?.split(" ")[0] ?? "Reader"} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--br-muted)" }}>
              Here are your book clubs.
            </p>
          </div>

          {/* Create group CTA */}
          <Link
            href="/groups/new"
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 self-center"
            style={{ backgroundColor: "var(--br-accent)", color: "#fff" }}
          >
            + New club
          </Link>
        </div>
        {/* Greeting */}

        {/* Groups list */}
        {groups.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-3xl">📖</p>
            <p className="text-sm" style={{ color: "var(--br-muted)" }}>
              You haven&apos;t joined any clubs yet.
            </p>
            <p className="text-xs" style={{ color: "var(--br-muted)" }}>
              Create one above or ask a friend to share their invite link.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border transition-colors hover:border-white/20"
                  style={{
                    backgroundColor: "var(--br-surface)",
                    borderColor: "var(--br-border)",
                  }}
                >
                  {/* Group photo or placeholder */}
                  <div
                    className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-xl"
                    style={{ backgroundColor: "var(--br-bg)" }}
                  >
                    {group.photoUrl ? (
                      <Image
                        src={group.photoUrl}
                        alt={group.title}
                        width={500}
                        height={500}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      "📚"
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: "var(--br-text)" }}
                    >
                      {group.title}
                    </p>
                    {group.description && (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "var(--br-muted)" }}
                      >
                        {group.description}
                      </p>
                    )}
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--br-muted)" }}
                    >
                      {group._count.members} member
                      {group._count.members !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <span style={{ color: "var(--br-muted)" }}>›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
