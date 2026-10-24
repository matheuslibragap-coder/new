import { useEffect, useState } from "react";
import { caso } from "./data";
import { cx } from "./ui/comum";
import Painel from "./modulos/Painel";
import LinhaTempo from "./modulos/LinhaTempo";
import MapaProvas from "./modulos/MapaProvas";
import Pontos from "./modulos/Pontos";
import Teses from "./modulos/Teses";
import Simulador from "./modulos/Simulador";
import Macetes from "./modulos/Macetes";
import Plenario from "./modulos/Plenario";

const MODULOS = [
  { id: "painel", nome: "Painel do caso", curto: "Painel", C: Painel },
  { id: "linha", nome: "Linha do tempo", curto: "Tempo", C: LinhaTempo },
  { id: "provas", nome: "Mapa de provas", curto: "Provas", C: MapaProvas },
  { id: "atencao", nome: "Pontos de atenção", curto: "Atenção", C: Pontos },
  { id: "teses", nome: "Árvore de teses", curto: "Teses", C: Teses },
  { id: "quesitos", nome: "Simulador de quesitação", curto: "Quesitos", C: Simulador },
  { id: "macetes", nome: "Macetes de plenário", curto: "Macetes", C: Macetes },
  { id: "plenario", nome: "Modo plenário", curto: "Plenário", C: Plenario },
] as const;

type IdModulo = (typeof MODULOS)[number]["id"];

function useRota(): [IdModulo, (id: IdModulo) => void] {
  const ler = () => {
    const h = location.hash.replace(/^#\/?/, "") as IdModulo;
    return MODULOS.some((m) => m.id === h) ? h : "painel";
  };
  const [rota, setRota] = useState<IdModulo>(ler);
  useEffect(() => {
    const f = () => {
      setRota(ler());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return [rota, (id) => (location.hash = `/${id}`)];
}

function BotaoTema() {
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains("dark"));
  const alternar = () => {
    const novo = !escuro;
    setEscuro(novo);
    document.documentElement.classList.toggle("dark", novo);
    try {
      localStorage.setItem("tema", novo ? "escuro" : "claro");
    } catch {
      /* sem armazenamento */
    }
  };
  return (
    <button
      onClick={alternar}
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm dark:border-slate-700"
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
    >
      {escuro ? "☀ Claro" : "☾ Escuro"}
    </button>
  );
}

export default function App() {
  const [rota, ir] = useRota();
  const atual = MODULOS.find((m) => m.id === rota)!;
  const Atual = atual.C;
  const plenario = rota === "plenario";

  useEffect(() => {
    document.title = `${atual.nome} · Júri simulado`;
  }, [atual]);

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <div className="sticky top-0 p-4">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Júri simulado · defesa</div>
          <div className="mt-1 text-sm leading-snug">{caso.meta.titulo}</div>
          <nav className="mt-5 flex flex-col gap-0.5">
            {MODULOS.map((m) => (
              <a
                key={m.id}
                href={`#/${m.id}`}
                aria-current={rota === m.id ? "page" : undefined}
                className={cx(
                  "rounded-lg px-3 py-2 text-[15px]",
                  rota === m.id ? "bg-indigo-600 font-medium text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                {m.nome}
              </a>
            ))}
          </nav>
          <div className="mt-6">
            <BotaoTema />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 md:hidden dark:border-slate-800 dark:bg-slate-900/95">
          <label className="sr-only" htmlFor="nav">
            Módulo
          </label>
          <select
            id="nav"
            value={rota}
            onChange={(e) => ir(e.target.value as IdModulo)}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-[15px] font-medium dark:border-slate-700 dark:bg-slate-800"
          >
            {MODULOS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          {!plenario && (
            <a href="#/plenario" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
              Plenário
            </a>
          )}
          <BotaoTema />
        </header>

        <main className={cx("mx-auto w-full px-4 py-5 md:px-8 md:py-8", plenario ? "max-w-3xl" : "max-w-5xl")}>
          <Atual />
        </main>
      </div>
    </div>
  );
}
