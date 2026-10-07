<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

/** Contagens do guia inicial e a opção de começar do zero, sempre só do usuário logado. */
final class Overview extends Model
{
    public function counts(): array
    {
        $u = $this->uid();
        return $this->fetchOne(
            "SELECT
                (SELECT COUNT(*) FROM categories WHERE user_id = ? AND active = 1)                               AS origins,
                (SELECT COUNT(*) FROM expense_categories WHERE user_id = ? AND active = 1)                       AS expense_categories,
                (SELECT COUNT(*) FROM recurring_bills WHERE user_id = ? AND kind = 'obrigatoria' AND active = 1) AS mandatory,
                (SELECT COUNT(*) FROM recurring_bills WHERE user_id = ? AND kind = 'opcional' AND active = 1)    AS optional,
                (SELECT COUNT(*) FROM transactions WHERE user_id = ? AND type = 'entrada')                       AS incomes,
                (SELECT COUNT(*) FROM installment_groups WHERE user_id = ? AND kind = 'parcelado')               AS installments,
                (SELECT COUNT(*) FROM budgets b JOIN categories c ON c.id = b.category_id WHERE c.user_id = ?)   AS budgets,
                (SELECT COUNT(*) FROM transactions WHERE user_id = ? AND is_daily = 1)                           AS daily,
                (SELECT COUNT(*) FROM transactions WHERE user_id = ?)                                            AS transactions",
            [$u, $u, $u, $u, $u, $u, $u, $u, $u]
        );
    }

    /**
     * Apaga os lançamentos do usuário logado. Opcionalmente também as contas
     * recorrentes e os orçamentos dele. Contas mantidas voltam a ser lançadas
     * só a partir do mês atual.
     */
    public function reset(bool $bills, bool $budgets, string $currentMonth): void
    {
        $u = $this->uid();
        $this->db->beginTransaction();
        try {
            $this->execute('DELETE FROM transactions WHERE user_id = ?', [$u]);
            $this->execute('DELETE FROM installment_groups WHERE user_id = ?', [$u]);
            $this->execute(
                'DELETE g FROM recurring_generations g JOIN recurring_bills r ON r.id = g.recurring_bill_id WHERE r.user_id = ?',
                [$u]
            );
            if ($bills) {
                $this->execute('DELETE FROM recurring_bills WHERE user_id = ?', [$u]);
            } else {
                $this->execute('UPDATE recurring_bills SET start_month = GREATEST(start_month, ?) WHERE user_id = ?', [$currentMonth, $u]);
            }
            if ($budgets) {
                $this->execute('DELETE b FROM budgets b JOIN categories c ON c.id = b.category_id WHERE c.user_id = ?', [$u]);
            }
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
