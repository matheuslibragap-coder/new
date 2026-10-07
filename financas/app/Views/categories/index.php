<?php use App\Models\Category; ?>
<div class="page-header">
    <h1>Contas e cartões</h1>
    <a href="<?= e(url('/categorias/nova')) ?>" class="btn btn-primary">Nova conta ou cartão</a>
</div>

<div class="card card-flush">
    <table class="table table-responsive">
        <thead>
        <tr>
            <th>Conta/cartão</th>
            <th>Tipo</th>
            <th>Fechamento</th>
            <th>Vencimento</th>
            <th>Situação</th>
            <th class="col-actions"><span class="sr-only">Ações</span></th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($categories as $c): ?>
            <tr class="<?= $c['active'] ? '' : 'is-inactive' ?>">
                <td data-label="Conta/cartão">
                    <span class="tag" style="--tag-color: <?= e($c['color']) ?>"><?= e($c['name']) ?></span>
                </td>
                <td data-label="Tipo"><?= e(Category::TYPE_LABELS[$c['type']] ?? $c['type']) ?></td>
                <td data-label="Fechamento"><?= $c['closing_day'] ? 'Dia ' . (int) $c['closing_day'] : '—' ?></td>
                <td data-label="Vencimento"><?= $c['due_day'] ? 'Dia ' . (int) $c['due_day'] : '—' ?></td>
                <td data-label="Situação">
                    <span class="status <?= $c['active'] ? 'status-ok' : 'status-off' ?>"><?= $c['active'] ? 'Ativa' : 'Inativa' ?></span>
                </td>
                <td class="col-actions">
                    <div class="actions">
                        <a href="<?= e(url('/categorias/editar', ['id' => $c['id']])) ?>" class="btn btn-small">Editar</a>
                        <form method="post" action="<?= e(url('/categorias/alternar')) ?>">
                            <?= csrf_field() ?>
                            <input type="hidden" name="id" value="<?= (int) $c['id'] ?>">
                            <button type="submit" class="btn btn-small"><?= $c['active'] ? 'Desativar' : 'Ativar' ?></button>
                        </form>
                        <?php if ((int) $c['usage_count'] === 0): ?>
                            <form method="post" action="<?= e(url('/categorias/excluir')) ?>" data-confirm="Excluir &quot;<?= e($c['name']) ?>&quot;?">
                                <?= csrf_field() ?>
                                <input type="hidden" name="id" value="<?= (int) $c['id'] ?>">
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
<p class="muted small">Aqui ficam as <strong>origens</strong> do dinheiro: suas contas bancárias, carteiras e cartões. Em todo lançamento o sistema pergunta de qual delas o dinheiro saiu. Itens com lançamentos não podem ser excluídos, só desativados.</p>
