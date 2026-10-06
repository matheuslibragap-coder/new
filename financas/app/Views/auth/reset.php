<h1 class="auth-title">Redefinir senha</h1>
<form method="post" action="<?= e(url('/redefinir-senha')) ?>" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="token" value="<?= e($token) ?>">
    <label class="field">
        <span>Nova senha</span>
        <input type="password" name="password" required minlength="8" autocomplete="new-password">
    </label>
    <label class="field">
        <span>Confirme a nova senha</span>
        <input type="password" name="password_confirmation" required minlength="8" autocomplete="new-password">
    </label>
    <button type="submit" class="btn btn-primary btn-block">Salvar nova senha</button>
</form>
