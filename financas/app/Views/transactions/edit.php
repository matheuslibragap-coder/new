<?php
use App\Core\View;
use App\Models\Transaction;
?>
<div class="page-header">
    <h1>Editar lançamento</h1>
</div>

<section class="card form-narrow">
    <?php if ($transaction['installment_group_id'] !== null): ?>
        <div class="alert alert-info">
            <?php if ($transaction['group_kind'] === Transaction::GROUP_RECURRING): ?>
                Lançamento recorrente: mês <?= (int) $transaction['installment_number'] ?> de <?= (int) $transaction['installment_count'] ?>
                de "<?= e($transaction['group_description']) ?>".
            <?php else: ?>
                Parcela <?= (int) $transaction['installment_number'] ?> de <?= (int) $transaction['installment_count'] ?>
                da compra "<?= e($transaction['group_description']) ?>".
            <?php endif; ?>
        </div>
    <?php endif; ?>
    <?php View::partial('partials/transaction_edit_form', [
        'form'              => $form,
        'transaction'       => $transaction,
        'categories'        => $categories,
        'expenseCategories' => $expenseCategories,
        'descriptions'      => $descriptions,
        'hidden'            => ['id' => $transaction['id'], 'voltar' => $returnTo],
    ]); ?>
</section>
