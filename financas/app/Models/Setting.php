<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

/** Preferências do usuário logado (ex.: se já concluiu o guia). */
final class Setting extends Model
{
    public const GUIDE_DONE = 'guide_done';

    public function get(string $name, ?string $default = null): ?string
    {
        $value = $this->fetchValue('SELECT value FROM settings WHERE user_id = ? AND name = ?', [$this->uid(), $name]);
        return $value === null ? $default : (string) $value;
    }

    public function set(string $name, ?string $value): void
    {
        $this->execute(
            'INSERT INTO settings (user_id, name, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
            [$this->uid(), $name, $value]
        );
    }
}
