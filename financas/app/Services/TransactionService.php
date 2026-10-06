<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Models\Category;
use App\Models\Transaction;
use DateTimeImmutable;

/** Regras de criação, edição e exclusão de lançamentos (inclusive parcelados). */
final class TransactionService
{
    public const SCOPE_THIS = 'esta';
    public const SCOPE_NEXT = 'proximas';
    public const SCOPE_ALL = 'todas';
    public const SCOPES = [self::SCOPE_THIS, self::SCOPE_NEXT, self::SCOPE_ALL];

    public const MAX_INSTALLMENTS = 72;
    public const MAX_AMOUNT = 9999999999.99;

    private Transaction $transactions;
    private Category $categories;
    private CompetenceCalculator $calculator;

    public function __construct()
    {
        $this->transactions = new Transaction();
        $this->categories = new Category();
        $this->calculator = new CompetenceCalculator();
    }

    /**
     * Valida e normaliza os dados do formulário.
     * $current: lançamento sendo editado (permite manter categoria já desativada).
     *
     * @return array{0: string[], 1: array} [erros, dados normalizados]
     */
    public function validate(array $input, ?array $current = null): array
    {
        $errors = [];
        $isParcel = $current !== null && $current['installment_group_id'] !== null;

        $type = $isParcel ? Transaction::TYPE_OUT : (string) ($input['type'] ?? '');
        if (!in_array($type, [Transaction::TYPE_IN, Transaction::TYPE_OUT], true)) {
            $errors[] = 'Escolha se é entrada ou saída.';
        }

        $amount = parse_money($input['amount'] ?? '');
        if ($amount === null || (float) $amount <= 0 || (float) $amount > self::MAX_AMOUNT) {
            $errors[] = 'Informe um valor válido maior que zero.';
        }

        $category = $this->categories->find((int) ($input['category_id'] ?? 0));
        $keepsCurrent = $current !== null && $category !== null && (int) $category['id'] === (int) $current['category_id'];
        if ($category === null || (!$category['active'] && !$keepsCurrent)) {
            $errors[] = 'Escolha uma categoria.';
            $category = null;
        } elseif ($type === Transaction::TYPE_IN && $category['type'] !== Category::TYPE_ACCOUNT) {
            $errors[] = 'Entradas só podem ir para categorias do tipo conta/carteira.';
        } elseif ($isParcel && $category['type'] !== Category::TYPE_CARD) {
            $errors[] = 'Parcelas precisam estar em um cartão de crédito.';
        }

        $date = DateTimeImmutable::createFromFormat('!Y-m-d', (string) ($input['transaction_date'] ?? ''));
        if (!$date || $date->format('Y-m-d') !== ($input['transaction_date'] ?? '') || (int) $date->format('Y') < 2000 || (int) $date->format('Y') > 2100) {
            $errors[] = 'Informe uma data válida.';
            $date = null;
        }

        $description = trim((string) ($input['description'] ?? ''));
        $description = preg_replace('/\s+/u', ' ', $description) ?? '';
        if ($description === '' || mb_strlen($description) > 200) {
            $errors[] = 'Informe a descrição (até 200 caracteres).';
        }

        $installments = 1;
        if ($current === null && $type === Transaction::TYPE_OUT) {
            $installments = filter_var($input['installments'] ?? 1, FILTER_VALIDATE_INT, [
                'options' => ['min_range' => 1, 'max_range' => self::MAX_INSTALLMENTS],
            ]);
            if ($installments === false) {
                $errors[] = sprintf('Número de parcelas deve ser de 1 a %d.', self::MAX_INSTALLMENTS);
                $installments = 1;
            } elseif ($installments > 1 && $category !== null && $category['type'] !== Category::TYPE_CARD) {
                $errors[] = 'Parcelamento só está disponível para cartões de crédito.';
            }
        }

        $manual = !empty($input['competence_manual']);
        $manualMonth = null;
        if ($manual) {
            $m = (int) ($input['competence_month'] ?? 0);
            $y = (int) ($input['competence_year'] ?? 0);
            if ($m < 1 || $m > 12 || $y < 2000 || $y > 2100) {
                $errors[] = 'Escolha o mês de competência.';
            } else {
                $manualMonth = new DateTimeImmutable(sprintf('%04d-%02d-01', $y, $m));
            }
        }

        $data = [
            'type'              => $type,
            'amount'            => $amount,
            'category'          => $category,
            'date'              => $date,
            'description'       => $description,
            'installments'      => (int) $installments,
            'competence_manual' => $manual,
            'manual_month'      => $manualMonth,
        ];
        return [$errors, $data];
    }

    /** Competência da 1ª parcela (ou do lançamento simples). */
    public function competence(array $data): DateTimeImmutable
    {
        return $data['competence_manual']
            ? $data['manual_month']
            : $this->calculator->forCategory($data['category'], $data['date']);
    }

