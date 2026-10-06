<?php
declare(strict_types=1);

namespace App\Core;

use PDO;

final class Database
{
    private static ?PDO $pdo = null;
    private static string $timezoneOffset = '+00:00';

    public static function setTimezoneOffset(string $offset): void
    {
        self::$timezoneOffset = $offset;
    }

    public static function connection(): PDO
    {
        if (self::$pdo === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                Config::get('db.host', 'localhost'),
                (int) Config::get('db.port', 3306),
                Config::get('db.name'),
                Config::get('db.charset', 'utf8mb4')
            );
            self::$pdo = new PDO($dsn, (string) Config::get('db.user'), (string) Config::get('db.pass'), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            $stmt = self::$pdo->prepare('SET time_zone = ?');
            $stmt->execute([self::$timezoneOffset]);
        }
        return self::$pdo;
    }
}
