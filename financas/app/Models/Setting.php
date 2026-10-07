<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

final class Setting extends Model
{
    public const GUIDE_DONE = 'guide_done';

    public function get(string $name, ?string $default = null): ?string
    {
        $value = $this->fetchValue('SELECT value FROM settings WHERE name = ?', [$name]);
        return $value === null ? $default : (string) $value;
    }

    public function set(string $name, ?string $value): void
    {
        $this->execute(
            'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
            [$name, $value]
        );
    }
}
