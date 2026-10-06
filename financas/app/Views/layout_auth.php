<?php $appName = (string) App\Core\Config::get('app.name', 'Finanças'); ?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title><?= e($title ?? '') ?> · <?= e($appName) ?></title>
    <link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>">
    <link rel="manifest" href="<?= e(url('manifest.webmanifest')) ?>">
    <link rel="icon" href="<?= e(asset('icons/icon.svg')) ?>" type="image/svg+xml">
    <link rel="apple-touch-icon" href="<?= e(asset('icons/apple-touch-icon.png')) ?>">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Finanças">
</head>
<body class="auth-body">
<main class="auth-card">
    <div class="brand brand-center"><?= e($appName) ?></div>
    <?php App\Core\View::partial('partials/flash', ['flash' => $flash]); ?>
    <?= $content ?>
</main>
</body>
</html>
