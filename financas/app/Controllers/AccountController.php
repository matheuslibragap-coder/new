<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\User;

/** Minha conta: cada usuário altera o próprio nome, e-mail e senha. */
final class AccountController extends Controller
{
    public function show(): void
    {
        $this->view('account/index', ['title' => 'Minha conta', 'user' => Auth::user(), 'old' => Session::pullOldInput()]);
    }

    public function update(): void
    {
        $user = Auth::user();
        $users = new User();
        $name = (string) Request::input('name', '');
        $email = mb_strtolower((string) Request::input('email', ''));
        $current = (string) ($_POST['current_password'] ?? '');
        $new = (string) ($_POST['new_password'] ?? '');
        $confirm = (string) ($_POST['new_password_confirmation'] ?? '');

        $errors = [];
        if (!password_verify($current, $user['password_hash'])) {
            $errors[] = 'A senha atual está incorreta.';
        }
        if ($name === '' || mb_strlen($name) > 100) {
            $errors[] = 'Informe o nome (até 100 caracteres).';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
            $errors[] = 'Informe um e-mail válido.';
        } elseif ($users->emailExists($email, (int) $user['id'])) {
            $errors[] = 'Esse e-mail já é usado por outro usuário.';
        }
        if ($new !== '') {
            $errors = array_merge($errors, AuthController::validatePassword($new, $confirm));
        }
        if ($errors) {
            $this->backWithErrors('/minha-conta', $errors, ['name' => $name, 'email' => $email]);
        }

        $users->updateProfile((int) $user['id'], $name, $email);
        if ($new !== '') {
            $users->updatePassword((int) $user['id'], $new);
        }
        Session::flash('success', $new !== '' ? 'Dados e senha atualizados.' : 'Dados atualizados.');
        redirect('/minha-conta');
    }
}
