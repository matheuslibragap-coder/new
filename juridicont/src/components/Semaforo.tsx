import type { Severidade } from "@/lib/tipos";
import { ROTULO_SEVERIDADE } from "@/lib/textos";

const LUZ: Record<Severidade, string> = {
  vermelho: "bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.7)]",
  amarelo: "bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.7)]",
  verde: "bg-green-500 shadow-[0_0_24px_rgba(34,197,94,0.7)]",
};

const FUNDO: Record<Severidade, string> = {
  vermelho: "border-red-200 bg-red-50 text-red-900",
  amarelo: "border-amber-200 bg-amber-50 text-amber-900",
  verde: "border-green-200 bg-green-50 text-green-900",
};

export function Semaforo({ valor, tamanho = "grande" }: { valor: Severidade; tamanho?: "grande" | "pequeno" }) {
  if (tamanho === "pequeno") {
    return (
      <span
        className={`inline-block h-3 w-3 shrink-0 rounded-full ${LUZ[valor].split(" ")[0]}`}
        aria-label={ROTULO_SEVERIDADE[valor]}
      />
    );
  }
  const ordem: Severidade[] = ["vermelho", "amarelo", "verde"];
  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 ${FUNDO[valor]}`} role="status">
      <div className="flex flex-col gap-2 rounded-2xl bg-stone-900 p-2.5" aria-hidden>
        {ordem.map((s) => (
          <span key={s} className={`h-9 w-9 rounded-full ${s === valor ? LUZ[s] : "bg-stone-700"}`} />
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Classificação</p>
        <p className="text-2xl font-bold capitalize">{valor}</p>
        <p className="text-sm">{ROTULO_SEVERIDADE[valor]}</p>
      </div>
    </div>
  );
}
