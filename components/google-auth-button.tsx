"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
  mode: "login" | "signup";
  disabled?: boolean;
  onPendingChange: (pending: boolean) => void;
  onError: (message: string) => void;
};

function getOAuthRedirectUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = configuredUrl || window.location.origin;
  const parsed = new URL(origin);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid application URL");
  }

  return new URL("/auth/callback?next=/dashboard", parsed).toString();
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z" /><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.5Z" /><path fill="#FBBC05" d="M6.53 13.58A5.85 5.85 0 0 1 6.22 12c0-.55.11-1.09.31-1.58V7.89H3.29A9.5 9.5 0 0 0 2.25 12c0 1.48.36 2.87 1.04 4.11l3.24-2.53Z" /><path fill="#EA4335" d="M12 6.39c1.43 0 2.72.49 3.74 1.46l2.8-2.8C16.84 3.45 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53C7.3 8.11 9.46 6.39 12 6.39Z" /></svg>;
}

export function GoogleAuthButton({ mode, disabled = false, onPendingChange, onError }: GoogleAuthButtonProps) {
  const [pending, setPending] = useState(false);
  const isDisabled = disabled || pending;

  async function handleClick() {
    if (isDisabled) return;
    setPending(true);
    onPendingChange(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getOAuthRedirectUrl() },
      });

      if (error) throw error;
    } catch {
      setPending(false);
      onPendingChange(false);
      onError("Google sign-in could not be started. Please try again.");
    }
  }

  return <button type="button" onClick={handleClick} disabled={isDisabled} aria-busy={pending} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[.04] text-sm font-medium text-white transition hover:border-violet-300/50 hover:bg-white/[.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60"><GoogleMark />{pending ? "Connecting to Google..." : mode === "login" ? "Continue with Google" : "Sign up with Google"}</button>;
}