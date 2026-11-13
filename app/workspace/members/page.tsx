import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Command } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceForUser, getWorkspaceMembers } from "@/lib/workspace";
import { WorkspaceMemberManager } from "@/components/workspace-member-manager";

export const instant = false;

export default async function WorkspaceMembersPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: workspace } = await getWorkspaceForUser(supabase, userData.user.id);
  if (!workspace) redirect("/workspace/setup");

  const { data: members } = await getWorkspaceMembers(supabase, workspace.id);
  const canManage = workspace.role === "owner" || workspace.role === "admin";

  return <main className="min-h-svh bg-[#0b0b18] text-white"><header className="border-b border-white/10"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6"><Link href="/dashboard" className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em]"><span className="flex size-9 items-center justify-center rounded-xl bg-violet-300 text-[#16142c]"><Command size={18} /></span>VEYROVA</Link><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> Back to dashboard</Link></div></header><section className="mx-auto max-w-4xl px-6 py-16"><p className="text-sm text-violet-300">Workspace settings</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Manage {workspace.business_name}</h1><p className="mt-4 max-w-xl text-lg leading-8 text-slate-400">Invite people and control their access with workspace roles.</p><div className="mt-10"><WorkspaceMemberManager workspaceId={workspace.id} members={members} canManage={canManage} /></div></section></main>;
}
