<?php
use App\Core\View;
use App\Models\RecurringBill;

$isOptional = $kind === RecurringBill::KIND_OPTIONAL;
?>
<div class="page-header">
    <h1><?= e($title) ?></h1>
    <a href="<?= e(url('/contas/nova', ['tipo' => $kind])) ?>" class="btn btn-primary"><?= $isOptional ? 'Nova assinatura ou conta recorrente' : 'Nova conta' ?></a>
</div>

<?php if ($isOptional): ?>
    <?php
    $today = date('Y-m-d');
    $debtTotal = array_sum(array_map(static fn ($t) => (float) $t['amount'], $postponable));
    $debtPending = array_sum(array_map(static fn ($t) => $t['status'] === 'pendente' ? (float) $t['amount'] : 0, $postponable));
    ?>
    <div class="highlight">
        <div>
            <span class="highlight-label">Total mensal das assinaturas recorrentes</span>
            <strong class="highlight-value"><?= e(money($monthlyTotal)) ?></strong>
        </div>
        <p>Cortando todas, você economizaria <strong><?= e(money($monthlyTotal * 12)) ?></strong> por ano.</p>
    </div>

    <section>
        <div class="section-header">
            <h2>Dívidas postergáveis de <?= e(month_label($month)) ?></h2>
            <?php View::partial('partials/month_picker', ['month' => $month, 'path' => $path]); ?>
        </div>
        <p class="muted small">Lançamentos que você transformou em dívida postergável pelo botão <strong>"Postergável"</strong> na aba Lançamentos. Dá para marcar como pago ou adiar para o mês seguinte.</p>
        <div class="summary">
            <div class="summary-item"><span>Total no mês</span><strong><?= e(money($debtTotal)) ?></strong></div>
            <div class="summary-item"><span>Ainda a pagar</span><strong class="amount-out"><?= e(money($debtPending)) ?></strong></div>
        </div>
        <div class="card card-flush">
            <?php if (!$postponable): ?>
                <div class="empty-state">Nenhuma dívida postergável em <?= e(month_label($month)) ?>. Em Lançamentos, use o botão "Postergável" na linha de um pagamento.</div>
            <?php else: ?>
                <table class="table table-responsive">
                    <thead>
                    <tr>
                        <th>Dívida</th>
                        <th>Vencimento</th>
                        <th>Conta/cartão</th>
                        <th class="col-paid">Pago</th>
                        <th class="num">Valor</th>
                        <th class="col-actions"><span class="sr-only">Ações</span></th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($postponable as $t): ?>
                        <?php
                        $isPending = $t['status'] === 'pendente';
                        $isOverdue = $isPending && $t['transaction_date'] < $today;
                        ?>
                        <tr class="<?= $isOverdue ? 'is-overdue' : ($isPending ? 'is-pending' : '') ?>">
                            <td data-label="Dívida" class="cell-main">
                                <?= e($t['description']) ?>
                                <?php if ($isOverdue): ?><span class="badge badge-danger">Vencido</span><?php elseif ($isPending): ?><span class="badge badge-warning">A pagar</span><?php endif; ?>
                            </td>
                            <td data-label="Vencimento"><?= e(date_br($t['transaction_date'])) ?></td>
                            <td data-label="Conta/cartão"><span class="tag" style="--tag-color: <?= e($t['category_color']) ?>"><?= e($t['category_name']) ?></span></td>
                            <td data-label="Pago" class="col-paid">
                                <form method="post" action="<?= e(url('/lancamentos/pago')) ?>" data-paid-toggle>
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                    <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                    <input type="hidden" name="pago" value="<?= $isPending ? '1' : '0' ?>">
                                    <label class="paid-check" title="<?= $isPending ? 'Marcar como pago' : 'Desmarcar' ?>">
                                        <input type="checkbox" <?= $isPending ? '' : 'checked' ?>>
                                        <span class="sr-only">Pago: <?= e($t['description']) ?></span>
                                    </label>
                                    <noscript><button type="submit" class="btn btn-small"><?= $isPending ? 'Marcar' : 'Desmarcar' ?></button></noscript>
                                </form>
                            </td>
                            <td data-label="Valor" class="num"><?= e(money($t['amount'])) ?></td>
                            <td class="col-actions">
                                <div class="actions">
                                    <?php if ($isPending): ?>
                                        <form method="post" action="<?= e(url('/dividas/adiar')) ?>"<?= $t['installment_group_id'] !== null ? ' data-confirm="Adiar esta e as próximas parcelas em 1 mês?"' : '' ?>>
                                            <?= csrf_field() ?>
                                            <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                            <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                            <button type="submit" class="btn btn-small">Adiar 1 mês</button>
                                        </form>
                                    <?php endif; ?>
                                    <a class="btn btn-small" href="<?= e(url('/lancamentos/editar', ['id' => $t['id'], 'voltar' => $returnTo])) ?>">Editar</a>
                                    <form method="post" action="<?= e(url('/lancamentos/postergavel')) ?>" data-confirm="Deixar de tratar &quot;<?= e($t['description']) ?>&quot; como dívida postergável?">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                        <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                        <button type="submit" class="btn btn-small btn-danger">Remover</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </section>
<?php endif; ?>

