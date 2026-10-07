<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;
use DateTimeImmutable;

final class Budget extends Model
{
    public const LEVEL_OK = 'ok';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_OVER = 'over';

    /** Verde até 80%, amarelo acima de 80% até 100%, vermelho acima de 100%. */
    public static function level(float $spent, float $limit): string
    {
        $pct = $limit > 0 ? $spent / $limit * 100 : 0;
        return match (true) {
            $pct > 100 => self::LEVEL_OVER,
            $pct > 80  => self::LEVEL_WARNING,
            default    => self::LEVEL_OK,
        };
    }

    /**
     * Categorias ativas (e inativas que ainda têm limite) com o limite e o total
     * de saídas do mês de competência, contando efetivados e pendentes.
     */
    public function overview(DateTimeImmutable $month): array
    {
        return $this->fetchAll(
            "SELECT c.id, c.name, c.color, c.type, c.active, b.limit_amount,
                    COALESCE(SUM(t.amount), 0) AS spent
               FROM categories c
          LEFT JOIN budgets b ON b.category_id = c.id
          LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'saida' AND t.competence_month = ?
              WHERE c.user_id = ? AND (c.active = 1 OR b.category_id IS NOT NULL)
           GROUP BY c.id, c.name, c.color, c.type, c.active, b.limit_amount
           ORDER BY c.name",
            [$month->format('Y-m-d'), $this->uid()]
        );
    }

    /** Só as categorias com limite acima de 80% no mês. */
    public function alerts(DateTimeImmutable $month): array
    {
        $alerts = [];
        foreach ($this->overview($month) as $row) {
            if ($row['limit_amount'] === null) {
                continue;
            }
            $level = self::level((float) $row['spent'], (float) $row['limit_amount']);
            if ($level !== self::LEVEL_OK) {
                $alerts[] = $row + ['level' => $level, 'pct' => (float) $row['spent'] / (float) $row['limit_amount'] * 100];
            }
        }
        usort($alerts, static fn ($a, $b) => $b['pct'] <=> $a['pct']);
        return $alerts;
    }

    /** @return array{limit: ?float, spent: float} gasto da categoria no mês, sem um lançamento opcional */
    public function usage(int $categoryId, DateTimeImmutable $month, ?int $excludeTransactionId = null): array
    {
        $limit = $this->fetchValue(
            'SELECT b.limit_amount FROM budgets b JOIN categories c ON c.id = b.category_id WHERE b.category_id = ? AND c.user_id = ?',
            [$categoryId, $this->uid()]
        );
        $spent = $this->fetchValue(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions
              WHERE user_id = ? AND category_id = ? AND type = 'saida' AND competence_month = ? AND id <> ?",
            [$this->uid(), $categoryId, $month->format('Y-m-d'), $excludeTransactionId ?? 0]
        );
        return ['limit' => $limit === null ? null : (float) $limit, 'spent' => (float) $spent];
    }

    public function set(int $categoryId, ?string $limit): void
    {
        if ($limit === null) {
            $this->execute('DELETE FROM budgets WHERE category_id = ?', [$categoryId]);
            return;
        }
        $this->execute(
            'INSERT INTO budgets (category_id, limit_amount) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount)',
            [$categoryId, $limit]
        );
    }
}
