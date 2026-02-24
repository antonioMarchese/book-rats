"use server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function dismissPwaTutorial(): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { hasSeenPwaTutorial: true },
  });
  revalidatePath("/dashboard");
}
