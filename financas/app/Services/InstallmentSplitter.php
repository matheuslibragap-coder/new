<?php
declare(strict_types=1);

namespace App\Services;

final class InstallmentSplitter
{
    /**
     * Divide o total em N parcelas, em centavos, sem perder arredondamento:
     * a sobra da divisão vai na 1ª parcela (100,00 em 3x = 33,34 + 33,33 + 33,33).
     *
     * @return string[] valores decimais com ponto ('33.34')
     */
    public function split(string $total, int $count): array
    {
        if ($count < 1) {
            throw new \InvalidArgumentException('Número de parcelas inválido.');
        }
        $cents = (int) round(((float) $total) * 100);
        $base = intdiv($cents, $count);
        $remainder = $cents - $base * $count;

        $parts = array_fill(0, $count, $base);
        $parts[0] += $remainder;

        return array_map(static fn (int $c) => number_format($c / 100, 2, '.', ''), $parts);
    }
}
