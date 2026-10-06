<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;
use DateTimeImmutable;

final class Transaction extends Model
{
    public const TYPE_IN = 'entrada';
    public const TYPE_OUT = 'saida';
    public const STATUS_DONE = 'efetivado';
    public const STATUS_PENDING = 'pendente';

    private const SELECT = 'SELECT t.*, c.name AS category_name, c.color AS category_color, c.type AS category_type,
                                   g.installment_count, g.description AS group_description
                              FROM transactions t
                              JOIN categories c ON c.id = t.category_id
                         LEFT JOIN installment_groups g ON g.id = t.installment_group_id';

    public function find(int $id): ?array
    {
        return $this->fetchOne(self::SELECT . ' WHERE t.id = ?', [$id]);
    }

    public function create(array $d): int
    {
        $this->execute(
            'INSERT INTO transactions
                (type, status, amount, category_id, description, transaction_date, competence_month,
                 competence_manual, installment_group_id, installment_number, recurring_bill_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $d['type'], $d['status'] ?? self::STATUS_DONE, $d['amount'], $d['category_id'], $d['description'],
                $d['transaction_date'], $d['competence_month'], (int) ($d['competence_manual'] ?? 0),
                $d['installment_group_id'] ?? null, $d['installment_number'] ?? null, $d['recurring_bill_id'] ?? null,
            ]
        );
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $d): void
    {
        $this->execute(
            'UPDATE transactions
                SET type = ?, amount = ?, category_id = ?, description = ?, transaction_date = ?,
                    competence_month = ?, competence_manual = ?
              WHERE id = ?',
            [
                $d['type'], $d['amount'], $d['category_id'], $d['description'], $d['transaction_date'],
                $d['competence_month'], (int) $d['competence_manual'], $id,
            ]
        );
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM transactions WHERE id = ?', [$id]);
    }

    // ---------- Parcelamento ----------

    public function createGroup(string $description, string $total, int $count, int $categoryId, string $purchaseDate): int
    {
        $this->execute(
            'INSERT INTO installment_groups (description, total_amount, installment_count, category_id, purchase_date)
             VALUES (?, ?, ?, ?, ?)',
            [$description, $total, $count, $categoryId, $purchaseDate]
        );
        return (int) $this->db->lastInsertId();
    }

    public function groupParcels(int $groupId): array
    {
        return $this->fetchAll(
            'SELECT * FROM transactions WHERE installment_group_id = ? ORDER BY installment_number',
            [$groupId]
        );
    }

    public function updateGroup(int $groupId, string $description, int $categoryId, string $purchaseDate): void
    {
        $this->execute(
            'UPDATE installment_groups SET description = ?, category_id = ?, purchase_date = ? WHERE id = ?',
            [$description, $categoryId, $purchaseDate, $groupId]
        );
    }

    /** Recalcula o total do grupo pelas parcelas restantes; remove o grupo se ficou vazio. */
    public function syncGroup(int $groupId): void
    {
        $total = $this->fetchValue('SELECT SUM(amount) FROM transactions WHERE installment_group_id = ?', [$groupId]);
        if ($total === null) {
            $this->execute('DELETE FROM installment_groups WHERE id = ?', [$groupId]);
            return;
        }
        $this->execute('UPDATE installment_groups SET total_amount = ? WHERE id = ?', [$total, $groupId]);
    }

    // ---------- Contas recorrentes ----------

    public function pendingOfBillFrom(int $billId, DateTimeImmutable $from): array
    {
        return $this->fetchAll(
            "SELECT * FROM transactions WHERE recurring_bill_id = ? AND status = 'pendente' AND competence_month >= ?",
            [$billId, $from->format('Y-m-d')]
        );
    }

    public function updatePendingFromBill(int $id, array $d): void
    {
        $this->execute(
            "UPDATE transactions SET amount = ?, category_id = ?, description = ?, transaction_date = ?
              WHERE id = ? AND status = 'pendente'",
            [$d['amount'], $d['category_id'], $d['description'], $d['transaction_date'], $id]
        );
    }

    public function deletePendingOfBillFrom(int $billId, DateTimeImmutable $from): void
    {
        $this->execute(
            "DELETE FROM transactions WHERE recurring_bill_id = ? AND status = 'pendente' AND competence_month >= ?",
            [$billId, $from->format('Y-m-d')]
        );
    }

    public function markPaid(int $id, string $amount, string $date): void
    {
        $this->execute(
            "UPDATE transactions SET status = 'efetivado', amount = ?, transaction_date = ? WHERE id = ?",
            [$amount, $date, $id]
        );
    }

