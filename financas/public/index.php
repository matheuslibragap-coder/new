<?php
declare(strict_types=1);

// Servidor embutido do PHP (php -S): entrega arquivos estáticos diretamente.
if (PHP_SAPI === 'cli-server') {
    $file = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (is_file($file)) {
        return false;
    }
}

require dirname(__DIR__) . '/app/bootstrap.php';

use App\Controllers\AuthController;
use App\Controllers\CategoryController;
use App\Controllers\InstallController;
use App\Controllers\PlaceholderController;
use App\Core\Request;
use App\Core\Router;

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

$router = new Router();

// Rotas públicas
$router->get('/install', [InstallController::class, 'show'], true);
$router->post('/install', [InstallController::class, 'store'], true);
$router->get('/login', [AuthController::class, 'showLogin'], true);
$router->post('/login', [AuthController::class, 'login'], true);
$router->get('/redefinir-senha', [AuthController::class, 'showReset'], true);
$router->post('/redefinir-senha', [AuthController::class, 'reset'], true);

// Rotas autenticadas
$router->post('/logout', [AuthController::class, 'logout']);

$router->get('/', [PlaceholderController::class, 'dashboard']);
$router->get('/lancamentos', [PlaceholderController::class, 'transactions']);
$router->get('/contas/obrigatorias', [PlaceholderController::class, 'mandatory']);
$router->get('/contas/opcionais', [PlaceholderController::class, 'optional']);
$router->get('/historico', [PlaceholderController::class, 'history']);
$router->get('/orcamentos', [PlaceholderController::class, 'budgets']);

$router->get('/categorias', [CategoryController::class, 'index']);
$router->get('/categorias/nova', [CategoryController::class, 'create']);
$router->get('/categorias/editar', [CategoryController::class, 'edit']);
$router->post('/categorias/salvar', [CategoryController::class, 'save']);
$router->post('/categorias/alternar', [CategoryController::class, 'toggle']);
$router->post('/categorias/excluir', [CategoryController::class, 'delete']);

$router->dispatch(Request::method(), Request::path());
