<div class="page-header">
    <h1>Marcar como paga</h1>
</div>

<form method="post" action="<?= e(url('/contas/pagar')) ?>" class="card form form-narrow">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) $transaction['id'] ?>">
    <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">

    <p>
        <strong><?= e($transaction['description']) ?></strong><br>
        <span class="muted">Vencimento <?= e(date_br($transaction['transaction_date'])) ?> · competência <?= e(month_label($transaction['competence_month'])) ?></span>
    </p>

    <div class="field-row">
        <label class="field">
            <span>Valor pago</span>
            <div class="input-prefix">
                <span>R$</span>
                <input type="text" name="amount" value="<?= e(old($old, 'amount', money_input($transaction['amount']))) ?>" required inputmode="decimal" autocomplete="off" data-money>
            </div>
        </label>
        <label class="field">
            <span>Data do pagamento</span>
            <input type="date" name="paid_at" value="<?= e(old($old, 'paid_at', date('Y-m-d'))) ?>" required>
        </label>
    </div>

    <div class="form-actions">
        <button type="submit" class="btn btn-success-solid">Confirmar pagamento</button>
        <a href="<?= e(url($returnTo)) ?>" class="btn">Cancelar</a>
    </div>
</form>