    public function markPending(int $id, string $dueDate): void
    {
        $this->execute(
            "UPDATE transactions SET status = 'pendente', transaction_date = ? WHERE id = ?",
            [$dueDate, $id]
        );
    }

    /** Lançamentos gerados por contas de um tipo (obrigatória/opcional) numa competência. */
    public function billItemsForMonth(string $kind, DateTimeImmutable $month): array
    {
        return $this->fetchAll(
            'SELECT t.*, c.name AS category_name, c.color AS category_color, b.due_day, b.name AS bill_name
               FROM transactions t
               JOIN recurring_bills b ON b.id = t.recurring_bill_id
               JOIN categories c ON c.id = t.category_id
              WHERE b.kind = ? AND t.competence_month = ?
              ORDER BY t.status DESC, t.transaction_date, t.id',
            [$kind, $month->format('Y-m-d')]
        );
    }

    // ---------- Consultas ----------

    public function forMonth(DateTimeImmutable $month): array
    {
        return $this->fetchAll(
            self::SELECT . ' WHERE t.competence_month = ? ORDER BY t.transaction_date DESC, t.id DESC',
            [$month->format('Y-m-d')]
        );
    }

    /**
     * Filtros aceitos: month (DateTimeImmutable|null), category_id (int|null),
     * type ('entrada'|'saida'|null), q (texto na descrição).
     */
    public function search(array $filters, ?int $limit = null, int $offset = 0): array
    {
        [$where, $params] = $this->where($filters);
        $sql = self::SELECT . $where . ' ORDER BY t.competence_month DESC, t.transaction_date DESC, t.id DESC';
        if ($limit !== null) {
            $sql .= ' LIMIT ' . max(1, $limit) . ' OFFSET ' . max(0, $offset);
        }
        return $this->fetchAll($sql, $params);
    }

    /** @return array{count: int, income: float, expense: float, pending: float} */
    public function totals(array $filters): array
    {
        [$where, $params] = $this->where($filters);
        $row = $this->fetchOne(
            "SELECT COUNT(*) AS count,
                    COALESCE(SUM(CASE WHEN t.type = 'entrada' THEN t.amount END), 0) AS income,
                    COALESCE(SUM(CASE WHEN t.type = 'saida'   THEN t.amount END), 0) AS expense,
                    COALESCE(SUM(CASE WHEN t.status = 'pendente' AND t.type = 'saida' THEN t.amount END), 0) AS pending
               FROM transactions t" . $where,
            $params
        );
        return [
            'count'   => (int) $row['count'],
            'income'  => (float) $row['income'],
            'expense' => (float) $row['expense'],
            'pending' => (float) $row['pending'],
        ];
    }

    /** Meses de competência que têm lançamentos, do mais recente ao mais antigo. */
    public function months(): array
    {
        return array_column(
            $this->fetchAll('SELECT DISTINCT competence_month FROM transactions ORDER BY competence_month DESC'),
            'competence_month'
        );
    }

    /** Descrições mais usadas, para sugerir no campo de descrição. */
    public function frequentDescriptions(int $limit = 80): array
    {
        return array_column($this->fetchAll(
            'SELECT COALESCE(g.description, t.description) AS description, COUNT(*) AS uses
               FROM transactions t
          LEFT JOIN installment_groups g ON g.id = t.installment_group_id
           GROUP BY COALESCE(g.description, t.description)
           ORDER BY uses DESC, MAX(t.id) DESC
              LIMIT ' . $limit
        ), 'description');
    }

    private function where(array $f): array
    {
        $clauses = [];
        $params = [];
        if (!empty($f['month'])) {
            $clauses[] = 't.competence_month = ?';
            $params[] = $f['month']->format('Y-m-d');
        }
        if (!empty($f['category_id'])) {
            $clauses[] = 't.category_id = ?';
            $params[] = (int) $f['category_id'];
        }
        if (!empty($f['type'])) {
            $clauses[] = 't.type = ?';
            $params[] = $f['type'];
        }
        if (isset($f['q']) && $f['q'] !== '') {
            $clauses[] = "t.description LIKE ? ESCAPE '!'";
            $params[] = '%' . strtr($f['q'], ['!' => '!!', '%' => '!%', '_' => '!_']) . '%';
        }
        return [$clauses ? ' WHERE ' . implode(' AND ', $clauses) : '', $params];
    }
}
