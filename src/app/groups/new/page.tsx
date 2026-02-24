"use client";

import { createGroup } from "@/actions/groups";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function NewGroupPage() {
  const [state, action, pending] = useActionState(createGroup, null);
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
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--br-border)" }}
      >
        <Link
          href="/dashboard"
          className="text-2xl leading-none"
          style={{ color: "var(--br-muted)" }}
          aria-label="Back"
        >
          ‹
        </Link>
        <h1 className="text-lg font-semibold" style={{ color: "var(--br-text)" }}>
          New book club
        </h1>
      </header>

      {/* Form */}
      <form
        action={action}
        className="px-4 py-6 space-y-6 max-w-lg mx-auto"
        encType="multipart/form-data"
      >
        {/* Cover photo */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Cover photo <span className="opacity-50">(optional)</span>
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:opacity-80 overflow-hidden"
            style={{ borderColor: "var(--br-border)", backgroundColor: "var(--br-surface)" }}
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
                <span className="text-3xl">🖼️</span>
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

        {/* Title */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Club name <span style={{ color: "var(--br-accent)" }}>*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={80}
            placeholder="e.g. The Midnight Readers"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--br-surface)",
              color: "var(--br-text)",
              border: "1px solid var(--br-border)",
              // @ts-expect-error CSS custom property
              "--tw-ring-color": "var(--br-accent)",
            }}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Description <span className="opacity-50">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={300}
            placeholder="What will your club be reading?"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 resize-none"
            style={{
              backgroundColor: "var(--br-surface)",
              color: "var(--br-text)",
              border: "1px solid var(--br-border)",
              // @ts-expect-error CSS custom property
              "--tw-ring-color": "var(--br-accent)",
            }}
          />
        </div>

        {/* Error */}
        {state?.error && (
          <p className="text-sm text-center" style={{ color: "var(--br-accent)" }}>
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
          {pending ? "Creating…" : "Create club"}
        </button>
      </form>
    </main>
  );
}
