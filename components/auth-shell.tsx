import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, BarChart3, Check, Command, ShieldCheck, Sparkles } from "lucide-react";
import { AccountAreaTabs } from "@/components/account-area-tabs";

export function AuthShell({ children, showAccountTabs = true }: { children: React.ReactNode; showAccountTabs?: boolean }) {
  return (
    <main className="nexora-auth min-h-svh">
      <section className="auth-story hidden lg:flex">
        <div className="relative z-10 flex min-h-svh w-full max-w-2xl flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[0.22em] text-white"><span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#16142c]"><Command size={18} /></span>VEYROVA</Link>
          <div className="max-w-xl"><p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200"><Sparkles size={14} /> Business operations, clarified</p><h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white xl:text-6xl">Make the work behind the work feel effortless.</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">VEYROVA brings your teams, decisions, and operating rhythm into one intelligent command center.</p><div className="mt-10 grid max-w-md grid-cols-2 gap-3 text-sm text-slate-200"><div className="auth-stat"><Check size={15} className="text-violet-300" /> One operating view</div><div className="auth-stat"><ShieldCheck size={15} className="text-violet-300" /> Built for trust</div></div></div>
          <div className="text-xs text-slate-400">© 2026 VEYROVA · AI business operations hub</div>
        </div>
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-dashboard-art" aria-hidden="true"><div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs text-slate-400"><span>Operating pulse</span><span className="text-emerald-300">+18.4%</span></div><div className="mt-5 flex items-end gap-2"><BarChart3 className="mb-1 text-violet-300" size={20} /><span className="text-4xl font-semibold text-white">84.6</span><span className="mb-1 text-xs text-slate-400">health score</span></div><div className="mt-7 flex h-20 items-end gap-2">{[32, 48, 40, 64, 54, 72, 88, 78, 96, 82, 100].map((height, index) => <span key={index} className="w-full rounded-t-sm bg-gradient-to-t from-violet-500/30 to-violet-200" style={{ height: `${height}%` }} />)}</div><div className="mt-5 flex items-center justify-between text-xs"><span className="text-slate-400">Weekly throughput</span><span className="text-white">On track</span></div></div>
      </section>
      <section className="auth-panel flex min-h-svh flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-[48%] lg:px-12 xl:w-[45%]"><div className="mb-10 flex w-full max-w-md items-center justify-between lg:hidden"><Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-white"><span className="flex size-8 items-center justify-center rounded-lg bg-violet-300 text-[#16142c]"><Command size={16} /></span>VEYROVA</Link><Link href="/" className="text-xs text-slate-400">Back to home <ArrowUpRight className="inline" size={13} /></Link></div><div className="w-full max-w-md"><Suspense fallback={null}>{showAccountTabs && <AccountAreaTabs />}{children}</Suspense></div></section>
    </main>
  );
}
