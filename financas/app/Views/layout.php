<?php
use App\Core\Auth;
use App\Core\Config;

$menu = [
    ['/',                   'Painel',              'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'],
    ['/lancamentos',        'Lançamentos',         'M12 5v14M5 12h14'],
    ['/contas/obrigatorias','Contas obrigatórias', 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
    ['/contas/opcionais',   'Contas opcionais',    'M21 12a9 9 0 1 1-9-9M12 7v5l3 3'],
    ['/historico',          'Histórico',           'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'],
    ['/orcamentos',         'Orçamentos',          'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
    ['/categorias',         'Categorias',          'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01'],
];
$isActive = static fn (string $href): bool =>
    $href === '/' ? $currentPath === '/' : ($currentPath === $href || str_starts_with($currentPath, $href . '/'));
$user = Auth::user();
$appName = (string) Config::get('app.name', 'Finanças');
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#ffffff">
    <title><?= e($title ?? '') ?> · <?= e($appName) ?></title>
    <link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>">
</head>
<body>
<div class="app">
    <header class="topbar">
        <button type="button" class="menu-toggle" data-menu-toggle aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar">
            <span></span><span></span><span></span>
        </button>
        <span class="topbar-title"><?= e($title ?? $appName) ?></span>
    </header>

    <aside class="sidebar" id="sidebar">
        <div class="brand"><?= e($appName) ?></div>
        <nav class="nav">
            <?php foreach ($menu as [$href, $label, $icon]): ?>
                <a href="<?= e(url($href)) ?>" class="nav-link<?= $isActive($href) ? ' is-active' : '' ?>"<?= $isActive($href) ? ' aria-current="page"' : '' ?>>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="<?= $icon ?>"/></svg>
                    <?= e($label) ?>
                </a>
            <?php endforeach; ?>
        </nav>
        <div class="sidebar-footer">
            <span class="user-name"><?= e($user['name'] ?? '') ?></span>
            <form method="post" action="<?= e(url('/logout')) ?>">
                <?= csrf_field() ?>
                <button type="submit" class="link-button">Sair</button>
            </form>
        </div>
    </aside>
    <div class="backdrop" data-menu-close></div>

    <main class="main">
        <?php App\Core\View::partial('partials/flash', ['flash' => $flash]); ?>
        <?= $content ?>
    </main>
</div>
<script src="<?= e(asset('js/app.js')) ?>"></script>
</body>
</html>
