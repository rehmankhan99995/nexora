"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { signInAction } from "@/lib/auth-actions";
import { FormAvatarStatus, NexoraAvatar, type AvatarEmotion } from "@/components/nexora-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleAuthButton } from "@/components/google-auth-button";

function SubmitButton({ pending }: { pending: boolean }) {
  return <Button className="h-12 w-full rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceMode = searchParams.get("mode") === "workspace";
  const [state, formAction] = useActionState(signInAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [emotion, setEmotion] = useState<AvatarEmotion>("idle");
  const [oauthError, setOauthError] = useState<string>();

  useEffect(() => {
    if (state.error) setEmotion("error");
    if (state.success) setEmotion("success");
  }, [state.error, state.success]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("error") === "oauth_failed") {
      setOauthError("Google sign-in was cancelled or could not be completed. Please try again.");
      setEmotion("error");
      url.searchParams.delete("error");
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
  }, []);

  useEffect(() => {
    if (!state.redirectTo) return;
    const timer = window.setTimeout(() => router.replace(state.redirectTo!), 700);
    return () => window.clearTimeout(timer);
  }, [router, state.redirectTo]);

  const edit = () => {
    setOauthError(undefined);
    setEmotion(state.error ? "idle" : "typing");
  };
  const formError = state.error ?? oauthError;

  return <div className="space-y-8">
    <div><NexoraAvatar emotion={pending ? "loading" : emotion} statusText={pending ? "NEXORA AI Buddy is checking your sign-in." : undefined} /><p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{workspaceMode ? "Workspace access" : "Profile access"}</p><h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-white">{workspaceMode ? "Welcome to your workspace" : "Welcome back"}</h2><p className="mt-3 text-center text-sm leading-6 text-slate-400">{workspaceMode ? "Sign in to continue to your NEXORA workspace." : "Sign in to manage your NEXORA profile."}</p></div>
    <form action={formAction} className="space-y-5">
      <div><label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">Work email</label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3.5 text-slate-500" size={17} /><Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" onChange={edit} className="h-12 rounded-xl border-white/10 bg-white/[.04] pl-10 text-white placeholder:text-slate-600 focus-visible:ring-violet-400" /></div></div>
      <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium text-slate-200">Password</label><Link href="/forgot-password" className="text-xs text-violet-300 hover:text-violet-200">Forgot password?</Link></div><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-3.5 text-slate-500" size={17} /><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required onFocus={() => setEmotion("password")} onBlur={() => setEmotion("idle")} onChange={edit} className="h-12 rounded-xl border-white/10 bg-white/[.04] pl-10 pr-11 text-white focus-visible:ring-violet-400" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-3 text-slate-500 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
      {formError && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{formError}</p>}
      <SubmitButton pending={pending} /><FormAvatarStatus onPendingChange={setPending} />
    </form>
    <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.2em] text-slate-500"><span className="h-px flex-1 bg-white/10" />OR<span className="h-px flex-1 bg-white/10" /></div>
    <GoogleAuthButton mode="login" disabled={pending} onPendingChange={setPending} onError={(message) => { setOauthError(message); setEmotion("error"); }} />
    <p className="text-center text-sm text-slate-400">New to NEXORA? <Link href="/signup" className="font-medium text-violet-300 hover:text-violet-200">Create an account</Link></p>
  </div>;
}
