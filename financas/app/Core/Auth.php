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

    /** ID do usuário logado. Todas as consultas de dados são filtradas por ele. */
    public static function id(): int
    {
        $id = Session::get('user_id');
        if (!is_int($id)) {
            throw new \RuntimeException('Nenhum usuário logado.');
        }
        return $id;
    }

    /** O dono é o primeiro usuário cadastrado: só ele gerencia os demais usuários. */
    public static function isOwner(): bool
    {
        $user = self::user();
        return $user !== null && (int) $user['id'] === (new User())->ownerId();
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
