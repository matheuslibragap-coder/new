<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use PDOException;

/** Cria as tabelas a partir de database/schema.sql quando ainda não existem. */
final class SchemaInstaller
{
    public function isInstalled(): bool
    {
        try {
            return (bool) Database::connection()->query("SHOW TABLES LIKE 'users'")->fetchColumn();
        } catch (PDOException) {
            return false;
        }
    }

    public function install(): void
    {
        $sql = file_get_contents(APP_ROOT . '/database/schema.sql');
        if ($sql === false) {
            throw new \RuntimeException('Não foi possível ler database/schema.sql');
        }

        // Comentários são removidos antes de dividir por ';', pois alguns contêm ';'.
        $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? '';
        $statements = array_filter(array_map('trim', preg_split('/;\s*$/m', $sql) ?: []));

        $pdo = Database::connection();
        foreach ($statements as $statement) {
            $pdo->exec($statement);
        }
    }
}
