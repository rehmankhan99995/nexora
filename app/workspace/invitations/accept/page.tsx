import Link from "next/link";
import { redirect } from "next/navigation";
import { Command } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AcceptWorkspaceInvitationForm } from "@/components/accept-workspace-invitation-form";

export default async function AcceptWorkspaceInvitationPage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const token = searchParams ? (await searchParams).token : undefined;

  return <main className="flex min-h-svh items-center justify-center bg-[#0b0b18] px-6 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-8"><Link href="/dashboard" className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em]"><span className="flex size-9 items-center justify-center rounded-xl bg-violet-300 text-[#16142c]"><Command size={18} /></span>NEXORA</Link><h1 className="mt-12 text-3xl font-semibold tracking-[-0.04em]">Join a workspace</h1><p className="mt-3 text-sm leading-6 text-slate-400">You are signed in as {data.user.email}. Accept this invitation to join the workspace.</p>{token ? <div className="mt-8"><AcceptWorkspaceInvitationForm token={token} /></div> : <p className="mt-8 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">This invitation link is missing its token.</p>}</div></main>;
}
