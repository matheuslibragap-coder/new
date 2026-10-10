import type { PostGerado } from "@/lib/ia/gerador";
import { BotaoCopiar } from "@/components/BotaoCopiar";

function textoCompleto(p: PostGerado) {
  const partes: string[] = [];
  p.slides.forEach((s, i) => partes.push(`Slide ${i + 1}: ${s.titulo}\n${s.texto}`));
  p.roteiro_reels.forEach((c, i) => partes.push(`Cena ${i + 1}: ${c.cena}\nFala: ${c.fala}\nTexto na tela: ${c.texto_na_tela}`));
  if (p.legenda) partes.push(p.legenda);
  return partes.join("\n\n");
}

export function PostView({ post }: { post: PostGerado }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{post.titulo}</h2>
      {post.slides.length > 0 && (
        <ol className="flex snap-x gap-3 overflow-x-auto pb-2">
          {post.slides.map((s, i) => (
            <li key={i} className="cartao w-64 shrink-0 snap-start space-y-1">
              <p className="text-xs font-semibold text-stone-400">Slide {i + 1}</p>
              <p className="font-semibold">{s.titulo}</p>
              <p className="whitespace-pre-wrap text-sm">{s.texto}</p>
            </li>
          ))}
        </ol>
      )}
      {post.roteiro_reels.length > 0 && (
        <ol className="space-y-2">
          {post.roteiro_reels.map((c, i) => (
            <li key={i} className="cartao space-y-1 text-sm">
              <p className="text-xs font-semibold text-stone-400">Cena {i + 1}</p>
              <p><span className="font-semibold">Cena: </span>{c.cena}</p>
              <p><span className="font-semibold">Fala: </span>{c.fala}</p>
              <p><span className="font-semibold">Texto na tela: </span>{c.texto_na_tela}</p>
            </li>
          ))}
        </ol>
      )}
      {post.legenda && (
        <div className="cartao space-y-2">
          <p className="text-xs font-semibold uppercase text-stone-400">Legenda</p>
          <p className="whitespace-pre-wrap">{post.legenda}</p>
          <BotaoCopiar texto={post.legenda} rotulo="Copiar legenda" />
        </div>
      )}
      <BotaoCopiar texto={textoCompleto(post)} rotulo="Copiar tudo" />
    </div>
  );
}
