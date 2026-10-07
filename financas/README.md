# Finanças: controle financeiro pessoal

Sistema web de controle financeiro de uso individual: um único usuário com login. Funciona no navegador do computador e do celular.

- PHP 8.1+ puro, sem framework, organizado em MVC simples
- Banco MySQL ou MariaDB, acessado com PDO e *prepared statements*
- HTML, CSS e JavaScript puros, com gráficos em Chart.js (carregado por CDN)
- Feito para hospedagem compartilhada comum (Apache + PHP + MySQL)

---

## Sumário

1. [Requisitos](#1-requisitos)
2. [Instalação em hospedagem compartilhada](#2-instalação-em-hospedagem-compartilhada)
3. [Usar no celular como app](#3-usar-no-celular-como-app)
4. [Primeiros passos no sistema](#4-primeiros-passos-no-sistema)
5. [Como o sistema calcula as coisas](#5-como-o-sistema-calcula-as-coisas)
6. [Backup, atualização e senha esquecida](#6-backup-atualização-e-senha-esquecida)
7. [Problemas comuns](#7-problemas-comuns)
8. [Estrutura do projeto](#8-estrutura-do-projeto)
9. [Segurança](#9-segurança)
10. [Desenvolvimento local e testes](#10-desenvolvimento-local-e-testes)

---

## 1. Requisitos

| Item | Mínimo |
|---|---|
| PHP | **8.1** ou superior, com as extensões `pdo_mysql` e `mbstring` (quase todas as hospedagens já trazem) |
| Banco de dados | MySQL 5.7+ ou MariaDB 10.3+ |
| Servidor web | Apache com `mod_rewrite` e `.htaccess` liberado (padrão em hospedagem compartilhada) |
| HTTPS | Recomendado. A maioria das hospedagens oferece SSL grátis (Let's Encrypt) |

No painel da hospedagem (cPanel, hPanel ou similar), confira a versão do PHP em **"Selecionar versão do PHP"** ou **"Configuração do PHP"** e escolha 8.1 ou mais nova.

---

## 2. Instalação em hospedagem compartilhada

Os nomes dos menus abaixo são os do cPanel. Em outros painéis os nomes mudam um pouco, mas os passos são os mesmos.

### Passo 1: criar o banco de dados

1. No painel, abra **Bancos de dados MySQL**.
2. Crie um banco, por exemplo `seuusuario_financas`.
3. Crie um usuário com uma senha forte.
4. **Adicione o usuário ao banco** com **todos os privilégios**.
5. Anote quatro dados: **host** (quase sempre `localhost`), **nome do banco**, **usuário** e **senha**.

> Algumas hospedagens usam um host diferente de `localhost`, como `mysql.seudominio.com.br`. Ele aparece na mesma tela do MySQL.

### Passo 2: enviar os arquivos

Envie o conteúdo da pasta `financas/` pelo **Gerenciador de arquivos** do painel (dá para enviar um `.zip` e extrair lá) ou por FTP. Escolha **uma** das opções:

**Opção A (recomendada): um subdomínio apontando para `public/`**

1. Envie a pasta para fora do `public_html`, por exemplo em `/home/seuusuario/financas/`.
2. No painel, crie um subdomínio, por exemplo `financas.seudominio.com.br`.
3. Em **Raiz do documento** (*Document Root*), coloque `/home/seuusuario/financas/public`.

Assim, só a pasta `public/` fica acessível pela internet.

**Opção B: dentro do `public_html`**

1. Envie a pasta para `public_html/financas/`.
2. O sistema fica em `seudominio.com.br/financas`.

O arquivo `.htaccess` incluído redireciona tudo para `public/` e bloqueia o acesso direto às pastas `app/` e `database/` e ao `config.php`. Não apague os arquivos `.htaccess`. Eles começam com ponto, então ative "mostrar arquivos ocultos" no gerenciador de arquivos se precisar vê-los.

### Passo 3: configurar

1. Dentro de `app/config/`, copie `config.example.php` com o nome **`config.php`**.
2. Edite o `config.php` e preencha os dados do banco:

```php
'db' => [
    'host'    => 'localhost',
    'port'    => 3306,
    'name'    => 'seuusuario_financas',
    'user'    => 'seuusuario_fin',
    'pass'    => 'a senha do usuário do banco',
    'charset' => 'utf8mb4',
],
```

Deixe `'debug' => false` em produção.

### Passo 4: instalar pelo navegador

1. Acesse o endereço do sistema. Na primeira vez, ele abre a tela de **Instalação**.
2. Informe seu nome, e-mail e senha (mínimo de 8 caracteres).
3. Clique em **Instalar**. O sistema:
   - cria todas as tabelas;
   - cadastra as 10 categorias padrão, com as cores;
   - cria o seu login e já entra no sistema.

Depois disso, a tela de instalação fica bloqueada.

> **Alternativa manual:** importe `database/schema.sql` pelo **phpMyAdmin** (aba *Importar*). Depois abra o sistema: a tela de instalação vai aparecer só para criar o login.

### Passo 5: ativar HTTPS

1. No painel, ative o **SSL/TLS** gratuito (AutoSSL ou Let's Encrypt) para o domínio ou subdomínio.
2. Para forçar HTTPS, coloque estas linhas no **início** de `public/.htaccess`, logo depois de `RewriteEngine On`:

```apache
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

Com HTTPS ativo, o cookie de sessão passa a ser enviado só por conexão segura, automaticamente.

---

## 3. Usar no celular como app

O sistema já é responsivo. No celular, o menu lateral abre pelo botão ☰. Para ter um ícone na tela inicial, que abre em tela cheia como um app:

- **Android (Chrome):** abra o sistema, toque em **⋮** e depois em **Adicionar à tela inicial** (ou **Instalar app**).
- **iPhone (Safari):** abra o sistema, toque em **Compartilhar** (o quadrado com seta) e depois em **Adicionar à Tela de Início**.

O mesmo login funciona no computador e no celular, e os dados ficam no banco, sempre sincronizados.

---

## 4. Primeiros passos no sistema

Na primeira vez que você entra, o sistema abre o **Guia inicial**, com os passos na ordem certa e um botão para cada aba:

1. Conferir **Contas e cartões** (as origens do dinheiro).
2. Conferir as **categorias de gasto**.
3. Cadastrar as **contas obrigatórias** (aluguel, luz…).
4. Cadastrar **assinaturas e contas opcionais**, escolhendo em qual cartão cada uma é cobrada.
5. Lançar as **entradas** (salário como recorrente).
6. Lançar as **compras parceladas** que ainda estão correndo.
7. Definir **orçamentos** (opcional).
8. Usar o **Controle diário** no dia a dia.

Cada passo mostra quantos itens já estão cadastrados. Enquanto você não clicar em "Concluir guia", ele abre no lugar do Painel. Depois continua disponível no menu, em **Guia inicial**.

O guia também tem a opção **"Começar do zero"**, que apaga todos os lançamentos. Opcionalmente, apaga também as contas recorrentes e os orçamentos. Para confirmar, é preciso digitar APAGAR.

---

### Mais de um usuário (cada um com seus dados)
O sistema aceita várias pessoas, e cada uma tem **dados totalmente separados**: lançamentos, contas e cartões, categorias de gasto, contas fixas, orçamentos e guia. Uma pessoa não vê nada da outra, nem trocando o número de um lançamento no endereço.

- O **primeiro usuário cadastrado é o dono**. Só ele vê a aba **Usuários**, onde pode criar contas para outras pessoas, definir uma nova senha para elas ou excluí-las. Excluir um usuário apaga também todos os dados dele.
- **Uma conta nova começa vazia**, sem contas, cartões ou categorias. A pessoa cadastra tudo do jeito dela, seguindo o guia inicial.
- Cada pessoa troca o próprio nome, e-mail e senha em **Minha conta** (clicando no nome, no rodapé do menu).
- A redefinição de senha pelo `reset_token` vale só para o dono. As senhas dos outros usuários o dono redefine na aba Usuários.

---

## 5. Como o sistema calcula as coisas

### Como lançar
Todo lançamento pergunta **de qual conta ou cartão o dinheiro saiu** (ou em qual entrou). Essas origens são cadastradas por você na aba **Contas e cartões**. A **categoria do gasto** (Alimentação, Lazer…) é opcional em Lançamentos e obrigatória no Controle diário.

Há três jeitos de lançar:

- **Único (à vista):** você escolhe como pagou: débito, dinheiro, Pix ou **crédito 1x**. No débito, dinheiro e Pix, o gasto conta no mês da data. No crédito 1x, o sistema pergunta **em qual mês cai na fatura**. Se o cartão tiver fechamento e vencimento cadastrados, ele já sugere o mês certo; senão, sugere o mês seguinte. Você sempre pode trocar.
- **Recorrente:** o mesmo valor todo mês. Você informa o mês da primeira cobrança e **por quantos meses** ele se repete, ou marca "Sem data para acabar" para lançar até dezembro de 2040 (bom para o salário). Entradas também podem ser recorrentes.
- **Parcelado (só saídas):** você informa o **valor total da compra** (com juros, se houver), o **número de parcelas** e o **mês da 1ª parcela**. Os centavos que sobram da divisão ficam na 1ª parcela. Exemplo: R$ 100,00 em 3x vira 33,34 + 33,33 + 33,33.

Antes de salvar, o formulário mostra um resumo do que vai ser lançado, por exemplo "10x de R$ 120,00, de Novembro/2026 a Agosto/2027".

Ao editar ou excluir um lançamento recorrente ou uma parcela, você escolhe: **só este**, **este e os próximos** ou **todos**. Mudar o mês de um deles faz os outros do grupo escolhido andarem junto.

Os seletores de mês vão de 2020 até **dezembro de 2040**.

### Pago ou a pagar
- Quando a data de um lançamento é **posterior a hoje** (ou, nos recorrentes e parcelados, quando há meses futuros), o formulário pergunta **"Já está pago?"** (nas entradas, **"Já recebeu?"**). A resposta é obrigatória.
- **Recorrentes e parcelados:** cada mês vence no **mesmo dia** da data informada (por exemplo, 25/10, 25/11, 25/12…). Se a resposta for "Não", os meses com data anterior a hoje entram como pagos e os demais ficam a pagar.
- Na lista de Lançamentos e no Histórico, a coluna **"Pago"** tem uma caixinha em cada linha. Ao marcar, o valor passa a contar no saldo atual. Ao desmarcar, volta para "a pagar". Nas contas obrigatórias e opcionais, marcar registra a data de hoje como data do pagamento.
- O que passa da data sem estar pago aparece em **vermelho**, com a etiqueta **"Vencido"**, e entra no alerta do Painel.
- O resumo de Lançamentos mostra as entradas recebidas, as saídas pagas, o total a pagar (destacando o que está vencido), o saldo atual (só o que foi pago e recebido) e o saldo previsto.

### Controle diário
Aba para os gastos do dia a dia, como um energético de R$ 12. Você informa valor, o que foi, a **categoria do gasto**, de qual conta ou cartão saiu e como pagou. A aba mostra o total do mês, o total de hoje, a média por dia, os gastos por categoria e a lista agrupada por dia.

As categorias de gasto (Alimentação, Lazer, Esportes e Transporte já vêm cadastradas) são criadas, editadas e desativadas em **Controle diário → Gerenciar categorias**.

Esses gastos também entram no saldo, no Painel e no Histórico. Um gasto no crédito conta no mês da fatura, mas aparece no Controle diário no dia da compra.

### Contas obrigatórias e opcionais
- Cada conta tem o campo **em qual cartão ou conta é cobrada** (por exemplo, o YT Premium no CC Nubank M), uma categoria de gasto opcional e, também opcional, um **último mês**. Sem último mês, ela continua sendo lançada até você desativar.
- Todo mês, cada conta ativa vira um lançamento **pendente**. Isso acontece quando você abre o sistema, porque hospedagem compartilhada normalmente não tem agendador de tarefas. Ao navegar para um mês futuro, as contas são geradas até ele.
- **Marcar como paga** transforma a conta em lançamento efetivado. Dá para pagar com outro valor ou outra data, e também desfazer o pagamento.
- Pendente com vencimento já passado aparece como **atrasada**, e o Painel mostra um alerta.
- **Editar uma conta** muda só os pendentes do mês atual em diante. O que já foi pago não muda.
- **Desativar ou excluir uma conta** mantém tudo que já foi pago e as atrasadas, e remove só os pendentes do mês atual em diante.
- Se você apagar a conta de um mês específico, ela não volta a ser gerada naquele mês.

### Saldo atual e saldo previsto
- **Saldo atual** = entradas efetivadas − saídas efetivadas do mês.
- **Saldo previsto** = saldo atual − contas pendentes do mês.
- O saldo é do **mês**: não soma sobras de meses anteriores.

### Orçamentos
- O limite é mensal e vale para todos os meses. O gasto considerado soma as saídas efetivadas e as pendentes da competência.
- A barra fica **verde até 80%**, **amarela acima de 80% até 100%** e **vermelha acima de 100%**.
- O Painel avisa quando uma categoria passa de 80%. O formulário de lançamento avisa **antes de salvar** se a saída vai passar do limite, e avisa de novo depois de salvar, mês a mês, no caso de um parcelamento.

---

## 6. Backup, atualização e senha esquecida

### Backup
- **Banco completo:** no phpMyAdmin, selecione o banco, abra a aba **Exportar** e clique em **Executar**. Guarde o arquivo `.sql`. Muitas hospedagens também fazem backup automático.
- **Planilha:** a aba **Histórico** tem o botão **Exportar CSV**, que abre no Excel com acentos e valores no formato brasileiro e respeita os filtros aplicados.

### Atualizar para uma versão nova
1. Faça backup do banco.
2. Envie os arquivos novos por cima dos antigos, **sem apagar o `app/config/config.php`**.
3. Abra o sistema. Ele **atualiza o banco sozinho** (cria as tabelas e colunas novas) sem apagar seus dados nem o seu login. As versões já aplicadas ficam registradas na tabela `schema_migrations`.

### Esqueci a senha
1. No `app/config/config.php`, coloque em `reset_token` um texto aleatório com 32 caracteres ou mais. Exemplo: `'reset_token' => 'troque-isto-por-um-texto-bem-longo-e-aleatorio-123',`
2. Acesse `seudominio.com.br/redefinir-senha?token=O_MESMO_TEXTO`. Se instalou na opção B, o endereço é `seudominio.com.br/financas/redefinir-senha?token=...`.
3. Defina a nova senha.
4. **Apague o `reset_token`** do `config.php` (deixe `''`). Enquanto ele estiver vazio, a página de redefinição fica desativada.

---

## 7. Problemas comuns

| Sintoma | O que fazer |
|---|---|
| "Configuração ausente" | Faltou criar o `app/config/config.php` (passo 3). |
| "Não foi possível conectar ao banco" | Confira host, nome do banco, usuário e senha. Confira também se o usuário foi **adicionado ao banco** com privilégios. Algumas hospedagens não usam `localhost` como host. |
| Erro 500 logo ao abrir | Confira se o PHP é 8.1+. Se o erro continuar, coloque `'debug' => true` no `config.php` para ver a mensagem. **Volte para `false` depois.** |
| Páginas internas dão "Não encontrado" (404) do servidor | O `.htaccess` não está sendo lido ou o `mod_rewrite` está desligado. Confira se os arquivos `.htaccess` foram enviados (são ocultos) e fale com o suporte da hospedagem. |
| Links ou estilos quebrados (página sem formatação) | Preencha `base_url` no `config.php` com o caminho onde o sistema está, por exemplo `'/financas'`. |
| "Sessão expirada" ao enviar um formulário | O formulário ficou aberto por muito tempo. Recarregue a página e envie de novo. O tempo de inatividade é configurado em `session_idle_minutes`. |
| "Muitas tentativas incorretas" | O login trava por 15 minutos depois de 5 senhas erradas. Espere e tente de novo. |
| Gráficos não aparecem | O Chart.js vem de `cdn.jsdelivr.net`. Confira a conexão ou se alguma extensão do navegador bloqueia esse endereço. Os números continuam aparecendo nos cartões e em "Ver em tabela". |

---

## 8. Estrutura do projeto

```
financas/
├── .htaccess                # usado quando a raiz do site não aponta para public/
├── public/                  # ÚNICA pasta acessível pela internet
│   ├── index.php            # ponto de entrada e definição das rotas
│   ├── .htaccess            # endereços sem "index.php"
│   ├── manifest.webmanifest # ícone e nome ao instalar no celular
│   └── assets/              # css, js e ícones
├── app/
│   ├── bootstrap.php        # autoload, configuração, sessão, tratamento de erros
│   ├── config/              # config.example.php → copie para config.php
│   ├── Core/                # Router, Database (PDO), View, Session, Csrf, Auth, Request
│   ├── Controllers/         # uma classe por aba
│   ├── Models/              # acesso ao banco (todas as consultas com prepared statements)
│   ├── Services/            # regras de negócio
│   │   ├── CompetenceCalculator.php  # regra de fatura do cartão
│   │   ├── InstallmentSplitter.php   # divisão em parcelas
│   │   ├── TransactionService.php    # criar/editar/excluir lançamentos e parcelas
│   │   ├── RecurringService.php      # geração mensal e pagamento das contas
│   │   ├── Migrator.php              # atualiza o banco automaticamente entre versões (v3: multiusuário)
│   │   └── SchemaInstaller.php       # cria as tabelas na instalação
│   ├── Helpers/format.php   # R$ 1.234,56, dd/mm/aaaa, meses em português
│   └── Views/               # telas (layout + uma pasta por aba)
├── database/schema.sql      # script de criação do banco
└── tests/run.php            # testes das regras de negócio
```

---

## 9. Segurança

- **Senha:** guardada com `password_hash`, com troca automática do hash quando o PHP passar a usar um algoritmo mais forte.
- **Login:**
  - bloqueio por 15 minutos depois de 5 tentativas erradas;
  - tempo de resposta igual para e-mail existente ou não, para não revelar quais e-mails estão cadastrados.
- **Sessão:**
  - o cookie é `HttpOnly` e `SameSite=Lax`, e vira `Secure` sob HTTPS;
  - um ID de sessão novo é gerado no login;
  - a sessão expira depois de um tempo sem uso.
- **Formulários e banco:** todos os formulários têm proteção **CSRF**. Todas as consultas usam **PDO com *prepared statements***.
- **Telas e arquivos:**
  - todo texto exibido passa por escape, o que evita XSS;
  - o CSV exportado é protegido contra textos que o Excel interpretaria como fórmula.
- **Separação entre usuários:** toda consulta ao banco filtra pelo usuário logado, inclusive buscas por número de registro.
- **Acesso aos arquivos:** só `public/` é servida. `app/`, `database/` e `config.php` ficam bloqueados por `.htaccess`.
- **Navegador:**
  - cabeçalhos `X-Frame-Options`, `X-Content-Type-Options` e `Referrer-Policy`;
  - o Chart.js é carregado com verificação de integridade (SRI).

---

## 10. Desenvolvimento local e testes

Com PHP e MySQL instalados no computador:

```bash
cp app/config/config.example.php app/config/config.php   # e preencha o banco
php -S localhost:8000 -t public public/index.php
```

Depois acesse `http://localhost:8000`.

Testes das regras de negócio (competência pela fatura, parcelas, formatação):

```bash
php tests/run.php
```
