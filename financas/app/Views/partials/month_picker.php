<?php
/**
 * Seletor de mês/ano com setas. Mantém os demais parâmetros da URL.
 * Variáveis: $month (DateTimeImmutable), $path (rota), $params (outros filtros)
 */
$params = $params ?? [];
$prev = $month->modify('-1 month');
$next = $month->modify('+1 month');
$years = range(APP_MIN_YEAR, APP_MAX_YEAR);
?>
<form method="get" action="<?= e(url($path)) ?>" class="month-picker" data-autosubmit>
    <?php foreach ($params as $key => $value): ?>
        <?php if ($value !== null && $value !== ''): ?>
            <input type="hidden" name="<?= e($key) ?>" value="<?= e($value) ?>">
        <?php endif; ?>
    <?php endforeach; ?>
    <a class="btn btn-icon" href="<?= e(url($path, ['mes' => month_param($prev)] + array_filter($params))) ?>" aria-label="Mês anterior">‹</a>
    <input type="hidden" name="mes" value="<?= e(month_param($month)) ?>" data-month-value>
    <select aria-label="Mês" data-month-part="m">
        <?php for ($m = 1; $m <= 12; $m++): ?>
            <option value="<?= sprintf('%02d', $m) ?>" <?= (int) $month->format('n') === $m ? 'selected' : '' ?>><?= e(month_name($m)) ?></option>
        <?php endfor; ?>
    </select>
    <select aria-label="Ano" data-month-part="y">
        <?php foreach ($years as $y): ?>
            <option value="<?= $y ?>" <?= (int) $month->format('Y') === $y ? 'selected' : '' ?>><?= $y ?></option>
        <?php endforeach; ?>
    </select>
    <a class="btn btn-icon" href="<?= e(url($path, ['mes' => month_param($next)] + array_filter($params))) ?>" aria-label="Próximo mês">›</a>
    <noscript><button type="submit" class="btn">Ir</button></noscript>
</form>
