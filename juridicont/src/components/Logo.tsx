import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight text-marca">
      <span aria-hidden className="flex h-7 w-7 flex-col items-center justify-center gap-0.5 rounded-lg bg-marca">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      </span>
      Juridicont
    </Link>
  );
}
