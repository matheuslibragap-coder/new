<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\Category;
use App\Models\ExpenseCategory;
use App\Models\RecurringBill;
use App\Models\Transaction;
use App\Services\RecurringService;
use App\Services\TransactionService;
use DateTimeImmutable;

final class RecurringController extends Controller
{
    private const PAGES = [
        RecurringBill::KIND_MANDATORY => ['path' => '/contas/obrigatorias', 'title' => 'Contas obrigatórias'],
        RecurringBill::KIND_OPTIONAL  => ['path' => '/dividas',             'title' => 'Dívidas postergáveis'],
    ];

    public function mandatory(): void
    {
        $this->index(RecurringBill::KIND_MANDATORY);
    }

    public function optional(): void
    {
        $this->index(RecurringBill::KIND_OPTIONAL);
    }

    /** Endereço antigo da aba (antes "Contas opcionais"). */
    public function legacyOptional(): void
    {
        redirect('/dividas', array_filter(['mes' => Request::query('mes')]));
    }

    private function index(string $kind): void
    {
        $month = month_from_param(Request::query('mes'));
        $this->syncRecurring($month);

        $bills = new RecurringBill();
        $items = (new Transaction())->billItemsForMonth($kind, $month);
        $today = (new DateTimeImmutable('today'))->format('Y-m-d');

        $summary = ['paid' => 0.0, 'pending' => 0.0, 'overdue' => 0];
        foreach ($items as &$item) {
            $item['overdue'] = $item['status'] === Transaction::STATUS_PENDING && $item['transaction_date'] < $today;
            $summary[$item['status'] === Transaction::STATUS_DONE ? 'paid' : 'pending'] += (float) $item['amount'];
            $summary['overdue'] += $item['overdue'] ? 1 : 0;
        }
        unset($item);

        $this->view('recurring/index', [
            'title'        => self::PAGES[$kind]['title'],
            'kind'         => $kind,
            'path'         => self::PAGES[$kind]['path'],
            'month'        => $month,
            'items'        => $items,
            'summary'      => $summary,
            'bills'        => $bills->allOfKind($kind),
            'monthlyTotal' => $bills->monthlyTotal($kind),
            'returnTo'     => self::PAGES[$kind]['path'] . '?mes=' . month_param($month),
            'postponable'  => $kind === RecurringBill::KIND_OPTIONAL ? (new Transaction())->postponableForMonth($month) : [],
        ]);
    }

    public function create(): void
    {
        $kind = $this->kindFromInput();
        $this->view('recurring/form', [
            'title'      => $kind === RecurringBill::KIND_MANDATORY ? 'Nova conta obrigatória' : 'Nova dívida postergável recorrente',
            'kind'       => $kind,
            'bill'       => null,
            'categories' => (new Category())->active(),
            'expenseCategories' => (new ExpenseCategory())->active(),
            'old'        => Session::pullOldInput(),
            'backPath'   => self::PAGES[$kind]['path'],
        ]);
    }

    public function edit(): void
    {
        $bill = $this->findOrFail((int) Request::query('id', 0));
        $categories = (new Category())->active();
        if (!in_array((int) $bill['category_id'], array_map('intval', array_column($categories, 'id')), true)) {
            $categories[] = (new Category())->find((int) $bill['category_id']);
        }
        $this->view('recurring/form', [
            'title'      => 'Editar conta',
            'kind'       => $bill['kind'],
            'bill'       => $bill,
            'categories' => $categories,
            'expenseCategories' => (new ExpenseCategory())->active(),
            'old'        => Session::pullOldInput(),
            'backPath'   => self::PAGES[$bill['kind']]['path'],
        ]);
    }

    public function save(): void
    {
        $id = (int) Request::input('id', 0);
        $bill = $id > 0 ? $this->findOrFail($id) : null;
        $kind = $bill['kind'] ?? $this->kindFromInput();

        $input = [
            'name'                => preg_replace('/\s+/u', ' ', (string) Request::input('name', '')) ?? '',
            'amount'              => (string) Request::input('amount', ''),
            'due_day'             => (string) Request::input('due_day', ''),
            'category_id'         => (string) Request::input('category_id', ''),
            'expense_category_id' => (string) Request::input('expense_category_id', ''),
            'has_end'             => (string) Request::input('has_end', ''),
            'kind'                => $kind,
        ] + array_intersect_key($_POST, array_flip(['start_month', 'start_year', 'end_month', 'end_year']));

        $errors = [];
        if ($input['name'] === '' || mb_strlen($input['name']) > 100) {
            $errors[] = 'Informe o nome (até 100 caracteres).';
        }
        $amount = parse_money($input['amount']);
        if ($amount === null || (float) $amount <= 0 || (float) $amount > TransactionService::MAX_AMOUNT) {
            $errors[] = 'Informe um valor válido maior que zero.';
        }
        $dueDay = filter_var($input['due_day'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 31]]);
        if ($dueDay === false) {
            $errors[] = 'Informe o dia de vencimento (1 a 31).';
        }
        $category = (new Category())->find((int) $input['category_id']);
        $keepsCurrent = $bill !== null && $category !== null && (int) $category['id'] === (int) $bill['category_id'];
        if ($category === null || (!$category['active'] && !$keepsCurrent)) {
            $errors[] = 'Escolha em qual cartão ou conta a cobrança é feita.';
        }
        $expenseCategory = null;
        if ((int) $input['expense_category_id'] > 0) {
            $expenseCategory = (new ExpenseCategory())->find((int) $input['expense_category_id']);
            if ($expenseCategory === null) {
                $errors[] = 'Categoria de gasto inválida.';
            }
        }
        $startMonth = $bill !== null
            ? new DateTimeImmutable($bill['start_month'])
            : (month_from_fields($input, 'start') ?? RecurringService::currentMonth());
        $endMonth = null;
        if ($input['has_end'] !== '') {
            $endMonth = month_from_fields($input, 'end');
            if ($endMonth === null || $endMonth < $startMonth) {
                $errors[] = 'O último mês precisa ser igual ou depois do primeiro.';
            }
        }

