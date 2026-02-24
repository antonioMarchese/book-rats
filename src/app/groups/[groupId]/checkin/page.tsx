"use client";

import { createCheckIn } from "@/actions/checkIns";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useActionState, useRef, useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const inputStyle = {
  backgroundColor: "var(--br-surface)",
  color: "var(--br-text)",
  border: "1px solid var(--br-border)",
  "--tw-ring-color": "var(--br-accent)",
} as React.CSSProperties;

export default function CheckInPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [state, action, pending] = useActionState(createCheckIn, null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_BYTES) return;
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  return (
    <main
      className="min-h-screen safe-top safe-bottom"
      style={{ backgroundColor: "var(--br-bg)" }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--br-border)" }}
      >
        <Link
          href={`/groups/${groupId}`}
          className="text-2xl leading-none"
          style={{ color: "var(--br-muted)" }}
          aria-label="Back to group"
        >
          ‹
        </Link>
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--br-text)" }}
        >
          Today&apos;s check-in
        </h1>
      </header>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <form
        action={action}
        className="px-4 py-6 space-y-6 max-w-lg mx-auto"
        encType="multipart/form-data"
      >
        {/* Hidden group identifier */}
        <input type="hidden" name="groupId" value={groupId} />

        {/* Check-in title */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Title <span style={{ color: "var(--br-accent)" }}>*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={120}
            placeholder="e.g. Finally finished part two!"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>

        {/* Book title */}
        <div className="space-y-2">
          <label
            htmlFor="bookTitle"
            className="block text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Book title <span className="opacity-50">(optional)</span>
          </label>
          <input
            id="bookTitle"
            name="bookTitle"
            type="text"
            maxLength={120}
            placeholder="e.g. Dune"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>

        {/* Pages & Chapters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="pagesRead"
              className="block text-sm font-medium"
              style={{ color: "var(--br-muted)" }}
            >
              Pages read <span className="opacity-50">(optional)</span>
            </label>
            <input
              id="pagesRead"
              name="pagesRead"
              type="number"
              min={0}
              placeholder="0"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="chaptersRead"
              className="block text-sm font-medium"
              style={{ color: "var(--br-muted)" }}
            >
              Chapters{" "}
              <span className="opacity-50">(optional)</span>
            </label>
            <input
              id="chaptersRead"
              name="chaptersRead"
              type="number"
              min={0}
              placeholder="0"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Notes <span className="opacity-50">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            placeholder="Thoughts, favourite quotes, reactions…"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 resize-none"
            style={inputStyle}
          />
        </div>

        {/* Photo */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Photo <span className="opacity-50">(optional)</span>
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:opacity-80 overflow-hidden"
            style={{
              borderColor: "var(--br-border)",
              backgroundColor: "var(--br-surface)",
            }}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <>
                <span className="text-3xl">📷</span>
                <span className="text-xs" style={{ color: "var(--br-muted)" }}>
                  Tap to upload — JPEG, PNG, WEBP up to 5 MB
                </span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>

        {/* Error message */}
        {state?.error && (
          <p
            className="text-sm text-center font-medium"
            style={{ color: "var(--br-accent)" }}
          >
            {state.error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--br-accent)", color: "#fff" }}
        >
          {pending ? "Saving…" : "Save check-in"}
        </button>
      </form>
    </main>
  );
}
