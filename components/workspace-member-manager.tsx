"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, UserMinus } from "lucide-react";
import {
  inviteWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateWorkspaceMemberRoleAction,
} from "@/lib/workspace-member-actions";
import type { WorkspaceMember } from "@/lib/workspace";

function MemberRow({ member, workspaceId, canManage }: { member: WorkspaceMember; workspaceId: string; canManage: boolean }) {
  const router = useRouter();
  const [roleState, roleAction] = useActionState(updateWorkspaceMemberRoleAction, {});
  const [removeState, removeAction] = useActionState(removeWorkspaceMemberAction, {});
  const isOwner = member.role === "owner";

  useEffect(() => {
    if (roleState.success || removeState.success) router.refresh();
  }, [removeState.success, roleState.success, router]);

  return <div className="flex flex-col gap-3 border-t border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{member.full_name}</p><p className="text-sm text-slate-500">{member.email ?? "Email unavailable"}</p></div><div className="flex items-center gap-2">{canManage && !isOwner ? <><form action={roleAction}><input type="hidden" name="workspaceId" value={workspaceId} /><input type="hidden" name="memberId" value={member.id} /><select name="role" defaultValue={member.role} className="h-9 rounded-lg border border-white/10 bg-[#17152a] px-2 text-xs text-white"><option value="member">Member</option><option value="admin">Admin</option></select><button type="submit" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[.06]">Save</button></form><form action={removeAction}><input type="hidden" name="workspaceId" value={workspaceId} /><input type="hidden" name="memberId" value={member.id} /><button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-200 hover:bg-red-400/10"><UserMinus size={13} /> Remove</button></form></> : <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs text-violet-200">{member.role}</span>}</div>{(roleState.error || removeState.error) && <p className="text-xs text-red-200">{roleState.error ?? removeState.error}</p>}</div>;
}

export function WorkspaceMemberManager({ workspaceId, members, canManage }: { workspaceId: string; members: WorkspaceMember[]; canManage: boolean }) {
  const [inviteState, inviteAction] = useActionState(inviteWorkspaceMemberAction, {});

  return <div className="space-y-6"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Workspace members</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">People with access</h2><p className="mt-2 text-sm leading-6 text-slate-400">Roles control what each person can manage inside this workspace.</p></div>{canManage && <form action={inviteAction} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><input type="hidden" name="workspaceId" value={workspaceId} /><label className="text-sm text-slate-300">Email<input name="email" type="email" required placeholder="person@company.com" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm text-white outline-none focus:border-violet-400" /></label><label className="text-sm text-slate-300">Role<select name="role" defaultValue="member" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#17152a] px-3 text-sm text-white outline-none focus:border-violet-400"><option value="member">Member</option><option value="admin">Admin</option></select></label><button type="submit" className="h-11 rounded-xl bg-violet-500 px-4 text-sm font-medium text-white hover:bg-violet-400">Create invite</button></form>}{inviteState.error && <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{inviteState.error}</p>}{inviteState.success && <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100"><p>{inviteState.success}</p>{inviteState.invitationUrl && <div className="mt-2 flex gap-2"><input readOnly value={inviteState.invitationUrl} className="min-w-0 flex-1 rounded-lg bg-black/20 px-2 py-2 text-xs text-emerald-50" /><button type="button" onClick={() => navigator.clipboard.writeText(inviteState.invitationUrl!)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/20 px-3 text-xs"><Copy size={13} /> Copy</button></div>}</div>}</div><div className="rounded-2xl border border-white/10 bg-white/[.04] px-6">{members.map((member) => <MemberRow key={member.id} member={member} workspaceId={workspaceId} canManage={canManage} />)}</div></div>;
}
