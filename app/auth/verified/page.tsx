import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { NexoraAvatar } from "@/components/nexora-avatar";

export default function Page() {
  return <AuthShell><div className="space-y-8 text-center"><NexoraAvatar emotion="verified" statusText="Your email has been verified." /><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Identity confirmed</p><h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">You&apos;re verified</h2><p className="mt-3 text-sm leading-6 text-slate-400">Your email is confirmed. NEXORA is ready when you are.</p></div><Link href="/dashboard" className="block h-12 rounded-xl bg-violet-500 pt-3 text-sm font-medium text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400">Continue to workspace</Link></div></AuthShell>;
}