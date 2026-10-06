<?php
declare(strict_types=1);

namespace App\Core;

final class Session
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');

        session_name('financas_sid');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => Request::base() === '' ? '/' : Request::base() . '/',
            'secure'   => Request::isHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();

        $idle = max(5, (int) Config::get('app.session_idle_minutes', 240)) * 60;
        $now = time();
        if (isset($_SESSION['_last_activity']) && $now - $_SESSION['_last_activity'] > $idle) {
            $_SESSION = [];
            session_regenerate_id(true);
            $_SESSION['_flash']['info'] = 'Sua sessão expirou por inatividade. Entre novamente.';
        }
        $_SESSION['_last_activity'] = $now;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    public static function forget(string $key): void
    {
        unset($_SESSION[$key]);
    }

    public static function regenerate(): void
    {
        session_regenerate_id(true);
    }

    public static function destroy(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $p['path'],
                'secure'   => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => $p['samesite'],
            ]);
        }
        session_destroy();
    }

    /** Mensagem exibida uma única vez na próxima página (success, error, info, warning). */
    public static function flash(string $type, string $message): void
    {
        $_SESSION['_flash'][$type] = $message;
    }

    public static function pullFlash(): array
    {
        $flash = $_SESSION['_flash'] ?? [];
        unset($_SESSION['_flash']);
        return $flash;
    }

    /** Guarda os dados do formulário para repreencher após erro de validação. */
    public static function flashInput(array $input): void
    {
        $_SESSION['_old'] = $input;
    }

    public static function pullOldInput(): array
    {
        $old = $_SESSION['_old'] ?? [];
        unset($_SESSION['_old']);
        return $old;
    }
}
