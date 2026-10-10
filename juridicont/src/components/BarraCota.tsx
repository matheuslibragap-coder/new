export function BarraCota({ rotulo, usados, limite }: { rotulo: string; usados: number; limite: number }) {
  const pct = limite > 0 ? Math.min(100, Math.round((usados / limite) * 100)) : 100;
  const cor = limite === 0 ? "bg-stone-300" : pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-marca";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-stone-600">{rotulo}</span>
        <span className="font-medium">{limite === 0 ? "Não incluso" : `${usados} de ${limite}`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${limite === 0 ? 100 : pct}%` }} />
      </div>
    </div>
  );
}
