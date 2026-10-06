<?php $isParcel = $transaction['installment_group_id'] !== null; ?>
<div class="page-header">
    <h1>Excluir lançamento</h1>
</div>

<form method="post" action="<?= e(url('/lancamentos/excluir')) ?>" class="card form form-narrow">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) $transaction['id'] ?>">
    <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">

    <p>
        <strong><?= e($transaction['description']) ?></strong><br>
        <span class="muted"><?= e(money($transaction['amount'])) ?> · <?= e(date_br($transaction['transaction_date'])) ?>
        · competência <?= e(month_label($transaction['competence_month'])) ?></span>
    </p>

    <?php if ($isParcel): ?>
        <fieldset class="field">
            <legend>O que excluir?</legend>
            <div class="radio-group radio-stack">
                <label class="radio"><input type="radio" name="escopo" value="esta" checked> Só esta parcela</label>
                <label class="radio"><input type="radio" name="escopo" value="proximas"> Esta e as próximas</label>
                <label class="radio"><input type="radio" name="escopo" value="todas"> Todas as <?= (int) $transaction['installment_count'] ?> parcelas</label>
            </div>
        </fieldset>
    <?php endif; ?>

    <div class="form-actions">
        <button type="submit" class="btn btn-danger-solid">Excluir</button>
        <a href="<?= e(url($returnTo)) ?>" class="btn">Cancelar</a>
    </div>
</form>
