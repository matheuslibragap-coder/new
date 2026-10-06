<?php
declare(strict_types=1);

namespace App\Core;

final class Request
{
    private static ?string $base = null;

    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function isPost(): bool
    {
        return self::method() === 'POST';
    }

    public static function isHttps(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    }

    public static function ip(): string
    {
        // Não confiamos em X-Forwarded-For: qualquer cliente pode forjá-lo
        // e assim burlar o bloqueio de tentativas de login.
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }

    /**
     * Prefixo de URL onde o sistema está instalado (ex.: '' ou '/financas').
     * Quando a raiz do site não aponta para public/, o .htaccess da raiz
     * reescreve para public/index.php; nesse caso o "/public" final é removido
     * para que os links continuem sem ele.
     */
    public static function base(): string
    {
        if (self::$base === null) {
            $configured = trim((string) Config::get('app.base_url', ''));
            if ($configured !== '') {
                self::$base = rtrim($configured, '/');
            } else {
                $dir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php'));
                $dir = rtrim($dir, '/');
                if (str_ends_with($dir, '/public')) {
                    $dir = substr($dir, 0, -strlen('/public'));
                }
                self::$base = $dir;
            }
        }
        return self::$base;
    }

    /** Caminho da rota atual, sem o prefixo de instalação. Sempre começa com '/'. */
    public static function path(): string
    {
        $path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $path = rawurldecode($path);
        $base = self::base();
        if ($base !== '' && str_starts_with($path, $base)) {
            $path = substr($path, strlen($base));
        }
        if (str_starts_with($path, '/public/')) {
            $path = substr($path, strlen('/public'));
        }
        if (str_starts_with($path, '/index.php')) {
            $path = substr($path, strlen('/index.php'));
        }
        $path = '/' . trim($path, '/');
        return $path;
    }

    public static function input(string $key, mixed $default = null): mixed
    {
        $value = $_POST[$key] ?? $_GET[$key] ?? $default;
        return is_string($value) ? trim($value) : $value;
    }

    public static function query(string $key, mixed $default = null): mixed
    {
        $value = $_GET[$key] ?? $default;
        return is_string($value) ? trim($value) : $value;
    }
}
