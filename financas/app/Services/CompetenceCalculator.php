<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use DateTimeImmutable;

/**
 * Define em qual mês um gasto conta no saldo.
 * Conta/carteira: o mês da própria data.
 * Cartão: o mês em que vence a fatura onde a compra cai.
 */
final class CompetenceCalculator
{
    public function forCategory(array $category, DateTimeImmutable $date): DateTimeImmutable
    {
        if ($category['type'] !== Category::TYPE_CARD) {
            return $this->firstDay($date);
        }
        return $this->invoiceDueDate($date, (int) $category['closing_day'], (int) $category['due_day'])
            ->modify('first day of this month');
    }

    /**
     * Data de vencimento da fatura em que a compra entra.
     * - Compra no dia do fechamento ou depois vai para a fatura seguinte.
     * - Fechamento/vencimento em dia inexistente no mês (ex.: 31 em fevereiro)
     *   usa o último dia do mês.
     * - Se o dia de vencimento é maior que o de fechamento, a fatura vence no
     *   mesmo mês em que fecha (fecha 1, vence 10); senão, no mês seguinte
     *   (fecha 28, vence 5).
     */
    public function invoiceDueDate(DateTimeImmutable $purchase, int $closingDay, int $dueDay): DateTimeImmutable
    {
        $month = $this->firstDay($purchase);
        $closingThisMonth = min($closingDay, (int) $purchase->format('t'));

        $closingMonth = (int) $purchase->format('j') >= $closingThisMonth
            ? $month->modify('+1 month')
            : $month;

        $dueMonth = $dueDay > $closingDay ? $closingMonth : $closingMonth->modify('+1 month');
        $day = min($dueDay, (int) $dueMonth->format('t'));

        return $dueMonth->setDate((int) $dueMonth->format('Y'), (int) $dueMonth->format('n'), $day);
    }

    private function firstDay(DateTimeImmutable $date): DateTimeImmutable
    {
        return $date->modify('first day of this month')->setTime(0, 0);
    }
}
