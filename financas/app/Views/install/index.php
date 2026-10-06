<h1 class="auth-title">Instalação</h1>

<?php if ($dbError): ?>
    <div class="alert alert-error"><?= e($dbError) ?></div>
<?php else: ?>
    <p class="muted">Crie o seu acesso. As tabelas do banco serão criadas automaticamente, já com as categorias padrão.</p>
    <form method="post" action="<?= e(url('/install')) ?>" class="form">
        <?= csrf_field() ?>
        <label class="field">
            <span>Nome</span>
            <input type="text" name="name" value="<?= e(old($old, 'name')) ?>" required maxlength="100" autofocus>
        </label>
        <label class="field">
            <span>E-mail (usado para entrar)</span>
            <input type="email" name="email" value="<?= e(old($old, 'email')) ?>" required maxlength="190" autocomplete="username">
        </label>
        <label class="field">
            <span>Senha (mínimo 8 caracteres)</span>
            <input type="password" name="password" required minlength="8" autocomplete="new-password">
        </label>
        <label class="field">
            <span>Confirme a senha</span>
            <input type="password" name="password_confirmation" required minlength="8" autocomplete="new-password">
        </label>
        <button type="submit" class="btn btn-primary btn-block">Instalar</button>
    </form>
<?php endif; ?>
