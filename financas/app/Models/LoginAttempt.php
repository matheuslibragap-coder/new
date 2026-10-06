<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

final class LoginAttempt extends Model
{
    public const MAX_ATTEMPTS = 5;
    public const LOCK_MINUTES = 15;

    public function isLocked(string $ip): bool
    {
        $count = (int) $this->fetchValue(
            'SELECT COUNT(*) FROM login_attempts
              WHERE ip_address = ? AND attempted_at > (NOW() - INTERVAL ' . self::LOCK_MINUTES . ' MINUTE)',
            [$ip]
        );
        return $count >= self::MAX_ATTEMPTS;
    }

    public function register(string $ip): void
    {
        $this->execute('INSERT INTO login_attempts (ip_address) VALUES (?)', [$ip]);
        $this->execute('DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)');
    }

    public function clear(string $ip): void
    {
        $this->execute('DELETE FROM login_attempts WHERE ip_address = ?', [$ip]);
    }
}
