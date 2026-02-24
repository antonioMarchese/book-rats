"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type State = { error: string } | null;

// ─────────────────────────────────────────────────────────────────────────────
// createCheckIn
// Records one daily reading check-in for the authenticated user.
// Enforces the @@unique([groupId, userId, date]) constraint — a P2002 error
// is caught and returned as a user-friendly message rather than thrown.
// ─────────────────────────────────────────────────────────────────────────────
export async function createCheckIn(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const user = await requireUser();

  const groupId      = formData.get("groupId") as string;
  const title        = (formData.get("title") as string)?.trim();
  const bookTitle    = (formData.get("bookTitle") as string)?.trim();
  const pagesRead    = Math.max(0, parseInt(formData.get("pagesRead") as string, 10) || 0);
  const chaptersRead = Math.max(0, parseInt(formData.get("chaptersRead") as string, 10) || 0);
  const description  = (formData.get("description") as string)?.trim() || null;
  const photoFile    = formData.get("photo") as File | null;

  if (!groupId) return { error: "Missing group." };
  if (!title)   return { error: "A check-in title is required." };

  // Verify membership — prevent outsiders from posting
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });
  if (!membership) return { error: "You are not a member of this group." };

  // ── Upload photo if provided ─────────────────────────────────────────────
  let pictureUrl: string | null = null;

  if (photoFile && photoFile.size > 0) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(photoFile.type))
      return { error: "Photo must be JPEG, PNG, WEBP, or GIF." };
    if (photoFile.size > 5 * 1024 * 1024)
      return { error: "Photo must be smaller than 5 MB." };

    const supabase = await createClient();
    const ext  = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${groupId}/${Date.now()}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from("check-in-pictures")
      .upload(path, await photoFile.arrayBuffer(), {
        contentType: photoFile.type,
        upsert: false,
      });

    if (uploadError)
      return { error: `Photo upload failed: ${uploadError.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from("check-in-pictures").getPublicUrl(data.path);

    pictureUrl = publicUrl;
  }

  // ── Persist the check-in ─────────────────────────────────────────────────
  // PostgreSQL truncates to date-only since the column is @db.Date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.checkIn.create({
      data: {
        title,
        bookTitle,
        description,
        pictureUrl,
        pagesRead,
        chaptersRead,
        date: today,
        userId: user.id,
        groupId,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        error:
          "You have already checked in for this group today. Come back tomorrow!",
      };
    }
    throw err;
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}
