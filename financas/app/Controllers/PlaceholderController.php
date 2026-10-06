<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;

/** Abas ainda não entregues. Cada método será substituído pelo controller real na sua etapa. */
final class PlaceholderController extends Controller
{
    public function dashboard(): void    { $this->soon('Painel', 5); }
    public function budgets(): void      { $this->soon('Orçamentos', 5); }

    private function soon(string $title, int $stage): void
    {
        $this->view('placeholder', ['title' => $title, 'stage' => $stage]);
    }
}
