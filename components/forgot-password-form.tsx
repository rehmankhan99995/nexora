"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { forgotPasswordAction } from "@/lib/auth-actions";
import { FormAvatarStatus, NexoraAvatar, type AvatarEmotion } from "@/components/nexora-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, {});
  const [pending, setPending] = useState(false);
  const [emotion, setEmotion] = useState<AvatarEmotion>("idle");

  useEffect(() => {
    if (state.error) setEmotion("error");
    if (state.success) setEmotion("success");
  }, [state.error, state.success]);

  return <div className="space-y-8">
    <div><NexoraAvatar emotion={pending ? "loading" : emotion} statusText={pending ? "NEXORA AI Buddy is preparing your recovery instructions." : undefined} /><p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Account recovery</p><h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-white">Reset your password</h2><p className="mt-3 text-center text-sm leading-6 text-slate-400">Enter your work email and we&apos;ll send a secure reset link.</p></div>
    {state.success ? <div className="space-y-5"><div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">{state.success}</div><Link href="/login" className="block text-center text-sm text-violet-300 hover:text-violet-200">Return to sign in</Link></div> : <form action={formAction} className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">Work email</label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3.5 text-slate-500" size={17} /><Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" onChange={() => setEmotion(state.error ? "idle" : "typing")} className="h-12 rounded-xl border-white/10 bg-white/[.04] pl-10 text-white placeholder:text-slate-600 focus-visible:ring-violet-400" /></div></div>{state.error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{state.error}</p>}<Button className="h-12 w-full rounded-xl bg-violet-500 text-white hover:bg-violet-400" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</Button><FormAvatarStatus onPendingChange={setPending} /><Link href="/login" className="block text-center text-sm text-slate-400 hover:text-white">Back to sign in</Link></form>}
  </div>;
}
