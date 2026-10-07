<?php
use App\Core\View;
use App\Models\Transaction;

$returnTo = '/diario?mes=' . month_param($month);
$weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
$categoryTotal = array_sum(array_map(static fn ($c) => (float) $c['total'], $byCategory));
?>
<div class="page-header">
    <h1>Controle diário</h1>
    <?php View::partial('partials/month_picker', ['month' => $month, 'path' => '/diario']); ?>
</div>

<div class="split">
    <section class="card split-side">
        <div class="section-header">
            <h2>Novo gasto</h2>
            <a href="<?= e(url('/diario/categorias')) ?>" class="small">Gerenciar categorias</a>
        </div>
<?php if (!$categories): ?>
    <div class="alert alert-warning">Antes de lançar, cadastre pelo menos uma conta ou cartão em <a href="<?= e(url('/categorias/nova')) ?>">Contas e cartões</a>.</div>
<?php endif; ?>
        <form method="post" action="<?= e(url('/lancamentos/salvar')) ?>" class="form" data-tx-form data-budget-url="<?= e(url('/orcamentos/consulta')) ?>">
            <?= csrf_field() ?>
            <input type="hidden" name="type" value="saida">
            <input type="hidden" name="mode" value="unico">
            <input type="hidden" name="is_daily" value="1">
            <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">

            <div class="field-row">
                <label class="field">
                    <span>Valor</span>
                    <div class="input-prefix">
                        <span>R$</span>
                        <input type="text" name="amount" value="<?= e($form['amount']) ?>" required inputmode="decimal" placeholder="0,00" autocomplete="off" data-money autofocus>
                    </div>
                </label>
                <label class="field">
                    <span>Data</span>
                    <input type="date" name="transaction_date" value="<?= e($form['transaction_date']) ?>" required
                           min="<?= APP_MIN_YEAR ?>-01-01" max="<?= APP_MAX_YEAR ?>-12-31" data-date>
                </label>
            </div>

            <label class="field">
                <span>O que foi?</span>
                <input type="text" name="description" value="<?= e($form['description']) ?>" required maxlength="200"
                       list="descriptions" autocomplete="off" placeholder="Ex.: Energético Monster">
                <datalist id="descriptions">
                    <?php foreach ($descriptions as $d): ?>
                        <option value="<?= e($d) ?>">
                    <?php endforeach; ?>
                </datalist>
            </label>

            <fieldset class="field">
                <legend>Categoria</legend>
                <?php if (!$expenseCategories): ?>
                    <p class="muted small">Nenhuma categoria ativa. <a href="<?= e(url('/diario/categorias/nova')) ?>">Crie uma</a>.</p>
                <?php endif; ?>
                <div class="chip-group">
                    <?php foreach ($expenseCategories as $ec): ?>
                        <label class="chip" style="--tag-color: <?= e($ec['color']) ?>">
                            <input type="radio" name="expense_category_id" value="<?= (int) $ec['id'] ?>" required
                                <?= (string) $form['expense_category_id'] === (string) $ec['id'] ? 'checked' : '' ?>>
                            <span><?= e($ec['name']) ?></span>
                        </label>
                    <?php endforeach; ?>
                </div>
            </fieldset>

            <label class="field">
                <span>De qual conta ou cartão saiu?</span>
                <?php View::partial('partials/origin_select', ['categories' => $categories, 'selected' => $form['category_id']]); ?>
            </label>

            <fieldset class="field">
                <legend>Como foi pago?</legend>
                <?php View::partial('partials/payment_options', ['selected' => $form['payment_method']]); ?>
            </fieldset>

            <div class="sub-box" data-show="payment_method=credito">
                <?php View::partial('partials/month_fields', [
                    'prefix' => 'invoice', 'label' => 'Em qual mês cai na fatura?',
                    'month' => $form['invoice_month'] ?? null, 'year' => $form['invoice_year'] ?? null, 'attr' => 'data-suggest="invoice"',
                ]); ?>
                <small class="muted small" data-suggest-hint></small>
            </div>

            <?php View::partial('partials/paid_question', ['selected' => $form['paid'] ?? '']); ?>

            <div class="alert alert-warning budget-warning" data-budget-warning role="status" hidden></div>

            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Lançar gasto</button>
            </div>
        </form>
    </section>

    <section class="split-main">
        <div class="summary">
            <div class="summary-item"><span>Total em <?= e(month_name((int) $month->format('n'))) ?></span><strong class="amount-out"><?= e(money($total)) ?></strong></div>
            <?php if ($todayTotal !== null): ?>
                <div class="summary-item"><span>Hoje</span><strong><?= e(money($todayTotal)) ?></strong></div>
            <?php endif; ?>
            <div class="summary-item"><span>Média por dia</span><strong><?= e(money($average)) ?></strong></div>
        </div>

        <?php if ($byCategory): ?>
            <div class="card">
                <h2>Por categoria</h2>
                <ul class="category-bars">
                    <?php foreach ($byCategory as $c): ?>
                        <?php $pct = $categoryTotal > 0 ? (float) $c['total'] / $categoryTotal * 100 : 0; ?>
                        <li>
                            <div class="category-bars-head">
                                <span class="tag" style="--tag-color: <?= e($c['color']) ?>"><?= e($c['name']) ?></span>
                                <span><strong><?= e(money($c['total'])) ?></strong> <span class="muted small"><?= number_format($pct, 0, ',', '.') ?>% · <?= (int) $c['items'] ?> gasto(s)</span></span>
                            </div>
                            <div class="bar-track"><span style="width: <?= $pct ?>%; background: <?= e($c['color']) ?>"></span></div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <div class="card card-flush">
            <?php if (!$byDay): ?>
                <div class="empty-state">Nenhum gasto do dia a dia em <?= e(month_label($month)) ?>.</div>
            <?php endif; ?>
            <?php foreach ($byDay as $date => $dayItems): ?>
                <?php $d = new DateTimeImmutable($date); ?>
                <div class="day-header">
                    <span><?= e($weekdays[(int) $d->format('w')]) ?>, <?= e(date_br($date)) ?></span>
                    <strong><?= e(money(array_sum(array_map(static fn ($t) => (float) $t['amount'], $dayItems)))) ?></strong>
                </div>
                <ul class="daily-list">
                    <?php foreach ($dayItems as $t): ?>
                        <li>
                            <div class="daily-main">
                                <span class="daily-desc"><?= e($t['description']) ?>
                                    <?php if ($t['status'] === 'pendente'): ?>
                                        <span class="badge <?= $t['transaction_date'] < date('Y-m-d') ? 'badge-danger">Vencido' : 'badge-warning">A pagar' ?></span>
                                    <?php endif; ?>
                                </span>
                                <span class="daily-meta">
                                    <?php if ($t['expense_name']): ?><span class="tag tag-small" style="--tag-color: <?= e($t['expense_color']) ?>"><?= e($t['expense_name']) ?></span><?php endif; ?>
                                    <span class="muted small"><?= e($t['category_name']) ?> · <?= e(Transaction::PAYMENT_LABELS[$t['payment_method']] ?? '') ?><?= $t['payment_method'] === 'credito' ? ' (fatura de ' . e(month_label($t['competence_month'])) . ')' : '' ?></span>
                                </span>
                            </div>
                            <span class="daily-amount"><?= e(money($t['amount'])) ?></span>
                            <div class="actions">
                                <a class="btn btn-small" href="<?= e(url('/lancamentos/editar', ['id' => $t['id'], 'voltar' => $returnTo])) ?>">Editar</a>
                                <form method="post" action="<?= e(url('/lancamentos/excluir')) ?>" data-confirm="Excluir &quot;<?= e($t['description']) ?>&quot;?">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                    <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                    <button type="submit" class="btn btn-small btn-danger">Excluir</button>
                                </form>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endforeach; ?>
        </div>
    </section>
</div>
