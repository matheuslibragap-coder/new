<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\Category;
use App\Models\ExpenseCategory;
use App\Models\Transaction;
use DateTimeImmutable;

/** Controle diário: gastos rápidos do dia a dia, por categoria de gasto. O mês aqui é o da data do gasto. */
final class DailyController extends Controller
{
    public function index(): void
    {
        $month = month_from_param(Request::query('mes'));
        $transactions = new Transaction();
        $today = new DateTimeImmutable('today');

        $items = $transactions->dailyForMonth($month);
        $byDay = [];
        foreach ($items as $item) {
            $byDay[$item['transaction_date']][] = $item;
        }

        $total = array_sum(array_map(static fn ($t) => (float) $t['amount'], $items));
        $isCurrentMonth = $month->format('Y-m') === $today->format('Y-m');
        $days = $isCurrentMonth ? (int) $today->format('j') : (int) $month->format('t');
        $todayTotal = array_sum(array_map(static fn ($t) => (float) $t['amount'], $byDay[$today->format('Y-m-d')] ?? []));

        $last = $transactions->lastDaily();
        $old = Session::pullOldInput();
        $nextMonth = $today->modify('first day of next month');
        $defaults = [
            'amount'              => '',
            'description'         => '',
            'expense_category_id' => '',
            'category_id'         => $last['category_id'] ?? '',
            'payment_method'      => $last['payment_method'] ?? '',
            'transaction_date'    => $today->format('Y-m-d'),
            'invoice_month'       => $nextMonth->format('n'),
            'invoice_year'        => $nextMonth->format('Y'),
        ];
        // Após um erro, mantém o que foi digitado; campos não enviados (ex.: categoria sem escolha) voltam ao padrão.
        $form = $old ? array_merge($defaults, array_intersect_key($old, $defaults)) : $defaults;

        $this->view('daily/index', [
            'title'             => 'Controle diário',
            'month'             => $month,
            'byDay'             => $byDay,
            'total'             => $total,
            'todayTotal'        => $isCurrentMonth ? $todayTotal : null,
            'average'           => $days > 0 ? $total / $days : 0,
            'byCategory'        => $transactions->expensesByExpenseCategory($month, true, 'date'),
            'form'              => $form,
            'categories'        => (new Category())->active(),
            'expenseCategories' => (new ExpenseCategory())->active(),
            'descriptions'      => $transactions->frequentDescriptions(),
        ]);
    }
}
