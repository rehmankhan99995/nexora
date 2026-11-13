import Link from "next/link";

export default function TermsPage() {
  return <main className="min-h-svh bg-[#0b0b18] px-6 py-16 text-slate-200"><div className="mx-auto max-w-2xl"><Link href="/signup" className="text-sm text-violet-300">Back to sign up</Link><h1 className="mt-10 text-4xl font-semibold text-white">Terms of Service</h1><p className="mt-5 leading-7 text-slate-400">Veyrova is a workspace for authorized business operations. Use the service lawfully, keep your account secure, and ensure the information you connect is yours to use.</p></div></main>;
}
