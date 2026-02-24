# BookRats — Project Roadmap & Remaining Steps

## Current Status

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Done | Project setup, Prisma schema, PWA config, Supabase utilities |
| Phase 2 | ✅ Done | Google OAuth, auth callback, user sync, dashboard |
| Phase 3 | ✅ Done | Group management, invite links, Storage uploads |
| Phase 4 | ⏳ TODO | Daily check-ins form & feed |

---

## One-Time Setup Checklist

Before the app is fully functional, complete these steps once in your Supabase project.

### 1 — Enable Google OAuth

1. Go to **Supabase Dashboard → Authentication → Providers → Google**
2. Enable the provider
3. Paste your **Google Cloud OAuth Client ID** and **Client Secret**
   - Create credentials at [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client IDs
   - Application type: **Web application**
4. Copy the **Callback URL** shown in Supabase and paste it into your Google OAuth credential's **Authorised redirect URIs**:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

### 2 — Configure Redirect URLs in Supabase

Go to **Authentication → URL Configuration** and set:

| Setting | Development value | Production value |
|---|---|---|
| Site URL | `http://localhost:3000` | `https://your-domain.com` |
| Additional Redirect URLs | `http://localhost:3000/auth/callback` | `https://your-domain.com/auth/callback` |

### 3 — Create Supabase Storage Buckets

Run this SQL in **Supabase SQL Editor** (Project → SQL Editor → New query):

```sql
-- ── group-photos bucket ──────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-photos', 'group-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload group photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'group-photos');

CREATE POLICY "Public can read group photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'group-photos');

CREATE POLICY "Users can delete their own group photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'group-photos' AND owner = auth.uid());

-- ── check-in-pictures bucket (needed for Phase 4) ────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('check-in-pictures', 'check-in-pictures', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload check-in pictures"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'check-in-pictures');

CREATE POLICY "Public can read check-in pictures"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'check-in-pictures');

CREATE POLICY "Users can delete their own check-in pictures"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'check-in-pictures' AND owner = auth.uid());
```

### 4 — Run Database Migrations

In your terminal at the project root:

```bash
# Generate Prisma client (if not done already)
npx prisma generate

# Apply the schema to Supabase (uses DIRECT_URL from .env.local)
npx prisma migrate dev --name init
```

### 5 — Add PWA Icons

Place two PNG files in `public/icons/`:
- `public/icons/icon-192x192.png` (192×192 px)
- `public/icons/icon-512x512.png` (512×512 px)

A quick way to generate these: [RealFaviconGenerator](https://realfavicongenerator.net) or [PWABuilder](https://www.pwabuilder.com/imageGenerator)

---

## Phase 4 — Daily Check-ins (TODO)

### What needs building

| Item | Description |
|---|---|
| `src/actions/checkIns.ts` | `createCheckIn(prevState, formData)` Server Action |
| `src/app/groups/[groupId]/checkin/page.tsx` | Mobile check-in form |
| `src/app/groups/[groupId]/CheckInFeed.tsx` | Feed component replacing the placeholder |
| Update `src/app/groups/[groupId]/page.tsx` | Wire up real check-in feed |

### Data rules to enforce in the Server Action

- **One check-in per user per group per day** — enforced by `@@unique([groupId, userId, date])` in the Prisma schema. Catch `PrismaClientKnownRequestError` with code `P2002` (unique constraint violation) and return a friendly error.
- **Date handling** — store today's date using `new Date()` with time stripped: `new Date(new Date().toDateString())`. This aligns with the `@db.Date` column type.

### Check-in form fields

| Field | Type | Required |
|---|---|---|
| Book title | `text` input | ✅ |
| Check-in title | `text` input | ✅ |
| Pages read | `number` input | ✅ |
| Chapters read | `number` input | ❌ optional |
| Description / notes | `textarea` | ❌ optional |
| Photo | `file` input | ❌ optional |

### Server Action sketch

```typescript
// src/actions/checkIns.ts
"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type State = { error: string } | null;

export async function createCheckIn(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const user = await requireUser();
  const groupId   = formData.get("groupId") as string;
  const title     = (formData.get("title") as string)?.trim();
  const bookTitle = (formData.get("bookTitle") as string)?.trim();
  const pagesRead    = parseInt(formData.get("pagesRead") as string, 10) || 0;
  const chaptersRead = parseInt(formData.get("chaptersRead") as string, 10) || 0;
  const description  = (formData.get("description") as string)?.trim() || null;
  const photoFile    = formData.get("photo") as File | null;

  if (!title || !bookTitle) return { error: "Title and book title are required." };
  if (pagesRead < 0) return { error: "Pages read cannot be negative." };

  // Today's date with no time component — matches @db.Date column
  const today = new Date(new Date().toDateString());

  // Upload photo if provided
  let pictureUrl: string | null = null;
  if (photoFile && photoFile.size > 0) {
    const supabase = await createClient();
    const ext  = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${groupId}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("check-in-pictures")
      .upload(path, await photoFile.arrayBuffer(), {
        contentType: photoFile.type,
        upsert: false,
      });
    if (error) return { error: `Photo upload failed: ${error.message}` };
    const { data: { publicUrl } } = supabase.storage
      .from("check-in-pictures")
      .getPublicUrl(data.path);
    pictureUrl = publicUrl;
  }

  try {
    await prisma.checkIn.create({
      data: {
        title, bookTitle, description, pictureUrl,
        pagesRead, chaptersRead,
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
      return { error: "You have already checked in for this group today." };
    }
    throw err;
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}
```

### Check-in feed query (for the group page)

```typescript
const checkIns = await prisma.checkIn.findMany({
  where: { groupId },
  include: { user: true },
  orderBy: { createdAt: "desc" },
  take: 20,
});
```

---

## Future Enhancements (post-Phase 4)

- **Pagination / infinite scroll** on the check-in feed
- **Notifications** — Supabase Realtime to push new check-ins to group members
- **Leaderboard** — rank members by total pages/chapters read this week
- **Edit / delete** check-in (within same day)
- **Group settings** — rename, change photo, remove members
- **Profile page** — view any member's check-in history
- **Push notifications** — use the Web Push API with the PWA service worker
