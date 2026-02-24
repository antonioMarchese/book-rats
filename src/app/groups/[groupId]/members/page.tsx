import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function MembersPage({ params }: Props) {
  const { groupId } = await params;
  const user = await requireUser();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      title: true,
      createdBy: true,
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === user.id);
  if (!isMember) notFound();

  return (
    <main
      className="min-h-screen safe-top safe-bottom"
      style={{ backgroundColor: "var(--br-bg)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--br-border)" }}
      >
        <Link
          href={`/groups/${group.id}`}
          className="text-2xl leading-none"
          style={{ color: "var(--br-muted)" }}
          aria-label="Back to group"
        >
          ‹
        </Link>
        <h1
          className="text-lg font-semibold truncate flex-1"
          style={{ color: "var(--br-text)" }}
        >
          Members
        </h1>
        <span className="text-sm" style={{ color: "var(--br-muted)" }}>
          {group.members.length}
        </span>
      </header>

      <ul className="px-4 py-4 space-y-2 max-w-lg mx-auto">
        {group.members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{
              backgroundColor: "var(--br-surface)",
              borderColor: "var(--br-border)",
            }}
          >
            {member.user.avatarUrl ? (
              <Image
                src={member.user.avatarUrl}
                alt={member.user.name ?? "Member"}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: "var(--br-bg)",
                  color: "var(--br-muted)",
                }}
              >
                {(member.user.name ?? member.user.email)[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--br-text)" }}
              >
                {member.user.name ?? member.user.email}
                {member.userId === user.id && (
                  <span
                    className="ml-2 text-xs"
                    style={{ color: "var(--br-muted)" }}
                  >
                    (you)
                  </span>
                )}
              </p>
              <p className="text-xs" style={{ color: "var(--br-muted)" }}>
                Joined{" "}
                {new Date(member.joinedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {member.userId === group.createdBy && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--br-accent)",
                  color: "#fff",
                }}
              >
                Owner
              </span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
