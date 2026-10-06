<?php
use App\Core\View;
use App\Models\RecurringBill;

$isOptional = $kind === RecurringBill::KIND_OPTIONAL;
?>
<div class="page-header">
    <h1><?= e($title) ?></h1>
    <a href="<?= e(url('/contas/nova', ['tipo' => $kind])) ?>" class="btn btn-primary">Nova conta</a>
</div>

<?php if ($isOptional): ?>
    <div class="highlight">
        <div>
            <span class="highlight-label">Total mensal das opcionais</span>
            <strong class="highlight-value"><?= e(money($monthlyTotal)) ?></strong>
        </div>
        <p>Cortando todas, você economizaria <strong><?= e(money($monthlyTotal * 12)) ?></strong> por ano.</p>
    </div>
<?php endif; ?>

<section>
    <div class="section-header">
        <h2>Contas de <?= e(month_label($month)) ?></h2>
        <?php View::partial('partials/month_picker', ['month' => $month, 'path' => $path]); ?>
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
                    <th>Categoria</th>
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
                        <td data-label="Categoria"><span class="tag" style="--tag-color: <?= e($t['category_color']) ?>"><?= e($t['category_name']) ?></span></td>
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
    <h2>Cadastro de contas</h2>
    <div class="card card-flush">
        <?php if (!$bills): ?>
            <div class="empty-state">
                Nenhuma conta cadastrada.
                <?= $isOptional ? 'Ex.: streaming, academia, assinaturas.' : 'Ex.: aluguel, luz, internet.' ?>
            </div>
        <?php else: ?>
            <table class="table table-responsive">
                <thead>
                <tr>
                    <th>Nome</th>
                    <th>Vencimento</th>
                    <th>Categoria</th>
                    <th>Situação</th>
                    <th class="num">Valor</th>
                    <th class="col-actions"><span class="sr-only">Ações</span></th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($bills as $b): ?>
                    <tr class="<?= $b['active'] ? '' : 'is-inactive' ?>">
                        <td data-label="Nome" class="cell-main"><?= e($b['name']) ?></td>
                        <td data-label="Vencimento">Dia <?= (int) $b['due_day'] ?></td>
                        <td data-label="Categoria"><span class="tag" style="--tag-color: <?= e($b['category_color']) ?>"><?= e($b['category_name']) ?></span></td>
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
