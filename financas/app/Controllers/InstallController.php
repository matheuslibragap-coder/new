<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Core\Database;
use App\Core\Request;
use App\Core\Session;
use App\Models\User;
use App\Services\SchemaInstaller;
use PDOException;

/** Primeiro acesso: cria as tabelas (se preciso) e o usuário único. Depois se bloqueia. */
final class InstallController extends Controller
{
    public function show(): void
    {
        $dbError = $this->connectionError();
        if ($dbError === null && $this->alreadyInstalled()) {
            redirect('/login');
        }
        $this->view('install/index', [
            'title'   => 'Instalação',
            'dbError' => $dbError,
            'old'     => Session::pullOldInput(),
        ], 'layout_auth');
    }

    public function store(): void
    {
        if ($this->connectionError() !== null) {
            redirect('/install');
        }
        if ($this->alreadyInstalled()) {
            redirect('/login');
        }

        $name = (string) Request::input('name', '');
        $email = mb_strtolower((string) Request::input('email', ''));
        $password = (string) ($_POST['password'] ?? '');
        $confirm = (string) ($_POST['password_confirmation'] ?? '');

        $errors = [];
        if ($name === '' || mb_strlen($name) > 100) {
            $errors[] = 'Informe seu nome (até 100 caracteres).';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
            $errors[] = 'Informe um e-mail válido.';
        }
        $errors = array_merge($errors, AuthController::validatePassword($password, $confirm));
        if ($errors) {
            $this->backWithErrors('/install', $errors, ['name' => $name, 'email' => $email]);
        }

        $installer = new SchemaInstaller();
        if (!$installer->isInstalled()) {
            $installer->install();
        }

        $users = new User();
        $id = $users->create($name, $email, $password);
        Auth::login($users->find($id));
        Session::flash('success', 'Instalação concluída. Bem-vindo!');
        redirect('/');
    }

    private function alreadyInstalled(): bool
    {
        return (new SchemaInstaller())->isInstalled() && (new User())->count() > 0;
    }

    private function connectionError(): ?string
    {
        try {
            Database::connection();
            return null;
        } catch (PDOException $e) {
            error_log('Falha de conexão no install: ' . $e->getMessage());
            return 'Não foi possível conectar ao banco de dados. Confira host, nome do banco, usuário e senha em app/config/config.php.';
        }
    }
}
