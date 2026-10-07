<?php
/**
 * Formulário de edição de lançamento.
 * Variáveis: $form, $transaction, $categories, $expenseCategories, $descriptions, $hidden
 */
use App\Core\View;
use App\Models\Transaction;

$inGroup = $transaction['installment_group_id'] !== null;
$isRecurring = ($transaction['group_kind'] ?? '') === Transaction::GROUP_RECURRING;
$type = $form['type'] ?? $transaction['type'];
$scopeLabel = $isRecurring ? 'lançamento' : 'parcela';
?>
<form method="post" action="<?= e(url('/lancamentos/atualizar')) ?>" class="form" data-tx-form
      data-budget-url="<?= e(url('/orcamentos/consulta')) ?>" data-transaction-id="<?= (int) $transaction['id'] ?>">
    <?= csrf_field() ?>
    <?php foreach ($hidden ?? [] as $name => $value): ?>
        <input type="hidden" name="<?= e($name) ?>" value="<?= e($value) ?>">
    <?php endforeach; ?>
    <?php if ($transaction['is_daily']): ?><input type="hidden" name="is_daily" value="1"><?php endif; ?>

    <?php if ($inGroup): ?>
        <input type="hidden" name="type" value="<?= e($transaction['type']) ?>">
    <?php else: ?>
        <div class="segmented" role="radiogroup" aria-label="Tipo">
            <label class="segmented-option segmented-out">
                <input type="radio" name="type" value="saida" <?= $type === 'saida' ? 'checked' : '' ?>> Saída
            </label>
            <label class="segmented-option segmented-in">
                <input type="radio" name="type" value="entrada" <?= $type === 'entrada' ? 'checked' : '' ?>> Entrada
            </label>
        </div>
    <?php endif; ?>

    <label class="field">
        <span><?= $inGroup ? ($isRecurring ? 'Valor deste mês' : 'Valor da parcela') : 'Valor' ?></span>
        <div class="input-prefix">
            <span>R$</span>
            <input type="text" name="amount" value="<?= e($form['amount'] ?? '') ?>" required inputmode="decimal" autocomplete="off" data-money>
        </div>
    </label>

    <label class="field">
        <span>Descrição</span>
        <input type="text" name="description" value="<?= e($form['description'] ?? '') ?>" required maxlength="200" list="descriptions" autocomplete="off">
        <datalist id="descriptions">
            <?php foreach ($descriptions as $d): ?>
                <option value="<?= e($d) ?>">
            <?php endforeach; ?>
        </datalist>
    </label>

    <label class="field" data-show="type=saida">
        <span>Categoria do gasto<?= $transaction['is_daily'] ? '' : ' <small class="muted">(opcional)</small>' ?></span>
        <select name="expense_category_id" <?= $transaction['is_daily'] ? 'required' : '' ?>>
            <option value="">Sem categoria</option>
            <?php foreach ($expenseCategories as $ec): ?>
                <option value="<?= (int) $ec['id'] ?>" <?= (string) ($form['expense_category_id'] ?? '') === (string) $ec['id'] ? 'selected' : '' ?>>
                    <?= e($ec['name']) ?><?= $ec['active'] ? '' : ' (inativa)' ?>
                </option>
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
        <span>Data</span>
        <input type="date" name="transaction_date" value="<?= e($form['transaction_date'] ?? '') ?>" required
               min="<?= APP_MIN_YEAR ?>-01-01" max="<?= APP_MAX_YEAR ?>-12-31" data-date>
    </label>

    <?php if (!$inGroup && $transaction['recurring_bill_id'] === null): ?>
        <fieldset class="field" data-show="type=saida">
            <legend>Como foi pago?</legend>
            <?php View::partial('partials/payment_options', ['selected' => $form['payment_method'] ?? '']); ?>
        </fieldset>
    <?php endif; ?>

    <?php View::partial('partials/paid_question', ['selected' => $form['paid'] ?? '', 'always' => true]); ?>

    <div class="sub-box">
        <?php View::partial('partials/month_fields', [
            'prefix' => 'competence', 'label' => 'Mês em que conta no saldo',
            'month' => $form['competence_month'] ?? null, 'year' => $form['competence_year'] ?? null, 'attr' => 'data-competence',
        ]); ?>
        <?php if ($inGroup): ?>
            <small class="muted small">Os outros lançamentos incluídos abaixo andam junto, um mês após o outro.</small>
        <?php endif; ?>
    </div>

    <?php if ($inGroup): ?>
        <fieldset class="field">
            <legend>Aplicar alterações a</legend>
            <div class="radio-group radio-stack">
                <label class="radio"><input type="radio" name="escopo" value="esta" checked> Só esta <?= $scopeLabel ?> (<?= (int) $transaction['installment_number'] ?>/<?= (int) $transaction['installment_count'] ?>)</label>
                <label class="radio"><input type="radio" name="escopo" value="proximas"> Esta e as próximas</label>
                <label class="radio"><input type="radio" name="escopo" value="todas"> Todas</label>
            </div>
        </fieldset>
    <?php endif; ?>

    <div class="alert alert-warning budget-warning" data-budget-warning role="status" hidden></div>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">Salvar alterações</button>
        <a href="<?= e(url($hidden['voltar'] ?? '/lancamentos')) ?>" class="btn">Cancelar</a>
    </div>
</form>
