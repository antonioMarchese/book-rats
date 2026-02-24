"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionState = { error: string } | null;

// ─────────────────────────────────────────────────────────────────────────────
// createGroup
// Creates a new group, uploads the cover photo to Supabase Storage,
// and adds the creator as the first member — all inside a transaction.
// ─────────────────────────────────────────────────────────────────────────────
export async function createGroup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const photoFile = formData.get("photo") as File | null;

  if (!title) {
    return { error: "A group title is required." };
  }

  // ── Upload cover photo ──────────────────────────────────────────────────
  let photoUrl: string | null = null;

  if (photoFile && photoFile.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(photoFile.type)) {
      return { error: "Photo must be a JPEG, PNG, WEBP, or GIF." };
    }
    if (photoFile.size > 5 * 1024 * 1024) {
      return { error: "Photo must be smaller than 5 MB." };
    }

    const supabase = await createClient();
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    // Namespace by userId to keep Storage organised
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("group-photos")
      .upload(path, await photoFile.arrayBuffer(), {
        contentType: photoFile.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: `Photo upload failed: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("group-photos").getPublicUrl(uploadData.path);

    photoUrl = publicUrl;
  }

  // ── Persist in a transaction ────────────────────────────────────────────
  const group = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.group.create({
      data: {
        title,
        description,
        photoUrl,
        createdBy: user.id,
      },
    });

    // Creator automatically becomes a member
    await tx.groupMember.create({
      data: { groupId: newGroup.id, userId: user.id },
    });

    return newGroup;
  });

  revalidatePath("/");
  redirect(`/groups/${group.id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// editGroup
// Updates the title, description, and optionally the cover photo of a group.
// Only the group creator is permitted to make changes.
// ─────────────────────────────────────────────────────────────────────────────
export async function editGroup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const groupId     = formData.get("groupId") as string;
  const title       = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const photoFile   = formData.get("photo") as File | null;

  if (!title) return { error: "A group title is required." };

  // Verify ownership
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.createdBy !== user.id)
    return { error: "Only the group creator can edit this group." };

  // ── Upload new cover photo if one was provided ───────────────────────────
  let photoUrl = group.photoUrl; // keep existing by default

  if (photoFile && photoFile.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(photoFile.type))
      return { error: "Photo must be a JPEG, PNG, WEBP, or GIF." };
    if (photoFile.size > 5 * 1024 * 1024)
      return { error: "Photo must be smaller than 5 MB." };

    const supabase = await createClient();
    const ext  = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("group-photos")
      .upload(path, await photoFile.arrayBuffer(), {
        contentType: photoFile.type,
        upsert: false,
      });

    if (uploadError)
      return { error: `Photo upload failed: ${uploadError.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from("group-photos").getPublicUrl(uploadData.path);

    photoUrl = publicUrl;
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { title, description, photoUrl },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
  redirect(`/groups/${groupId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// joinGroup
// Adds the authenticated user to the group identified by inviteCode.
// Idempotent: redirects to the group page if already a member.
// Used directly as a form `action` (not with useActionState), so it always
// redirects — either to the group page or back to the invite page with an
// error param.
// ─────────────────────────────────────────────────────────────────────────────
export async function joinGroup(formData: FormData): Promise<void> {
  const user = await requireUser();
  const inviteCode = formData.get("inviteCode") as string;

  if (!inviteCode) {
    redirect(`/invite/invalid?error=missing_code`);
  }

  const group = await prisma.group.findUnique({
    where: { inviteCode },
  });

  if (!group) {
    redirect(`/invite/${inviteCode}?error=invalid`);
  }

  // Already a member — just navigate to the group
  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
  });

  if (existing) {
    redirect(`/groups/${group.id}`);
  }

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: user.id },
  });

  revalidatePath("/");
  redirect(`/groups/${group.id}`);
}
