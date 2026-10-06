<?php
use App\Core\View;
use App\Models\Category;

$levelLabels = ['ok' => 'Dentro do limite', 'warning' => 'Acima de 80%', 'over' => 'Estourado'];
?>
<div class="page-header">
    <h1>Orçamentos</h1>
    <?php View::partial('partials/month_picker', ['month' => $month, 'path' => '/orcamentos']); ?>
</div>

<p class="muted">Defina um limite mensal por categoria. O limite é o mesmo todo mês; o gasto mostrado é de <?= e(month_label($month)) ?> (efetivados + pendentes). Deixe em branco para não ter limite.</p>

<form method="post" action="<?= e(url('/orcamentos/salvar')) ?>" class="card card-flush">
    <?= csrf_field() ?>
    <input type="hidden" name="mes" value="<?= e(month_param($month)) ?>">
    <ul class="budget-list">
        <?php foreach ($rows as $r): ?>
            <?php
            $value = $old['limits'][$r['id']] ?? ($r['limit_amount'] !== null ? money_input($r['limit_amount']) : '');
            $pct = $r['pct'];
            ?>
            <li class="budget-item<?= $r['active'] ? '' : ' is-inactive' ?>">
                <div class="budget-head">
                    <span class="tag" style="--tag-color: <?= e($r['color']) ?>"><?= e($r['name']) ?></span>
                    <span class="muted small"><?= $r['type'] === Category::TYPE_CARD ? 'Cartão' : 'Conta/carteira' ?><?= $r['active'] ? '' : ' · inativa' ?></span>
                </div>
                <label class="budget-input">
                    <span class="sr-only">Limite mensal de <?= e($r['name']) ?></span>
                    <span class="input-prefix">
                        <span>R$</span>
                        <input type="text" name="limits[<?= (int) $r['id'] ?>]" value="<?= e($value) ?>" inputmode="decimal" placeholder="Sem limite" autocomplete="off" data-money>
                    </span>
                </label>
                <div class="budget-progress">
                    <?php if ($pct === null): ?>
                        <span class="muted small">Gasto no mês: <?= e(money($r['spent'])) ?></span>
                    <?php else: ?>
                        <div class="progress progress-<?= e($r['level']) ?>" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                             aria-valuenow="<?= (int) min(100, round($pct)) ?>" aria-label="<?= e($r['name']) ?>: <?= number_format($pct, 0, ',', '.') ?>% do limite">
                            <span style="width: <?= min(100, $pct) ?>%"></span>
                        </div>
                        <div class="budget-numbers small">
                            <span><?= e(money($r['spent'])) ?> de <?= e(money($r['limit_amount'])) ?> · <strong><?= number_format($pct, 0, ',', '.') ?>%</strong></span>
                            <span class="level level-<?= e($r['level']) ?>">
                                <?= e($levelLabels[$r['level']]) ?>
                                <?php if ($pct > 100): ?>(+<?= e(money($r['spent'] - $r['limit_amount'])) ?>)<?php else: ?>· restam <?= e(money($r['limit_amount'] - $r['spent'])) ?><?php endif; ?>
                            </span>
                        </div>
                    <?php endif; ?>
                </div>
            </li>
        <?php endforeach; ?>
    </ul>
    <div class="card-footer">
        <button type="submit" class="btn btn-primary">Salvar limites</button>
    </div>
</form>
