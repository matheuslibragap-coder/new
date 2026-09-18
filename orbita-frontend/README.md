# Orbyta — Frontend (Fase 1)

Frontend real da Fase 1 da Orbyta, conectado ao `orbita-backend`. Next.js (App
Router) + TypeScript, sem framework de CSS — os tokens de design (azul
marinho escuro, cartões pretos com borda dourada, tipografia arredondada
Fredoka + Nunito) ficam em `app/globals.css`, seguindo a direção visual já
validada no protótipo.

## Telas

- `/login` — entrar ou criar conta (conectado a `POST /auth/login` e `/auth/register`).
- `/agenda` — agenda do dia (via `GET /events`), horários livres e bloqueio de
  tempo sugerido por IA (`/scheduling/suggest-study-blocks` → `/scheduling/accept`).
- `/notes` — CRUD de notas com editor em blocos (título, parágrafo com
  negrito/itálico/sublinhado, listas) e exportação real em PDF/DOCX.
- `/focus` — modo foco com cronômetro real (start/pause/resume/complete via
  `/focus-sessions`), comparando tempo planejado x real, com histórico das
  últimas sessões.

## Rodando localmente

O backend (`orbita-backend`) precisa estar rodando antes (ver o README dele).
Como os dois projetos usam a porta 3000 por padrão, este frontend sobe na
**3001**.

```bash
cd orbita-frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:3001
```

Se o backend estiver em outra URL, ajuste `NEXT_PUBLIC_API_URL` no `.env`.

## Próximos passos

Esta é a base navegável da Fase 1. Itens não cobertos ainda: paginação/edição
de compromissos e rotina diretamente pela agenda (hoje só a IA cria eventos
pela UI), visão semanal do calendário, e os recursos de Fase 2 (extração de
prazos de documentos, rebalanceamento automático, assistente sobre as notas).
