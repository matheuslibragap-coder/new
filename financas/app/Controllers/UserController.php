<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\User;

/** Gestão de usuários: só o dono (primeiro usuário) acessa. Cada usuário tem dados próprios. */
final class UserController extends Controller
{
    public function __construct()
    {
        if (!Auth::isOwner()) {
            $this->notFound();
        }
    }

    public function index(): void
    {
        $this->view('users/index', [
            'title'   => 'Usuários',
            'users'   => (new User())->all(),
            'ownerId' => (new User())->ownerId(),
            'old'     => Session::pullOldInput(),
        ]);
    }

    public function store(): void
    {
        $users = new User();
        $name = (string) Request::input('name', '');
        $email = mb_strtolower((string) Request::input('email', ''));
        $password = (string) ($_POST['password'] ?? '');

        $errors = [];
        if ($name === '' || mb_strlen($name) > 100) {
            $errors[] = 'Informe o nome (até 100 caracteres).';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
            $errors[] = 'Informe um e-mail válido.';
        } elseif ($users->emailExists($email)) {
            $errors[] = 'Já existe um usuário com esse e-mail.';
        }
        $errors = array_merge($errors, AuthController::validatePassword($password, $password));
        if ($errors) {
            $this->backWithErrors('/usuarios', $errors, ['name' => $name, 'email' => $email]);
        }

        $users->create($name, $email, $password);
        Session::flash('success', sprintf('Usuário criado. %s já pode entrar com o e-mail %s e a senha que você definiu. A conta começa vazia.', $name, $email));
        redirect('/usuarios');
    }

    public function resetPassword(): void
    {
        $user = $this->otherUserOrFail();
        $password = (string) ($_POST['password'] ?? '');
        $errors = AuthController::validatePassword($password, $password);
        if ($errors) {
            $this->backWithErrors('/usuarios', $errors);
        }
        (new User())->updatePassword((int) $user['id'], $password);
        Session::flash('success', sprintf('Nova senha definida para %s.', $user['name']));
        redirect('/usuarios');
    }

    public function delete(): void
    {
        $user = $this->otherUserOrFail();
        if (mb_strtolower(trim((string) Request::input('confirmacao', ''))) !== mb_strtolower($user['email'])) {
            Session::flash('error', 'Para excluir, digite o e-mail do usuário no campo de confirmação.');
            redirect('/usuarios');
        }
        (new User())->deleteWithData((int) $user['id']);
        Session::flash('success', sprintf('Usuário %s e todos os dados dele foram excluídos.', $user['name']));
        redirect('/usuarios');
    }

    /** O dono não pode ser excluído nem ter a senha trocada por aqui (ele usa Minha conta). */
    private function otherUserOrFail(): array
    {
        $users = new User();
        $user = $users->find((int) Request::input('id', 0));
        if ($user === null || (int) $user['id'] === $users->ownerId()) {
            $this->notFound();
        }
        return $user;
    }
}
