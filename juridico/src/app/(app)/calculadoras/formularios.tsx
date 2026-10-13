"use client";
import { useState, useTransition, type ReactNode } from "react";
import { classeBotao } from "@/components/ui";
import { DATA_LEI_14905, ROTULO_JUROS, type Correcao, type Juros, type PeriodoCriterio } from "@/lib/calculos/atualizacao";
import { ROTULO_RESCISAO, type Aviso, type TipoRescisao } from "@/lib/calculos/rescisao";
import type { TipoCalculo } from "@/lib/calculos/servidor";
import { calcular, salvarCalculo } from "./acoes";
import { ResultadoQualquer } from "./resultados";

const cls = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const num = (s: string) => {
  const t = s.trim().replace(/[R$\s]/g, "");
  return t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t);
};

function C({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{rotulo}</span>
      {children}
    </label>
  );
}

const CORRECOES: Correcao[] = ["IPCA", "IPCA-E", "INPC", "SELIC", "TR", "nenhuma"];

export function EditorCriterios({ valor, onChange }: { valor: PeriodoCriterio[]; onChange: (v: PeriodoCriterio[]) => void }) {
  const set = (i: number, p: Partial<PeriodoCriterio>) => onChange(valor.map((x, k) => (k === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">Critérios por período</span>
        <div className="flex gap-2">
          <button
            type="button"
            className={classeBotao("secundario", true)}
            onClick={() =>
              onChange([
                { ate: "2024-08-29", correcao: "INPC", juros: "simples_1_am" },
                { ate: null, correcao: "IPCA", juros: "selic_menos_ipca" },
              ])
            }
          >
            Usar regra do CC após a Lei 14.905/2024
          </button>
          <button type="button" className={classeBotao("secundario", true)} onClick={() => onChange([{ ate: null, correcao: "INPC", juros: "simples_1_am" }])}>
            Critério único
          </button>
        </div>
      </div>
      <p className="text-xs text-amber-800">[VALIDAR COM ADVOGADO] A regra da Lei 14.905/2024 aplica-se a partir de {DATA_LEI_14905.split("-").reverse().join("/")}; o critério anterior fica selecionável para o período até 29/08/2024. Confira o título judicial.</p>
      {valor.map((p, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
          <C rotulo={i === valor.length - 1 ? "Até (vazio = fim)" : "Até"}>
            <input type="date" className={cls} value={p.ate ?? ""} onChange={(e) => set(i, { ate: e.target.value || null })} />
          </C>
          <C rotulo="Correção">
            <select className={cls} value={p.correcao} onChange={(e) => set(i, { correcao: e.target.value as Correcao })}>
              {CORRECOES.map((c) => (
                <option key={c} value={c}>
                  {c === "nenhuma" ? "Sem correção" : c}
                </option>
              ))}
            </select>
          </C>
          <C rotulo="Juros">
            <select className={cls} value={p.juros} onChange={(e) => set(i, { juros: e.target.value as Juros })}>
              {Object.entries(ROTULO_JUROS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </C>
          <button type="button" className="self-end text-xs text-red-700 underline disabled:opacity-30" disabled={valor.length === 1} onClick={() => onChange(valor.filter((_, k) => k !== i))}>
            remover
          </button>
        </div>
      ))}
      <button type="button" className="text-sm underline" onClick={() => onChange([...valor, { ate: null, correcao: "IPCA", juros: "nenhum" }])}>
        + período
      </button>
    </div>
  );
}

function Rodape({ tipo, entrada, processos }: { tipo: TipoCalculo; entrada: () => Record<string, unknown> | null; processos: { valor: string; rotulo: string }[] }) {
  const [pendente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<unknown>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [processo, setProcesso] = useState("");
  const [salvo, setSalvo] = useState<string | null>(null);

  const rodar = () =>
    iniciar(async () => {
      setErro(null);
      setSalvo(null);
      const e = entrada();
      if (!e) return;
      const r = await calcular(tipo, e);
      if (r.erro) {
        setErro(r.erro);
        setResultado(null);
      } else setResultado(r.resultado);
    });

  const salvar = () =>
    iniciar(async () => {
      const e = entrada();
      if (!e) return;
      const r = await salvarCalculo(tipo, titulo, e, processo || null);
      if (r.erro) setErro(r.erro);
      else setSalvo(r.id!);
    });

  return (
    <div className="space-y-4">
      <button type="button" onClick={rodar} disabled={pendente} className={classeBotao("primario")}>
        {pendente ? "Calculando..." : "Calcular"}
      </button>
      {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</div>}
      {resultado !== null && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <ResultadoQualquer tipo={tipo} r={resultado} />
          <div className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <C rotulo="Título para salvar">
              <input className={cls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Cálculo de atualização da inicial" />
            </C>
            <C rotulo="Processo (opcional)">
              <select className={cls} value={processo} onChange={(e) => setProcesso(e.target.value)}>
                <option value="">Sem processo</option>
                {processos.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </option>
                ))}
              </select>
            </C>
            <button type="button" onClick={salvar} disabled={pendente} className={classeBotao("secundario")}>
              Salvar
            </button>
          </div>
          {salvo && (
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-emerald-800">Cálculo salvo.</span>
              <a href={`/api/calculos/${salvo}/pdf`} className="underline" target="_blank" rel="noopener noreferrer">
                Baixar memória em PDF
              </a>
              <a href={`/calculadoras/salvos/${salvo}`} className="underline">
                Abrir
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FormAtualizacao({ processos }: { processos: { valor: string; rotulo: string }[] }) {
  const [valor, setValor] = useState("");
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState(hoje());
  const [juros, setJuros] = useState("");
  const [deflacao, setDeflacao] = useState(false);
  const [crit, setCrit] = useState<PeriodoCriterio[]>([{ ate: null, correcao: "INPC", juros: "simples_1_am" }]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <C rotulo="Valor (R$)">
          <input className={cls} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="10.000,00" />
        </C>
        <C rotulo="Data do débito (início da correção)">
          <input type="date" className={cls} value={ini} onChange={(e) => setIni(e.target.value)} />
        </C>
        <C rotulo="Início dos juros (ex.: citação; vazio = data do débito)">
          <input type="date" className={cls} value={juros} onChange={(e) => setJuros(e.target.value)} />
        </C>
        <C rotulo="Data do cálculo">
          <input type="date" className={cls} value={fim} onChange={(e) => setFim(e.target.value)} />
        </C>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={deflacao} onChange={(e) => setDeflacao(e.target.checked)} /> Desconsiderar índices negativos (deflação)
      </label>
      <EditorCriterios valor={crit} onChange={setCrit} />
      <Rodape tipo="atualizacao" processos={processos} entrada={() => ({ valor: num(valor), dataInicial: ini, dataFinal: fim, dataInicioJuros: juros || null, periodos: crit, desconsiderarDeflacao: deflacao })} />
    </div>
  );
}

export function FormRescisao({ processos }: { processos: { valor: string; rotulo: string }[] }) {
  const [f, setF] = useState({ salario: "", variaveis: "", admissao: "", desligamento: hoje(), tipo: "sem_justa_causa" as TipoRescisao, aviso: "indenizado" as Aviso, vencidas: "0", dobro: "0", fgts: "" });
  const s = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const avisos: Aviso[] = f.tipo === "pedido_demissao" ? ["trabalhado", "descontado", "dispensado"] : f.tipo === "sem_justa_causa" || f.tipo === "acordo" ? ["indenizado", "trabalhado"] : ["dispensado"];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <C rotulo="Último salário (R$)">
          <input className={cls} inputMode="decimal" value={f.salario} onChange={s("salario")} />
        </C>
        <C rotulo="Média de variáveis (R$, opcional)">
          <input className={cls} inputMode="decimal" value={f.variaveis} onChange={s("variaveis")} placeholder="horas extras, comissões" />
        </C>
        <C rotulo="Admissão">
          <input type="date" className={cls} value={f.admissao} onChange={s("admissao")} />
        </C>
        <C rotulo="Último dia trabalhado">
          <input type="date" className={cls} value={f.desligamento} onChange={s("desligamento")} />
        </C>
        <C rotulo="Tipo de rescisão">
          <select className={cls} value={f.tipo} onChange={(e) => {
            const tipo = e.target.value as TipoRescisao;
            setF({ ...f, tipo, aviso: tipo === "pedido_demissao" ? "trabalhado" : tipo === "sem_justa_causa" || tipo === "acordo" ? "indenizado" : "dispensado" });
          }}>
            {Object.entries(ROTULO_RESCISAO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </C>
        <C rotulo="Aviso prévio">
          <select className={cls} value={f.aviso} onChange={s("aviso")}>
            {avisos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </C>
        <C rotulo="Períodos de férias vencidas">
          <input type="number" min={0} className={cls} value={f.vencidas} onChange={s("vencidas")} />
        </C>
        <C rotulo="Desses, vencidos em dobro (art. 137)">
          <input type="number" min={0} className={cls} value={f.dobro} onChange={s("dobro")} />
        </C>
        <C rotulo="Saldo do FGTS para fins rescisórios (R$)">
          <input className={cls} inputMode="decimal" value={f.fgts} onChange={s("fgts")} />
        </C>
      </div>
      <Rodape
        tipo="rescisao"
        processos={processos}
        entrada={() => ({
          salario: num(f.salario),
          mediaVariaveis: f.variaveis ? num(f.variaveis) : 0,
          admissao: f.admissao,
          desligamento: f.desligamento,
          tipo: f.tipo,
          aviso: f.aviso,
          periodosFeriasVencidas: Number(f.vencidas) || 0,
          periodosFeriasEmDobro: Number(f.dobro) || 0,
          saldoFgts: f.fgts ? num(f.fgts) : 0,
        })}
      />
    </div>
  );
}

export function FormPensao({ processos }: { processos: { valor: string; rotulo: string }[] }) {
  const [base, setBase] = useState<"bruto" | "liquido" | "salario_minimo">("liquido");
  const [rend, setRend] = useState("");
  const [desc, setDesc] = useState("");
  const [sm, setSm] = useState("");
  const [percentual, setPercentual] = useState("30");
  const [parcelas, setParcelas] = useState<{ vencimento: string; devido: string; pago: string }[]>([]);
  const [dataCalc, setDataCalc] = useState(hoje());
  const [crit, setCrit] = useState<PeriodoCriterio[]>([{ ate: null, correcao: "INPC", juros: "simples_1_am" }]);
  const setP = (i: number, k: "vencimento" | "devido" | "pago", v: string) => setParcelas(parcelas.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Valor mensal</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <C rotulo="Base">
          <select className={cls} value={base} onChange={(e) => setBase(e.target.value as typeof base)}>
            <option value="liquido">Rendimentos líquidos</option>
            <option value="bruto">Rendimentos brutos</option>
            <option value="salario_minimo">Salário mínimo</option>
          </select>
        </C>
        <C rotulo="Percentual (%)">
          <input className={cls} inputMode="decimal" value={percentual} onChange={(e) => setPercentual(e.target.value)} />
        </C>
        {base === "salario_minimo" ? (
          <C rotulo="Salário mínimo vigente (R$)">
            <input className={cls} inputMode="decimal" value={sm} onChange={(e) => setSm(e.target.value)} />
          </C>
        ) : (
          <>
            <C rotulo="Rendimento bruto (R$)">
              <input className={cls} inputMode="decimal" value={rend} onChange={(e) => setRend(e.target.value)} />
            </C>
            {base === "liquido" && (
              <C rotulo="Descontos obrigatórios: INSS e IRRF (R$)">
                <input className={cls} inputMode="decimal" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </C>
            )}
          </>
        )}
      </div>
      <h3 className="text-sm font-semibold">Débito em atraso (opcional)</h3>
      {parcelas.map((p, i) => (
        <div key={i} className="grid grid-cols-3 gap-2">
          <input type="date" className={cls} value={p.vencimento} onChange={(e) => setP(i, "vencimento", e.target.value)} aria-label="Vencimento" />
          <input className={cls} inputMode="decimal" placeholder="Devido" value={p.devido} onChange={(e) => setP(i, "devido", e.target.value)} aria-label="Devido" />
          <input className={cls} inputMode="decimal" placeholder="Pago" value={p.pago} onChange={(e) => setP(i, "pago", e.target.value)} aria-label="Pago" />
        </div>
      ))}
      <div className="flex flex-wrap gap-3 text-sm">
        <button type="button" className="underline" onClick={() => setParcelas([...parcelas, { vencimento: "", devido: "", pago: "0" }])}>
          + parcela
        </button>
        {parcelas.length > 0 && (
          <button type="button" className="text-red-700 underline" onClick={() => setParcelas(parcelas.slice(0, -1))}>
            remover última
          </button>
        )}
      </div>
      {parcelas.length > 0 && (
        <>
          <C rotulo="Data do cálculo">
            <input type="date" className={cls} value={dataCalc} onChange={(e) => setDataCalc(e.target.value)} />
          </C>
          <EditorCriterios valor={crit} onChange={setCrit} />
        </>
      )}
      <Rodape
        tipo="pensao"
        processos={processos}
        entrada={() => ({
          mensal: { base, rendimentoBruto: rend ? num(rend) : undefined, descontosObrigatorios: desc ? num(desc) : 0, salarioMinimo: sm ? num(sm) : undefined, percentual: num(percentual) },
          debito: parcelas.length ? { parcelas: parcelas.map((p) => ({ vencimento: p.vencimento, devido: num(p.devido), pago: p.pago ? num(p.pago) : 0 })), dataCalculo: dataCalc, criterios: crit } : undefined,
        })}
      />
    </div>
  );
}

export function FormCumprimento({ processos }: { processos: { valor: string; rotulo: string }[] }) {
  const [f, setF] = useState({ valor: "", base: "", juros: "", calc: hoje(), honorarios: "", pago: "", custas: "", multa: true, hon523: true });
  const [crit, setCrit] = useState<PeriodoCriterio[]>([{ ate: null, correcao: "INPC", juros: "simples_1_am" }]);
  const s = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <C rotulo="Valor da condenação (R$)">
          <input className={cls} inputMode="decimal" value={f.valor} onChange={s("valor")} />
        </C>
        <C rotulo="Data-base do valor">
          <input type="date" className={cls} value={f.base} onChange={s("base")} />
        </C>
        <C rotulo="Início dos juros (vazio = data-base)">
          <input type="date" className={cls} value={f.juros} onChange={s("juros")} />
        </C>
        <C rotulo="Data do cálculo">
          <input type="date" className={cls} value={f.calc} onChange={s("calc")} />
        </C>
        <C rotulo="Honorários fixados na sentença (%)">
          <input className={cls} inputMode="decimal" value={f.honorarios} onChange={s("honorarios")} placeholder="Ex.: 10" />
        </C>
        <C rotulo="Pagamento parcial no prazo (R$)">
          <input className={cls} inputMode="decimal" value={f.pago} onChange={s("pago")} />
        </C>
        <C rotulo="Custas a ressarcir (R$)">
          <input className={cls} inputMode="decimal" value={f.custas} onChange={s("custas")} />
        </C>
      </div>
      <div className="space-y-1 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.multa} onChange={(e) => setF({ ...f, multa: e.target.checked })} /> Multa de 10% (CPC art. 523 §1º)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.hon523} onChange={(e) => setF({ ...f, hon523: e.target.checked })} /> Honorários de 10% (CPC art. 523 §1º)
        </label>
      </div>
      <EditorCriterios valor={crit} onChange={setCrit} />
      <Rodape
        tipo="cumprimento_sentenca"
        processos={processos}
        entrada={() => ({
          valorCondenacao: num(f.valor),
          dataBase: f.base,
          dataInicioJuros: f.juros || null,
          dataCalculo: f.calc,
          criterios: crit,
          honorariosConhecimentoPct: f.honorarios ? num(f.honorarios) : 0,
          aplicarMulta523: f.multa,
          aplicarHonorarios523: f.hon523,
          pagamentoParcial: f.pago ? num(f.pago) : 0,
          custas: f.custas ? num(f.custas) : 0,
        })}
      />
    </div>
  );
}
