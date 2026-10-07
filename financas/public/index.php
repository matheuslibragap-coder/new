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
use App\Controllers\BudgetController;
use App\Controllers\CategoryController;
use App\Controllers\DailyController;
use App\Controllers\DashboardController;
use App\Controllers\ExpenseCategoryController;
use App\Controllers\GuideController;
use App\Controllers\HistoryController;
use App\Controllers\InstallController;
use App\Controllers\RecurringController;
use App\Controllers\TransactionController;
use App\Core\Request;
use App\Core\Router;
use App\Services\Migrator;
use App\Services\SchemaInstaller;

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

$router->get('/', [DashboardController::class, 'index']);

$router->get('/guia', [GuideController::class, 'index']);
$router->post('/guia/concluir', [GuideController::class, 'finish']);
$router->post('/guia/zerar', [GuideController::class, 'reset']);

$router->get('/diario', [DailyController::class, 'index']);
$router->get('/diario/categorias', [ExpenseCategoryController::class, 'index']);
$router->get('/diario/categorias/nova', [ExpenseCategoryController::class, 'create']);
$router->get('/diario/categorias/editar', [ExpenseCategoryController::class, 'edit']);
$router->post('/diario/categorias/salvar', [ExpenseCategoryController::class, 'save']);
$router->post('/diario/categorias/alternar', [ExpenseCategoryController::class, 'toggle']);
$router->post('/diario/categorias/excluir', [ExpenseCategoryController::class, 'delete']);

$router->get('/lancamentos', [TransactionController::class, 'index']);
$router->post('/lancamentos/salvar', [TransactionController::class, 'store']);
$router->get('/lancamentos/editar', [TransactionController::class, 'edit']);
$router->post('/lancamentos/atualizar', [TransactionController::class, 'update']);
$router->get('/lancamentos/excluir', [TransactionController::class, 'confirmDelete']);
$router->post('/lancamentos/excluir', [TransactionController::class, 'delete']);

$router->get('/historico', [HistoryController::class, 'index']);
$router->get('/historico/exportar', [HistoryController::class, 'export']);

$router->get('/contas/obrigatorias', [RecurringController::class, 'mandatory']);
$router->get('/contas/opcionais', [RecurringController::class, 'optional']);
$router->get('/contas/nova', [RecurringController::class, 'create']);
$router->get('/contas/editar', [RecurringController::class, 'edit']);
$router->post('/contas/salvar', [RecurringController::class, 'save']);
$router->post('/contas/alternar', [RecurringController::class, 'toggle']);
$router->post('/contas/excluir', [RecurringController::class, 'delete']);
$router->get('/contas/pagar', [RecurringController::class, 'showPay']);
$router->post('/contas/pagar', [RecurringController::class, 'pay']);
$router->post('/contas/desfazer-pagamento', [RecurringController::class, 'unpay']);

$router->get('/orcamentos', [BudgetController::class, 'index']);
$router->post('/orcamentos/salvar', [BudgetController::class, 'save']);
$router->get('/orcamentos/consulta', [BudgetController::class, 'check']);

$router->get('/categorias', [CategoryController::class, 'index']);
$router->get('/categorias/nova', [CategoryController::class, 'create']);
$router->get('/categorias/editar', [CategoryController::class, 'edit']);
$router->post('/categorias/salvar', [CategoryController::class, 'save']);
$router->post('/categorias/alternar', [CategoryController::class, 'toggle']);
$router->post('/categorias/excluir', [CategoryController::class, 'delete']);

// Atualiza o banco automaticamente quando uma versão nova do sistema é enviada.
if ((new SchemaInstaller())->isInstalled()) {
    (new Migrator())->migrate();
}

$router->dispatch(Request::method(), Request::path());
