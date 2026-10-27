import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Command, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { getWorkspacesForUser } from "@/lib/workspace";
import { WorkspaceLogoManager } from "@/components/workspace-logo-manager";
import { getWorkspaceLogoUrl } from "@/lib/workspace-storage";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ workspace?: string }>;
}) {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: workspaces, error: workspacesError } = await getWorkspacesForUser(
    supabase,
    data.user.id,
  );
  if (workspacesError || workspaces.length === 0) redirect("/workspace/setup");

  const params = searchParams ? await searchParams : {};
  const workspace = workspaces.find((item) => item.id === params.workspace) ?? workspaces[0];

  const logoUrl = await getWorkspaceLogoUrl(supabase, data.user.id, workspace);

  const fullName = data.user.user_metadata?.full_name;
  const name = (typeof fullName === "string" ? fullName : "").split(" ")[0] || "there";

  return (
    <main className="min-h-svh bg-[#0b0b18] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em]">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-300 text-[#16142c]">
              <Command aria-hidden="true" size={18} />
            </span>
            NEXORA
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="flex items-center gap-2 text-sm text-violet-300">
          <Sparkles aria-hidden="true" size={15} /> Your operating command center
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Good to see you, {name}.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
          Your workspace is ready. The next phase of NEXORA will bring your most important signals into one calm, actionable view.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
            <p className="text-sm text-slate-400">Workspace</p>
            <p className="mt-3 truncate text-2xl font-semibold">{workspace.business_name}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
            <p className="text-sm text-slate-400">Industry</p>
            <p className="mt-3 truncate text-lg font-medium">{workspace.industry}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="mt-3 truncate text-lg font-medium">{data.user.email}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-6">
          <p className="text-sm text-violet-200">Next up</p>
          <p className="mt-3 text-lg font-medium">Connect your operating signals</p>
        </div>

        <div className="mt-4">
          <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={workspace.id} />
        </div>

        <div className="mt-4 max-w-xl rounded-2xl border border-white/10 bg-white/[.04] p-6">
          <p className="text-sm text-slate-400">Workspace logo</p>
          <p className="mt-2 mb-5 text-sm leading-6 text-slate-500">
            Add a small mark for {workspace.business_name}. Logos are private to your workspace.
          </p>
          <WorkspaceLogoManager initialUrl={logoUrl} hasLogo={Boolean(workspace.logo_path)} />
        </div>
      </section>
    </main>
  );
}
