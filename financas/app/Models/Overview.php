<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

/** Contagens usadas pelo guia inicial e pela opção de começar do zero. */
final class Overview extends Model
{
    public function counts(): array
    {
        return $this->fetchOne(
            "SELECT
                (SELECT COUNT(*) FROM categories WHERE active = 1)                                   AS origins,
                (SELECT COUNT(*) FROM expense_categories WHERE active = 1)                           AS expense_categories,
                (SELECT COUNT(*) FROM recurring_bills WHERE kind = 'obrigatoria' AND active = 1)     AS mandatory,
                (SELECT COUNT(*) FROM recurring_bills WHERE kind = 'opcional' AND active = 1)        AS optional,
                (SELECT COUNT(*) FROM transactions WHERE type = 'entrada')                           AS incomes,
                (SELECT COUNT(*) FROM installment_groups WHERE kind = 'parcelado')                   AS installments,
                (SELECT COUNT(*) FROM budgets)                                                       AS budgets,
                (SELECT COUNT(*) FROM transactions WHERE is_daily = 1)                               AS daily,
                (SELECT COUNT(*) FROM transactions)                                                  AS transactions"
        );
    }

    /**
     * Apaga os lançamentos. Opcionalmente também as contas recorrentes e os orçamentos.
     * Contas mantidas voltam a ser lançadas só a partir do mês atual.
     */
    public function reset(bool $bills, bool $budgets, string $currentMonth): void
    {
        $this->db->beginTransaction();
        try {
            $this->execute('DELETE FROM transactions');
            $this->execute('DELETE FROM installment_groups');
            $this->execute('DELETE FROM recurring_generations');
            if ($bills) {
                $this->execute('DELETE FROM recurring_bills');
            } else {
                $this->execute('UPDATE recurring_bills SET start_month = GREATEST(start_month, ?)', [$currentMonth]);
            }
            if ($budgets) {
                $this->execute('DELETE FROM budgets');
            }
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
