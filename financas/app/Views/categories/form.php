<?php
use App\Models\Category;

$v = static fn (string $key, mixed $default = '') => old($old, $key, $category[$key] ?? $default);
$type = $v('type', Category::TYPE_CARD);
$color = $v('color', '#1A56DB');
$presets = ['#1B5E20', '#EC7000', '#C88A00', '#B388FF', '#4A148C', '#FFD600', '#81C784', '#D32F2F', '#212121', '#EC407A', '#1A56DB', '#00838F'];
?>
<div class="page-header">
    <h1><?= e($title) ?></h1>
</div>

<form method="post" action="<?= e(url('/categorias/salvar')) ?>" class="card form form-narrow">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) ($category['id'] ?? 0) ?>">

    <label class="field">
        <span>Nome</span>
        <input type="text" name="name" value="<?= e($v('name')) ?>" required maxlength="60" autofocus>
    </label>

    <div class="field">
        <span id="color-label">Cor</span>
        <div class="color-picker" role="group" aria-labelledby="color-label">
            <input type="color" value="<?= e($color) ?>" data-color-input aria-label="Escolher cor">
            <input type="text" name="color" value="<?= e($color) ?>" data-color-hex maxlength="7" pattern="#[0-9A-Fa-f]{6}" required class="input-hex" aria-label="Código da cor">
            <span class="tag" data-color-preview style="--tag-color: <?= e($color) ?>"><?= e($v('name') ?: 'Prévia') ?></span>
        </div>
        <div class="swatches">
            <?php foreach ($presets as $preset): ?>
                <button type="button" class="swatch" style="background: <?= e($preset) ?>" data-color-preset="<?= e($preset) ?>" aria-label="Usar cor <?= e($preset) ?>"></button>
            <?php endforeach; ?>
        </div>
    </div>

    <fieldset class="field">
        <legend>Tipo</legend>
        <div class="radio-group">
            <?php foreach (Category::TYPE_LABELS as $value => $label): ?>
                <label class="radio">
                    <input type="radio" name="type" value="<?= e($value) ?>" <?= $type === $value ? 'checked' : '' ?> data-category-type>
                    <?= e($label) ?>
                </label>
            <?php endforeach; ?>
        </div>
    </fieldset>

    <div class="field-row" data-card-fields <?= $type === Category::TYPE_CARD ? '' : 'hidden' ?>>
        <label class="field">
            <span>Dia de fechamento da fatura</span>
            <input type="number" name="closing_day" value="<?= e($v('closing_day')) ?>" min="1" max="31" inputmode="numeric">
        </label>
        <label class="field">
            <span>Dia de vencimento da fatura</span>
            <input type="number" name="due_day" value="<?= e($v('due_day')) ?>" min="1" max="31" inputmode="numeric">
        </label>
        <p class="muted small field-hint">Compras feitas a partir do dia de fechamento entram na fatura seguinte. O gasto conta no mês em que a fatura vence.</p>
    </div>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="<?= e(url('/categorias')) ?>" class="btn">Cancelar</a>
    </div>
</form>
