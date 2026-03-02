import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── GET — check whether current user has an active subscription ───────────────
export async function GET() {
  const user = await requireUser();

  const count = await prisma.pushSubscription.count({
    where: { userId: user.id },
  });

  return NextResponse.json({ subscribed: count > 0 });
}

// ── POST — save a new push subscription ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await requireUser();

  const body = await req.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription object." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}

// ── DELETE — remove an existing push subscription ────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await requireUser();

  const body = await req.json();
  const { endpoint } = body as { endpoint: string };

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
