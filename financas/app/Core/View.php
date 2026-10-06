<?php
declare(strict_types=1);

namespace App\Core;

final class View
{
    /**
     * Renderiza Views/{$template}.php dentro de Views/{$layout}.php.
     * O layout recebe o HTML da página em $content e as mesmas variáveis.
     */
    public static function render(string $template, array $data = [], ?string $layout = 'layout'): void
    {
        $data['flash'] = $data['flash'] ?? Session::pullFlash();
        $data['currentPath'] = Request::path();

        $content = self::capture($template, $data);
        if ($layout === null) {
            echo $content;
            return;
        }
        echo self::capture($layout, $data + ['content' => $content]);
    }

    public static function partial(string $template, array $data = []): void
    {
        echo self::capture($template, $data);
    }

    private static function capture(string $__template, array $__data): string
    {
        $__file = APP_PATH . '/Views/' . $__template . '.php';
        if (!is_file($__file)) {
            throw new \RuntimeException("View não encontrada: {$__template}");
        }
        extract($__data, EXTR_SKIP);
        ob_start();
        try {
            require $__file;
        } catch (\Throwable $e) {
            ob_end_clean();
            throw $e;
        }
        return (string) ob_get_clean();
    }
}
