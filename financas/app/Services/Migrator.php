<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use PDO;
use PDOException;

/**
 * Atualiza o banco automaticamente para a versão do código.
 * database/schema.sql é a versão 1; cada método migrateN() leva à versão N.
 * As alterações conferem o estado atual antes de agir, para que uma migração
 * interrompida no meio possa ser executada de novo sem erro.
 */
final class Migrator
{
    public const LATEST = 2;

    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function migrate(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (
                version    INT UNSIGNED NOT NULL,
                applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (version)
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $current = max(1, (int) $this->db->query('SELECT MAX(version) FROM schema_migrations')->fetchColumn());

        for ($version = $current + 1; $version <= self::LATEST; $version++) {
            $this->{'migrate' . $version}();
            $this->db->prepare('INSERT IGNORE INTO schema_migrations (version) VALUES (?)')->execute([$version]);
        }
    }

    /** Controle diário, categorias de gasto, tipos de lançamento e guia inicial. */
    private function migrate2(): void
    {
        $this->db->exec(
            "CREATE TABLE IF NOT EXISTS settings (
                name       VARCHAR(64) NOT NULL,
                value      TEXT        NULL,
                updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (name)
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );

        $this->db->exec(
            "CREATE TABLE IF NOT EXISTS expense_categories (
                id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
                name       VARCHAR(60)  NOT NULL,
                color      CHAR(7)      NOT NULL,
                active     TINYINT(1)   NOT NULL DEFAULT 1,
                created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_expense_categories_name (name)
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $this->db->exec(
            "INSERT IGNORE INTO expense_categories (name, color) VALUES
                ('Alimentação', '#E8590C'),
                ('Lazer',       '#7048E8'),
                ('Esportes',    '#2F9E44'),
                ('Transporte',  '#1971C2')"
        );

        if (!$this->columnExists('transactions', 'expense_category_id')) {
            $this->db->exec(
                "ALTER TABLE transactions
                    ADD COLUMN expense_category_id INT UNSIGNED NULL AFTER category_id,
                    ADD COLUMN payment_method ENUM('debito','dinheiro','pix','credito') NULL AFTER expense_category_id,
                    ADD COLUMN is_daily TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_method,
                    ADD KEY idx_tx_expense_category (expense_category_id, competence_month),
                    ADD KEY idx_tx_daily (is_daily, competence_month),
                    ADD CONSTRAINT fk_tx_expense_category FOREIGN KEY (expense_category_id)
                        REFERENCES expense_categories (id) ON DELETE SET NULL"
            );
        }

        if (!$this->columnExists('installment_groups', 'kind')) {
            $this->db->exec(
                "ALTER TABLE installment_groups
                    ADD COLUMN kind ENUM('parcelado','recorrente') NOT NULL DEFAULT 'parcelado' AFTER id"
            );
        }
        // Recorrentes podem ter de 1 a 240 meses; a regra antiga (2 a 72) passa a ficar na aplicação.
        $this->dropCheck('installment_groups', 'chk_installment_count');

        if (!$this->columnExists('recurring_bills', 'expense_category_id')) {
            $this->db->exec(
                "ALTER TABLE recurring_bills
                    ADD COLUMN expense_category_id INT UNSIGNED NULL AFTER category_id,
                    ADD COLUMN end_month DATE NULL AFTER start_month,
                    ADD CONSTRAINT fk_recurring_expense_category FOREIGN KEY (expense_category_id)
                        REFERENCES expense_categories (id) ON DELETE SET NULL"
            );
        }

        // Dias de fechamento/vencimento viram opcionais (servem só para sugerir o mês da fatura).
        $this->dropCheck('categories', 'chk_categories_card_days');
    }

    private function columnExists(string $table, string $column): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * Remove uma CHECK. A sintaxe muda entre MariaDB (DROP CONSTRAINT) e
     * MySQL 8.0.16+ (DROP CHECK); o MySQL 5.7 nem guarda CHECKs.
     */
    private function dropCheck(string $table, string $name): void
    {
        foreach (["ALTER TABLE {$table} DROP CONSTRAINT {$name}", "ALTER TABLE {$table} DROP CHECK {$name}"] as $sql) {
            try {
                $this->db->exec($sql);
                return;
            } catch (PDOException) {
                // tenta a próxima sintaxe; se nenhuma servir, a CHECK não existe
            }
        }
    }
}
