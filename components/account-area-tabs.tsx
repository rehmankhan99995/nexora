"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Building2, UserRound } from "lucide-react";

export function AccountAreaTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("mode") === "workspace" ? "workspace" : "profile";

  function tabHref(tab: "profile" | "workspace") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", tab);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="mb-8 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[.03] p-1" role="tablist" aria-label="NEXORA account area">
      <Link href={tabHref("profile")} role="tab" aria-selected={activeTab === "profile"} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${activeTab === "profile" ? "bg-violet-300 font-semibold text-[#16142c]" : "text-slate-400 hover:bg-white/[.05] hover:text-white"}`}>
        <UserRound size={15} /> Profile
      </Link>
      <Link href={tabHref("workspace")} role="tab" aria-selected={activeTab === "workspace"} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${activeTab === "workspace" ? "bg-violet-300 font-semibold text-[#16142c]" : "text-slate-400 hover:bg-white/[.05] hover:text-white"}`}>
        <Building2 size={15} /> Workspace
      </Link>
    </div>
  );
}
