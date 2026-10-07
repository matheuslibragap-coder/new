<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;
use DateTimeImmutable;

final class RecurringBill extends Model
{
    public const KIND_MANDATORY = 'obrigatoria';
    public const KIND_OPTIONAL = 'opcional';

    private const SELECT = 'SELECT b.*, c.name AS category_name, c.color AS category_color,
                                   ec.name AS expense_name, ec.color AS expense_color
                              FROM recurring_bills b
                              JOIN categories c ON c.id = b.category_id
                         LEFT JOIN expense_categories ec ON ec.id = b.expense_category_id';

    public function allOfKind(string $kind): array
    {
        return $this->fetchAll(self::SELECT . ' WHERE b.user_id = ? AND b.kind = ? ORDER BY b.active DESC, b.due_day, b.name', [$this->uid(), $kind]);
    }

    public function find(int $id): ?array
    {
        return $this->fetchOne(self::SELECT . ' WHERE b.id = ? AND b.user_id = ?', [$id, $this->uid()]);
    }

    /** Total mensal das contas ativas de um tipo. */
    public function monthlyTotal(string $kind): float
    {
        return (float) $this->fetchValue(
            'SELECT COALESCE(SUM(amount), 0) FROM recurring_bills WHERE user_id = ? AND kind = ? AND active = 1',
            [$this->uid(), $kind]
        );
    }

    /** Contas ativas com o último mês já gerado (NULL se nunca gerada). */
    public function activeWithLastGeneration(): array
    {
        return $this->fetchAll(
            'SELECT b.*, MAX(g.competence_month) AS last_generated
               FROM recurring_bills b
          LEFT JOIN recurring_generations g ON g.recurring_bill_id = b.id
              WHERE b.user_id = ? AND b.active = 1
           GROUP BY b.id',
            [$this->uid()]
        );
    }

    public function create(array $d): int
    {
        $this->execute(
            'INSERT INTO recurring_bills (user_id, kind, name, amount, due_day, category_id, expense_category_id, start_month, end_month)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$this->uid(), $d['kind'], $d['name'], $d['amount'], $d['due_day'], $d['category_id'], $d['expense_category_id'] ?? null,
             $d['start_month'], $d['end_month'] ?? null]
        );
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $d): void
    {
        $this->execute(
            'UPDATE recurring_bills SET name = ?, amount = ?, due_day = ?, category_id = ?, expense_category_id = ?, end_month = ? WHERE id = ? AND user_id = ?',
            [$d['name'], $d['amount'], $d['due_day'], $d['category_id'], $d['expense_category_id'] ?? null, $d['end_month'] ?? null, $id, $this->uid()]
        );
    }

    public function setActive(int $id, bool $active, ?DateTimeImmutable $startMonth = null): void
    {
        if ($startMonth !== null) {
            $this->execute('UPDATE recurring_bills SET active = ?, start_month = ? WHERE id = ? AND user_id = ?', [(int) $active, $startMonth->format('Y-m-d'), $id, $this->uid()]);
            return;
        }
        $this->execute('UPDATE recurring_bills SET active = ? WHERE id = ? AND user_id = ?', [(int) $active, $id, $this->uid()]);
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM recurring_bills WHERE id = ? AND user_id = ?', [$id, $this->uid()]);
    }

    /** Registra a geração do mês. Retorna false se já tinha sido gerada (proteção contra corrida). */
    public function markGenerated(int $id, DateTimeImmutable $month): bool
    {
        return $this->execute(
            'INSERT IGNORE INTO recurring_generations (recurring_bill_id, competence_month) VALUES (?, ?)',
            [$id, $month->format('Y-m-d')]
        ) === 1;
    }

    /** Apaga os registros de geração a partir de um mês, exceto meses em que a conta já foi paga. */
    public function forgetGenerationsFrom(int $id, DateTimeImmutable $from): void
    {
        $this->execute(
            "DELETE g FROM recurring_generations g
              WHERE g.recurring_bill_id = ? AND g.competence_month >= ?
                AND NOT EXISTS (SELECT 1 FROM transactions t
                                 WHERE t.recurring_bill_id = g.recurring_bill_id
                                   AND t.competence_month = g.competence_month
                                   AND t.status = 'efetivado')",
            [$id, $from->format('Y-m-d')]
        );
    }
}
