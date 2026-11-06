"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { acceptWorkspaceInvitationAction } from "@/lib/workspace-member-actions";

export function AcceptWorkspaceInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(acceptWorkspaceInvitationAction, {});

  useEffect(() => {
    if (state.error) return;
    if (state.success) router.refresh();
  }, [router, state.error, state.success]);

  return <form action={formAction} className="space-y-4"><input type="hidden" name="token" value={token} /><button type="submit" className="h-12 w-full rounded-xl bg-violet-500 text-sm font-medium text-white hover:bg-violet-400">Accept invitation</button>{state.error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{state.error}</p>}</form>;
}
