<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Models\Category;
use App\Models\ExpenseCategory;
use App\Models\Transaction;
use DateTimeImmutable;

/**
 * Regras de criação, edição e exclusão de lançamentos.
 *
 * Um lançamento pode ser:
 *  - único: pago à vista (débito, dinheiro, pix) conta no mês da data;
 *    no crédito 1x conta no mês da fatura informado pelo usuário;
 *  - recorrente: o mesmo valor repetido por N meses a partir do mês informado;
 *  - parcelado: o valor total dividido em N parcelas mensais.
 * Recorrentes e parcelados ficam ligados por um registro em installment_groups.
 */
final class TransactionService
{
    public const MODE_SINGLE = 'unico';
    public const MODE_RECURRING = 'recorrente';
    public const MODE_INSTALLMENTS = 'parcelado';

    public const SCOPE_THIS = 'esta';
    public const SCOPE_NEXT = 'proximas';
    public const SCOPE_ALL = 'todas';
    public const SCOPES = [self::SCOPE_THIS, self::SCOPE_NEXT, self::SCOPE_ALL];

    public const MAX_INSTALLMENTS = 72;
    public const MAX_RECURRING_MONTHS = 240;
    public const MAX_AMOUNT = 9999999999.99;

    private Transaction $transactions;
    private Category $categories;
    private ExpenseCategory $expenseCategories;
    private CompetenceCalculator $calculator;

    public function __construct()
    {
        $this->transactions = new Transaction();
        $this->categories = new Category();
        $this->expenseCategories = new ExpenseCategory();
        $this->calculator = new CompetenceCalculator();
    }

    /**
     * Valida o formulário de novo lançamento (Lançamentos ou Controle diário).
     *
     * @return array{0: string[], 1: array} [erros, dados normalizados]
     */
    public function validateCreate(array $input): array
    {
        [$errors, $data] = $this->validateCommon($input, null);

        $mode = (string) ($input['mode'] ?? self::MODE_SINGLE);
        $allowed = $data['type'] === Transaction::TYPE_IN
            ? [self::MODE_SINGLE, self::MODE_RECURRING]
            : [self::MODE_SINGLE, self::MODE_RECURRING, self::MODE_INSTALLMENTS];
        if (!in_array($mode, $allowed, true)) {
            $errors[] = 'Escolha se o lançamento é único, recorrente ou parcelado.';
            $mode = self::MODE_SINGLE;
        }

        $count = 1;
        $firstMonth = null;
        $payment = null;

        if ($mode === self::MODE_SINGLE) {
            if ($data['type'] === Transaction::TYPE_OUT) {
                $payment = (string) ($input['payment_method'] ?? '');
                if (!isset(Transaction::PAYMENT_LABELS[$payment])) {
                    $errors[] = 'Escolha a forma de pagamento.';
                    $payment = null;
                }
            }
            if ($payment === 'credito') {
                $firstMonth = month_from_fields($input, 'invoice');
                if ($firstMonth === null) {
                    $errors[] = 'Informe em qual mês a compra cai na fatura.';
                }
            } elseif ($data['date'] !== null) {
                $firstMonth = $data['date']->modify('first day of this month');
            }
        } else {
            $firstMonth = month_from_fields($input, 'start');
            if ($firstMonth === null) {
                $errors[] = $mode === self::MODE_INSTALLMENTS ? 'Informe o mês da 1ª parcela.' : 'Informe o mês da primeira cobrança.';
            }
            if ($mode === self::MODE_INSTALLMENTS) {
                $count = filter_var($input['installments'] ?? null, FILTER_VALIDATE_INT, [
                    'options' => ['min_range' => 2, 'max_range' => self::MAX_INSTALLMENTS],
                ]);
                if ($count === false) {
                    $errors[] = sprintf('Informe o número de parcelas (2 a %d).', self::MAX_INSTALLMENTS);
                    $count = 1;
                }
            } elseif (!empty($input['until_end']) && $firstMonth !== null) {
                $count = self::monthsBetween($firstMonth, last_allowed_month()) + 1;
            } else {
                $count = filter_var($input['months'] ?? null, FILTER_VALIDATE_INT, [
                    'options' => ['min_range' => 1, 'max_range' => self::MAX_RECURRING_MONTHS],
                ]);
                if ($count === false) {
                    $errors[] = 'Informe por quantos meses o lançamento se repete.';
                    $count = 1;
                }
            }
        }

        if ($firstMonth !== null && $firstMonth->modify('+' . ($count - 1) . ' month') > last_allowed_month()) {
            $errors[] = sprintf('O último mês ficaria depois de dezembro de %d. Diminua a quantidade de meses.', APP_MAX_YEAR);
        }

        // Se algum lançamento cai depois de hoje, é obrigatório dizer se já está pago/recebido.
        $paid = true;
        if ($data['date'] !== null && $firstMonth !== null && $count >= 1) {
            $lastDate = $mode === self::MODE_SINGLE
                ? $data['date']
                : self::itemDate($data['date'], $firstMonth->modify('+' . ($count - 1) . ' month'));
            if ($lastDate > new DateTimeImmutable('today')) {
                $answer = (string) ($input['paid'] ?? '');
                if (!in_array($answer, ['1', '0'], true)) {
                    $errors[] = $data['type'] === Transaction::TYPE_IN ? 'Informe se você já recebeu.' : 'Informe se já está pago.';
                }
                $paid = $answer !== '0';
            }
        }

        return [$errors, $data + [
            'mode'           => $mode,
            'count'          => (int) $count,
            'first_month'    => $firstMonth,
            'payment_method' => $payment,
            'is_daily'       => !empty($input['is_daily']),
            'paid'           => $paid,
        ]];
    }

