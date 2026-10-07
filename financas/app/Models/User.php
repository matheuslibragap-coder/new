<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

final class User extends Model
{
    public function count(): int
    {
        return (int) $this->fetchValue('SELECT COUNT(*) FROM users');
    }

    public function find(int $id): ?array
    {
        return $this->fetchOne('SELECT id, name, email, password_hash FROM users WHERE id = ?', [$id]);
    }

    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne('SELECT id, name, email, password_hash FROM users WHERE email = ?', [$email]);
    }

    public function first(): ?array
    {
        return $this->fetchOne('SELECT id, name, email, password_hash FROM users ORDER BY id LIMIT 1');
    }

    public function create(string $name, string $email, string $password): int
    {
        $this->execute(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [$name, $email, password_hash($password, PASSWORD_DEFAULT)]
        );
        return (int) $this->db->lastInsertId();
    }

    public function updatePassword(int $id, string $password): void
    {
        $this->execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [password_hash($password, PASSWORD_DEFAULT), $id]
        );
    }

    /** O primeiro usuário cadastrado é o dono do sistema. */
    public function ownerId(): ?int
    {
        $id = $this->fetchValue('SELECT MIN(id) FROM users');
        return $id === null ? null : (int) $id;
    }

    public function all(): array
    {
        return $this->fetchAll(
            'SELECT u.id, u.name, u.email, u.created_at,
                    (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) AS transactions
               FROM users u
              ORDER BY u.id'
        );
    }

    public function emailExists(string $email, ?int $ignoreId = null): bool
    {
        return (bool) $this->fetchValue('SELECT 1 FROM users WHERE email = ? AND id <> ?', [$email, $ignoreId ?? 0]);
    }

    public function updateProfile(int $id, string $name, string $email): void
    {
        $this->execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [$name, $email, $id]);
    }

    /** Exclui o usuário e todos os dados dele, na ordem que as chaves estrangeiras exigem. */
    public function deleteWithData(int $id): void
    {
        $this->db->beginTransaction();
        try {
            $this->execute('DELETE FROM transactions WHERE user_id = ?', [$id]);
            $this->execute('DELETE FROM installment_groups WHERE user_id = ?', [$id]);
            $this->execute('DELETE g FROM recurring_generations g JOIN recurring_bills r ON r.id = g.recurring_bill_id WHERE r.user_id = ?', [$id]);
            $this->execute('DELETE FROM recurring_bills WHERE user_id = ?', [$id]);
            $this->execute('DELETE b FROM budgets b JOIN categories c ON c.id = b.category_id WHERE c.user_id = ?', [$id]);
            $this->execute('DELETE FROM categories WHERE user_id = ?', [$id]);
            $this->execute('DELETE FROM expense_categories WHERE user_id = ?', [$id]);
            $this->execute('DELETE FROM settings WHERE user_id = ?', [$id]);
            $this->execute('DELETE FROM users WHERE id = ?', [$id]);
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /** Atualiza o hash quando o PHP passar a usar um algoritmo/custo mais forte. */
    public function rehashIfNeeded(array $user, string $password): void
    {
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $this->updatePassword((int) $user['id'], $password);
        }
    }
}