<section>
    <div class="section-header">
        <h2><?= $isOptional ? 'Assinaturas e contas recorrentes de ' : 'Contas de ' ?><?= e(month_label($month)) ?></h2>
        <?php if (!$isOptional): ?>
            <?php View::partial('partials/month_picker', ['month' => $month, 'path' => $path]); ?>
        <?php endif; ?>
    </div>

    <div class="summary">
        <?php if (!$isOptional): ?>
            <div class="summary-item"><span>Total mensal</span><strong><?= e(money($monthlyTotal)) ?></strong></div>
        <?php endif; ?>
        <div class="summary-item"><span>Pago no mês</span><strong class="amount-in"><?= e(money($summary['paid'])) ?></strong></div>
        <div class="summary-item"><span>A pagar no mês</span><strong class="amount-out"><?= e(money($summary['pending'])) ?></strong></div>
        <div class="summary-item"><span>Atrasadas</span><strong class="<?= $summary['overdue'] ? 'amount-out' : '' ?>"><?= (int) $summary['overdue'] ?></strong></div>
    </div>

    <div class="card card-flush">
        <?php if (!$items): ?>
            <div class="empty-state">Nenhuma conta lançada nesta competência.</div>
        <?php else: ?>
            <table class="table table-responsive">
                <thead>
                <tr>
                    <th>Conta</th>
                    <th>Vencimento</th>
                    <th>Cartão/conta</th>
                    <th>Situação</th>
                    <th class="num">Valor</th>
                    <th class="col-actions"><span class="sr-only">Ações</span></th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($items as $t): ?>
                    <?php $isPaid = $t['status'] === 'efetivado'; ?>
                    <tr>
                        <td data-label="Conta" class="cell-main"><?= e($t['description']) ?></td>
                        <td data-label="<?= $isPaid ? 'Pago em' : 'Vencimento' ?>"><?= e(date_br($t['transaction_date'])) ?></td>
                        <td data-label="Cartão/conta"><span class="tag" style="--tag-color: <?= e($t['category_color']) ?>"><?= e($t['category_name']) ?></span></td>
                        <td data-label="Situação">
                            <?php if ($isPaid): ?>
                                <span class="badge badge-success">Paga</span>
                            <?php elseif ($t['overdue']): ?>
                                <span class="badge badge-danger">Atrasada</span>
                            <?php else: ?>
                                <span class="badge badge-warning">Pendente</span>
                            <?php endif; ?>
                        </td>
                        <td data-label="Valor" class="num"><?= e(money($t['amount'])) ?></td>
                        <td class="col-actions">
                            <div class="actions">
                                <?php if ($isPaid): ?>
                                    <form method="post" action="<?= e(url('/contas/desfazer-pagamento')) ?>" data-confirm="Desfazer o pagamento de &quot;<?= e($t['description']) ?>&quot;?">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                        <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                        <button type="submit" class="btn btn-small">Desfazer pagamento</button>
                                    </form>
                                <?php else: ?>
                                    <form method="post" action="<?= e(url('/contas/pagar')) ?>">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                        <input type="hidden" name="voltar" value="<?= e($returnTo) ?>">
                                        <button type="submit" class="btn btn-small btn-success">Marcar como paga</button>
                                    </form>
                                    <a class="btn btn-small" href="<?= e(url('/contas/pagar', ['id' => $t['id'], 'voltar' => $returnTo])) ?>">Outro valor/data</a>
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</section>

<section>
    <h2><?= $isOptional ? 'Cadastro de assinaturas e contas recorrentes' : 'Cadastro de contas' ?></h2>
    <div class="card card-flush">
        <?php if (!$bills): ?>
            <div class="empty-state">
                Nenhuma conta cadastrada.
                <?= $isOptional ? 'Ex.: YT Premium, streaming, academia.' : 'Ex.: aluguel, luz, internet.' ?>
            </div>
        <?php else: ?>
            <table class="table table-responsive">
                <thead>
                <tr>
                    <th>Nome</th>
                    <th>Vencimento</th>
                    <th>Cartão/conta</th>
                    <th>Situação</th>
                    <th class="num">Valor</th>
                    <th class="col-actions"><span class="sr-only">Ações</span></th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($bills as $b): ?>
                    <tr class="<?= $b['active'] ? '' : 'is-inactive' ?>">
                        <td data-label="Nome" class="cell-main">
                            <?= e($b['name']) ?>
                            <?php if ($b['expense_name']): ?><span class="tag tag-small" style="--tag-color: <?= e($b['expense_color']) ?>"><?= e($b['expense_name']) ?></span><?php endif; ?>
                            <span class="badge"><?= $b['end_month'] ? 'até ' . e(month_label($b['end_month'])) : 'sem data para acabar' ?></span>
                        </td>
                        <td data-label="Vencimento">Dia <?= (int) $b['due_day'] ?></td>
                        <td data-label="Cartão/conta"><span class="tag" style="--tag-color: <?= e($b['category_color']) ?>"><?= e($b['category_name']) ?></span></td>
                        <td data-label="Situação"><span class="status <?= $b['active'] ? 'status-ok' : 'status-off' ?>"><?= $b['active'] ? 'Ativa' : 'Inativa' ?></span></td>
                        <td data-label="Valor" class="num"><?= e(money($b['amount'])) ?></td>
                        <td class="col-actions">
                            <div class="actions">
                                <a class="btn btn-small" href="<?= e(url('/contas/editar', ['id' => $b['id']])) ?>">Editar</a>
                                <form method="post" action="<?= e(url('/contas/alternar')) ?>"<?= $b['active'] ? ' data-confirm="Desativar &quot;' . e($b['name']) . '&quot;? Os pendentes deste mês em diante serão removidos."' : '' ?>>
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="id" value="<?= (int) $b['id'] ?>">
                                    <button type="submit" class="btn btn-small"><?= $b['active'] ? 'Desativar' : 'Ativar' ?></button>
                                </form>
                                <form method="post" action="<?= e(url('/contas/excluir')) ?>" data-confirm="Excluir &quot;<?= e($b['name']) ?>&quot;? O que já foi pago continua no histórico.">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="id" value="<?= (int) $b['id'] ?>">
                                    <button type="submit" class="btn btn-small btn-danger">Excluir</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</section>
