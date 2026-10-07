<div class="page-header">
    <h1>Usuários</h1>
</div>

<p class="muted">Cada usuário entra com o próprio e-mail e senha e tem os <strong>seus próprios dados</strong>: lançamentos, contas e cartões, categorias, contas fixas e orçamentos. Um não vê nada do outro. Uma conta nova começa vazia, com o guia inicial.</p>

<div class="card card-flush">
    <table class="table table-responsive">
        <thead>
        <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Lançamentos</th>
            <th class="col-actions"><span class="sr-only">Ações</span></th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($users as $u): ?>
            <?php $isOwner = (int) $u['id'] === $ownerId; ?>
            <tr>
                <td data-label="Nome" class="cell-main"><?= e($u['name']) ?> <?php if ($isOwner): ?><span class="badge">Dono</span><?php endif; ?></td>
                <td data-label="E-mail"><?= e($u['email']) ?></td>
                <td data-label="Lançamentos"><?= (int) $u['transactions'] ?></td>
                <td class="col-actions">
                    <?php if ($isOwner): ?>
                        <a href="<?= e(url('/minha-conta')) ?>" class="btn btn-small">Minha conta</a>
                    <?php else: ?>
                        <details class="user-actions">
                            <summary class="btn btn-small">Gerenciar</summary>
                            <div class="user-actions-body">
                                <form method="post" action="<?= e(url('/usuarios/senha')) ?>" class="form">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="id" value="<?= (int) $u['id'] ?>">
                                    <label class="field">
                                        <span>Definir nova senha</span>
                                        <input type="text" name="password" minlength="8" required autocomplete="off" placeholder="Mínimo 8 caracteres">
                                    </label>
                                    <button type="submit" class="btn btn-small">Salvar senha</button>
                                </form>
                                <form method="post" action="<?= e(url('/usuarios/excluir')) ?>" class="form">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="id" value="<?= (int) $u['id'] ?>">
                                    <label class="field">
                                        <span>Excluir usuário e todos os dados dele: digite o e-mail para confirmar</span>
                                        <input type="text" name="confirmacao" required autocomplete="off" placeholder="<?= e($u['email']) ?>">
                                    </label>
                                    <button type="submit" class="btn btn-small btn-danger">Excluir usuário</button>
                                </form>
                            </div>
                        </details>
                    <?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>

<section class="card form-narrow">
    <h2>Novo usuário</h2>
    <form method="post" action="<?= e(url('/usuarios/salvar')) ?>" class="form">
        <?= csrf_field() ?>
        <label class="field">
            <span>Nome</span>
            <input type="text" name="name" value="<?= e(old($old, 'name')) ?>" required maxlength="100">
        </label>
        <label class="field">
            <span>E-mail (usado para entrar)</span>
            <input type="email" name="email" value="<?= e(old($old, 'email')) ?>" required maxlength="190" autocomplete="off">
        </label>
        <label class="field">
            <span>Senha inicial (mínimo 8 caracteres)</span>
            <input type="text" name="password" required minlength="8" autocomplete="off">
            <small class="muted small">Passe a senha para a pessoa. Ela pode trocar depois em "Minha conta".</small>
        </label>
        <div class="form-actions">
            <button type="submit" class="btn btn-primary">Criar usuário</button>
        </div>
    </form>
</section>
