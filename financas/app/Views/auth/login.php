<h1 class="auth-title">Entrar</h1>
<form method="post" action="<?= e(url('/login')) ?>" class="form">
    <?= csrf_field() ?>
    <label class="field">
        <span>E-mail</span>
        <input type="email" name="email" value="<?= e(old($old, 'email')) ?>" required autofocus autocomplete="username">
    </label>
    <label class="field">
        <span>Senha</span>
        <input type="password" name="password" required autocomplete="current-password">
    </label>
    <button type="submit" class="btn btn-primary btn-block">Entrar</button>
</form>
