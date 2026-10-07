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
        <div class="summary">
            <div class="summary-item"><span>Entradas</span><strong class="amount-in"><?= e(money($totals['income'])) ?></strong></div>
            <div class="summary-item"><span>Saídas</span><strong class="amount-out"><?= e(money($totals['expense'])) ?></strong></div>
            <div class="summary-item"><span>Diferença</span><strong><?= e(money($totals['income'] - $totals['expense'])) ?></strong></div>
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
