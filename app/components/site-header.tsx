import Link from "next/link";

export default function SiteHeader({ active }: { active: "demo" | "verify" }) {
  return (
    <header className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-xl font-semibold tracking-tight text-navy-800">Custos</span>
          <span className="text-sm text-navy-500">Give AI the answer, never the record.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className={active === "demo" ? "font-semibold text-navy-800" : "text-navy-500"}
          >
            Demo
          </Link>
          <Link
            href="/verify"
            className={active === "verify" ? "font-semibold text-navy-800" : "text-navy-500"}
          >
            Verify an answer
          </Link>
        </nav>
      </div>
    </header>
  );
}
