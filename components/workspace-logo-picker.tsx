/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { MAX_WORKSPACE_LOGO_BYTES } from "@/lib/workspace";
import { useFormStatus } from "react-dom";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function validateSelectedFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return "Choose a PNG, JPEG, or WebP image.";
  }

  if (file.size > MAX_WORKSPACE_LOGO_BYTES) {
    return "Logo images must be 2 MB or smaller.";
  }

  return null;
}

export function WorkspaceLogoPicker({
  initialUrl,
  disabled = false,
}: {
  initialUrl?: string | null;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(initialUrl ?? null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [initialUrl, selectedFile]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateSelectedFile(file);
    if (validationError) {
      event.target.value = "";
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setError(undefined);
    setSelectedFile(file);
  }

  function clearSelectedFile() {
    if (inputRef.current) inputRef.current.value = "";
    setSelectedFile(null);
    setError(undefined);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#17152a]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Workspace logo preview"
              className="size-full object-cover"
              onError={() => setPreviewUrl(null)}
            />
          ) : (
            <ImagePlus aria-hidden="true" className="text-violet-300" size={26} />
          )}
        </div>
        <div className="min-w-0">
          <label
            htmlFor="workspace-logo"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[.04] px-4 text-sm font-medium text-white transition hover:border-violet-300/50 hover:bg-white/[.08] focus-within:outline-none focus-within:ring-2 focus-within:ring-violet-400"
          >
            {selectedFile ? "Choose a different logo" : "Choose a logo"}
          </label>
          <input
            ref={inputRef}
            id="workspace-logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleChange}
            disabled={isDisabled}
            className="sr-only"
          />
          <p className="mt-2 text-xs text-slate-500">PNG, JPEG, or WebP · 2 MB max · optional</p>
        </div>
      </div>

      {selectedFile && (
        <button
          type="button"
          onClick={clearSelectedFile}
          disabled={isDisabled}
          className="inline-flex items-center gap-1 text-xs text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-white disabled:opacity-50"
        >
          <X aria-hidden="true" size={13} />
          Remove selected file
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
