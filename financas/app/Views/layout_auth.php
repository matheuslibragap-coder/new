<?php $appName = (string) App\Core\Config::get('app.name', 'Finanças'); ?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title><?= e($title ?? '') ?> · <?= e($appName) ?></title>
    <link rel="stylesheet" href="<?= e(asset('css/app.css')) ?>">
</head>
<body class="auth-body">
<main class="auth-card">
    <div class="brand brand-center"><?= e($appName) ?></div>
    <?php App\Core\View::partial('partials/flash', ['flash' => $flash]); ?>
    <?= $content ?>
</main>
</body>
</html>
