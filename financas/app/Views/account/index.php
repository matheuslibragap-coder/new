<div class="page-header">
    <h1>Minha conta</h1>
</div>

<form method="post" action="<?= e(url('/minha-conta')) ?>" class="card form form-narrow">
    <?= csrf_field() ?>
    <label class="field">
        <span>Nome</span>
        <input type="text" name="name" value="<?= e(old($old, 'name', $user['name'])) ?>" required maxlength="100">
    </label>
    <label class="field">
        <span>E-mail (usado para entrar)</span>
        <input type="email" name="email" value="<?= e(old($old, 'email', $user['email'])) ?>" required maxlength="190" autocomplete="username">
    </label>
    <div class="sub-box">
        <label class="field">
            <span>Nova senha <small class="muted">(deixe em branco para manter a atual)</small></span>
            <input type="password" name="new_password" minlength="8" autocomplete="new-password">
        </label>
        <label class="field">
            <span>Confirme a nova senha</span>
            <input type="password" name="new_password_confirmation" minlength="8" autocomplete="new-password">
        </label>
    </div>
    <label class="field">
        <span>Senha atual (para confirmar as alterações)</span>
        <input type="password" name="current_password" required autocomplete="current-password">
    </label>
    <div class="form-actions">
        <button type="submit" class="btn btn-primary">Salvar</button>
    </div>
</form>
