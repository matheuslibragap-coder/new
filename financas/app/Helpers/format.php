<?php
declare(strict_types=1);

use App\Core\Csrf;
use App\Core\Request;

/** Intervalo de anos disponível nos seletores e lançamentos futuros. */
const APP_MIN_YEAR = 2020;
const APP_MAX_YEAR = 2040;

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function url(string $path = '/', array $query = []): string
{
    $url = Request::base() . '/' . ltrim($path, '/');
    if ($query) {
        $url .= '?' . http_build_query($query);
    }
    return $url;
}

function asset(string $path): string
{
    $file = APP_ROOT . '/public/assets/' . ltrim($path, '/');
    $version = is_file($file) ? (string) filemtime($file) : '1';
    return url('assets/' . ltrim($path, '/')) . '?v=' . $version;
}

function redirect(string $path, array $query = []): never
{
    header('Location: ' . url($path, $query), true, 303);
    exit;
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(Csrf::token()) . '">';
}

/** R$ 1.234,56 (negativos como -R$ 1.234,56). */
function money(float|int|string|null $value, bool $withSymbol = true): string
{
    $number = (float) ($value ?? 0);
    $formatted = number_format(abs($number), 2, ',', '.');
    $prefix = $number < 0 ? '-' : '';
    return $prefix . ($withSymbol ? 'R$ ' : '') . $formatted;
}

/** Valor no formato do campo de formulário: 1.234,56 sem o símbolo. */
function money_input(float|int|string|null $value): string
{
    return $value === null || $value === '' ? '' : number_format((float) $value, 2, ',', '.');
}

/** 'aaaa-mm-dd' → 'dd/mm/aaaa'. */
function date_br(?string $date): string
{
    if ($date === null || $date === '') {
        return '';
    }
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', substr($date, 0, 10));
    return $d ? $d->format('d/m/Y') : '';
}

/**
 * Converte o valor digitado para decimal com ponto ('1234.56').
 * Aceita "1.234,56", "1234,56", "1234.56", "R$ 1.234" etc. Retorna null se inválido.
 * Sem vírgula, um ponto seguido de exatamente 3 dígitos é separador de milhar
 * (padrão brasileiro: "1.234" = mil duzentos e trinta e quatro).
 */
function parse_money(mixed $input): ?string
{
    if (!is_string($input) && !is_int($input) && !is_float($input)) {
        return null;
    }
    $s = preg_replace('/[\sR$\x{00A0}]/u', '', (string) $input) ?? '';
    if ($s === '') {
        return null;
    }
    if (str_contains($s, ',')) {
        $s = str_replace('.', '', $s);
        $s = str_replace(',', '.', $s);
    } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $s)) {
        $s = str_replace('.', '', $s);
    }
    if (!preg_match('/^\d+(\.\d{1,2})?$/', $s)) {
        return null;
    }
    return number_format((float) $s, 2, '.', '');
}

function month_name(int $month): string
{
    static $names = [1 => 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return $names[$month] ?? '';
}

/** Dado repreenchido após erro de validação, com valor padrão. */
function old(array $old, string $key, mixed $default = ''): string
{
    return (string) ($old[$key] ?? $default);
}

/** Primeiro dia do mês a partir de 'aaaa-mm'; usa o mês atual se inválido. */
function month_from_param(mixed $value, ?DateTimeImmutable $default = null): DateTimeImmutable
{
    if (is_string($value) && preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $value, $m) && $m[1] >= APP_MIN_YEAR && $m[1] <= APP_MAX_YEAR) {
        return new DateTimeImmutable("{$m[1]}-{$m[2]}-01");
    }
    return ($default ?? new DateTimeImmutable('today'))->modify('first day of this month')->setTime(0, 0);
}

function month_param(DateTimeImmutable $month): string
{
    return $month->format('Y-m');
}

/** 'Abril/2026' */
function month_label(DateTimeImmutable|string $month): string
{
    if (is_string($month)) {
        $month = new DateTimeImmutable(substr($month, 0, 10));
    }
    return month_name((int) $month->format('n')) . '/' . $month->format('Y');
}

/** Retorna o caminho apenas se for interno (evita redirecionamento para outro site). */
function safe_return_path(mixed $path, string $fallback): string
{
    if (is_string($path) && preg_match('#^/(?!/)[^\s\\\\]*$#', $path)) {
        return $path;
    }
    return $fallback;
}

/** Lê um par de campos mês/ano do formulário (ex.: invoice_month + invoice_year). Null se inválido. */
function month_from_fields(array $input, string $prefix): ?DateTimeImmutable
{
    $m = filter_var($input[$prefix . '_month'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 12]]);
    $y = filter_var($input[$prefix . '_year'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => APP_MIN_YEAR, 'max_range' => APP_MAX_YEAR]]);
    if ($m === false || $y === false) {
        return null;
    }
    return new DateTimeImmutable(sprintf('%04d-%02d-01', $y, $m));
}

/** Último mês permitido para lançamentos (dezembro do ano máximo). */
function last_allowed_month(): DateTimeImmutable
{
    return new DateTimeImmutable(APP_MAX_YEAR . '-12-01');
}
