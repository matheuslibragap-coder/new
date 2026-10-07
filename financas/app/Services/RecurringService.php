<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Models\RecurringBill;
use App\Models\Transaction;
use DateTimeImmutable;

/**
 * Contas recorrentes: geração mensal dos pendentes e efeitos de editar,
 * desativar e excluir uma conta sobre os lançamentos já gerados.
 *
 * Regra geral: o que já foi pago nunca é alterado; pendentes do mês atual
 * em diante acompanham a conta; pendentes de meses passados (atrasados)
 * também ficam como estão.
 */
final class RecurringService
{
    private RecurringBill $bills;
    private Transaction $transactions;

    public function __construct()
    {
        $this->bills = new RecurringBill();
        $this->transactions = new Transaction();
    }

    /**
     * Gera os pendentes de todas as contas ativas até $until (inclusive).
     * Sem cron na hospedagem compartilhada, é chamado ao abrir as páginas.
     */
    public function generateUntil(DateTimeImmutable $until): int
    {
        $until = $until->modify('first day of this month');
        $created = 0;
        $db = Database::connection();

        foreach ($this->bills->activeWithLastGeneration() as $bill) {
            $month = new DateTimeImmutable($bill['start_month']);
            if ($bill['last_generated'] !== null) {
                $month = max($month, (new DateTimeImmutable($bill['last_generated']))->modify('+1 month'));
            }
            $limit = $bill['end_month'] !== null ? min($until, new DateTimeImmutable($bill['end_month'])) : $until;
            for (; $month <= $limit; $month = $month->modify('+1 month')) {
                $db->beginTransaction();
                try {
                    if ($this->bills->markGenerated((int) $bill['id'], $month)) {
                        $this->transactions->create([
                            'type'              => Transaction::TYPE_OUT,
                            'status'            => Transaction::STATUS_PENDING,
                            'amount'            => $bill['amount'],
                            'category_id'       => (int) $bill['category_id'],
                            'expense_category_id' => $bill['expense_category_id'] !== null ? (int) $bill['expense_category_id'] : null,
                            'description'       => $bill['name'],
                            'transaction_date'  => self::dueDate($month, (int) $bill['due_day'])->format('Y-m-d'),
                            'competence_month'  => $month->format('Y-m-d'),
                            'recurring_bill_id' => (int) $bill['id'],
                        ]);
                        $created++;
                    }
                    $db->commit();
                } catch (\Throwable $e) {
                    $db->rollBack();
                    throw $e;
                }
            }
        }
        return $created;
    }

    public function create(array $data): int
    {
        return $this->bills->create($data);
    }

    /** Atualiza a conta e os pendentes do mês atual em diante. */
    public function update(array $bill, array $data): void
    {
        $this->inTransaction(function () use ($bill, $data): void {
            $this->bills->update((int) $bill['id'], $data);
            foreach ($this->transactions->pendingOfBillFrom((int) $bill['id'], self::currentMonth()) as $t) {
                $this->transactions->updatePendingFromBill((int) $t['id'], [
                    'amount'           => $data['amount'],
                    'category_id'      => $data['category_id'],
                    'expense_category_id' => $data['expense_category_id'] ?? null,
                    'description'      => $data['name'],
                    'transaction_date' => self::dueDate(new DateTimeImmutable($t['competence_month']), (int) $data['due_day'])->format('Y-m-d'),
                ]);
            }
            // Data de término antecipada: remove os pendentes que passaram do novo último mês.
            if (!empty($data['end_month'])) {
                $after = max(self::currentMonth(), (new DateTimeImmutable($data['end_month']))->modify('+1 month'));
                $this->transactions->deletePendingOfBillFrom((int) $bill['id'], $after);
                $this->bills->forgetGenerationsFrom((int) $bill['id'], $after);
            }
        });
    }

    public function deactivate(array $bill): void
    {
        $this->inTransaction(function () use ($bill): void {
            $this->bills->setActive((int) $bill['id'], false);
            $this->removeFutureGenerations((int) $bill['id']);
        });
    }

    /** Reativar volta a gerar a partir do mês atual (meses em que esteve inativa não são cobrados). */
    public function activate(array $bill): void
    {
        $start = max(new DateTimeImmutable($bill['start_month']), self::currentMonth());
        $this->bills->setActive((int) $bill['id'], true, $start);
    }

    /** Exclui a conta; lançamentos pagos e atrasados ficam (sem vínculo com a conta). */
    public function delete(array $bill): void
    {
        $this->inTransaction(function () use ($bill): void {
            $this->removeFutureGenerations((int) $bill['id']);
            $this->bills->delete((int) $bill['id']);
        });
    }

    public function pay(array $transaction, string $amount, DateTimeImmutable $date): void
    {
        $this->transactions->markPaid((int) $transaction['id'], $amount, $date->format('Y-m-d'));
    }

    public function unpay(array $transaction): void
    {
        $bill = $transaction['recurring_bill_id'] !== null ? $this->bills->find((int) $transaction['recurring_bill_id']) : null;
        $dueDay = $bill !== null ? (int) $bill['due_day'] : (int) (new DateTimeImmutable($transaction['transaction_date']))->format('j');
        $dueDate = self::dueDate(new DateTimeImmutable($transaction['competence_month']), $dueDay);
        $this->transactions->markPending((int) $transaction['id'], $dueDate->format('Y-m-d'));
    }

    private function removeFutureGenerations(int $billId): void
    {
        $from = self::currentMonth();
        $this->transactions->deletePendingOfBillFrom($billId, $from);
        $this->bills->forgetGenerationsFrom($billId, $from);
    }

    private function inTransaction(callable $fn): void
    {
        $db = Database::connection();
        $db->beginTransaction();
        try {
            $fn();
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /** Dia de vencimento no mês; dias 29–31 inexistentes viram o último dia do mês. */
    public static function dueDate(DateTimeImmutable $month, int $day): DateTimeImmutable
    {
        $month = $month->modify('first day of this month');
        return $month->setDate((int) $month->format('Y'), (int) $month->format('n'), min($day, (int) $month->format('t')));
    }

    public static function currentMonth(): DateTimeImmutable
    {
        return (new DateTimeImmutable('first day of this month'))->setTime(0, 0);
    }
}
