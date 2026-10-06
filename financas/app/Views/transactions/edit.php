<?php use App\Core\View; ?>
<div class="page-header">
    <h1>Editar lançamento</h1>
</div>

<section class="card form-narrow">
    <?php if ($transaction['installment_group_id'] !== null): ?>
        <div class="alert alert-info">
            Parcela <?= (int) $transaction['installment_number'] ?> de <?= (int) $transaction['installment_count'] ?>
            da compra "<?= e($transaction['group_description']) ?>".
        </div>
    <?php endif; ?>
    <?php View::partial('partials/transaction_form', [
        'form'         => $form,
        'categories'   => $categories,
        'descriptions' => $descriptions,
        'action'       => '/lancamentos/atualizar',
        'transaction'  => $transaction,
        'hidden'       => ['id' => $transaction['id'], 'voltar' => $returnTo],
    ]); ?>
</section>
