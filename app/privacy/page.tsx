import Link from "next/link";

export default function PrivacyPage() {
  return <main className="min-h-svh bg-[#0b0b18] px-6 py-16 text-slate-200"><div className="mx-auto max-w-2xl"><Link href="/signup" className="text-sm text-violet-300">Back to sign up</Link><h1 className="mt-10 text-4xl font-semibold text-white">Privacy Policy</h1><p className="mt-5 leading-7 text-slate-400">NEXORA uses account information to provide workspace access and improve the product. We do not ask for passwords outside Supabase Auth, and we do not sell personal information.</p></div></main>;
}
