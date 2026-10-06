<?php
declare(strict_types=1);

use App\Core\Config;
use App\Core\Database;
use App\Core\Session;

define('APP_ROOT', dirname(__DIR__));
define('APP_PATH', __DIR__);

spl_autoload_register(static function (string $class): void {
    if (strncmp($class, 'App\\', 4) !== 0) {
        return;
    }
    $file = APP_PATH . '/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

require APP_PATH . '/Helpers/format.php';

$configFile = APP_PATH . '/config/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Configuração ausente: copie app/config/config.example.php para app/config/config.php e preencha os dados do banco.";
    exit;
}
Config::load(require $configFile);

date_default_timezone_set((string) Config::get('app.timezone', 'America/Sao_Paulo'));
mb_internal_encoding('UTF-8');

$debug = (bool) Config::get('app.debug', false);
ini_set('display_errors', $debug ? '1' : '0');
error_reporting(E_ALL);

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(static function (Throwable $e) use ($debug): void {
    error_log((string) $e);
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: text/html; charset=utf-8');
    }
    $detail = $debug ? '<pre>' . e((string) $e) . '</pre>' : '';
    echo '<!doctype html><meta charset="utf-8"><title>Erro</title>'
        . '<body style="font-family:Arial,sans-serif;padding:40px">'
        . '<h1>Algo deu errado</h1><p>O erro foi registrado. Tente novamente em instantes.</p>'
        . $detail . '</body>';
});

Session::start();

// Fuso do MySQL alinhado ao do PHP, para CURRENT_TIMESTAMP e comparações de data.
Database::setTimezoneOffset((new DateTimeImmutable())->format('P'));
