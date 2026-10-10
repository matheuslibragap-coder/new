import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Rodape } from "@/components/Rodape";
import { Semaforo } from "@/components/Semaforo";

const PASSOS = [
  {
    titulo: "Envie o conteúdo",
    texto: "Cole a legenda, o roteiro, a bio ou o anúncio. Se preferir, envie a imagem do post.",
  },
  {
    titulo: "Receba o semáforo",
    texto: "Cada trecho é comparado com uma base de regras do Provimento 205/2021 e do Código de Ética e Disciplina.",
  },
  {
    titulo: "Ajuste antes de publicar",
    texto: "Veja o trecho com risco, a explicação e uma sugestão de reescrita pronta para copiar.",
  },
];

export default function Inicio() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <Link href="/entrar" className="btn-secundario min-h-10 px-4 py-2 text-sm">
          Entrar
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="grid gap-8 py-8 md:grid-cols-2 md:items-center md:py-16">
          <div className="space-y-5">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-marca sm:text-4xl">
              Confira se seu post respeita as regras de publicidade da advocacia antes de publicar.
            </h1>
            <p className="text-lg text-stone-600">
              O Juridicont analisa posts, legendas, roteiros de reels, bios e anúncios e indica em verde, amarelo ou
              vermelho o que pode gerar problema ético.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/app/auditoria" className="btn-primario">
                Fazer auditoria gratuita do perfil
              </Link>
              <Link href="/app/checar" className="btn-secundario">
                Checar um post
              </Link>
            </div>
            <p className="text-sm text-stone-500">Plano gratuito: 1 auditoria de perfil e 3 checagens por mês.</p>
          </div>
          <div className="space-y-3">
            <div className="cartao space-y-3">
              <p className="text-sm text-stone-500">Exemplo</p>
              <p className="leading-relaxed">
                <mark className="rounded bg-red-100 px-0.5 text-red-900 underline decoration-red-500 decoration-2">
                  Ganhe sua causa
                </mark>{" "}
                com quem entende de direito do consumidor.
              </p>
              <Semaforo valor="vermelho" />
              <p className="text-sm text-stone-600">
                <strong>Sugestão:</strong> Entenda seus direitos quando uma compra chega com defeito.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-3">
          {PASSOS.map((p, i) => (
            <div key={p.titulo} className="cartao">
              <p className="mb-1 text-sm font-semibold text-stone-400">{i + 1}</p>
              <h2 className="mb-1 font-semibold">{p.titulo}</h2>
              <p className="text-sm text-stone-600">{p.texto}</p>
            </div>
          ))}
        </section>

        <section className="cartao mb-12 space-y-2">
          <h2 className="font-semibold">Como a análise funciona</h2>
          <p className="text-sm text-stone-600">
            A inteligência artificial só aponta riscos que correspondem a regras cadastradas na nossa base. Quando algo
            parece arriscado mas não está catalogado, o resultado é amarelo, com a orientação de revisar com cautela.
            Cada checagem fica salva no seu histórico com a versão das regras usada e pode ser exportada em PDF.
          </p>
          <p className="text-sm text-stone-600">
            O resultado verde significa que não foram identificados riscos pela base de regras. Não é aprovação da OAB
            nem garantia. A responsabilidade pela publicação continua sendo do(a) advogado(a).
          </p>
        </section>
      </main>
      <Rodape />
    </div>
  );
}
