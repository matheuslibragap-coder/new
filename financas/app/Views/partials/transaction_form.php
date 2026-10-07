<?php
/**
 * Formulário de novo lançamento.
 * Variáveis: $form, $categories, $expenseCategories, $descriptions, $hidden (campos ocultos)
 *
 * Os blocos com data-show aparecem conforme as escolhas (ex.: "type=saida;mode=unico").
 * Campos dentro de blocos ocultos ficam desabilitados e não são enviados.
 */
use App\Core\View;
use App\Services\TransactionService;

$type = $form['type'] ?? 'saida';
$mode = $form['mode'] ?? 'unico';
?>
<?php if (!$categories): ?>
    <div class="alert alert-warning">Antes de lançar, cadastre pelo menos uma conta ou cartão em <a href="<?= e(url('/categorias/nova')) ?>">Contas e cartões</a>.</div>
<?php endif; ?>
<form method="post" action="<?= e(url('/lancamentos/salvar')) ?>" class="form" data-tx-form
      data-budget-url="<?= e(url('/orcamentos/consulta')) ?>">
    <?= csrf_field() ?>
    <?php foreach ($hidden ?? [] as $name => $value): ?>
        <input type="hidden" name="<?= e($name) ?>" value="<?= e($value) ?>">
    <?php endforeach; ?>

    <div class="segmented" role="radiogroup" aria-label="Tipo">
        <label class="segmented-option segmented-out">
            <input type="radio" name="type" value="saida" <?= $type === 'saida' ? 'checked' : '' ?>> Saída
        </label>
        <label class="segmented-option segmented-in">
            <input type="radio" name="type" value="entrada" <?= $type === 'entrada' ? 'checked' : '' ?>> Entrada
        </label>
    </div>

    <fieldset class="field">
        <legend>Como é esse lançamento?</legend>
        <div class="choice-group choice-3" role="radiogroup">
            <label class="choice">
                <input type="radio" name="mode" value="unico" <?= $mode === 'unico' ? 'checked' : '' ?>>
                <span>Único<small>à vista</small></span>
            </label>
            <label class="choice">
                <input type="radio" name="mode" value="recorrente" <?= $mode === 'recorrente' ? 'checked' : '' ?>>
                <span>Recorrente<small>todo mês</small></span>
            </label>
            <label class="choice" data-show="type=saida">
                <input type="radio" name="mode" value="parcelado" <?= $mode === 'parcelado' ? 'checked' : '' ?>>
                <span>Parcelado<small>em vezes</small></span>
            </label>
        </div>
    </fieldset>

    <label class="field">
        <span>
            <span data-show="mode=unico">Valor</span>
            <span data-show="mode=recorrente">Valor por mês</span>
            <span data-show="mode=parcelado">Valor total da compra (com juros, se houver)</span>
        </span>
        <div class="input-prefix">
            <span>R$</span>
            <input type="text" name="amount" value="<?= e($form['amount'] ?? '') ?>" required inputmode="decimal"
                   placeholder="0,00" autocomplete="off" data-money>
        </div>
    </label>

    <label class="field">
        <span>Descrição</span>
        <input type="text" name="description" value="<?= e($form['description'] ?? '') ?>" required maxlength="200"
               list="descriptions" autocomplete="off" placeholder="Ex.: Mercado, YT Premium, Salário">
        <datalist id="descriptions">
            <?php foreach ($descriptions as $d): ?>
                <option value="<?= e($d) ?>">
            <?php endforeach; ?>
        </datalist>
    </label>

    <label class="field" data-show="type=saida">
        <span>Categoria do gasto <small class="muted">(opcional)</small></span>
        <select name="expense_category_id">
            <option value="">Sem categoria</option>
            <?php foreach ($expenseCategories as $ec): ?>
                <option value="<?= (int) $ec['id'] ?>" <?= (string) ($form['expense_category_id'] ?? '') === (string) $ec['id'] ? 'selected' : '' ?>><?= e($ec['name']) ?></option>
            <?php endforeach; ?>
        </select>
    </label>

    <label class="field">
        <span>
            <span data-show="type=saida">De qual conta ou cartão saiu?</span>
            <span data-show="type=entrada">Em qual conta entrou?</span>
        </span>
        <?php View::partial('partials/origin_select', ['categories' => $categories, 'selected' => $form['category_id'] ?? '']); ?>
    </label>

    <label class="field">
        <span>
            <span data-show="type=saida">Data da compra</span>
            <span data-show="type=entrada">Data</span>
        </span>
        <input type="date" name="transaction_date" value="<?= e($form['transaction_date'] ?? '') ?>" required
               min="<?= APP_MIN_YEAR ?>-01-01" max="<?= APP_MAX_YEAR ?>-12-31" data-date>
    </label>

    <!-- Único (saída): forma de pagamento -->
    <fieldset class="field" data-show="type=saida;mode=unico">
        <legend>Como foi pago?</legend>
        <?php View::partial('partials/payment_options', ['selected' => $form['payment_method'] ?? '']); ?>
    </fieldset>

    <div class="sub-box" data-show="type=saida;mode=unico;payment_method=credito">
        <?php View::partial('partials/month_fields', [
            'prefix' => 'invoice', 'label' => 'Em qual mês cai na fatura?',
            'month' => $form['invoice_month'] ?? null, 'year' => $form['invoice_year'] ?? null, 'attr' => 'data-suggest="invoice"',
        ]); ?>
        <small class="muted small" data-suggest-hint></small>
    </div>

    <!-- Recorrente -->
    <div class="sub-box" data-show="mode=recorrente">
        <?php View::partial('partials/month_fields', [
            'prefix' => 'start', 'label' => 'Mês da primeira cobrança',
            'month' => $form['start_month'] ?? null, 'year' => $form['start_year'] ?? null, 'attr' => 'data-start',
        ]); ?>
        <label class="field">
            <span>Por quantos meses?</span>
            <input type="number" name="months" value="<?= (int) ($form['months'] ?? 12) ?>" min="1" max="<?= TransactionService::MAX_RECURRING_MONTHS ?>" inputmode="numeric" data-months>
        </label>
        <label class="checkbox">
            <input type="checkbox" name="until_end" value="1" <?= !empty($form['until_end']) ? 'checked' : '' ?> data-until-end>
            Sem data para acabar (lançar até dezembro de <?= APP_MAX_YEAR ?>)
        </label>
    </div>

    <!-- Parcelado -->
    <div class="sub-box" data-show="type=saida;mode=parcelado">
        <label class="field">
            <span>Número de parcelas</span>
            <input type="number" name="installments" value="<?= (int) ($form['installments'] ?? 2) ?>" min="2" max="<?= TransactionService::MAX_INSTALLMENTS ?>" inputmode="numeric" data-installments>
        </label>
        <?php View::partial('partials/month_fields', [
            'prefix' => 'start', 'label' => 'Mês da 1ª parcela',
            'month' => $form['start_month'] ?? null, 'year' => $form['start_year'] ?? null, 'attr' => 'data-start data-suggest="start"',
        ]); ?>
        <small class="muted small" data-suggest-hint></small>
    </div>

    <div class="tx-summary" data-tx-summary hidden></div>
    <div class="alert alert-warning budget-warning" data-budget-warning role="status" hidden></div>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">Lançar</button>
    </div>
</form>
