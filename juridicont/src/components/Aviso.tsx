import { AVISO_LEGAL } from "@/lib/textos";

export function AvisoLegal() {
  return (
    <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-relaxed text-stone-600">
      {AVISO_LEGAL}
    </p>
  );
}
