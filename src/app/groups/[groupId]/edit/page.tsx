import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditGroupForm } from "./EditGroupForm";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function EditGroupPage({ params }: Props) {
  const { groupId } = await params;
  const user = await requireUser();

  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!group) notFound();
  if (group.createdBy !== user.id) notFound();

  return (
    <EditGroupForm
      groupId={group.id}
      initialTitle={group.title}
      initialDescription={group.description ?? ""}
      initialPhotoUrl={group.photoUrl ?? null}
    />
  );
}
