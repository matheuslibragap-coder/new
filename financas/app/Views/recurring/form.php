<?php
use App\Models\Category;

$v = static fn (string $key, mixed $default = '') => old($old, $key, $bill[$key] ?? $default);
$amount = $old['amount'] ?? ($bill ? money_input($bill['amount']) : '');
$startMonth = old($old, 'start_month', date('Y-m'));
?>
<div class="page-header">
    <h1><?= e($title) ?></h1>
</div>

<form method="post" action="<?= e(url('/contas/salvar')) ?>" class="card form form-narrow">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) ($bill['id'] ?? 0) ?>">
    <input type="hidden" name="tipo" value="<?= e($kind) ?>">

    <label class="field">
        <span>Nome</span>
        <input type="text" name="name" value="<?= e($v('name')) ?>" required maxlength="100" autofocus
               placeholder="<?= $kind === 'opcional' ? 'Ex.: Netflix, Academia' : 'Ex.: Aluguel, Luz, Internet' ?>">
    </label>

    <div class="field-row">
        <label class="field">
            <span>Valor mensal</span>
            <div class="input-prefix">
                <span>R$</span>
                <input type="text" name="amount" value="<?= e($amount) ?>" required inputmode="decimal" placeholder="0,00" autocomplete="off" data-money>
            </div>
        </label>
        <label class="field">
            <span>Dia de vencimento</span>
            <input type="number" name="due_day" value="<?= e($v('due_day')) ?>" required min="1" max="31" inputmode="numeric">
        </label>
    </div>

    <label class="field">
        <span>Categoria (onde é paga)</span>
        <select name="category_id" required>
            <option value="">Selecione…</option>
            <?php foreach ($categories as $c): ?>
                <option value="<?= (int) $c['id'] ?>" <?= (string) $v('category_id') === (string) $c['id'] ? 'selected' : '' ?>>
                    <?= e($c['name']) ?><?= $c['active'] ? '' : ' (inativa)' ?> · <?= $c['type'] === Category::TYPE_CARD ? 'cartão' : 'conta' ?>
                </option>
            <?php endforeach; ?>
        </select>
    </label>

    <?php if ($bill === null): ?>
        <label class="field">
            <span>Lançar a partir de</span>
            <select name="start_month">
                <?php $first = (new DateTimeImmutable('first day of this month'))->modify('-12 months'); ?>
                <?php for ($i = 0; $i <= 24; $i++): $m = $first->modify("+{$i} month"); ?>
                    <option value="<?= e(month_param($m)) ?>" <?= $startMonth === month_param($m) ? 'selected' : '' ?>><?= e(month_label($m)) ?></option>
                <?php endfor; ?>
            </select>
            <small class="muted small">Todo mês a conta aparece como pendente até você marcar como paga.</small>
        </label>
    <?php else: ?>
        <p class="muted small">Alterações valem para os lançamentos pendentes a partir deste mês. Contas já pagas não mudam.</p>
    <?php endif; ?>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="<?= e(url($backPath)) ?>" class="btn">Cancelar</a>
    </div>
</form>
