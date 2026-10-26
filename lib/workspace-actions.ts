"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getWorkspaceForUser,
  validateWorkspaceFields,
} from "@/lib/workspace";

export type WorkspaceActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
};

function getField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const businessName = getField(formData, "businessName");
  const industry = getField(formData, "industry");
  const validationError = validateWorkspaceFields({ businessName, industry });

  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const { error: insertError } = await supabase.from("workspaces").insert({
    owner_id: userData.user.id,
    business_name: businessName,
    industry,
  });

  if (!insertError) {
    return {
      success: "Your workspace is ready. Redirecting you to the dashboard...",
      redirectTo: "/dashboard",
    };
  }

  // The unique owner constraint makes a second submission safe. If another
  // request won the race, confirm the owner's existing row through RLS and
  // continue to the dashboard instead of creating a duplicate.
  if (insertError.code === "23505") {
    const { data: existingWorkspace, error: lookupError } =
      await getWorkspaceForUser(supabase, userData.user.id);

    if (existingWorkspace && !lookupError) {
      return {
        success: "Your workspace is already set up. Redirecting you to the dashboard...",
        redirectTo: "/dashboard",
      };
    }
  }

  console.error("Workspace creation failed", {
    code: insertError.code,
    message: insertError.message,
  });

  return { error: "We could not save your workspace. Please try again." };
}
