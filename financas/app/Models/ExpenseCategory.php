<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

/** Categorias de gasto (Alimentação, Lazer...) do usuário logado. */
final class ExpenseCategory extends Model
{
    public function allWithUsage(): array
    {
        return $this->fetchAll(
            'SELECT e.*,
                    (SELECT COUNT(*) FROM transactions t WHERE t.expense_category_id = e.id)
                  + (SELECT COUNT(*) FROM recurring_bills r WHERE r.expense_category_id = e.id) AS usage_count
               FROM expense_categories e
              WHERE e.user_id = ?
              ORDER BY e.active DESC, e.name',
            [$this->uid()]
        );
    }

    public function active(): array
    {
        return $this->fetchAll('SELECT * FROM expense_categories WHERE user_id = ? AND active = 1 ORDER BY name', [$this->uid()]);
    }

    public function find(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM expense_categories WHERE id = ? AND user_id = ?', [$id, $this->uid()]);
    }

    public function nameExists(string $name, ?int $ignoreId = null): bool
    {
        return (bool) $this->fetchValue(
            'SELECT 1 FROM expense_categories WHERE user_id = ? AND name = ? AND id <> ?',
            [$this->uid(), $name, $ignoreId ?? 0]
        );
    }

    public function create(string $name, string $color): int
    {
        $this->execute('INSERT INTO expense_categories (user_id, name, color) VALUES (?, ?, ?)', [$this->uid(), $name, $color]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $name, string $color): void
    {
        $this->execute('UPDATE expense_categories SET name = ?, color = ? WHERE id = ? AND user_id = ?', [$name, $color, $id, $this->uid()]);
    }

    public function setActive(int $id, bool $active): void
    {
        $this->execute('UPDATE expense_categories SET active = ? WHERE id = ? AND user_id = ?', [$active ? 1 : 0, $id, $this->uid()]);
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM expense_categories WHERE id = ? AND user_id = ?', [$id, $this->uid()]);
    }

    public function isInUse(int $id): bool
    {
        return (bool) $this->fetchValue(
            'SELECT EXISTS(SELECT 1 FROM transactions WHERE expense_category_id = ?)
                 OR EXISTS(SELECT 1 FROM recurring_bills WHERE expense_category_id = ?)',
            [$id, $id]
        );
    }
}
