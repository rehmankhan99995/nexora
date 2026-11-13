import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_WORKSPACE_LOGO_BYTES = 2 * 1024 * 1024;

export const INDUSTRIES = [
  "Technology & Software",
  "Professional Services",
  "Marketing & Advertising",
  "Finance & Accounting",
  "Healthcare",
  "Education",
  "Retail & E-commerce",
  "Manufacturing",
  "Real Estate",
  "Construction",
  "Media & Entertainment",
  "Nonprofit",
  "Other",
] as const;

export type Workspace = {
  id: string;
  business_name: string;
  industry: string;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRole = "owner" | "admin" | "member";
export type WorkspaceWithRole = Workspace & { role: WorkspaceRole };
export type WorkspaceMember = {
  id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  full_name: string;
  email: string | null;
};

type WorkspaceFields = {
  businessName: string;
  industry: string;
};

export function validateWorkspaceFields({ businessName, industry }: WorkspaceFields) {
  if (businessName.length < 2 || businessName.length > 120) {
    return "Business name must be between 2 and 120 characters.";
  }

  if (industry.length < 2 || industry.length > 80) {
    return "Industry must be between 2 and 80 characters.";
  }

  if (!INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number])) {
    return "Choose an industry from the list.";
  }

  return null;
}

export async function getWorkspaceForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  const result = await getWorkspacesForUser(supabase, userId);
  return {
    data: result.data[0] ?? null,
    error: result.error,
  };
}

export async function getWorkspacesForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspace:workspaces(id, business_name, industry, logo_path, created_at, updated_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const workspaces = (data ?? [])
    .filter((membership) => membership.workspace)
    .map((membership) => ({
      ...(membership.workspace as unknown as Workspace),
      role: membership.role as WorkspaceRole,
    })) as WorkspaceWithRole[];

  return { data: workspaces, error };
}

export async function getWorkspaceMembers(
  supabase: SupabaseClient,
  workspaceId: string,
) {
  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (membershipError || !memberships?.length) {
    return { data: [] as WorkspaceMember[], error: membershipError };
  }

  const userIds = memberships.map((membership) => membership.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const members = memberships.map((membership) => {
    const profile = profileById.get(membership.user_id);
    return {
      id: membership.id,
      user_id: membership.user_id,
      role: membership.role as WorkspaceRole,
      created_at: membership.created_at,
      full_name: profile?.full_name ?? "Veyrova member",
      email: profile?.email ?? null,
    };
  });

  return { data: members, error: profileError };
}
