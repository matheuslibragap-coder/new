<?php
use App\Core\View;

$v = static fn (string $key, mixed $default = '') => old($old, $key, $bill[$key] ?? $default);
$amount = $old['amount'] ?? ($bill ? money_input($bill['amount']) : '');
$now = new DateTimeImmutable('first day of this month');
$end = !empty($bill['end_month']) ? new DateTimeImmutable($bill['end_month']) : $now->modify('+11 months');
$hasEnd = $old ? !empty($old['has_end']) : !empty($bill['end_month']);
$isOptional = $kind === 'opcional';
?>
<div class="page-header">
    <h1><?= e($title) ?></h1>
</div>

<?php if (!$categories): ?>
    <div class="alert alert-warning">Antes de lançar, cadastre pelo menos uma conta ou cartão em <a href="<?= e(url('/categorias/nova')) ?>">Contas e cartões</a>.</div>
<?php endif; ?>
<form method="post" action="<?= e(url('/contas/salvar')) ?>" class="card form form-narrow">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) ($bill['id'] ?? 0) ?>">
    <input type="hidden" name="tipo" value="<?= e($kind) ?>">

    <label class="field">
        <span>Nome</span>
        <input type="text" name="name" value="<?= e($v('name')) ?>" required maxlength="100" autofocus
               placeholder="<?= $isOptional ? 'Ex.: YT Premium, Netflix, Academia' : 'Ex.: Aluguel, Luz, Internet' ?>">
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
            <span>Dia de vencimento ou cobrança</span>
            <input type="number" name="due_day" value="<?= e($v('due_day')) ?>" required min="1" max="31" inputmode="numeric">
        </label>
    </div>

    <label class="field">
        <span>Em qual cartão ou conta é cobrada?</span>
        <?php View::partial('partials/origin_select', ['categories' => $categories, 'selected' => $v('category_id')]); ?>
        <small class="muted small">Ex.: o YT Premium cobrado no CC Nubank M. Para cadastrar outro cartão, use a aba <a href="<?= e(url('/categorias')) ?>">Contas e cartões</a>.</small>
    </label>

    <label class="field">
        <span>Categoria do gasto <small class="muted">(opcional)</small></span>
        <select name="expense_category_id">
            <option value="">Sem categoria</option>
            <?php foreach ($expenseCategories as $ec): ?>
                <option value="<?= (int) $ec['id'] ?>" <?= (string) $v('expense_category_id') === (string) $ec['id'] ? 'selected' : '' ?>><?= e($ec['name']) ?></option>
            <?php endforeach; ?>
        </select>
    </label>

    <?php if ($bill === null): ?>
        <?php View::partial('partials/month_fields', [
            'prefix' => 'start', 'label' => 'Primeiro mês',
            'month' => $old['start_month'] ?? $now->format('n'), 'year' => $old['start_year'] ?? $now->format('Y'),
        ]); ?>
    <?php endif; ?>

    <label class="checkbox">
        <input type="checkbox" name="has_end" value="1" <?= $hasEnd ? 'checked' : '' ?> data-toggle-target="end-fields">
        Tem data para acabar
    </label>
    <div id="end-fields" class="sub-box" <?= $hasEnd ? '' : 'hidden' ?>>
        <?php View::partial('partials/month_fields', [
            'prefix' => 'end', 'label' => 'Último mês',
            'month' => $old['end_month'] ?? $end->format('n'), 'year' => $old['end_year'] ?? $end->format('Y'),
        ]); ?>
    </div>

    <p class="muted small">
        <?= $bill === null
            ? 'Todo mês a conta aparece como pendente até você marcar como paga. Sem data para acabar, ela continua sendo lançada até você desativar.'
            : 'Alterações valem para os lançamentos pendentes a partir deste mês. Contas já pagas não mudam.' ?>
    </p>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="<?= e(url($backPath)) ?>" class="btn">Cancelar</a>
    </div>
</form>
