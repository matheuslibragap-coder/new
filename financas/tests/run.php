<?php
// Testes das regras de negócio que não dependem do banco.
// Uso: php tests/run.php
declare(strict_types=1);

define('APP_ROOT', dirname(__DIR__));
define('APP_PATH', APP_ROOT . '/app');
spl_autoload_register(static function (string $class): void {
    $file = APP_PATH . '/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (str_starts_with($class, 'App\\') && is_file($file)) {
        require $file;
    }
});
require APP_PATH . '/Helpers/format.php';

use App\Services\CompetenceCalculator;
use App\Services\InstallmentSplitter;

$failures = 0;
function check(string $label, mixed $expected, mixed $actual): void
{
    global $failures;
    $ok = $expected === $actual;
    $failures += $ok ? 0 : 1;
    echo ($ok ? 'OK   ' : 'FAIL ') . $label . ($ok ? '' : ' | esperado ' . var_export($expected, true) . ', obtido ' . var_export($actual, true)) . PHP_EOL;
}

$calc = new CompetenceCalculator();
$card = static fn (int $closing, int $due) => ['type' => 'cartao', 'closing_day' => $closing, 'due_day' => $due];
$comp = static fn (array $cat, string $date) => $calc->forCategory($cat, new DateTimeImmutable($date))->format('Y-m');
$due = static fn (string $date, int $c, int $d) => $calc->invoiceDueDate(new DateTimeImmutable($date), $c, $d)->format('Y-m-d');

check('conta: mês da data', '2026-03', $comp(['type' => 'conta'], '2026-03-31'));
check('fecha 28/vence 5: compra 10/03 → vence 05/04', '2026-04-05', $due('2026-03-10', 28, 5));
check('fecha 28/vence 5: compra no dia 28/03 → fatura seguinte, vence 05/05', '2026-05-05', $due('2026-03-28', 28, 5));
check('fecha 28/vence 5: compra 27/03 → vence 05/04', '2026-04-05', $due('2026-03-27', 28, 5));
check('fecha 1/vence 10: compra 15/03 → vence 10/04', '2026-04-10', $due('2026-03-15', 1, 10));
check('fecha 1/vence 10: compra 01/03 → vence 10/04', '2026-04-10', $due('2026-03-01', 1, 10));
check('fecha 10/vence 20: compra 05/03 → vence 20/03 (mesmo mês)', '2026-03-20', $due('2026-03-05', 10, 20));
check('fecha 10/vence 20: compra 10/03 → vence 20/04', '2026-04-20', $due('2026-03-10', 10, 20));
check('fecha 31 em fevereiro usa dia 28: compra 28/02 → fatura seguinte', '2026-04-05', $due('2026-02-28', 31, 5));
check('fecha 31: compra 27/02 → fecha 28/02, vence 05/03', '2026-03-05', $due('2026-02-27', 31, 5));
check('vence dia 31 em abril vira 30/04', '2026-04-30', $due('2026-04-02', 5, 31));
check('virada de ano: compra 20/12 fecha 15 vence 1 → 01/02', '2027-02-01', $due('2026-12-20', 15, 1));
check('competência do cartão = mês do vencimento', '2026-04', $comp($card(28, 5), '2026-03-10'));
check('ano bissexto: fecha 29, compra 29/02/2028 → fatura seguinte', '2028-04-05', $due('2028-02-29', 29, 5));

$split = new InstallmentSplitter();
check('100,00 em 3x', ['33.34', '33.33', '33.33'], $split->split('100.00', 3));
check('10,00 em 4x', ['2.50', '2.50', '2.50', '2.50'], $split->split('10.00', 4));
check('0,05 em 3x', ['0.03', '0.01', '0.01'], $split->split('0.05', 3));
check('soma das parcelas = total', 1999.99, round(array_sum(array_map('floatval', $split->split('1999.99', 7))), 2));

check('parse "1.234,56"', '1234.56', parse_money('1.234,56'));
check('parse "1234,5"', '1234.50', parse_money('1234,5'));
check('parse "1234.56"', '1234.56', parse_money('1234.56'));
check('parse "1.234"', '1234.00', parse_money('1.234'));
check('parse "R$ 12"', '12.00', parse_money('R$ 12'));
check('parse "abc"', null, parse_money('abc'));
check('parse "-5"', null, parse_money('-5'));
check('money()', 'R$ 1.234,56', money('1234.56'));
check('money() negativo', '-R$ 0,50', money(-0.5));
check('date_br()', '05/04/2026', date_br('2026-04-05'));
check('safe_return_path externo', '/x', safe_return_path('//evil.com', '/x'));
check('safe_return_path interno', '/historico?mes=2026-04', safe_return_path('/historico?mes=2026-04', '/x'));

echo PHP_EOL . ($failures === 0 ? 'Todos os testes passaram.' : "{$failures} falha(s).") . PHP_EOL;
exit($failures === 0 ? 0 : 1);
