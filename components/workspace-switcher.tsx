import Link from "next/link";
import type { WorkspaceWithRole } from "@/lib/workspace";

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceWithRole[];
  activeWorkspaceId: string;
}) {
  if (workspaces.length < 2) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Your workspaces</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {workspaces.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard?workspace=${item.id}`}
            className={`rounded-lg border px-3 py-2 text-sm transition ${item.id === activeWorkspaceId ? "border-violet-300/50 bg-violet-300/15 text-violet-100" : "border-white/10 text-slate-400 hover:bg-white/[.06] hover:text-white"}`}
          >
            {item.business_name}
            <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">{item.role}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