        if ($errors) {
            $back = $bill ? '/contas/editar?id=' . $bill['id'] : '/contas/nova?tipo=' . $kind;
            $this->backWithErrors($back, $errors, $input);
        }

        $data = [
            'kind'        => $kind,
            'name'        => $input['name'],
            'amount'      => $amount,
            'due_day'     => $dueDay,
            'category_id' => (int) $category['id'],
            'expense_category_id' => $expenseCategory !== null ? (int) $expenseCategory['id'] : null,
            'start_month' => $startMonth->format('Y-m-d'),
            'end_month'   => $endMonth?->format('Y-m-d'),
        ];

        $service = new RecurringService();
        if ($bill !== null) {
            $service->update($bill, $data);
            Session::flash('success', 'Conta atualizada. Os lançamentos pendentes a partir deste mês foram ajustados.');
        } else {
            $service->create($data);
            Session::flash('success', $endMonth !== null
                ? sprintf('Conta cadastrada. Ela será lançada todo mês de %s a %s.', month_label($startMonth), month_label($endMonth))
                : sprintf('Conta cadastrada. Ela será lançada todo mês a partir de %s.', month_label($startMonth)));
        }
        redirect(self::PAGES[$kind]['path']);
    }

    public function toggle(): void
    {
        $bill = $this->findOrFail((int) Request::input('id', 0));
        $service = new RecurringService();
        if ($bill['active']) {
            $service->deactivate($bill);
            Session::flash('success', 'Conta desativada. Os pendentes deste mês em diante foram removidos; o que já foi pago continua no histórico.');
        } else {
            $service->activate($bill);
            Session::flash('success', 'Conta reativada. Ela volta a ser lançada a partir deste mês.');
        }
        redirect(self::PAGES[$bill['kind']]['path']);
    }

    public function delete(): void
    {
        $bill = $this->findOrFail((int) Request::input('id', 0));
        (new RecurringService())->delete($bill);
        Session::flash('success', 'Conta excluída. Os lançamentos já pagos e os atrasados continuam no histórico.');
        redirect(self::PAGES[$bill['kind']]['path']);
    }

    public function showPay(): void
    {
        $transaction = $this->pendingOrFail((int) Request::query('id', 0));
        $this->view('recurring/pay', [
            'title'       => 'Marcar como paga',
            'transaction' => $transaction,
            'old'         => Session::pullOldInput(),
            'returnTo'    => safe_return_path(Request::query('voltar'), '/lancamentos'),
        ]);
    }

    public function pay(): void
    {
        $transaction = $this->pendingOrFail((int) Request::input('id', 0));
        $returnTo = safe_return_path(Request::input('voltar'), '/lancamentos');

        $amount = parse_money(Request::input('amount', money_input($transaction['amount'])));
        $dateInput = (string) Request::input('paid_at', date('Y-m-d'));
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $dateInput);

        $errors = [];
        if ($amount === null || (float) $amount <= 0 || (float) $amount > TransactionService::MAX_AMOUNT) {
            $errors[] = 'Informe um valor válido maior que zero.';
        }
        if (!$date || $date->format('Y-m-d') !== $dateInput) {
            $errors[] = 'Informe uma data válida.';
        }
        if ($errors) {
            $this->backWithErrors('/contas/pagar?' . http_build_query(['id' => $transaction['id'], 'voltar' => $returnTo]), $errors, $_POST);
        }

        (new RecurringService())->pay($transaction, $amount, $date);
        Session::flash('success', sprintf('"%s" marcada como paga.', $transaction['description']));
        redirect($returnTo);
    }

    public function unpay(): void
    {
        $transaction = (new Transaction())->find((int) Request::input('id', 0));
        if ($transaction === null || $transaction['recurring_bill_id'] === null || $transaction['status'] !== Transaction::STATUS_DONE) {
            $this->notFound();
        }
        (new RecurringService())->unpay($transaction);
        Session::flash('success', sprintf('Pagamento de "%s" desfeito; voltou a ficar pendente.', $transaction['description']));
        redirect(safe_return_path(Request::input('voltar'), '/lancamentos'));
    }

    private function findOrFail(int $id): array
    {
        $bill = (new RecurringBill())->find($id);
        if ($bill === null) {
            $this->notFound();
        }
        return $bill;
    }

    private function pendingOrFail(int $id): array
    {
        $transaction = (new Transaction())->find($id);
        if ($transaction === null || $transaction['status'] !== Transaction::STATUS_PENDING) {
            $this->notFound();
        }
        return $transaction;
    }

    private function kindFromInput(): string
    {
        $kind = (string) Request::input('tipo', Request::input('kind', ''));
        return isset(self::PAGES[$kind]) ? $kind : RecurringBill::KIND_MANDATORY;
    }
}
