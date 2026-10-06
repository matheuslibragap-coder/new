<?php
declare(strict_types=1);

namespace App\Core;

final class Router
{
    /** @var array<string, array<string, array{0: class-string, 1: string, 2: bool}>> */
    private array $routes = [];

    public function get(string $path, array $handler, bool $public = false): void
    {
        $this->routes['GET'][$path] = [$handler[0], $handler[1], $public];
    }

    public function post(string $path, array $handler, bool $public = false): void
    {
        $this->routes['POST'][$path] = [$handler[0], $handler[1], $public];
    }

    public function dispatch(string $method, string $path): void
    {
        $route = $this->routes[$method][$path] ?? null;

        if ($route === null) {
            $allowed = array_keys(array_filter($this->routes, static fn (array $r) => isset($r[$path])));
            if ($allowed) {
                http_response_code(405);
                header('Allow: ' . implode(', ', $allowed));
                View::render('errors/simple', ['title' => 'Método não permitido', 'message' => 'Esta ação não está disponível.'], 'layout_auth');
                return;
            }
            http_response_code(404);
            View::render('errors/simple', ['title' => 'Página não encontrada', 'message' => 'O endereço acessado não existe.'], 'layout_auth');
            return;
        }

        [$class, $action, $public] = $route;

        if ($method === 'POST' && !Csrf::validateRequest()) {
            http_response_code(419);
            View::render('errors/simple', [
                'title'   => 'Sessão expirada',
                'message' => 'O formulário expirou. Volte, recarregue a página e tente novamente.',
            ], 'layout_auth');
            return;
        }

        if (!$public && !Auth::check()) {
            redirect('/login');
        }

        (new $class())->$action();
    }
}
