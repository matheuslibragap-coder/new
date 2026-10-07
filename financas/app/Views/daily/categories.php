<div class="page-header">
    <h1>Categorias de gasto</h1>
    <div class="actions">
        <a href="<?= e(url('/diario')) ?>" class="btn">Voltar ao Controle diário</a>
        <a href="<?= e(url('/diario/categorias/nova')) ?>" class="btn btn-primary">Nova categoria</a>
    </div>
</div>

<p class="muted">Essas categorias dizem <strong>com o que</strong> você gastou (Alimentação, Lazer…). A conta ou cartão de onde o dinheiro saiu é outra coisa, cadastrada em <a href="<?= e(url('/categorias')) ?>">Contas e cartões</a>.</p>

<div class="card card-flush">
    <table class="table table-responsive">
        <thead>
        <tr>
            <th>Categoria</th>
            <th>Situação</th>
            <th class="col-actions"><span class="sr-only">Ações</span></th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($categories as $c): ?>
            <tr class="<?= $c['active'] ? '' : 'is-inactive' ?>">
                <td data-label="Categoria"><span class="tag" style="--tag-color: <?= e($c['color']) ?>"><?= e($c['name']) ?></span></td>
                <td data-label="Situação"><span class="status <?= $c['active'] ? 'status-ok' : 'status-off' ?>"><?= $c['active'] ? 'Ativa' : 'Inativa' ?></span></td>
                <td class="col-actions">
                    <div class="actions">
                        <a href="<?= e(url('/diario/categorias/editar', ['id' => $c['id']])) ?>" class="btn btn-small">Editar</a>
                        <form method="post" action="<?= e(url('/diario/categorias/alternar')) ?>">
                            <?= csrf_field() ?>
                            <input type="hidden" name="id" value="<?= (int) $c['id'] ?>">
                            <button type="submit" class="btn btn-small"><?= $c['active'] ? 'Desativar' : 'Ativar' ?></button>
                        </form>
                        <?php if ((int) $c['usage_count'] === 0): ?>
                            <form method="post" action="<?= e(url('/diario/categorias/excluir')) ?>" data-confirm="Excluir a categoria &quot;<?= e($c['name']) ?>&quot;?">
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
