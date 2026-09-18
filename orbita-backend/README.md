# Órbita — Backend (Fase 1)

Backend da Fase 1 da Órbita: núcleo de organização de tempo e rotina de estudo.
Stack: **NestJS + TypeScript + PostgreSQL (Prisma)**, com IA (Anthropic Claude) aplicada
apenas à *organização* da agenda — não a conteúdo de estudo.

## Funcionalidades cobertas

- **Auth**: registro/login com JWT.
- **Agenda estilo CRM** (`/events`): compromissos, rotina e blocos de estudo em uma
  visão única, filtrável por período e por tipo.
- **Bloqueio de tempo sugerido por IA** (`/scheduling`):
  - `POST /scheduling/free-slots`: calcula os intervalos livres reais na agenda do
    usuário, dentro do horário útil configurado.
  - `POST /scheduling/suggest-study-blocks`: distribui blocos de estudo nesses
    intervalos livres, respeitando metas semanais por matéria. Usa a API da
    Anthropic (Claude) quando `ANTHROPIC_API_KEY` está configurada; caso
    contrário, cai automaticamente em uma distribuição determinística
    proporcional às metas.
  - `POST /scheduling/accept`: revalida os blocos sugeridos contra a agenda atual
    e os persiste como eventos `STUDY_BLOCK`.
- **Editor de notas rico** (`/notes`): blocos de título, parágrafo (com negrito/
  itálico/sublinhado) e listas; exportação em `GET /notes/:id/export/pdf` e
  `GET /notes/:id/export/docx`.
- **Modo foco** (`/focus-sessions`): start/pause/resume/complete/abandon de
  sessões de cronômetro vinculadas (opcionalmente) a um bloco da agenda, com
  comparação automática entre tempo planejado e tempo real estudado
  (`actualDurationSec` / `varianceSec`).

Todas as rotas (exceto `/auth/*`) exigem `Authorization: Bearer <token>`.

## Modelo de dados

Ver `prisma/schema.prisma`. Entidades principais: `User`, `Event` (agenda),
`Note` (conteúdo rico em blocos JSON), `FocusSession`.

## Rodando localmente

```bash
cp .env.example .env
# edite DATABASE_URL, JWT_SECRET e (opcional) ANTHROPIC_API_KEY

docker compose up -d db     # sobe apenas o Postgres
npm install
npm run prisma:migrate      # cria as tabelas
npm run start:dev
```

Sem `ANTHROPIC_API_KEY`, o endpoint de sugestão de blocos continua funcional,
usando o fallback determinístico — útil para desenvolvimento e para não travar
o MVP na dependência de uma chave de IA.

## Rodando com Docker (API + banco)

```bash
cp .env.example .env
docker compose up --build
```

## Scripts úteis

- `npm run start:dev` — API em modo watch.
- `npm run prisma:studio` — inspecionar o banco visualmente.
- `npm run build` / `npm run start:prod` — build e execução de produção.
- `npm run lint` / `npm test` — qualidade de código.

## Próximos passos (Fase 2, fora deste escopo)

Extração de prazos a partir de documentos, rebalanceamento automático do plano
e assistente de IA sobre as notas do usuário — ver escopo do produto.
