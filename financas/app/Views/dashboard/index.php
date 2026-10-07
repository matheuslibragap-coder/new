<?php
use App\Core\View;
use App\Models\Budget;

$overdueTotal = array_sum(array_map(static fn ($r) => (float) $r['amount'], $overdue));
?>
<div class="page-header">
    <h1>Painel</h1>
    <?php View::partial('partials/month_picker', ['month' => $month, 'path' => '/']); ?>
</div>

<?php if ($overdue || $alerts): ?>
    <div class="alerts-list">
        <?php if ($overdue): ?>
            <div class="alert alert-error alert-row">
                <span><strong><?= count($overdue) ?> conta(s) atrasada(s)</strong> somando <?= e(money($overdueTotal)) ?>:
                    <?= e(implode(', ', array_map(static fn ($r) => $r['description'] . ' (venceu ' . date_br($r['transaction_date']) . ')', array_slice($overdue, 0, 4)))) ?><?= count($overdue) > 4 ? '…' : '' ?></span>
                <a href="<?= e(url('/lancamentos', ['mes' => substr($overdue[0]['competence_month'], 0, 7)])) ?>" class="alert-link">Ver</a>
            </div>
        <?php endif; ?>
        <?php foreach ($alerts as $a): ?>
            <div class="alert <?= $a['level'] === Budget::LEVEL_OVER ? 'alert-error' : 'alert-warning' ?> alert-row">
                <span>
                    <strong><?= e($a['name']) ?></strong>
                    <?= $a['level'] === Budget::LEVEL_OVER ? 'estourou o orçamento' : 'passou de 80% do orçamento' ?>:
                    <?= e(money($a['spent'])) ?> de <?= e(money($a['limit_amount'])) ?> (<?= number_format($a['pct'], 0, ',', '.') ?>%)
                </span>
                <a href="<?= e(url('/orcamentos', ['mes' => month_param($month)])) ?>" class="alert-link">Orçamentos</a>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<div class="stats">
    <div class="stat">
        <span class="stat-label">Entradas</span>
        <strong class="stat-value"><?= e(money($summary['income_done'])) ?></strong>
        <?php if ($summary['income_pending'] > 0): ?><span class="stat-note">+ <?= e(money($summary['income_pending'])) ?> previstas</span><?php endif; ?>
    </div>
    <div class="stat">
        <span class="stat-label">Saídas efetivadas</span>
        <strong class="stat-value"><?= e(money($summary['expense_done'])) ?></strong>
        <span class="stat-note"><?= $summary['expense_pending'] > 0 ? '+ ' . e(money($summary['expense_pending'])) . ' pendentes' : 'Nenhuma conta pendente' ?></span>
    </div>
    <div class="stat stat-strong">
        <span class="stat-label">Saldo atual</span>
        <strong class="stat-value <?= $current < 0 ? 'amount-out' : '' ?>"><?= e(money($current)) ?></strong>
        <span class="stat-note">Só lançamentos efetivados</span>
    </div>
    <div class="stat stat-strong">
        <span class="stat-label">Saldo previsto</span>
        <strong class="stat-value <?= $forecast < 0 ? 'amount-out' : '' ?>"><?= e(money($forecast)) ?></strong>
        <span class="stat-note">Depois de pagar as pendentes</span>
    </div>
</div>

<div class="charts">
    <section class="card chart-card">
        <h2>Gastos por conta/cartão</h2>
        <?php if (!$byCategory): ?>
            <div class="empty-state">Nenhuma saída em <?= e(month_label($month)) ?>.</div>
        <?php else: ?>
            <div class="donut-layout">
                <div class="donut">
                    <canvas id="chart-categories" role="img" aria-label="Gráfico de rosca dos gastos por categoria em <?= e(month_label($month)) ?>"></canvas>
                    <div class="donut-center"><span>Total</span><strong><?= e(money($expenseSum)) ?></strong></div>
                </div>
                <table class="legend-table">
                    <caption class="sr-only">Gastos por conta/cartão</caption>
                    <tbody>
                    <?php foreach ($byCategory as $c): ?>
                        <tr>
                            <td><span class="tag" style="--tag-color: <?= e($c['color']) ?>"><?= e($c['name']) ?></span></td>
                            <td class="num"><?= e(money($c['total'])) ?></td>
                            <td class="num muted"><?= number_format((float) $c['total'] / $expenseSum * 100, 1, ',', '.') ?>%</td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </section>

    <section class="card chart-card">
        <h2>Gastos por categoria</h2>
        <?php if (!$byExpense): ?>
            <div class="empty-state">Nenhuma saída em <?= e(month_label($month)) ?>.</div>
        <?php else: ?>
            <div class="donut-layout">
                <div class="donut">
                    <canvas id="chart-expenses" role="img" aria-label="Gráfico de rosca dos gastos por categoria de gasto em <?= e(month_label($month)) ?>"></canvas>
                    <div class="donut-center"><span>Total</span><strong><?= e(money($expenseSum)) ?></strong></div>
                </div>
                <table class="legend-table">
                    <caption class="sr-only">Gastos por categoria de gasto</caption>
                    <tbody>
                    <?php foreach ($byExpense as $c): ?>
                        <tr>
                            <td><span class="tag" style="--tag-color: <?= e($c['color']) ?>"><?= e($c['name']) ?></span></td>
                            <td class="num"><?= e(money($c['total'])) ?></td>
                            <td class="num muted"><?= number_format((float) $c['total'] / $expenseSum * 100, 1, ',', '.') ?>%</td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </section>

    <section class="card chart-card chart-wide">
        <h2>Entradas x saídas · últimos 6 meses</h2>
        <div class="bar-chart">
            <canvas id="chart-months" role="img" aria-label="Gráfico de barras com entradas e saídas dos últimos 6 meses"></canvas>
        </div>
        <details class="chart-table">
            <summary>Ver em tabela</summary>
            <table class="table">
                <thead><tr><th>Mês</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Diferença</th></tr></thead>
                <tbody>
                <?php foreach ($series as $s): ?>
                    <tr>
                        <td><?= e(month_label($s['month'])) ?></td>
                        <td class="num"><?= e(money($s['income'])) ?></td>
                        <td class="num"><?= e(money($s['expense'])) ?></td>
                        <td class="num"><?= e(money($s['income'] - $s['expense'])) ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </details>
    </section>
</div>

<?php if ($upcoming): ?>
    <section class="card card-flush">
        <div class="card-title">A pagar em <?= e(month_label($month)) ?></div>
        <ul class="upcoming">
            <?php foreach ($upcoming as $u): ?>
                <li>
                    <span class="upcoming-date"><?= e(date_br($u['transaction_date'])) ?></span>
                    <span class="upcoming-name"><?= e($u['description']) ?> <span class="tag" style="--tag-color: <?= e($u['category_color']) ?>"><?= e($u['category_name']) ?></span></span>
                    <span class="num"><?= e(money($u['amount'])) ?></span>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
<?php endif; ?>

<script type="application/json" id="dashboard-data"><?= json_encode($chartData, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) ?></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"
        integrity="sha384-dug+JxfBvklEQdJ4AYuBBAIScUz0bVN73xpy273gcAwHjb3qI0fXmuYNaNfdyYJG"
        crossorigin="anonymous"></script>
