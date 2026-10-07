<?php
use App\Core\View;

$returnTo = '/lancamentos?mes=' . month_param($month);
?>
<div class="page-header">
    <h1>Lançamentos</h1>
    <?php View::partial('partials/month_picker', ['month' => $month, 'path' => '/lancamentos']); ?>
</div>

<div class="split">
    <section class="card split-side">
        <h2>Novo lançamento</h2>
        <?php View::partial('partials/transaction_form', [
            'form'              => $form,
            'categories'        => $categories,
            'expenseCategories' => $expenseCategories,
            'descriptions'      => $descriptions,
            'hidden'            => ['mes' => month_param($month)],
        ]); ?>
    </section>

    <section class="split-main">
        <?php $balance = $totals['income_done'] - $totals['expense_done']; ?>
        <div class="summary">
            <div class="summary-item">
                <span>Entradas recebidas</span><strong class="amount-in"><?= e(money($totals['income_done'])) ?></strong>
                <?php if ($totals['income_pending'] > 0): ?><small class="muted">+ <?= e(money($totals['income_pending'])) ?> a receber</small><?php endif; ?>
            </div>
            <div class="summary-item"><span>Saídas pagas</span><strong class="amount-out"><?= e(money($totals['expense_done'])) ?></strong></div>
            <div class="summary-item">
                <span>A pagar</span><strong><?= e(money($totals['pending'])) ?></strong>
                <?php if ($totals['overdue'] > 0): ?><small class="amount-out"><?= e(money($totals['overdue'])) ?> vencido</small><?php endif; ?>
            </div>
            <div class="summary-item">
                <span>Saldo atual</span><strong class="<?= $balance < 0 ? 'amount-out' : '' ?>"><?= e(money($balance)) ?></strong>
                <small class="muted">Previsto: <?= e(money($totals['income'] - $totals['expense'])) ?></small>
            </div>
        </div>
        <div class="card card-flush">
            <div class="card-title">Competência <?= e(month_label($month)) ?> · <?= $totals['count'] ?> lançamento(s)</div>
            <?php View::partial('partials/transaction_table', [
                'items'        => $items,
                'returnTo'     => $returnTo,
                'emptyMessage' => 'Nenhum lançamento nesta competência.',
            ]); ?>
        </div>
    </section>
</div>
