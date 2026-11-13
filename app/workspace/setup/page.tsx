import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ArrowUpRight, Check, Command, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { WorkspaceSetupForm } from "@/components/workspace-setup-form";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceForUser } from "@/lib/workspace";

export const instant = false;

export default async function WorkspaceSetupPage() {
  await connection();
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");

  const { data: workspace, error } = await getWorkspaceForUser(
    supabase,
    userData.user.id,
  );

  if (workspace) redirect("/dashboard");

  return (
    <main className="min-h-svh bg-[#0b0b18] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-300 text-[#16142c]">
              <Command aria-hidden="true" size={18} />
            </span>
            NEXORA
          </Link>
          <span className="text-xs text-slate-500">Step 1 of 1</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-center lg:gap-20 lg:py-20">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm text-violet-300">
            <Sparkles aria-hidden="true" size={15} /> Make it yours
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
            Start with a clear view of your business.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-400">
            Tell us a little about your business and we&apos;ll shape your NEXORA workspace around the way you operate.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-3">
              <Check aria-hidden="true" className="text-violet-300" size={15} />
              One operating view
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-3">
              <ShieldCheck aria-hidden="true" className="text-violet-300" size={15} />
              Private by default
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 shadow-2xl shadow-violet-950/20 sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Workspace details
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              What should we call it?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              These details are only used to personalize your workspace.
            </p>
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200"
            >
              We couldn&apos;t load your workspace details. Refresh the page and try again.
            </p>
          ) : (
            <WorkspaceSetupForm email={userData.user.email ?? undefined} />
          )}
          <div className="mt-6 flex items-center justify-center gap-1 text-xs text-slate-500">
            Securely connected to your account <ArrowUpRight aria-hidden="true" size={13} />
          </div>
        </div>
      </section>
    </main>
  );
}
