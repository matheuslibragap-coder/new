<?php
use App\Core\Auth;
use App\Core\Config;

$menu = [
    ['/',                   'Painel',              'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'],
    ['/diario',             'Controle diário',     'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
    ['/lancamentos',        'Lançamentos',         'M12 5v14M5 12h14'],
    ['/contas/obrigatorias','Contas obrigatórias', 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
    ['/contas/opcionais',   'Contas opcionais',    'M21 12a9 9 0 1 1-9-9M12 7v5l3 3'],
    ['/historico',          'Histórico',           'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'],
    ['/orcamentos',         'Orçamentos',          'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
    ['/categorias',         'Contas e cartões',    'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 10h20M6 15h4'],
    ['/guia',               'Guia inicial',        'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01'],
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
    <link rel="manifest" href="<?= e(url('manifest.webmanifest')) ?>">
    <link rel="icon" href="<?= e(asset('icons/icon.svg')) ?>" type="image/svg+xml">
    <link rel="apple-touch-icon" href="<?= e(asset('icons/apple-touch-icon.png')) ?>">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Finanças">
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
