<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Config;
use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\LoginAttempt;
use App\Models\User;
use App\Services\SchemaInstaller;

final class AuthController extends Controller
{
    public const MIN_PASSWORD = 8;

    public function showLogin(): void
    {
        if (Auth::check()) {
            redirect('/');
        }
        if (!(new SchemaInstaller())->isInstalled() || (new User())->count() === 0) {
            redirect('/install');
        }
        $this->view('auth/login', ['title' => 'Entrar', 'old' => Session::pullOldInput()], 'layout_auth');
    }

    public function login(): void
    {
        $email = mb_strtolower((string) Request::input('email', ''));
        $password = (string) ($_POST['password'] ?? '');
        $ip = Request::ip();
        $attempts = new LoginAttempt();

        if ($attempts->isLocked($ip)) {
            $this->backWithErrors('/login', [sprintf(
                'Muitas tentativas incorretas. Aguarde %d minutos e tente de novo.',
                LoginAttempt::LOCK_MINUTES
            )], ['email' => $email]);
        }

        $users = new User();
        $user = $users->findByEmail($email);

        // Verifica um hash fictício quando o e-mail não existe, para que o tempo
        // de resposta não revele se o e-mail está cadastrado.
        $hash = $user['password_hash'] ?? '$2y$10$p/8y.Gqc1gpiTF8RCpk3xunSCU2HzSOIgJ0r0VzMfLkm7UCyBnTrO';
        $valid = password_verify($password, $hash) && $user !== null;

        if (!$valid) {
            $attempts->register($ip);
            $this->backWithErrors('/login', ['E-mail ou senha incorretos.'], ['email' => $email]);
        }

        $attempts->clear($ip);
        $users->rehashIfNeeded($user, $password);
        Auth::login($user);
        redirect('/');
    }

    public function logout(): void
    {
        Auth::logout();
        Session::start();
        Session::flash('info', 'Você saiu do sistema.');
        redirect('/login');
    }

    public function showReset(): void
    {
        $token = (string) Request::query('token', '');
        if (!$this->resetTokenValid($token)) {
            $this->notFoundPublic();
        }
        $this->view('auth/reset', ['title' => 'Redefinir senha', 'token' => $token], 'layout_auth');
    }

    public function reset(): void
    {
        $token = (string) Request::input('token', '');
        if (!$this->resetTokenValid($token)) {
            $this->notFoundPublic();
        }

        $password = (string) ($_POST['password'] ?? '');
        $confirm = (string) ($_POST['password_confirmation'] ?? '');
        $errors = self::validatePassword($password, $confirm);
        if ($errors) {
            Session::flash('error', implode(' ', $errors));
            redirect('/redefinir-senha', ['token' => $token]);
        }

        $users = new User();
        $user = $users->first();
        if ($user === null) {
            redirect('/install');
        }
        $users->updatePassword((int) $user['id'], $password);
        (new LoginAttempt())->clear(Request::ip());

        Session::flash('success', 'Senha redefinida. Entre com a nova senha e apague o reset_token do config.php.');
        redirect('/login');
    }

    /** @return string[] mensagens de erro */
    public static function validatePassword(string $password, string $confirm): array
    {
        $errors = [];
        if (mb_strlen($password) < self::MIN_PASSWORD) {
            $errors[] = sprintf('A senha precisa ter pelo menos %d caracteres.', self::MIN_PASSWORD);
        }
        if ($password !== $confirm) {
            $errors[] = 'A confirmação não confere com a senha.';
        }
        return $errors;
    }

    private function resetTokenValid(string $token): bool
    {
        $configured = (string) Config::get('app.reset_token', '');
        return strlen($configured) >= 32 && hash_equals($configured, $token);
    }

    private function notFoundPublic(): never
    {
        http_response_code(404);
        $this->view('errors/simple', ['title' => 'Página não encontrada', 'message' => 'O endereço acessado não existe.'], 'layout_auth');
        exit;
    }
}
