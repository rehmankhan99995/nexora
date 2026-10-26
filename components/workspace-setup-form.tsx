"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import { createWorkspaceAction } from "@/lib/workspace-actions";
import { INDUSTRIES } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400"
      disabled={pending}
    >
      {pending ? "Saving workspace..." : "Continue to dashboard"}
    </Button>
  );
}

export function WorkspaceSetupForm({ email }: { email?: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createWorkspaceAction, {});

  useEffect(() => {
    if (!state.redirectTo) return;

    const timer = window.setTimeout(() => router.replace(state.redirectTo!), 650);
    return () => window.clearTimeout(timer);
  }, [router, state.redirectTo]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="businessName"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Business name
        </label>
        <div className="relative">
          <Building2
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3.5 text-slate-500"
            size={17}
          />
          <Input
            id="businessName"
            name="businessName"
            type="text"
            autoComplete="organization"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. Northstar Studio"
            aria-describedby="businessName-help"
            className="h-12 rounded-xl border-white/10 bg-white/[.04] pl-10 text-white placeholder:text-slate-600 focus-visible:ring-violet-400"
          />
        </div>
        <p id="businessName-help" className="mt-2 text-xs text-slate-500">
          Use the name your team knows you by.
        </p>
      </div>

      <div>
        <label
          htmlFor="industry"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Industry
        </label>
        <div className="relative">
          <select
            id="industry"
            name="industry"
            required
            aria-describedby="industry-help"
            defaultValue=""
            className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[.04] px-3 pr-10 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
          >
            <option value="" disabled className="bg-[#17152a] text-slate-500">
              Select your industry
            </option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry} className="bg-[#17152a] text-white">
                {industry}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-3.5 text-slate-500"
            size={17}
          />
        </div>
        <p id="industry-help" className="mt-2 text-xs text-slate-500">
          This helps shape the signals you see first.
        </p>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100"
        >
          <Check aria-hidden="true" className="mr-2 inline" size={16} />
          {state.success}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs leading-5 text-slate-500">
        You are setting up a workspace for {email ?? "your account"}. You can refine these details later.
      </p>
    </form>
  );
}
