<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Models\Category;
use App\Models\Transaction;

final class HistoryController extends Controller
{
    private const PER_PAGE = 50;

    public function index(): void
    {
        [$filters, $params] = $this->filters();
        $transactions = new Transaction();
        $totals = $transactions->totals($filters);

        $pages = max(1, (int) ceil($totals['count'] / self::PER_PAGE));
        $page = min($pages, max(1, (int) Request::query('pagina', 1)));

        $months = $transactions->months();
        if ($params['mes'] !== '' && !in_array($params['mes'] . '-01', $months, true)) {
            array_unshift($months, $params['mes'] . '-01');
        }

        $this->view('history/index', [
            'title'      => 'Histórico',
            'items'      => $transactions->search($filters, self::PER_PAGE, ($page - 1) * self::PER_PAGE),
            'totals'     => $totals,
            'params'     => $params,
            'months'     => $months,
            'categories' => (new Category())->allWithUsage(),
            'page'       => $page,
            'pages'      => $pages,
            'returnTo'   => '/historico' . ($this->queryString($params, $page) ?: ''),
        ]);
    }

    public function export(): void
    {
        [$filters, $params] = $this->filters();
        $items = (new Transaction())->search($filters);

        $name = 'lancamentos' . ($params['mes'] !== '' ? '-' . $params['mes'] : '') . '-' . date('Ymd-His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $name . '"');
        header('Cache-Control: no-store');

        $out = fopen('php://output', 'wb');
        // BOM para o Excel reconhecer UTF-8 (acentos); ';' e vírgula decimal = Excel em português.
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Data', 'Competência', 'Tipo', 'Situação', 'Categoria', 'Descrição', 'Valor'], ';', '"', '');
        foreach ($items as $t) {
            $signed = $t['type'] === 'saida' ? -(float) $t['amount'] : (float) $t['amount'];
            fputcsv($out, [
                date_br($t['transaction_date']),
                substr($t['competence_month'], 5, 2) . '/' . substr($t['competence_month'], 0, 4),
                $t['type'] === 'entrada' ? 'Entrada' : 'Saída',
                $t['status'] === 'pendente' ? 'Pendente' : 'Efetivado',
                self::csvText($t['category_name']),
                self::csvText($t['description']),
                number_format($signed, 2, ',', ''),
            ], ';', '"', '');
        }
        fclose($out);
    }

    /** @return array{0: array, 1: array} [filtros para o model, parâmetros normalizados da URL] */
    private function filters(): array
    {
        $mes = (string) Request::query('mes', '');
        $mes = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $mes) ? $mes : '';
        $type = (string) Request::query('tipo', '');
        $type = in_array($type, ['entrada', 'saida'], true) ? $type : '';
        $categoryId = max(0, (int) Request::query('categoria', 0));
        $q = mb_substr((string) Request::query('q', ''), 0, 100);

        $filters = [
            'month'       => $mes !== '' ? month_from_param($mes) : null,
            'category_id' => $categoryId ?: null,
            'type'        => $type ?: null,
            'q'           => $q,
        ];
        $params = ['mes' => $mes, 'categoria' => $categoryId ?: '', 'tipo' => $type, 'q' => $q];
        return [$filters, $params];
    }

    private function queryString(array $params, int $page = 1): string
    {
        $query = array_filter($params, static fn ($v) => $v !== '' && $v !== null);
        if ($page > 1) {
            $query['pagina'] = $page;
        }
        return $query ? '?' . http_build_query($query) : '';
    }

    /** Impede que o Excel interprete o texto como fórmula (CSV injection). */
    private static function csvText(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
    }
}
