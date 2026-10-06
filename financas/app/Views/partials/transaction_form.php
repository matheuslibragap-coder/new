<?php
/**
 * Formulário de lançamento (novo ou edição).
 * Variáveis: $form, $categories, $descriptions, $action, $transaction (ou null), $hidden (campos ocultos)
 */
use App\Models\Category;
use App\Models\Transaction;
use App\Services\TransactionService;

$transaction = $transaction ?? null;
$isParcel = $transaction !== null && $transaction['installment_group_id'] !== null;
$isNew = $transaction === null;
$type = $form['type'] ?? Transaction::TYPE_OUT;
$currentYear = (int) date('Y');
$compYear = (int) ($form['competence_year'] ?? $currentYear);
?>
<form method="post" action="<?= e(url($action)) ?>" class="form" data-transaction-form
      data-parcel-number="<?= (int) ($transaction['installment_number'] ?? 1) ?>"
      data-transaction-id="<?= (int) ($transaction['id'] ?? 0) ?>"
      data-budget-url="<?= e(url('/orcamentos/consulta')) ?>">
    <?= csrf_field() ?>
    <?php foreach ($hidden ?? [] as $name => $value): ?>
        <input type="hidden" name="<?= e($name) ?>" value="<?= e($value) ?>">
    <?php endforeach; ?>

    <?php if ($isParcel): ?>
        <input type="hidden" name="type" value="saida">
    <?php else: ?>
        <div class="segmented" role="radiogroup" aria-label="Tipo">
            <label class="segmented-option segmented-out">
                <input type="radio" name="type" value="saida" <?= $type === 'saida' ? 'checked' : '' ?> data-tx-type> Saída
            </label>
            <label class="segmented-option segmented-in">
                <input type="radio" name="type" value="entrada" <?= $type === 'entrada' ? 'checked' : '' ?> data-tx-type> Entrada
            </label>
        </div>
    <?php endif; ?>

    <div class="field-row">
        <label class="field">
            <span><?= $isParcel ? 'Valor da parcela' : 'Valor' ?></span>
            <div class="input-prefix">
                <span>R$</span>
                <input type="text" name="amount" value="<?= e($form['amount'] ?? '') ?>" required inputmode="decimal"
                       placeholder="0,00" autocomplete="off" data-money>
            </div>
        </label>
        <label class="field">
            <span>Data</span>
            <input type="date" name="transaction_date" value="<?= e($form['transaction_date'] ?? '') ?>" required data-tx-date>
        </label>
    </div>

    <label class="field">
        <span>Categoria</span>
        <select name="category_id" required data-tx-category>
            <option value="">Selecione…</option>
            <?php foreach ($categories as $c): ?>
                <option value="<?= (int) $c['id'] ?>"
                        data-type="<?= e($c['type']) ?>"
                        data-closing="<?= (int) $c['closing_day'] ?>"
                        data-due="<?= (int) $c['due_day'] ?>"
                    <?= (string) ($form['category_id'] ?? '') === (string) $c['id'] ? 'selected' : '' ?>>
                    <?= e($c['name']) ?><?= $c['active'] ? '' : ' (inativa)' ?> · <?= $c['type'] === Category::TYPE_CARD ? 'cartão' : 'conta' ?>
                </option>
            <?php endforeach; ?>
        </select>
        <small class="muted small" data-in-hint hidden>Entradas só podem ir para contas/carteiras.</small>
    </label>

    <label class="field">
        <span>Descrição</span>
        <input type="text" name="description" value="<?= e($form['description'] ?? '') ?>" required maxlength="200"
               list="descriptions" autocomplete="off" placeholder="Ex.: Mercado, Gasolina, Salário">
        <datalist id="descriptions">
            <?php foreach ($descriptions as $d): ?>
                <option value="<?= e($d) ?>">
            <?php endforeach; ?>
        </datalist>
    </label>

    <?php if ($isNew): ?>
        <label class="field" data-installments-field hidden>
            <span>Parcelas</span>
            <input type="number" name="installments" value="<?= (int) ($form['installments'] ?? 1) ?>" min="1"
                   max="<?= TransactionService::MAX_INSTALLMENTS ?>" inputmode="numeric" data-installments>
            <small class="muted small" data-installments-preview></small>
        </label>
    <?php endif; ?>

    <div class="competence-box">
        <div class="competence-preview" data-competence-preview>
            <?php if (!$isNew): ?>Competência atual: <strong><?= e(month_label($transaction['competence_month'])) ?></strong><?php endif; ?>
        </div>
        <label class="checkbox">
            <input type="checkbox" name="competence_manual" value="1" <?= !empty($form['competence_manual']) ? 'checked' : '' ?> data-competence-manual>
            Ajustar mês de competência manualmente
        </label>
        <div class="field-row" data-competence-fields <?= empty($form['competence_manual']) ? 'hidden' : '' ?>>
            <label class="field">
                <span>Mês</span>
                <select name="competence_month">
                    <?php for ($m = 1; $m <= 12; $m++): ?>
                        <option value="<?= $m ?>" <?= (int) ($form['competence_month'] ?? 0) === $m ? 'selected' : '' ?>><?= e(month_name($m)) ?></option>
                    <?php endfor; ?>
                </select>
            </label>
            <label class="field">
                <span>Ano</span>
                <select name="competence_year">
                    <?php foreach (range(min($currentYear - 5, $compYear), max($currentYear + 6, $compYear)) as $y): ?>
                        <option value="<?= $y ?>" <?= $compYear === $y ? 'selected' : '' ?>><?= $y ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <?php if ($isParcel): ?>
                <p class="muted small field-hint">Vale para esta parcela; as outras incluídas no escopo andam junto, um mês após o outro.</p>
            <?php endif; ?>
        </div>
    </div>

    <?php if ($isParcel): ?>
        <fieldset class="field">
            <legend>Aplicar alterações a</legend>
            <div class="radio-group radio-stack">
                <label class="radio"><input type="radio" name="escopo" value="esta" checked> Só esta parcela (<?= (int) $transaction['installment_number'] ?>/<?= (int) $transaction['installment_count'] ?>)</label>
                <label class="radio"><input type="radio" name="escopo" value="proximas"> Esta e as próximas</label>
                <label class="radio"><input type="radio" name="escopo" value="todas"> Todas as parcelas</label>
            </div>
        </fieldset>
    <?php endif; ?>

    <div class="alert alert-warning budget-warning" data-budget-warning role="status" hidden></div>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary"><?= $isNew ? 'Lançar' : 'Salvar alterações' ?></button>
        <?php if (!$isNew): ?>
            <a href="<?= e(url($hidden['voltar'] ?? '/lancamentos')) ?>" class="btn">Cancelar</a>
        <?php endif; ?>
    </div>
</form>
