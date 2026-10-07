<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

/** Contas e cartões (origens do dinheiro) do usuário logado. */
final class Category extends Model
{
    public const TYPE_CARD = 'cartao';
    public const TYPE_ACCOUNT = 'conta';

    public const TYPE_LABELS = [
        self::TYPE_CARD    => 'Cartão de crédito',
        self::TYPE_ACCOUNT => 'Conta/carteira',
    ];

    /** Todas, com a quantidade de registros que as usam. */
    public function allWithUsage(): array
    {
        return $this->fetchAll(
            'SELECT c.*,
                    (SELECT COUNT(*) FROM transactions t       WHERE t.category_id = c.id)
                  + (SELECT COUNT(*) FROM recurring_bills r    WHERE r.category_id = c.id)
                  + (SELECT COUNT(*) FROM installment_groups g WHERE g.category_id = c.id) AS usage_count
               FROM categories c
              WHERE c.user_id = ?
              ORDER BY c.active DESC, c.name',
            [$this->uid()]
        );
    }

    /** Ativas, para os formulários; $type filtra cartão ou conta. */
    public function active(?string $type = null): array
    {
        if ($type === null) {
            return $this->fetchAll('SELECT * FROM categories WHERE user_id = ? AND active = 1 ORDER BY name', [$this->uid()]);
        }
        return $this->fetchAll('SELECT * FROM categories WHERE user_id = ? AND active = 1 AND type = ? ORDER BY name', [$this->uid(), $type]);
    }

    public function find(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM categories WHERE id = ? AND user_id = ?', [$id, $this->uid()]);
    }

    public function nameExists(string $name, ?int $ignoreId = null): bool
    {
        return (bool) $this->fetchValue(
            'SELECT 1 FROM categories WHERE user_id = ? AND name = ? AND id <> ?',
            [$this->uid(), $name, $ignoreId ?? 0]
        );
    }

    /** @param array{name: string, color: string, type: string, closing_day: ?int, due_day: ?int} $data */
    public function create(array $data): int
    {
        $this->execute(
            'INSERT INTO categories (user_id, name, color, type, closing_day, due_day) VALUES (?, ?, ?, ?, ?, ?)',
            [$this->uid(), $data['name'], $data['color'], $data['type'], $data['closing_day'], $data['due_day']]
        );
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $this->execute(
            'UPDATE categories SET name = ?, color = ?, type = ?, closing_day = ?, due_day = ? WHERE id = ? AND user_id = ?',
            [$data['name'], $data['color'], $data['type'], $data['closing_day'], $data['due_day'], $id, $this->uid()]
        );
    }

    public function setActive(int $id, bool $active): void
    {
        $this->execute('UPDATE categories SET active = ? WHERE id = ? AND user_id = ?', [$active ? 1 : 0, $id, $this->uid()]);
    }

    public function isInUse(int $id): bool
    {
        return (bool) $this->fetchValue(
            'SELECT EXISTS(SELECT 1 FROM transactions WHERE category_id = ?)
                 OR EXISTS(SELECT 1 FROM recurring_bills WHERE category_id = ?)
                 OR EXISTS(SELECT 1 FROM installment_groups WHERE category_id = ?)',
            [$id, $id, $id]
        );
    }

    public function delete(int $id): void
    {
        $this->execute('DELETE FROM categories WHERE id = ? AND user_id = ?', [$id, $this->uid()]);
    }
}