    /** @return DateTimeImmutable competência do primeiro lançamento criado */
    public function create(array $data): DateTimeImmutable
    {
        $competence = $this->competence($data);
        $db = Database::connection();
        $db->beginTransaction();
        try {
            if ($data['installments'] > 1) {
                $this->createInstallments($data, $competence);
            } else {
                $this->transactions->create([
                    'type'              => $data['type'],
                    'amount'            => $data['amount'],
                    'category_id'       => (int) $data['category']['id'],
                    'description'       => $data['description'],
                    'transaction_date'  => $data['date']->format('Y-m-d'),
                    'competence_month'  => $competence->format('Y-m-d'),
                    'competence_manual' => $data['competence_manual'],
                ]);
            }
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        return $competence;
    }

    private function createInstallments(array $data, DateTimeImmutable $firstCompetence): void
    {
        $count = $data['installments'];
        $parts = (new InstallmentSplitter())->split($data['amount'], $count);
        $groupId = $this->transactions->createGroup(
            $data['description'], $data['amount'], $count, (int) $data['category']['id'], $data['date']->format('Y-m-d')
        );
        foreach ($parts as $i => $value) {
            $this->transactions->create([
                'type'                 => Transaction::TYPE_OUT,
                'amount'               => $value,
                'category_id'          => (int) $data['category']['id'],
                'description'          => self::parcelDescription($data['description'], $i + 1, $count),
                'transaction_date'     => $data['date']->format('Y-m-d'),
                'competence_month'     => $firstCompetence->modify("+{$i} month")->format('Y-m-d'),
                'competence_manual'    => $data['competence_manual'],
                'installment_group_id' => $groupId,
                'installment_number'   => $i + 1,
            ]);
        }
    }

    /**
     * Atualiza um lançamento. Em parcelas, aplica ao escopo escolhido:
     * a competência informada vale para a parcela editada e as demais do escopo
     * andam junto, mantendo um mês de distância entre si. O valor informado é o
     * valor de cada parcela.
     */
    public function update(array $current, array $data, string $scope = self::SCOPE_THIS): void
    {
        $db = Database::connection();
        $db->beginTransaction();
        try {
            if ($current['installment_group_id'] === null) {
                $competence = $this->competence($data);
                $this->transactions->update((int) $current['id'], $this->row($data, $data['description'], $competence));
            } else {
                $this->updateParcels($current, $data, $scope);
            }
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    private function updateParcels(array $current, array $data, string $scope): void
    {
        $groupId = (int) $current['installment_group_id'];
        $number = (int) $current['installment_number'];
        $count = (int) $current['installment_count'];

        $editedCompetence = $data['competence_manual']
            ? $data['manual_month']
            : $this->calculator->forCategory($data['category'], $data['date'])->modify('+' . ($number - 1) . ' month');

        foreach ($this->parcelsInScope($groupId, $number, $scope, (int) $current['id']) as $parcel) {
            $offset = (int) $parcel['installment_number'] - $number;
            $this->transactions->update((int) $parcel['id'], $this->row(
                $data,
                self::parcelDescription($data['description'], (int) $parcel['installment_number'], $count),
                $editedCompetence->modify(($offset >= 0 ? '+' : '') . $offset . ' month')
            ));
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
            $parcels = $this->parcelsInScope($groupId, (int) $current['installment_number'], $scope, (int) $current['id']);
            foreach ($parcels as $parcel) {
                $this->transactions->delete((int) $parcel['id']);
            }
            $this->transactions->syncGroup($groupId);
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        return count($parcels);
    }

    private function parcelsInScope(int $groupId, int $number, string $scope, int $currentId): array
    {
        $parcels = $this->transactions->groupParcels($groupId);
        return array_values(array_filter($parcels, static fn (array $p) => match ($scope) {
            self::SCOPE_ALL  => true,
            self::SCOPE_NEXT => (int) $p['installment_number'] >= $number,
            default          => (int) $p['id'] === $currentId,
        }));
    }

    private function row(array $data, string $description, DateTimeImmutable $competence): array
    {
        return [
            'type'              => $data['type'],
            'amount'            => $data['amount'],
            'category_id'       => (int) $data['category']['id'],
            'description'       => $description,
            'transaction_date'  => $data['date']->format('Y-m-d'),
            'competence_month'  => $competence->format('Y-m-d'),
            'competence_manual' => $data['competence_manual'],
        ];
    }

    public static function parcelDescription(string $base, int $number, int $count): string
    {
        return sprintf('%s (%d/%d)', $base, $number, $count);
    }

    /** Descrição sem o sufixo "(n/N)", para exibir no formulário de edição. */
    public static function baseDescription(array $transaction): string
    {
        if ($transaction['installment_group_id'] === null) {
            return $transaction['description'];
        }
        return preg_replace('/\s\(\d+\/\d+\)$/', '', $transaction['description']) ?? $transaction['description'];
    }
}
