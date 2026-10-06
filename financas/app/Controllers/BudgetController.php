<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\Budget;
use App\Models\Category;
use App\Services\TransactionService;

final class BudgetController extends Controller
{
    public function index(): void
    {
        $month = month_from_param(Request::query('mes'));
        $this->syncRecurring($month);

        $rows = (new Budget())->overview($month);
        foreach ($rows as &$row) {
            $row['pct'] = $row['limit_amount'] !== null ? (float) $row['spent'] / (float) $row['limit_amount'] * 100 : null;
            $row['level'] = $row['limit_amount'] !== null ? Budget::level((float) $row['spent'], (float) $row['limit_amount']) : null;
        }
        unset($row);

        $this->view('budgets/index', [
            'title' => 'Orçamentos',
            'month' => $month,
            'rows'  => $rows,
            'old'   => Session::pullOldInput(),
        ]);
    }

    public function save(): void
    {
        $month = month_from_param(Request::input('mes'));
        $limits = $_POST['limits'] ?? [];
        if (!is_array($limits)) {
            $limits = [];
        }

        $categories = new Category();
        $parsed = [];
        $errors = [];
        foreach ($limits as $categoryId => $value) {
            $category = $categories->find((int) $categoryId);
            if ($category === null || !is_string($value)) {
                continue;
            }
            $value = trim($value);
            if ($value === '') {
                $parsed[(int) $categoryId] = null;
                continue;
            }
            $amount = parse_money($value);
            if ($amount === null || (float) $amount <= 0 || (float) $amount > TransactionService::MAX_AMOUNT) {
                $errors[] = sprintf('Limite inválido para %s.', $category['name']);
                continue;
            }
            $parsed[(int) $categoryId] = $amount;
        }

        if ($errors) {
            $this->backWithErrors('/orcamentos?mes=' . month_param($month), $errors, ['limits' => $limits]);
        }

        $budgets = new Budget();
        foreach ($parsed as $categoryId => $amount) {
            $budgets->set($categoryId, $amount);
        }
        Session::flash('success', 'Orçamentos salvos. Os limites valem para todos os meses.');
        redirect('/orcamentos', ['mes' => month_param($month)]);
    }

    /** JSON usado pelo formulário de lançamento para avisar antes de estourar o limite. */
    public function check(): void
    {
        $categoryId = (int) Request::query('categoria', 0);
        $month = month_from_param(Request::query('mes'));
        $exclude = (int) Request::query('excluir', 0) ?: null;

        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode((new Budget())->usage($categoryId, $month, $exclude));
    }
}
