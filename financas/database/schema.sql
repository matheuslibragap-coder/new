-- =============================================================
-- Controle Financeiro Pessoal - script de criação do banco
-- Requer MySQL 5.7+ ou MariaDB 10.3+ (InnoDB, utf8mb4)
--
-- Convenções:
--   * Valores monetários em DECIMAL(12,2), sempre positivos;
--     o sinal vem da coluna `type` (entrada/saida).
--   * Mês de competência guardado como DATE no dia 1 (ex.: 2026-04-01),
--     o que permite filtros por intervalo e indexação simples.
--   * O usuário único NÃO é criado aqui: a página de instalação
--     (/install) cria a conta com password_hash e depois se bloqueia.
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

-- -------------------------------------------------------------
-- Usuário (sistema de uso individual: haverá apenas um registro)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(190)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Tentativas de login (bloqueio temporário após 5 falhas)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    ip_address   VARCHAR(45)  NOT NULL,
    attempted_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_login_attempts_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Categorias = etiquetas de origem do gasto (cartão ou conta/carteira)
-- Fechamento e vencimento só se aplicam a cartões.
-- Dias 29-31 em meses mais curtos são tratados como o último dia do mês.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name        VARCHAR(60)      NOT NULL,
    color       CHAR(7)          NOT NULL,
    type        ENUM('cartao','conta') NOT NULL,
    closing_day TINYINT UNSIGNED NULL,
    due_day     TINYINT UNSIGNED NULL,
    active      TINYINT(1)       NOT NULL DEFAULT 1,
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name),
    CONSTRAINT chk_categories_color CHECK (color REGEXP '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT chk_categories_card_days CHECK (
        (type = 'conta'  AND closing_day IS NULL AND due_day IS NULL)
        OR
        (type = 'cartao' AND closing_day IS NOT NULL AND due_day IS NOT NULL
                         AND closing_day BETWEEN 1 AND 31 AND due_day BETWEEN 1 AND 31)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Orçamento: limite mensal fixo por categoria (vale para todos os meses)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
    category_id  INT UNSIGNED  NOT NULL,
    limit_amount DECIMAL(12,2) NOT NULL,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    CONSTRAINT fk_budgets_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE CASCADE,
    CONSTRAINT chk_budgets_limit CHECK (limit_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Contas recorrentes (obrigatórias e opcionais)
-- start_month: primeiro mês (dia 1) a partir do qual a conta é gerada.
-- Excluir uma conta mantém os lançamentos já gerados (FK SET NULL em
-- transactions); a aplicação remove apenas os pendentes do mês atual em diante.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_bills (
    id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    kind        ENUM('obrigatoria','opcional') NOT NULL,
    name        VARCHAR(100)     NOT NULL,
    amount      DECIMAL(12,2)    NOT NULL,
    due_day     TINYINT UNSIGNED NOT NULL,
    category_id INT UNSIGNED     NOT NULL,
    active      TINYINT(1)       NOT NULL DEFAULT 1,
    start_month DATE             NOT NULL,
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_recurring_kind_active (kind, active),
    CONSTRAINT fk_recurring_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT chk_recurring_amount  CHECK (amount > 0),
    CONSTRAINT chk_recurring_due_day CHECK (due_day BETWEEN 1 AND 31)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Registro de geração mensal das recorrentes.
-- Como não há cron em hospedagem compartilhada, os pendentes são gerados
-- sob demanda ao acessar um mês. Esta tabela garante que cada conta seja
-- gerada uma única vez por mês, mesmo que o lançamento seja excluído depois
-- (ex.: "este mês não vou pagar a academia" não faz a conta reaparecer).
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_generations (
    recurring_bill_id INT UNSIGNED NOT NULL,
    competence_month  DATE         NOT NULL,
    generated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recurring_bill_id, competence_month),
    CONSTRAINT fk_generations_bill FOREIGN KEY (recurring_bill_id)
        REFERENCES recurring_bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Grupos de parcelamento: uma compra parcelada gera N lançamentos
-- (um por mês) ligados a este registro.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS installment_groups (
    id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    description       VARCHAR(255)     NOT NULL,
    total_amount      DECIMAL(12,2)    NOT NULL,
    installment_count TINYINT UNSIGNED NOT NULL,
    category_id       INT UNSIGNED     NOT NULL,
    purchase_date     DATE             NOT NULL,
    created_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_installment_groups_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT chk_installment_total CHECK (total_amount > 0),
    CONSTRAINT chk_installment_count CHECK (installment_count BETWEEN 2 AND 72)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Lançamentos
--   transaction_date : data da compra/recebimento; para conta pendente,
--                      data de vencimento; ao pagar, data do pagamento.
--   competence_month : mês (dia 1) em que o valor conta no saldo.
--                      Em cartões, calculado pela regra de fatura
--                      (mês de vencimento da fatura).
--   competence_manual: 1 quando o usuário ajustou a competência à mão.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id                   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    type                 ENUM('entrada','saida')      NOT NULL,
    status               ENUM('efetivado','pendente') NOT NULL DEFAULT 'efetivado',
    amount               DECIMAL(12,2)    NOT NULL,
    category_id          INT UNSIGNED     NOT NULL,
    description          VARCHAR(255)     NOT NULL,
    transaction_date     DATE             NOT NULL,
    competence_month     DATE             NOT NULL,
    competence_manual    TINYINT(1)       NOT NULL DEFAULT 0,
    installment_group_id INT UNSIGNED     NULL,
    installment_number   TINYINT UNSIGNED NULL,
    recurring_bill_id    INT UNSIGNED     NULL,
    created_at           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tx_competence (competence_month, type, status),
    KEY idx_tx_category_competence (category_id, competence_month),
    KEY idx_tx_date (transaction_date),
    KEY idx_tx_installment (installment_group_id, installment_number),
    KEY idx_tx_recurring (recurring_bill_id, competence_month),
    CONSTRAINT fk_tx_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tx_installment_group FOREIGN KEY (installment_group_id)
        REFERENCES installment_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_recurring_bill FOREIGN KEY (recurring_bill_id)
        REFERENCES recurring_bills (id) ON DELETE SET NULL,
    CONSTRAINT chk_tx_amount CHECK (amount > 0),
    -- installment_group_id não pode entrar na CHECK: MySQL 8 proíbe CHECK em
    -- colunas com ação de FK (erro 3823). A coerência grupo/número fica na aplicação.
    CONSTRAINT chk_tx_installment_number CHECK (installment_number IS NULL OR installment_number >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Categorias pré-cadastradas
-- Fechamento/vencimento (1 e 10) são provisórios: ajuste na aba Categorias.
-- -------------------------------------------------------------
INSERT IGNORE INTO categories (name, color, type, closing_day, due_day) VALUES
    ('CC Sicredi',   '#1B5E20', 'cartao', 1,    10),
    ('CC Itaú',      '#EC7000', 'cartao', 1,    10),
    ('CC Inter',     '#C88A00', 'cartao', 1,    10),
    ('CC Nubank M',  '#B388FF', 'cartao', 1,    10),
    ('CC Nubank F',  '#4A148C', 'cartao', 1,    10),
    ('99 Pay',       '#FFD600', 'conta',  NULL, NULL),
    ('Infinite Pay', '#81C784', 'conta',  NULL, NULL),
    ('Renner',       '#D32F2F', 'cartao', 1,    10),
    ('Riachuelo',    '#212121', 'cartao', 1,    10),
    ('CCAM',         '#EC407A', 'cartao', 1,    10);
