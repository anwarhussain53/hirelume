import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
      <span aria-hidden className="size-2.5 rounded-full bg-amber-500 shadow-[0_0_12px_2px] shadow-amber-500/60" />
      Hirelume
    </Link>
  );
}
