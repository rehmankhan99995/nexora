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
  return supabase
    .from("workspaces")
    .select("id, business_name, industry, logo_path, created_at, updated_at")
    .eq("owner_id", userId)
    .maybeSingle<Workspace>();
}
