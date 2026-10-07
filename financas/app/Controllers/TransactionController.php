<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\Budget;
use App\Models\Category;
use App\Models\ExpenseCategory;
use App\Models\Transaction;
use App\Services\RecurringService;
use App\Services\TransactionService;
use DateTimeImmutable;

final class TransactionController extends Controller
{
    public function index(): void
    {
        $month = month_from_param(Request::query('mes'));
        $this->syncRecurring($month);
        $transactions = new Transaction();

        $this->view('transactions/index', [
            'title'             => 'Lançamentos',
            'month'             => $month,
            'items'             => $transactions->forMonth($month),
            'totals'            => $transactions->totals(['month' => $month]),
            'form'              => $this->newFormValues(Session::pullOldInput(), $month),
            'categories'        => (new Category())->active(),
            'expenseCategories' => (new ExpenseCategory())->active(),
            'descriptions'      => $transactions->frequentDescriptions(),
        ]);
    }

    public function store(): void
    {
        $viewMonth = month_from_param(Request::input('mes'));
        $back = safe_return_path(Request::input('voltar'), '/lancamentos?mes=' . month_param($viewMonth));

        $service = new TransactionService();
        [$errors, $data] = $service->validateCreate($_POST);
        if ($errors) {
            $this->backWithErrors($back, $errors, $_POST);
        }

        $months = $service->create($data);
        if ($data['type'] === Transaction::TYPE_OUT) {
            $this->warnIfOverBudget($data['category'], $months);
        }

        $first = $months[0];
        $last = end($months);
        Session::flash('success', match ($data['mode']) {
            TransactionService::MODE_INSTALLMENTS => sprintf('Compra parcelada em %dx, de %s a %s.', count($months), month_label($first), month_label($last)),
            TransactionService::MODE_RECURRING    => sprintf('Lançamento recorrente criado em %d mês(es), de %s a %s.', count($months), month_label($first), month_label($last)),
            default                               => sprintf('Lançamento salvo em %s.', month_label($first)),
        });
        redirect($back);
    }

    public function edit(): void
    {
        $transaction = $this->findOrFail((int) Request::query('id', 0));
        $this->view('transactions/edit', [
            'title'             => 'Editar lançamento',
            'transaction'       => $transaction,
            'form'              => $this->editFormValues($transaction, Session::pullOldInput()),
            'categories'        => $this->withCurrent((new Category())->active(), (int) $transaction['category_id'], new Category()),
            'expenseCategories' => $this->withCurrent((new ExpenseCategory())->active(), (int) $transaction['expense_category_id'], new ExpenseCategory()),
            'descriptions'      => (new Transaction())->frequentDescriptions(),
            'returnTo'          => safe_return_path(Request::query('voltar'), $this->defaultReturn($transaction)),
        ]);
    }

    public function update(): void
    {
        $transaction = $this->findOrFail((int) Request::input('id', 0));
        $returnTo = safe_return_path(Request::input('voltar'), $this->defaultReturn($transaction));
        $scope = $this->scope();

        $service = new TransactionService();
        [$errors, $data] = $service->validateEdit($_POST, $transaction);
        if ($errors) {
            $this->backWithErrors('/lancamentos/editar?' . http_build_query(['id' => $transaction['id'], 'voltar' => $returnTo]), $errors, $_POST);
        }

        $service->update($transaction, $data, $scope);
        if ($data['type'] === Transaction::TYPE_OUT) {
            $model = new Transaction();
            $rows = $transaction['installment_group_id'] !== null && $scope !== TransactionService::SCOPE_THIS
                ? $model->groupParcels((int) $transaction['installment_group_id'])
                : [$model->find((int) $transaction['id'])];
            $months = array_map(static fn (array $r) => new DateTimeImmutable($r['competence_month']), array_filter($rows));
            $this->warnIfOverBudget($data['category'], $months);
        }
        Session::flash('success', 'Lançamento atualizado.');
        redirect($returnTo);
    }

    public function confirmDelete(): void
    {
        $transaction = $this->findOrFail((int) Request::query('id', 0));
        $this->view('transactions/delete', [
            'title'       => 'Excluir lançamento',
            'transaction' => $transaction,
            'returnTo'    => safe_return_path(Request::query('voltar'), $this->defaultReturn($transaction)),
        ]);
    }

    public function delete(): void
    {
        $transaction = $this->findOrFail((int) Request::input('id', 0));
        $returnTo = safe_return_path(Request::input('voltar'), $this->defaultReturn($transaction));

        $removed = (new TransactionService())->delete($transaction, $this->scope());
        Session::flash('success', $removed > 1 ? "{$removed} lançamentos excluídos." : 'Lançamento excluído.');
        redirect($returnTo);
    }

