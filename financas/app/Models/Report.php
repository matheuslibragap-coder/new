<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;
use DateTimeImmutable;

/** Consultas agregadas do Painel. Tudo por mês de competência. */
final class Report extends Model
{
    /** @return array{income_done: float, income_pending: float, expense_done: float, expense_pending: float} */
    public function monthSummary(DateTimeImmutable $month): array
    {
        $row = $this->fetchOne(
            "SELECT COALESCE(SUM(CASE WHEN type = 'entrada' AND status = 'efetivado' THEN amount END), 0) AS income_done,
                    COALESCE(SUM(CASE WHEN type = 'entrada' AND status = 'pendente'  THEN amount END), 0) AS income_pending,
                    COALESCE(SUM(CASE WHEN type = 'saida'   AND status = 'efetivado' THEN amount END), 0) AS expense_done,
                    COALESCE(SUM(CASE WHEN type = 'saida'   AND status = 'pendente'  THEN amount END), 0) AS expense_pending
               FROM transactions WHERE competence_month = ?",
            [$month->format('Y-m-d')]
        );
        return array_map('floatval', $row);
    }

    /** Saídas do mês por categoria (efetivadas + pendentes), da maior para a menor. */
    public function expensesByCategory(DateTimeImmutable $month): array
    {
        return $this->fetchAll(
            "SELECT c.id, c.name, c.color, SUM(t.amount) AS total
               FROM transactions t JOIN categories c ON c.id = t.category_id
              WHERE t.type = 'saida' AND t.competence_month = ?
           GROUP BY c.id, c.name, c.color
           ORDER BY total DESC",
            [$month->format('Y-m-d')]
        );
    }

    /** Entradas e saídas dos últimos N meses terminando em $last (meses sem movimento entram zerados). */
    public function lastMonths(DateTimeImmutable $last, int $count = 6): array
    {
        $first = $last->modify('-' . ($count - 1) . ' month');
        $rows = $this->fetchAll(
            "SELECT competence_month,
                    COALESCE(SUM(CASE WHEN type = 'entrada' THEN amount END), 0) AS income,
                    COALESCE(SUM(CASE WHEN type = 'saida'   THEN amount END), 0) AS expense
               FROM transactions
              WHERE competence_month BETWEEN ? AND ?
           GROUP BY competence_month",
            [$first->format('Y-m-d'), $last->format('Y-m-d')]
        );
        $byMonth = array_column($rows, null, 'competence_month');

        $series = [];
        for ($i = 0; $i < $count; $i++) {
            $m = $first->modify("+{$i} month");
            $row = $byMonth[$m->format('Y-m-d')] ?? ['income' => 0, 'expense' => 0];
            $series[] = ['month' => $m, 'income' => (float) $row['income'], 'expense' => (float) $row['expense']];
        }
        return $series;
    }

    /** Contas pendentes com vencimento já passado, de qualquer mês. */
    public function overdue(DateTimeImmutable $today): array
    {
        return $this->fetchAll(
            "SELECT t.id, t.description, t.amount, t.transaction_date, t.competence_month, c.name AS category_name, c.color AS category_color
               FROM transactions t JOIN categories c ON c.id = t.category_id
              WHERE t.status = 'pendente' AND t.transaction_date < ?
           ORDER BY t.transaction_date",
            [$today->format('Y-m-d')]
        );
    }

    /** Pendentes do mês ainda dentro do prazo. */
    public function upcoming(DateTimeImmutable $month, DateTimeImmutable $today): array
    {
        return $this->fetchAll(
            "SELECT t.id, t.description, t.amount, t.transaction_date, c.name AS category_name, c.color AS category_color
               FROM transactions t JOIN categories c ON c.id = t.category_id
              WHERE t.status = 'pendente' AND t.competence_month = ? AND t.transaction_date >= ?
           ORDER BY t.transaction_date
              LIMIT 8",
            [$month->format('Y-m-d'), $today->format('Y-m-d')]
        );
    }
}
