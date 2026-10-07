<?php
/** Select de conta/cartão de origem. Variáveis: $categories, $selected */
use App\Models\Category;
?>
<select name="category_id" required data-origin>
    <option value="">Selecione…</option>
    <?php foreach ($categories as $c): ?>
        <option value="<?= (int) $c['id'] ?>"
                data-type="<?= e($c['type']) ?>"
                data-closing="<?= (int) $c['closing_day'] ?>"
                data-due="<?= (int) $c['due_day'] ?>"
            <?= (string) $selected === (string) $c['id'] ? 'selected' : '' ?>>
            <?= e($c['name']) ?><?= $c['active'] ? '' : ' (inativa)' ?> · <?= $c['type'] === Category::TYPE_CARD ? 'cartão' : 'conta' ?>
        </option>
    <?php endforeach; ?>
</select>
