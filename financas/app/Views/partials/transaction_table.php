<?php
/**
 * Tabela de lançamentos. Variáveis: $items, $returnTo (rota para voltar após editar/excluir),
 * $emptyMessage, $showCompetence (bool)
 */
$showCompetence = $showCompetence ?? false;
?>
<?php if (!$items): ?>
    <div class="empty-state"><?= e($emptyMessage ?? 'Nenhum lançamento encontrado.') ?></div>
<?php else: ?>
    <div class="table-scroll">
    <table class="table table-responsive">
        <thead>
        <tr>
            <th>Descrição</th>
            <th>Data</th>
            <?php if ($showCompetence): ?><th>Competência</th><?php endif; ?>
            <th>Conta/cartão</th>
            <th class="num">Valor</th>
            <th class="col-actions"><span class="sr-only">Ações</span></th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($items as $t): ?>
            <?php
            $isIn = $t['type'] === 'entrada';
            $isPending = $t['status'] === 'pendente';
            $isParcel = $t['installment_group_id'] !== null;
            $query = ['id' => $t['id'], 'voltar' => $returnTo];
            ?>
            <tr class="<?= $isPending ? 'is-pending' : '' ?>">
                <td data-label="Descrição" class="cell-main">
                    <span class="tx-description"><?= e($t['description']) ?></span>
                    <?php if ($isPending): ?><span class="badge badge-warning">Pendente</span><?php endif; ?>
                    <?php if (!empty($t['expense_name'])): ?><span class="tag tag-small" style="--tag-color: <?= e($t['expense_color']) ?>"><?= e($t['expense_name']) ?></span><?php endif; ?>
                    <?php if (($t['group_kind'] ?? '') === 'recorrente'): ?><span class="badge">Recorrente <?= (int) $t['installment_number'] ?>/<?= (int) $t['installment_count'] ?></span><?php endif; ?>
                    <?php if (!empty($t['is_daily'])): ?><span class="badge">Diário</span><?php endif; ?>
                    <?php if (!empty($t['payment_method'])): ?><span class="badge"><?= e(\App\Models\Transaction::PAYMENT_LABELS[$t['payment_method']] ?? '') ?></span><?php endif; ?>
                </td>
                <td data-label="Data"><?= e(date_br($t['transaction_date'])) ?></td>
                <?php if ($showCompetence): ?>
                    <td data-label="Competência"><?= e(month_label($t['competence_month'])) ?></td>
                <?php endif; ?>
                <td data-label="Conta/cartão"><span class="tag" style="--tag-color: <?= e($t['category_color']) ?>"><?= e($t['category_name']) ?></span></td>
                <td data-label="Valor" class="num <?= $isIn ? 'amount-in' : 'amount-out' ?>"><?= $isIn ? '+' : '−' ?> <?= e(money($t['amount'])) ?></td>
                <td class="col-actions">
                    <div class="actions">
                        <?php if ($isPending): ?>
                            <form method="post" action="<?= e(url('/contas/pagar')) ?>">
                                <?= csrf_field() ?>
                                <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                <button type="submit" class="btn btn-small btn-success">Pagar</button>
                            </form>
                        <?php elseif ($t['recurring_bill_id'] !== null): ?>
                            <form method="post" action="<?= e(url('/contas/desfazer-pagamento')) ?>" data-confirm="Desfazer o pagamento de &quot;<?= e($t['description']) ?>&quot;?">
                                <?= csrf_field() ?>
                                <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                <button type="submit" class="btn btn-small">Desfazer</button>
                            </form>
                        <?php endif; ?>
                        <a class="btn btn-small" href="<?= e(url('/lancamentos/editar', $query)) ?>">Editar</a>
                        <?php if ($isParcel): ?>
                            <a class="btn btn-small btn-danger" href="<?= e(url('/lancamentos/excluir', $query)) ?>">Excluir</a>
                        <?php else: ?>
                            <form method="post" action="<?= e(url('/lancamentos/excluir')) ?>" data-confirm="Excluir &quot;<?= e($t['description']) ?>&quot;?">
                                <?= csrf_field() ?>
                                <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                <button type="submit" class="btn btn-small btn-danger">Excluir</button>
                            </form>
                        <?php endif; ?>
                    </div>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
<?php endif; ?>
