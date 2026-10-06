<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\Category;
use App\Models\Transaction;
use App\Services\TransactionService;
use DateTimeImmutable;

final class TransactionController extends Controller
{
    public function index(): void
    {
        $month = month_from_param(Request::query('mes'));
        $transactions = new Transaction();

        $this->view('transactions/index', [
            'title'        => 'Lançamentos',
            'month'        => $month,
            'items'        => $transactions->forMonth($month),
            'totals'       => $transactions->totals(['month' => $month]),
            'form'         => $this->formValues(null, Session::pullOldInput(), $month),
            'categories'   => (new Category())->active(),
            'descriptions' => $transactions->frequentDescriptions(),
        ]);
    }

    public function store(): void
    {
        $viewMonth = month_from_param(Request::input('mes'));
        $service = new TransactionService();
        [$errors, $data] = $service->validate($_POST);
        if ($errors) {
            $this->backWithErrors('/lancamentos?mes=' . month_param($viewMonth), $errors, $_POST);
        }

        $competence = $service->create($data);
        Session::flash('success', $data['installments'] > 1
            ? sprintf('Compra parcelada em %dx, de %s a %s.', $data['installments'], month_label($competence),
                month_label($competence->modify('+' . ($data['installments'] - 1) . ' month')))
            : sprintf('Lançamento salvo na competência %s.', month_label($competence)));
        redirect('/lancamentos', ['mes' => month_param($viewMonth)]);
    }

    public function edit(): void
    {
        $transaction = $this->findOrFail((int) Request::query('id', 0));
        $this->view('transactions/edit', [
            'title'        => 'Editar lançamento',
            'transaction'  => $transaction,
            'form'         => $this->formValues($transaction, Session::pullOldInput()),
            'categories'   => $this->categoriesFor($transaction),
            'descriptions' => (new Transaction())->frequentDescriptions(),
            'returnTo'     => safe_return_path(Request::query('voltar'), $this->defaultReturn($transaction)),
        ]);
    }

    public function update(): void
    {
        $transaction = $this->findOrFail((int) Request::input('id', 0));
        $returnTo = safe_return_path(Request::input('voltar'), $this->defaultReturn($transaction));
        $scope = $this->scope();

        $service = new TransactionService();
        [$errors, $data] = $service->validate($_POST, $transaction);
        if ($errors) {
            $this->backWithErrors('/lancamentos/editar?' . http_build_query(['id' => $transaction['id'], 'voltar' => $returnTo]), $errors, $_POST);
        }

        $service->update($transaction, $data, $scope);
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
        Session::flash('success', $removed > 1 ? "{$removed} parcelas excluídas." : 'Lançamento excluído.');
        redirect($returnTo);
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
        return '/lancamentos?mes=' . substr($transaction['competence_month'], 0, 7);
    }

    /** Categorias ativas + a categoria atual do lançamento, mesmo que desativada. */
    private function categoriesFor(array $transaction): array
    {
        $categories = (new Category())->active();
        if (!in_array((int) $transaction['category_id'], array_map('intval', array_column($categories, 'id')), true)) {
            $current = (new Category())->find((int) $transaction['category_id']);
            if ($current !== null) {
                $categories[] = $current;
            }
        }
        return $categories;
    }

    /** Valores do formulário: dados digitados (após erro) > lançamento em edição > padrões. */
    private function formValues(?array $transaction, array $old, ?DateTimeImmutable $viewMonth = null): array
    {
        if ($old) {
            return $old + ['competence_manual' => ''];
        }
        if ($transaction !== null) {
            $competence = new DateTimeImmutable($transaction['competence_month']);
            return [
                'type'              => $transaction['type'],
                'amount'            => money_input($transaction['amount']),
                'category_id'       => $transaction['category_id'],
                'transaction_date'  => $transaction['transaction_date'],
                'description'       => TransactionService::baseDescription($transaction),
                'installments'      => 1,
                'competence_manual' => $transaction['competence_manual'] ? '1' : '',
                'competence_month'  => $competence->format('n'),
                'competence_year'   => $competence->format('Y'),
            ];
        }
        $today = new DateTimeImmutable('today');
        return [
            'type'              => Transaction::TYPE_OUT,
            'amount'            => '',
            'category_id'       => '',
            'transaction_date'  => $today->format('Y-m-d'),
            'description'       => '',
            'installments'      => 1,
            'competence_manual' => '',
            'competence_month'  => ($viewMonth ?? $today)->format('n'),
            'competence_year'   => ($viewMonth ?? $today)->format('Y'),
        ];
    }
}
