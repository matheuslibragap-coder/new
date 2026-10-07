<?php
/**
 * Pergunta "Já está pago?" / "Já recebeu?". Variáveis: $selected ('1', '0' ou ''),
 * $always (true = sempre visível, como na edição; senão só aparece para datas futuras),
 * $groupHint (mostra a observação sobre meses passados em recorrentes/parcelados).
 */
$always = $always ?? false;
?>
<fieldset class="field paid-question" <?= $always ? '' : 'data-paid-question' ?>>
    <legend>
        <span data-show="type=saida">Já está pago?</span>
        <span data-show="type=entrada">Já recebeu?</span>
    </legend>
    <div class="choice-group choice-2" role="radiogroup">
        <label class="choice">
            <input type="radio" name="paid" value="1" <?= (string) $selected === '1' ? 'checked' : '' ?><?= $always ? ' required' : '' ?>>
            <span>
                <span data-show="type=saida">Sim, já paguei</span>
                <span data-show="type=entrada">Sim, já recebi</span>
            </span>
        </label>
        <label class="choice">
            <input type="radio" name="paid" value="0" <?= (string) $selected === '0' ? 'checked' : '' ?><?= $always ? ' required' : '' ?>>
            <span>
                <span data-show="type=saida">Não, vou pagar</span>
                <span data-show="type=entrada">Não, vou receber</span>
            </span>
        </label>
    </div>
    <?php if (!empty($groupHint)): ?>
        <small class="muted small" data-show="mode=recorrente|parcelado">Se marcar "Não", os meses com data anterior a hoje entram como pagos e os demais ficam a pagar. Cada mês vence no mesmo dia da data informada.</small>
    <?php endif; ?>
</fieldset>
