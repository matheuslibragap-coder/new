<?php
$name = old($old, 'name', $category['name'] ?? '');
$color = old($old, 'color', $category['color'] ?? '#E8590C');
$presets = ['#E8590C', '#7048E8', '#2F9E44', '#1971C2', '#C2255C', '#F08C00', '#0C8599', '#5C940D', '#862E9C', '#495057'];
?>
<div class="page-header">
    <h1><?= e($title) ?></h1>
</div>

<form method="post" action="<?= e(url('/diario/categorias/salvar')) ?>" class="card form form-narrow">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) ($category['id'] ?? 0) ?>">

    <label class="field">
        <span>Nome</span>
        <input type="text" name="name" value="<?= e($name) ?>" required maxlength="60" autofocus placeholder="Ex.: Saúde, Pets, Educação">
    </label>

    <div class="field">
        <span id="color-label">Cor</span>
        <div class="color-picker" role="group" aria-labelledby="color-label">
            <input type="color" value="<?= e($color) ?>" data-color-input aria-label="Escolher cor">
            <input type="text" name="color" value="<?= e($color) ?>" data-color-hex maxlength="7" pattern="#[0-9A-Fa-f]{6}" required class="input-hex" aria-label="Código da cor">
            <span class="tag" data-color-preview style="--tag-color: <?= e($color) ?>"><?= e($name ?: 'Prévia') ?></span>
        </div>
        <div class="swatches">
            <?php foreach ($presets as $preset): ?>
                <button type="button" class="swatch" style="background: <?= e($preset) ?>" data-color-preset="<?= e($preset) ?>" aria-label="Usar cor <?= e($preset) ?>"></button>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="<?= e(url('/diario/categorias')) ?>" class="btn">Cancelar</a>
    </div>
</form>
