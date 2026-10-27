"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Upload } from "lucide-react";
import { updateWorkspaceLogoAction } from "@/lib/workspace-actions";
import { Button } from "@/components/ui/button";
import { WorkspaceLogoPicker } from "@/components/workspace-logo-picker";
import { useFormStatus } from "react-dom";

function LogoSubmitButton({
  intent,
  pendingIntent,
  onClick,
}: {
  intent: "upload" | "remove";
  pendingIntent: "upload" | "remove" | null;
  onClick: () => void;
}) {
  const { pending } = useFormStatus();
  const isPending = pending && pendingIntent === intent;

  return (
    <Button
      type="submit"
      name="intent"
      value={intent}
      variant={intent === "remove" ? "ghost" : "default"}
      onClick={onClick}
      disabled={pending}
      className={
        intent === "remove"
          ? "text-slate-400 hover:bg-red-400/10 hover:text-red-200"
          : "bg-violet-500 text-white shadow-lg shadow-violet-950/30 hover:bg-violet-400"
      }
    >
      {intent === "remove" ? <Trash2 aria-hidden="true" size={15} /> : <Upload aria-hidden="true" size={15} />}
      {isPending ? (intent === "remove" ? "Removing..." : "Uploading...") : intent === "remove" ? "Remove logo" : "Save logo"}
    </Button>
  );
}

export function WorkspaceLogoManager({
  initialUrl,
  hasLogo,
}: {
  initialUrl?: string | null;
  hasLogo: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateWorkspaceLogoAction, {});
  const [pendingIntent, setPendingIntent] = useState<"upload" | "remove" | null>(null);
  const [pickerKey, setPickerKey] = useState(0);

  useEffect(() => {
    if (!state.success && !state.error) return;
    setPendingIntent(null);
    if (state.success) {
      setPickerKey((key) => key + 1);
      router.refresh();
    }
  }, [router, state.error, state.success]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      onSubmit={() => setPendingIntent((intent) => intent ?? "upload")}
      className="space-y-4"
    >
      <WorkspaceLogoPicker key={pickerKey} initialUrl={initialUrl} />

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" aria-live="polite" className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
          <Check aria-hidden="true" className="mr-1 inline" size={15} />
          {state.success}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <LogoSubmitButton
          intent="upload"
          pendingIntent={pendingIntent}
          onClick={() => setPendingIntent("upload")}
        />
        {hasLogo && (
          <LogoSubmitButton
            intent="remove"
            pendingIntent={pendingIntent}
            onClick={() => setPendingIntent("remove")}
          />
        )}
      </div>
    </form>
  );
}