    /**
     * Valida a edição. O mês de competência é sempre informado explicitamente.
     *
     * @return array{0: string[], 1: array}
     */
    public function validateEdit(array $input, array $current): array
    {
        [$errors, $data] = $this->validateCommon($input, $current);

        $competence = month_from_fields($input, 'competence');
        if ($competence === null) {
            $errors[] = 'Informe o mês em que o lançamento conta no saldo.';
        }

        $payment = null;
        if ($current['installment_group_id'] === null && $data['type'] === Transaction::TYPE_OUT) {
            $payment = (string) ($input['payment_method'] ?? '');
            $payment = isset(Transaction::PAYMENT_LABELS[$payment]) ? $payment : null;
        }

        $answer = (string) ($input['paid'] ?? '');
        $status = match ($answer) {
            '1'     => Transaction::STATUS_DONE,
            '0'     => Transaction::STATUS_PENDING,
            default => $current['status'],
        };

        return [$errors, $data + ['competence' => $competence, 'payment_method' => $payment, 'status' => $status]];
    }

    /** Campos comuns a criar e editar. */
    private function validateCommon(array $input, ?array $current): array
    {
        $errors = [];
        $inGroup = $current !== null && $current['installment_group_id'] !== null;

        $type = $inGroup ? $current['type'] : (string) ($input['type'] ?? '');
        if (!in_array($type, [Transaction::TYPE_IN, Transaction::TYPE_OUT], true)) {
            $errors[] = 'Escolha se é entrada ou saída.';
            $type = Transaction::TYPE_OUT;
        }

        $amount = parse_money($input['amount'] ?? '');
        if ($amount === null || (float) $amount <= 0 || (float) $amount > self::MAX_AMOUNT) {
            $errors[] = 'Informe um valor válido maior que zero.';
        }

        $category = $this->categories->find((int) ($input['category_id'] ?? 0));
        $keepsCurrent = $current !== null && $category !== null && (int) $category['id'] === (int) $current['category_id'];
        if ($category === null || (!$category['active'] && !$keepsCurrent)) {
            $errors[] = $type === Transaction::TYPE_IN ? 'Escolha em qual conta o dinheiro entrou.' : 'Escolha de qual conta ou cartão saiu o dinheiro.';
            $category = null;
        }

        $expenseCategory = null;
        $expenseId = (int) ($input['expense_category_id'] ?? 0);
        if ($expenseId > 0) {
            $expenseCategory = $this->expenseCategories->find($expenseId);
            $keepsExpense = $current !== null && (int) ($current['expense_category_id'] ?? 0) === $expenseId;
            if ($expenseCategory === null || (!$expenseCategory['active'] && !$keepsExpense)) {
                $errors[] = 'Categoria de gasto inválida.';
                $expenseCategory = null;
            }
        } elseif (!empty($input['is_daily'])) {
            $errors[] = 'Escolha a categoria do gasto.';
        }

        $rawDate = (string) ($input['transaction_date'] ?? '');
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $rawDate);
        if (!$date || $date->format('Y-m-d') !== $rawDate || (int) $date->format('Y') < APP_MIN_YEAR || (int) $date->format('Y') > APP_MAX_YEAR) {
            $errors[] = 'Informe uma data válida.';
            $date = null;
        }

        $description = preg_replace('/\s+/u', ' ', trim((string) ($input['description'] ?? ''))) ?? '';
        if ($description === '' || mb_strlen($description) > 200) {
            $errors[] = 'Informe a descrição (até 200 caracteres).';
        }

