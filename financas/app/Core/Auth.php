<?php
declare(strict_types=1);

namespace App\Core;

use App\Models\User;

final class Auth
{
    private static ?array $user = null;

    public static function login(array $user): void
    {
        // Novo ID de sessão no login evita fixação de sessão.
        Session::regenerate();
        Session::set('user_id', (int) $user['id']);
        Session::forget('_csrf');
        self::$user = $user;
    }

    public static function logout(): void
    {
        self::$user = null;
        Session::destroy();
    }

    public static function check(): bool
    {
        return self::user() !== null;
    }

    public static function user(): ?array
    {
        if (self::$user === null) {
            $id = Session::get('user_id');
            if (!is_int($id)) {
                return null;
            }
            self::$user = (new User())->find($id);
            if (self::$user === null) {
                Session::forget('user_id');
            }
        }
        return self::$user;
    }
}
