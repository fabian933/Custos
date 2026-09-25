import Link from "next/link";

const SECTIONS = [
  { id: "hero", label: "Overview" },
  { id: "problem", label: "The problem" },
  { id: "how", label: "How it works" },
  { id: "demo", label: "Live demo" },
  { id: "proof", label: "The proof" },
  { id: "next", label: "What's next" },
];

export default function SiteHeader({ active }: { active: "demo" | "verify" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-navy-200/70 bg-cream-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-8 py-3">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-lg font-semibold tracking-tight text-red-600">Custos</span>
          <span className="hidden text-sm text-navy-500 lg:inline">
            Give AI the answer, never the record.
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {active === "demo" &&
            SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="hidden text-navy-500 transition hover:text-navy-800 md:inline"
              >
                {section.label}
              </a>
            ))}
          <Link
            href="/verify"
            className={
              active === "verify"
                ? "font-semibold text-navy-800"
                : "rounded-full border border-navy-200 px-3 py-1.5 font-medium text-navy-700 transition hover:bg-navy-50"
            }
          >
            Verify an answer
          </Link>
        </nav>
      </div>
    </header>
  );
}