    /** Caixinha "Pago" da lista: marca ou desmarca o pagamento/recebimento. */
    public function togglePaid(): void
    {
        $transaction = $this->findOrFail((int) Request::input('id', 0));
        $returnTo = safe_return_path(Request::input('voltar'), $this->defaultReturn($transaction));
        $paid = (string) Request::input('pago', '') === '1';
        $isIn = $transaction['type'] === Transaction::TYPE_IN;

        if ($paid === ($transaction['status'] === Transaction::STATUS_DONE)) {
            redirect($returnTo);
        }
        $model = new Transaction();
        if ($transaction['recurring_bill_id'] !== null) {
            // Contas obrigatórias/opcionais: registra a data do pagamento e, ao desfazer, volta ao vencimento.
            $service = new RecurringService();
            $paid ? $service->pay($transaction, $transaction['amount'], new DateTimeImmutable('today')) : $service->unpay($transaction);
        } elseif ($paid) {
            $model->markPaid((int) $transaction['id'], $transaction['amount'], $transaction['transaction_date']);
        } else {
            $model->markPending((int) $transaction['id'], $transaction['transaction_date']);
        }

        Session::flash('success', sprintf('"%s" %s.', $transaction['description'], $paid
            ? ($isIn ? 'marcado como recebido' : 'marcado como pago')
            : ($isIn ? 'voltou para a receber' : 'voltou para a pagar')));
        redirect($returnTo);
    }

    /** @param DateTimeImmutable[] $months */
    private function warnIfOverBudget(array $category, array $months): void
    {
        $budget = new Budget();
        $over = [];
        foreach ($months as $month) {
            $key = month_param($month);
            if (isset($over[$key])) {
                continue;
            }
            $usage = $budget->usage((int) $category['id'], $month);
            if ($usage['limit'] !== null && $usage['spent'] > $usage['limit']) {
                $over[$key] = sprintf('%s (%s de %s)', month_label($month), money($usage['spent']), money($usage['limit']));
            }
        }
        if ($over) {
            $list = array_values($over);
            $extra = count($list) > 6 ? sprintf(' e mais %d mês(es)', count($list) - 6) : '';
            Session::flash('warning', sprintf('Atenção: %s passou do orçamento em %s%s.', $category['name'], implode(', ', array_slice($list, 0, 6)), $extra));
        }
    }

    private function findOrFail(int $id): array
    {
        $transaction = (new Transaction())->find($id);
        if ($transaction === null) {
            $this->notFound();
        }
        return $transaction;
    }

    private function scope(): string
    {
        $scope = (string) Request::input('escopo', TransactionService::SCOPE_THIS);
        return in_array($scope, TransactionService::SCOPES, true) ? $scope : TransactionService::SCOPE_THIS;
    }

    private function defaultReturn(array $transaction): string
    {
        if ($transaction['is_daily']) {
            return '/diario?mes=' . substr($transaction['transaction_date'], 0, 7);
        }
        return '/lancamentos?mes=' . substr($transaction['competence_month'], 0, 7);
    }

    /** Lista de ativos + o item atual do lançamento, mesmo que desativado. */
    private function withCurrent(array $active, int $currentId, Category|ExpenseCategory $model): array
    {
        if ($currentId > 0 && !in_array($currentId, array_map('intval', array_column($active, 'id')), true)) {
            $current = $model->find($currentId);
            if ($current !== null) {
                $active[] = $current;
            }
        }
        return $active;
    }

    /** Padrões do formulário de novo lançamento (ou o que foi digitado antes de um erro). */
    public static function newFormValues(array $old, DateTimeImmutable $viewMonth): array
    {
        $today = new DateTimeImmutable('today');
        $defaults = [
            'type'                => Transaction::TYPE_OUT,
            'mode'                => TransactionService::MODE_SINGLE,
            'amount'              => '',
            'description'         => '',
            'category_id'         => '',
            'expense_category_id' => '',
            'transaction_date'    => $today->format('Y-m-d'),
            'payment_method'      => '',
            'invoice_month'       => $today->modify('first day of next month')->format('n'),
            'invoice_year'        => $today->modify('first day of next month')->format('Y'),
            'start_month'         => $viewMonth->format('n'),
            'start_year'          => $viewMonth->format('Y'),
            'months'              => 12,
            'until_end'           => '',
            'installments'        => 2,
            'paid'                => '',
        ];
        return $old ? $old + ['until_end' => ''] + $defaults : $defaults;
    }

    private function editFormValues(array $transaction, array $old): array
    {
        if ($old) {
            return $old;
        }
        $competence = new DateTimeImmutable($transaction['competence_month']);
        return [
            'type'                => $transaction['type'],
            'amount'              => money_input($transaction['amount']),
            'description'         => TransactionService::baseDescription($transaction),
            'category_id'         => $transaction['category_id'],
            'expense_category_id' => $transaction['expense_category_id'] ?? '',
            'transaction_date'    => $transaction['transaction_date'],
            'payment_method'      => $transaction['payment_method'] ?? '',
            'paid'                => $transaction['status'] === Transaction::STATUS_DONE ? '1' : '0',
            'competence_month'    => $competence->format('n'),
            'competence_year'     => $competence->format('Y'),
        ];
    }
}
