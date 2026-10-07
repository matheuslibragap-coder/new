<?php
use App\Core\View;

$activeParams = array_filter($params, static fn ($v) => $v !== '' && $v !== null);
$pageUrl = static fn (int $p) => url('/historico', $activeParams + ($p > 1 ? ['pagina' => $p] : []));
?>
<div class="page-header">
    <h1>Histórico</h1>
    <a class="btn" href="<?= e(url('/historico/exportar', $activeParams)) ?>">Exportar CSV</a>
</div>

<form method="get" action="<?= e(url('/historico')) ?>" class="card filters">
    <label class="field">
        <span>Competência</span>
        <select name="mes">
            <option value="">Todos os meses</option>
            <?php foreach ($months as $m): ?>
                <option value="<?= e(substr($m, 0, 7)) ?>" <?= $params['mes'] === substr($m, 0, 7) ? 'selected' : '' ?>><?= e(month_label($m)) ?></option>
            <?php endforeach; ?>
        </select>
    </label>
    <label class="field">
        <span>Conta/cartão</span>
        <select name="categoria">
            <option value="">Todas</option>
            <?php foreach ($categories as $c): ?>
                <option value="<?= (int) $c['id'] ?>" <?= (string) $params['categoria'] === (string) $c['id'] ? 'selected' : '' ?>>
                    <?= e($c['name']) ?><?= $c['active'] ? '' : ' (inativa)' ?>
                </option>
            <?php endforeach; ?>
        </select>
    </label>
    <label class="field">
        <span>Categoria de gasto</span>
        <select name="gasto">
            <option value="">Todas</option>
            <?php foreach ($expenseCategories as $ec): ?>
                <option value="<?= (int) $ec['id'] ?>" <?= (string) $params['gasto'] === (string) $ec['id'] ? 'selected' : '' ?>>
                    <?= e($ec['name']) ?><?= $ec['active'] ? '' : ' (inativa)' ?>
                </option>
            <?php endforeach; ?>
        </select>
    </label>
    <label class="field">
        <span>Tipo</span>
        <select name="tipo">
            <option value="">Entradas e saídas</option>
            <option value="entrada" <?= $params['tipo'] === 'entrada' ? 'selected' : '' ?>>Só entradas</option>
            <option value="saida" <?= $params['tipo'] === 'saida' ? 'selected' : '' ?>>Só saídas</option>
        </select>
    </label>
    <label class="field field-grow">
        <span>Buscar na descrição</span>
        <input type="search" name="q" value="<?= e($params['q']) ?>" placeholder="Ex.: mercado">
    </label>
    <div class="filters-actions">
        <button type="submit" class="btn btn-primary">Filtrar</button>
        <?php if ($activeParams): ?><a href="<?= e(url('/historico')) ?>" class="btn">Limpar</a><?php endif; ?>
    </div>
</form>

<div class="summary">
    <div class="summary-item"><span>Lançamentos</span><strong><?= $totals['count'] ?></strong></div>
    <div class="summary-item"><span>Entradas</span><strong class="amount-in"><?= e(money($totals['income'])) ?></strong></div>
    <div class="summary-item"><span>Saídas</span><strong class="amount-out"><?= e(money($totals['expense'])) ?></strong></div>
    <div class="summary-item"><span>Saldo</span><strong><?= e(money($totals['income'] - $totals['expense'])) ?></strong></div>
</div>
<?php if ($totals['pending'] > 0): ?>
    <p class="muted small">As saídas incluem <?= e(money($totals['pending'])) ?> em contas pendentes.</p>
<?php endif; ?>

<div class="card card-flush">
    <?php View::partial('partials/transaction_table', [
        'items'          => $items,
        'returnTo'       => $returnTo,
        'showCompetence' => true,
        'emptyMessage'   => $activeParams ? 'Nenhum lançamento com esses filtros.' : 'Nenhum lançamento cadastrado ainda.',
    ]); ?>
</div>

<?php if ($pages > 1): ?>
    <nav class="pagination" aria-label="Páginas">
        <?php if ($page > 1): ?><a class="btn" href="<?= e($pageUrl($page - 1)) ?>">‹ Anterior</a><?php endif; ?>
        <span class="muted">Página <?= $page ?> de <?= $pages ?></span>
        <?php if ($page < $pages): ?><a class="btn" href="<?= e($pageUrl($page + 1)) ?>">Próxima ›</a><?php endif; ?>
    </nav>
<?php endif; ?>
