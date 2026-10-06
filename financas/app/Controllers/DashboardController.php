<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Models\Budget;
use App\Models\Report;
use DateTimeImmutable;

final class DashboardController extends Controller
{
    public function index(): void
    {
        $month = month_from_param(Request::query('mes'));
        $this->syncRecurring($month);

        $report = new Report();
        $today = new DateTimeImmutable('today');
        $summary = $report->monthSummary($month);
        $byCategory = $report->expensesByCategory($month);
        $series = $report->lastMonths($month, 6);

        $this->view('dashboard/index', [
            'title'      => 'Painel',
            'month'      => $month,
            'summary'    => $summary,
            'current'    => $summary['income_done'] - $summary['expense_done'],
            'forecast'   => ($summary['income_done'] + $summary['income_pending']) - ($summary['expense_done'] + $summary['expense_pending']),
            'byCategory' => $byCategory,
            'expenseSum' => array_sum(array_map(static fn ($r) => (float) $r['total'], $byCategory)),
            'series'     => $series,
            'overdue'    => $report->overdue($today),
            'upcoming'   => $report->upcoming($month, $today),
            'alerts'     => (new Budget())->alerts($month),
            'chartData'  => [
                'categories' => array_map(static fn ($r) => [
                    'label' => $r['name'], 'value' => (float) $r['total'], 'color' => $r['color'],
                ], $byCategory),
                'months' => array_map(static fn ($r) => [
                    'label'   => mb_substr(month_name((int) $r['month']->format('n')), 0, 3) . '/' . $r['month']->format('y'),
                    'income'  => $r['income'],
                    'expense' => $r['expense'],
                ], $series),
            ],
        ]);
    }
}