        return [$errors, [
            'type'             => $type,
            'amount'           => $amount,
            'category'         => $category,
            'expense_category' => $expenseCategory,
            'date'             => $date,
            'description'      => $description,
        ]];
    }

    /** Sugestão do mês da fatura para crédito: usa fechamento/vencimento do cartão, se cadastrados; senão, o mês seguinte. */
    public function suggestInvoiceMonth(array $category, DateTimeImmutable $date): DateTimeImmutable
    {
        if ($category['type'] === Category::TYPE_CARD && $category['closing_day'] && $category['due_day']) {
            return $this->calculator->forCategory($category, $date);
        }
        return $date->modify('first day of next month');
    }

    /** @return DateTimeImmutable[] competências de todos os lançamentos criados */
    public function create(array $data): array
    {
        $db = Database::connection();
        $db->beginTransaction();
        try {
            $months = $data['mode'] === self::MODE_SINGLE ? $this->createSingle($data) : $this->createGroup($data);
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        return $months;
    }

    private function createSingle(array $data): array
    {
        $this->transactions->create($this->row($data, $data['amount'], $data['description'], $data['first_month']) + [
            'status'            => $data['paid'] ? Transaction::STATUS_DONE : Transaction::STATUS_PENDING,
            'payment_method'    => $data['payment_method'],
            'is_daily'          => $data['is_daily'],
            'competence_manual' => $data['payment_method'] === 'credito',
        ]);
        return [$data['first_month']];
    }

    private function createGroup(array $data): array
    {
        $count = $data['count'];
        $isInstallments = $data['mode'] === self::MODE_INSTALLMENTS;
        $amounts = $isInstallments
            ? (new InstallmentSplitter())->split($data['amount'], $count)
            : array_fill(0, $count, $data['amount']);
        $total = number_format(array_sum(array_map('floatval', $amounts)), 2, '.', '');

        $groupId = $this->transactions->createGroup(
            $isInstallments ? Transaction::GROUP_INSTALLMENTS : Transaction::GROUP_RECURRING,
            $data['description'], $total, $count, (int) $data['category']['id'], $data['date']->format('Y-m-d')
        );

        // Cada mês vence no mesmo dia da data informada. Se o usuário disse que ainda
        // não pagou, só os meses de hoje em diante ficam pendentes.
        $today = new DateTimeImmutable('today');
        $months = [];
        foreach ($amounts as $i => $value) {
            $month = $data['first_month']->modify("+{$i} month");
            $months[] = $month;
            $date = self::itemDate($data['date'], $month);
            $description = $isInstallments ? self::parcelDescription($data['description'], $i + 1, $count) : $data['description'];
            $this->transactions->create($this->row($data, $value, $description, $month, $date) + [
                'status'               => $data['paid'] || $date < $today ? Transaction::STATUS_DONE : Transaction::STATUS_PENDING,
                'competence_manual'    => true,
                'installment_group_id' => $groupId,
                'installment_number'   => $i + 1,
                'is_daily'             => $data['is_daily'] ?? false,
            ]);
        }
        return $months;
    }

    /**
     * Atualiza um lançamento. Em recorrentes/parcelados, aplica ao escopo escolhido:
     * o mês informado vale para o lançamento editado e os demais do escopo andam
     * junto, mantendo um mês de distância entre si.
     */
    public function update(array $current, array $data, string $scope = self::SCOPE_THIS): void
    {
        $db = Database::connection();
        $db->beginTransaction();
        try {
            if ($current['installment_group_id'] === null) {
                $this->transactions->update((int) $current['id'], $this->row($data, $data['amount'], $data['description'], $data['competence']) + [
                    'status'            => $data['status'],
                    'payment_method'    => $data['payment_method'],
                    'competence_manual' => true,
                ]);
            } else {
                $this->updateGroupItems($current, $data, $scope);
            }
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    private function updateGroupItems(array $current, array $data, string $scope): void
    {
        $groupId = (int) $current['installment_group_id'];
        $number = (int) $current['installment_number'];
        $count = (int) $current['installment_count'];
        $isInstallments = $current['group_kind'] !== Transaction::GROUP_RECURRING;

        foreach ($this->itemsInScope($groupId, $number, $scope, (int) $current['id']) as $item) {
            $offset = (int) $item['installment_number'] - $number;
            $description = $isInstallments
                ? self::parcelDescription($data['description'], (int) $item['installment_number'], $count)
                : $data['description'];
            $competence = $data['competence']->modify(($offset >= 0 ? '+' : '') . $offset . ' month');
            // O item editado recebe a data e a situação informadas; os outros do escopo
            // vencem no mesmo dia, no mês deles, e mantêm a situação que já tinham.
            $this->transactions->update((int) $item['id'], $this->row(
                $data,
                $data['amount'],
                $description,
                $competence,
                $offset === 0 ? $data['date'] : self::itemDate($data['date'], $competence)
            ) + [
                'status'            => $offset === 0 ? $data['status'] : $item['status'],
                'payment_method'    => $item['payment_method'],
                'competence_manual' => true,
            ]);
        }

        if ($scope === self::SCOPE_ALL) {
            $this->transactions->updateGroup($groupId, $data['description'], (int) $data['category']['id'], $data['date']->format('Y-m-d'));
        }
        $this->transactions->syncGroup($groupId);
    }

    public function delete(array $current, string $scope = self::SCOPE_THIS): int
    {
        if ($current['installment_group_id'] === null) {
            $this->transactions->delete((int) $current['id']);
            return 1;
        }

        $groupId = (int) $current['installment_group_id'];
        $db = Database::connection();
        $db->beginTransaction();
        try {
            $items = $this->itemsInScope($groupId, (int) $current['installment_number'], $scope, (int) $current['id']);
            foreach ($items as $item) {
                $this->transactions->delete((int) $item['id']);
            }
            $this->transactions->syncGroup($groupId);
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        return count($items);
    }

    /**
     * Adia um mês. Em parcelados/recorrentes, adia este e os seguintes do grupo,
     * para continuar um lançamento por mês.
     *
     * @return int quantidade de lançamentos adiados
     */
    public function postpone(array $current): int
    {
        $items = $current['installment_group_id'] === null
            ? [$current]
            : $this->itemsInScope((int) $current['installment_group_id'], (int) $current['installment_number'], self::SCOPE_NEXT, (int) $current['id']);

        $last = last_allowed_month();
        foreach ($items as $item) {
            if ((new DateTimeImmutable($item['competence_month']))->modify('+1 month') > $last) {
                throw new \DomainException(sprintf('Não dá para adiar além de dezembro de %d.', APP_MAX_YEAR));
            }
        }

        $db = Database::connection();
        $db->beginTransaction();
        try {
            foreach ($items as $item) {
                $date = new DateTimeImmutable($item['transaction_date']);
                $this->transactions->moveTo(
                    (int) $item['id'],
                    (new DateTimeImmutable($item['competence_month']))->modify('+1 month')->format('Y-m-d'),
                    self::itemDate($date, $date->modify('first day of next month'))->format('Y-m-d')
                );
            }
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        return count($items);
    }

    private function itemsInScope(int $groupId, int $number, string $scope, int $currentId): array
    {
        return array_values(array_filter($this->transactions->groupParcels($groupId), static fn (array $p) => match ($scope) {
            self::SCOPE_ALL  => true,
            self::SCOPE_NEXT => (int) $p['installment_number'] >= $number,
            default          => (int) $p['id'] === $currentId,
        }));
    }

    private function row(array $data, string $amount, string $description, DateTimeImmutable $competence, ?DateTimeImmutable $date = null): array
    {
        return [
            'type'                => $data['type'],
            'amount'              => $amount,
            'category_id'         => (int) $data['category']['id'],
            'expense_category_id' => $data['expense_category'] !== null ? (int) $data['expense_category']['id'] : null,
            'description'         => $description,
            'transaction_date'    => ($date ?? $data['date'])->format('Y-m-d'),
            'competence_month'    => $competence->format('Y-m-d'),
        ];
    }

    /** O dia de $date dentro de $month (dias 29–31 inexistentes viram o último dia do mês). */
    public static function itemDate(DateTimeImmutable $date, DateTimeImmutable $month): DateTimeImmutable
    {
        $day = min((int) $date->format('j'), (int) $month->format('t'));
        return $month->setDate((int) $month->format('Y'), (int) $month->format('n'), $day)->setTime(0, 0);
    }

    public static function monthsBetween(DateTimeImmutable $from, DateTimeImmutable $to): int
    {
        return ((int) $to->format('Y') - (int) $from->format('Y')) * 12 + (int) $to->format('n') - (int) $from->format('n');
    }

    public static function parcelDescription(string $base, int $number, int $count): string
    {
        return sprintf('%s (%d/%d)', $base, $number, $count);
    }

    /** Descrição sem o sufixo "(n/N)", para exibir no formulário de edição. */
    public static function baseDescription(array $transaction): string
    {
        if ($transaction['installment_group_id'] === null || ($transaction['group_kind'] ?? '') === Transaction::GROUP_RECURRING) {
            return $transaction['description'];
        }
        return preg_replace('/\s\(\d+\/\d+\)$/', '', $transaction['description']) ?? $transaction['description'];
    }
}
