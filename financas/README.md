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

1. **Categorias:**
   - Ajuste o **dia de fechamento** e o **dia de vencimento** de cada cartão. Eles vêm como 1 e 10, de forma provisória.
   - Se quiser lançar entradas (salário, por exemplo) numa conta corrente, crie uma categoria do tipo **conta/carteira**, como "Conta Sicredi". Entradas só podem ir para categorias desse tipo.
2. **Contas obrigatórias e opcionais:** cadastre aluguel, luz, internet, streaming, academia etc.
3. **Orçamentos:** defina um limite mensal para as categorias que você quer controlar.
4. **Lançamentos:** registre as entradas e saídas do dia a dia.
5. **Painel:** acompanhe o saldo do mês, os alertas e os gráficos.

---

## 5. Como o sistema calcula as coisas

### Mês de competência
Todo lançamento tem a **data** (da compra ou do recebimento) e o **mês de competência**, que é o mês em que o valor entra no saldo. Saldos, gráficos, orçamentos e filtros usam sempre a competência.

- **Conta/carteira:** a competência é o mês da data.
- **Cartão de crédito:** a competência é o **mês em que vence a fatura** onde a compra cai.
  - Compra **antes** do dia de fechamento entra na fatura atual. Compra **no dia do fechamento ou depois** entra na seguinte.
  - Se o dia de vencimento é **maior** que o de fechamento, a fatura vence no mesmo mês em que fecha. Exemplo: fecha dia 1, vence dia 10.
  - Se não é, vence no mês seguinte. Exemplo: fecha dia 28, vence dia 5. Uma compra em 10/03 entra na fatura que fecha em 28/03, vence em 05/04 e por isso conta em **abril**.
  - Dia 29, 30 ou 31 num mês que não tem esse dia vira o último dia do mês.
- No formulário, a prévia mostra a competência calculada antes de salvar. Também dá para ajustar o mês à mão.

### Parcelamento (só para saídas no cartão)
- Você informa o **valor total** e o número de parcelas. O sistema cria uma parcela por mês, a partir da competência da compra.
- Os centavos que sobram da divisão ficam na 1ª parcela. Exemplo: R$ 100,00 em 3x vira 33,34 + 33,33 + 33,33.
- Ao editar ou excluir uma parcela, você escolhe: **só esta**, **esta e as próximas** ou **todas**.

### Contas recorrentes
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
