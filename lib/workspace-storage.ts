import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_WORKSPACE_LOGO_BYTES, type Workspace } from "@/lib/workspace";

export const WORKSPACE_LOGO_BUCKET = "workspace-logos";
export const WORKSPACE_LOGO_SIGNED_URL_TTL = 60 * 60;

const LOGO_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

type LogoExtension = (typeof LOGO_TYPES)[keyof typeof LOGO_TYPES];

/**
 * Server actions can receive a File created by a different runtime realm.
 * A strict `instanceof File` check can therefore reject a valid upload even
 * though the browser selected it correctly.
 */
export function isWorkspaceLogoFile(
  value: FormDataEntryValue | null,
): value is File {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<File>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.arrayBuffer === "function"
  );
}

function hasPngSignature(bytes: Uint8Array) {
  return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
    (value, index) => bytes[index] === value,
  );
}

function hasJpegSignature(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function hasWebpSignature(bytes: Uint8Array) {
  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

function hasValidSignature(extension: LogoExtension, bytes: Uint8Array) {
  if (extension === "png") return hasPngSignature(bytes);
  if (extension === "jpg") return hasJpegSignature(bytes);
  return hasWebpSignature(bytes);
}

function hasAllowedFilenameExtension(filename: string, mimeType: string) {
  const extension = filename.toLowerCase().split(".").pop();
  if (mimeType === "image/png") return extension === "png";
  if (mimeType === "image/webp") return extension === "webp";
  return extension === "jpg" || extension === "jpeg";
}

export async function validateWorkspaceLogo(fileValue: FormDataEntryValue | null) {
  if (!isWorkspaceLogoFile(fileValue) || fileValue.size === 0) {
    return { error: "Choose a PNG, JPEG, or WebP image to upload." } as const;
  }

  if (fileValue.size > MAX_WORKSPACE_LOGO_BYTES) {
    return { error: "Logo images must be 2 MB or smaller." } as const;
  }

  const extension = LOGO_TYPES[fileValue.type as keyof typeof LOGO_TYPES];
  if (!extension || !hasAllowedFilenameExtension(fileValue.name, fileValue.type)) {
    return { error: "Logo must be a PNG, JPEG, or WebP image." } as const;
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());
  if (!hasValidSignature(extension, bytes)) {
    return { error: "The selected file is not a valid image of that type." } as const;
  }

  return { extension } as const;
}

export function getWorkspaceLogoPath(
  userId: string,
  workspaceId: string,
  extension: LogoExtension,
) {
  return `${userId}/${workspaceId}/logo-${crypto.randomUUID()}.${extension}`;
}

export function isWorkspaceLogoPath(
  path: string,
  userId: string,
  workspaceId: string,
) {
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedWorkspaceId = workspaceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^${escapedUserId}/${escapedWorkspaceId}/logo-[0-9a-f-]+\\.(png|jpg|jpeg|webp)$`,
  ).test(path);
}

export async function uploadWorkspaceLogo(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  file: File,
  extension: LogoExtension,
) {
  const path = getWorkspaceLogoPath(userId, workspaceId, extension);
  const { error } = await supabase.storage
    .from(WORKSPACE_LOGO_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  return error ? { error } : { path };
}

export async function deleteWorkspaceLogo(supabase: SupabaseClient, path: string) {
  const { error } = await supabase.storage
    .from(WORKSPACE_LOGO_BUCKET)
    .remove([path]);
  return error;
}

export async function getWorkspaceLogoUrl(
  supabase: SupabaseClient,
  userId: string,
  workspace: Workspace,
) {
  if (!workspace.logo_path || !isWorkspaceLogoPath(workspace.logo_path, userId, workspace.id)) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(WORKSPACE_LOGO_BUCKET)
    .createSignedUrl(workspace.logo_path, WORKSPACE_LOGO_SIGNED_URL_TTL);

  return error ? null : data.signedUrl;
}
