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

    /** Atualiza o hash quando o PHP passar a usar um algoritmo/custo mais forte. */
    public function rehashIfNeeded(array $user, string $password): void
    {
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $this->updatePassword((int) $user['id'], $password);
        }
    }
}
