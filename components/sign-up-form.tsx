"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { signUpAction } from "@/lib/auth-actions";
import { FormAvatarStatus, NexoraAvatar, type AvatarEmotion } from "@/components/nexora-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleAuthButton } from "@/components/google-auth-button";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceMode = searchParams.get("mode") === "workspace";
  const [state, formAction] = useActionState(signUpAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [emotion, setEmotion] = useState<AvatarEmotion>("idle");
  const [oauthError, setOauthError] = useState<string>();
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const checks = [{ label: "8+ characters", valid: password.length >= 8 }, { label: "Uppercase letter", valid: /[A-Z]/.test(password) }, { label: "Number", valid: /\d/.test(password) }];

  useEffect(() => {
    if (state.error || passwordMismatch) setEmotion("error");
    if (state.success) setEmotion("success");
  }, [passwordMismatch, state.error, state.success]);

  useEffect(() => {
    if (!state.redirectTo) return;
    const timer = window.setTimeout(() => router.replace(state.redirectTo!), 700);
    return () => window.clearTimeout(timer);
  }, [router, state.redirectTo]);

  const edit = () => setEmotion(state.error ? "idle" : "typing");

  return <div className="space-y-7">
    <div><NexoraAvatar emotion={pending ? "loading" : emotion} statusText={pending ? "VEYROVA AI Buddy is creating your account." : undefined} /><p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{workspaceMode ? "Start with your workspace" : "Start with your profile"}</p><h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-white">{workspaceMode ? "Create your workspace account" : "Create your profile"}</h2><p className="mt-3 text-center text-sm leading-6 text-slate-400">{workspaceMode ? "Bring your team's operating rhythm into focus." : "Create your VEYROVA identity before setting up a workspace."}</p></div>
    <form action={formAction} className="space-y-4">
      <div><label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-200">Full name</label><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-3.5 text-slate-500" size={17} /><Input id="fullName" name="fullName" autoComplete="name" required placeholder="Jordan Lee" onChange={edit} className="h-12 rounded-xl border-white/10 bg-white/[.04] pl-10 text-white placeholder:text-slate-600 focus-visible:ring-violet-400" /></div></div>
      <div><label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">Work email</label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3.5 text-slate-500" size={17} /><Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" onChange={edit} className="h-12 rounded-xl border-white/10 bg-white/[.04] pl-10 text-white placeholder:text-slate-600 focus-visible:ring-violet-400" /></div></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">Password</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-3.5 text-slate-500" size={17} /><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(event) => { setPassword(event.target.value); edit(); }} onFocus={() => setEmotion("password")} onBlur={() => setEmotion("idle")} className="h-12 rounded-xl border-white/10 bg-white/[.04] pl-10 pr-11 text-white focus-visible:ring-violet-400" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-3 text-slate-500 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">{checks.map((check) => <span key={check.label} className={check.valid ? "text-emerald-300" : ""}><Check size={13} className="mr-1 inline" />{check.label}</span>)}</div></div>
      <div><label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label><Input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); edit(); }} onFocus={() => setEmotion("password")} onBlur={() => setEmotion("idle")} className="h-12 rounded-xl border-white/10 bg-white/[.04] text-white focus-visible:ring-violet-400" /></div>
      <label className="flex items-start gap-2 text-xs leading-5 text-slate-500"><input name="terms" type="checkbox" required className="mt-1 accent-violet-400" />I agree to the <a href="/terms" className="text-slate-300 underline">Terms of Service</a> and <a href="/privacy" className="text-slate-300 underline">Privacy Policy</a>.</label>
      {(state.error || passwordMismatch || oauthError) && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{passwordMismatch ? "Passwords do not match." : oauthError ?? state.error}</p>}
      <Button className="h-12 w-full rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400" disabled={pending}>{pending ? "Creating workspace..." : "Create account"}</Button><FormAvatarStatus onPendingChange={setPending} />
    </form>
    <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.2em] text-slate-500"><span className="h-px flex-1 bg-white/10" />OR<span className="h-px flex-1 bg-white/10" /></div>
    <GoogleAuthButton mode="signup" disabled={pending} onPendingChange={setPending} onError={(message) => { setOauthError(message); setEmotion("error"); }} />
    <p className="text-center text-sm text-slate-400">Already have an account? <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">Sign in</Link></p>
  </div>;
}
