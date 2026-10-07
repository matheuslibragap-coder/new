<?php
/**
 * Par de selects mês/ano. Variáveis: $prefix (nome base dos campos), $month, $year, $label,
 * $attr (atributo data-* opcional para o JS identificar o par)
 */
$month = (int) ($month ?? date('n'));
$year = (int) ($year ?? date('Y'));
$attr = $attr ?? '';
?>
<div class="field">
    <span><?= e($label) ?></span>
    <div class="month-fields" <?= $attr ?>>
        <select name="<?= e($prefix) ?>_month" aria-label="<?= e($label) ?>: mês">
            <?php for ($m = 1; $m <= 12; $m++): ?>
                <option value="<?= $m ?>" <?= $month === $m ? 'selected' : '' ?>><?= e(month_name($m)) ?></option>
            <?php endfor; ?>
        </select>
        <select name="<?= e($prefix) ?>_year" aria-label="<?= e($label) ?>: ano">
            <?php for ($y = APP_MIN_YEAR; $y <= APP_MAX_YEAR; $y++): ?>
                <option value="<?= $y ?>" <?= $year === $y ? 'selected' : '' ?>><?= $y ?></option>
            <?php endfor; ?>
        </select>
    </div>
</div>
