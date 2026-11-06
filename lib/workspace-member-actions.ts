"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceMemberActionState = {
  error?: string;
  success?: string;
  invitationUrl?: string;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function validRole(value: string): value is "admin" | "member" {
  return value === "admin" || value === "member";
}

async function getSiteUrl() {
  const requestHeaders = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? requestHeaders.get("origin") ?? "http://localhost:3000";
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: data.user, error };
}

export async function inviteWorkspaceMemberAction(
  _previousState: WorkspaceMemberActionState,
  formData: FormData,
): Promise<WorkspaceMemberActionState> {
  const workspaceId = field(formData, "workspaceId");
  const email = field(formData, "email").toLowerCase();
  const role = field(formData, "role");

  if (!workspaceId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!validRole(role)) return { error: "Choose an admin or member role." };

  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const { data, error } = await supabase
    .from("workspace_invitations")
    .insert({ workspace_id: workspaceId, email, role, invited_by: user.id })
    .select("token")
    .single();

  if (error || !data) {
    console.error("Workspace invitation failed", error?.message);
    return { error: "You do not have permission to invite members, or the invitation could not be created." };
  }

  const invitationUrl = `${await getSiteUrl()}/workspace/invitations/accept?token=${data.token}`;
  const { data: sessionData } = await supabase.auth.getSession();
  let success = "Invitation created. Share the invitation link with the person you want to add.";

  if (sessionData.session?.access_token) {
    const { error: emailError } = await supabase.functions.invoke("send-workspace-invitation", {
      body: { token: data.token },
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });
    if (!emailError) success = `Invitation email sent to ${email}.`;
    else console.error("Workspace invitation email failed", emailError.message);
  }

  return { success, invitationUrl };
}

export async function updateWorkspaceMemberRoleAction(
  _previousState: WorkspaceMemberActionState,
  formData: FormData,
): Promise<WorkspaceMemberActionState> {
  const workspaceId = field(formData, "workspaceId");
  const memberId = field(formData, "memberId");
  const role = field(formData, "role");
  if (!workspaceId || !memberId || !validRole(role)) return { error: "Choose a valid member role." };

  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (target?.role === "owner") return { error: "The workspace owner role cannot be changed." };

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);
  if (error) return { error: "We could not update this member's role." };
  return { success: "Member role updated." };
}

export async function removeWorkspaceMemberAction(
  _previousState: WorkspaceMemberActionState,
  formData: FormData,
): Promise<WorkspaceMemberActionState> {
  const workspaceId = field(formData, "workspaceId");
  const memberId = field(formData, "memberId");
  if (!workspaceId || !memberId) return { error: "This member could not be identified." };

  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (target?.role === "owner") return { error: "The workspace owner cannot be removed." };

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);
  if (error) return { error: "We could not remove this member." };
  return { success: "Member removed from the workspace." };
}

export async function acceptWorkspaceInvitationAction(
  _previousState: WorkspaceMemberActionState,
  formData: FormData,
): Promise<WorkspaceMemberActionState> {
  const token = field(formData, "token");
  if (!token) return { error: "This invitation link is missing its token." };

  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "Sign in with the invited email address before accepting this invitation." };

  const { data: workspaceId, error } = await supabase.rpc("accept_workspace_invitation", {
    invitation_token: token,
  });
  if (error || !workspaceId) return { error: error?.message ?? "This invitation is invalid or expired." };

  redirect(`/dashboard?workspace=${workspaceId}`);
}
