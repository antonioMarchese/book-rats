import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /auth/callback
 *
 * Supabase redirects here after Google OAuth completes.
 * This handler:
 *  1. Exchanges the one-time `code` for a persistent session.
 *  2. Upserts the authenticated user into our Prisma `User` table
 *     so the rest of the app can join on our own user records.
 *  3. Redirects to the intended destination (default: "/").
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Supabase sends an error param when the user denies consent
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=oauth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();

  // ── 1. Exchange the code for a session ─────────────────────────────────────
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("[auth/callback] Session exchange failed:", sessionError.message);
    return NextResponse.redirect(`${origin}/login?error=session_failed`);
  }

  // ── 2. Fetch the now-authenticated user ────────────────────────────────────
  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !authUser?.email) {
    console.error("[auth/callback] Could not retrieve user:", userError?.message);
    return NextResponse.redirect(`${origin}/login?error=user_fetch_failed`);
  }

  // ── 3. Sync to our Prisma User table ───────────────────────────────────────
  // We upsert so that profile updates (name, avatar) from Google are reflected.
  try {
    await prisma.user.upsert({
      where: { authId: authUser.id },
      update: {
        email: authUser.email,
        name:
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name ??
          null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      },
      create: {
        authId: authUser.id,
        email: authUser.email,
        name:
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name ??
          null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      },
    });
  } catch (dbError) {
    // Do not block the user from accessing the app if the sync fails —
    // log it and continue. The middleware will still allow access via
    // the Supabase session; sync can be retried on the next login.
    console.error("[auth/callback] Prisma upsert failed:", dbError);
  }

  // ── 4. Redirect to intended destination ────────────────────────────────────
  return NextResponse.redirect(`${origin}${next}`);
}
