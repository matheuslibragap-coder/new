<?php
/** Botões de forma de pagamento. Variáveis: $selected */
use App\Models\Transaction;
?>
<div class="choice-group" role="radiogroup" aria-label="Forma de pagamento">
    <?php foreach (Transaction::PAYMENT_LABELS as $value => $label): ?>
        <label class="choice">
            <input type="radio" name="payment_method" value="<?= e($value) ?>" <?= (string) $selected === $value ? 'checked' : '' ?> required>
            <span><?= e($value === 'credito' ? 'Crédito 1x' : $label) ?></span>
        </label>
    <?php endforeach; ?>
</div>
