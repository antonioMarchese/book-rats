import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { User } from "@/generated/prisma/client";

/**
 * Returns the current authenticated Prisma User.
 * Redirects to /login if the session is missing or invalid.
 * Call this at the top of any Server Component or Server Action that
 * requires an authenticated user.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!user) {
    // Authenticated in Supabase but not yet synced — send back through callback.
    redirect(`/auth/callback?next=/`);
  }

  return user;
}

/**
 * Returns the current authenticated Prisma User, or null if not signed in.
 * Use this when auth is optional (e.g. public pages that personalise for
 * signed-in users).
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  return prisma.user.findUnique({ where: { authId: authUser.id } });
}
