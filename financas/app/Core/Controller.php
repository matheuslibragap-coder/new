<?php
declare(strict_types=1);

namespace App\Core;

use App\Services\RecurringService;
use DateTimeImmutable;

abstract class Controller
{
    protected function view(string $template, array $data = [], ?string $layout = 'layout'): void
    {
        View::render($template, $data, $layout);
    }

    /** Volta ao formulário com mensagem de erro e os dados digitados preservados. */
    protected function backWithErrors(string $path, array $errors, array $input = []): never
    {
        Session::flash('error', implode(' ', $errors));
        Session::flashInput($input);
        redirect($path);
    }

    /**
     * Gera as contas recorrentes pendentes até o mês exibido (ou o atual, o que
     * for maior). Substitui o cron, que hospedagens compartilhadas não oferecem.
     */
    protected function syncRecurring(?DateTimeImmutable $viewedMonth = null): void
    {
        $current = RecurringService::currentMonth();
        (new RecurringService())->generateUntil(max($current, $viewedMonth ?? $current));
    }

    protected function notFound(): never
    {
        http_response_code(404);
        View::render('errors/simple', ['title' => 'Não encontrado', 'message' => 'O registro solicitado não existe.']);
        exit;
    }
}
