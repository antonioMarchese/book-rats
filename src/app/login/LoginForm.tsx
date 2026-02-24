"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.169 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

interface Props {
  /** The path to redirect to after login (e.g. /invite/abc). Defaults to /. */
  next?: string;
  /** Pre-populated error from the URL (e.g. oauth_denied). */
  initialError?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Google sign-in was cancelled.",
  session_failed: "Failed to complete sign-in. Please try again.",
  missing_code: "Invalid callback. Please try again.",
  user_fetch_failed: "Could not retrieve your account. Please try again.",
};

export function LoginForm({ next, initialError }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? (ERROR_MESSAGES[initialError] ?? "An unexpected error occurred.") : null
  );

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (next) callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: "var(--br-bg)" }}
    >
      <div className="w-full max-w-sm space-y-10">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="text-6xl select-none">📚</div>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--br-text)" }}
          >
            BookRats
          </h1>
          <p className="text-sm" style={{ color: "var(--br-muted)" }}>
            Track your reading. Share your progress.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 space-y-5 border"
          style={{
            backgroundColor: "var(--br-surface)",
            borderColor: "var(--br-border)",
          }}
        >
          <p
            className="text-center text-sm font-medium"
            style={{ color: "var(--br-muted)" }}
          >
            Sign in to join or create a book club
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 font-medium text-sm transition-opacity disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "#fff", color: "#1f2937" }}
          >
            <GoogleIcon />
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          {error && (
            <p
              className="text-center text-xs"
              style={{ color: "var(--br-accent)" }}
            >
              {error}
            </p>
          )}
        </div>

        <p className="text-center text-xs" style={{ color: "var(--br-muted)" }}>
          By signing in you agree to share your reading journey with your club.
        </p>
      </div>
    </main>
  );
}
