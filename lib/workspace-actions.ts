"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getWorkspaceForUser,
  validateWorkspaceFields,
} from "@/lib/workspace";
import type { Workspace } from "@/lib/workspace";
import {
  deleteWorkspaceLogo,
  isWorkspaceLogoPath,
  uploadWorkspaceLogo,
  validateWorkspaceLogo,
} from "@/lib/workspace-storage";

export type WorkspaceActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
};

function getField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function getAuthenticatedWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Your session has expired. Please sign in again." } as const;
  }

  const { data: workspace, error: workspaceError } = await getWorkspaceForUser(
    supabase,
    userData.user.id,
  );

  if (workspaceError || !workspace) {
    return { error: "We could not find your workspace. Please try again." } as const;
  }

  return { user: userData.user, workspace } as const;
}

async function setWorkspaceLogoPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workspaceId: string,
  logoPath: string | null,
) {
  const { data, error } = await supabase
    .from("workspaces")
    .update({ logo_path: logoPath, updated_at: new Date().toISOString() })
    .eq("id", workspaceId)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  return error || !data ? new Error("Workspace logo record was not updated") : null;
}

async function replaceWorkspaceLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workspace: Workspace,
  file: File,
  extension: "png" | "jpg" | "webp",
) {
  const uploaded = await uploadWorkspaceLogo(
    supabase,
    userId,
    workspace.id,
    file,
    extension,
  );

  if (uploaded.error) return "We could not upload that logo. Please try again.";

  const updateError = await setWorkspaceLogoPath(
    supabase,
    userId,
    workspace.id,
    uploaded.path,
  );

  if (updateError) {
    await deleteWorkspaceLogo(supabase, uploaded.path);
    return "The logo uploaded, but we could not save it to your workspace. Please try again.";
  }

  if (
    workspace.logo_path &&
    isWorkspaceLogoPath(workspace.logo_path, userId, workspace.id)
  ) {
    const cleanupError = await deleteWorkspaceLogo(supabase, workspace.logo_path);
    if (cleanupError) {
      console.error("Old workspace logo cleanup failed", {
        workspaceId: workspace.id,
        message: cleanupError.message,
      });
    }
  }

  return null;
}

export async function createWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const businessName = getField(formData, "businessName");
  const industry = getField(formData, "industry");
  const validationError = validateWorkspaceFields({ businessName, industry });

  if (validationError) return { error: validationError };

  const logoEntry = formData.get("logo");
  const logoFile = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;
  if (logoEntry && !(logoEntry instanceof File)) {
    return { error: "Choose a valid logo image." };
  }

  const logoValidation = logoFile ? await validateWorkspaceLogo(logoFile) : null;
  if (logoValidation && "error" in logoValidation) {
    return { error: logoValidation.error };
  }

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

  let workspace: Workspace | null = null;

  if (!insertError || insertError.code === "23505") {
    const { data: existingWorkspace, error: lookupError } =
      await getWorkspaceForUser(supabase, userData.user.id);
    if (lookupError) return { error: "We could not load your workspace. Please try again." };
    workspace = existingWorkspace;
  }

  // The unique owner constraint makes a second submission safe. If another
  // request won the race, reuse the owner's row instead of creating a duplicate.
  if (!workspace) {
    console.error("Workspace creation failed", {
      code: insertError?.code,
      message: insertError?.message,
    });
    return { error: "We could not save your workspace. Please try again." };
  }

  if (logoFile && logoValidation && "extension" in logoValidation) {
    const logoError = await replaceWorkspaceLogo(
      supabase,
      userData.user.id,
      workspace,
      logoFile,
      logoValidation.extension,
    );

    if (logoError) {
      return { error: `Workspace created, but ${logoError.toLowerCase()}` };
    }
  }

  return {
    success: "Your workspace is ready. Redirecting you to the dashboard...",
    redirectTo: "/dashboard",
  };
}

export async function updateWorkspaceLogoAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const supabase = await createClient();
  const current = await getAuthenticatedWorkspace(supabase);

  if ("error" in current) return { error: current.error };

  if (getField(formData, "intent") === "remove") {
    if (!current.workspace.logo_path) {
      return { success: "No workspace logo is currently saved." };
    }

    if (
      !isWorkspaceLogoPath(
        current.workspace.logo_path,
        current.user.id,
        current.workspace.id,
      )
    ) {
      return { error: "The saved logo path is invalid. Please contact support." };
    }

    const clearError = await setWorkspaceLogoPath(
      supabase,
      current.user.id,
      current.workspace.id,
      null,
    );

    if (clearError) return { error: "We could not remove the logo. Please try again." };

    const deleteError = await deleteWorkspaceLogo(supabase, current.workspace.logo_path);
    if (deleteError) {
      const restoreError = await setWorkspaceLogoPath(
        supabase,
        current.user.id,
        current.workspace.id,
        current.workspace.logo_path,
      );

      console.error("Workspace logo deletion failed", {
        workspaceId: current.workspace.id,
        message: deleteError.message,
        restoreMessage: restoreError?.message,
      });

      return { error: "We could not remove the logo completely. Please try again." };
    }

    return { success: "Workspace logo removed." };
  }

  const logoEntry = formData.get("logo");
  const logoFile = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;
  const logoValidation = logoFile ? await validateWorkspaceLogo(logoFile) : null;

  if (!logoFile || !logoValidation || "error" in logoValidation) {
    return {
      error:
        logoValidation && "error" in logoValidation
          ? logoValidation.error
          : "Choose a PNG, JPEG, or WebP image to upload.",
    };
  }

  const logoError = await replaceWorkspaceLogo(
    supabase,
    current.user.id,
    current.workspace,
    logoFile,
    logoValidation.extension,
  );

  return logoError ? { error: logoError } : { success: "Workspace logo updated." };
}
