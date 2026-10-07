<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Session;
use App\Models\Overview;
use App\Models\Setting;
use App\Services\RecurringService;

final class GuideController extends Controller
{
    public function index(): void
    {
        $this->view('guide/index', [
            'title'  => 'Guia inicial',
            'counts' => array_map('intval', (new Overview())->counts()),
            'done'   => (new Setting())->get(Setting::GUIDE_DONE) !== null,
        ]);
    }

    public function finish(): void
    {
        (new Setting())->set(Setting::GUIDE_DONE, date('Y-m-d H:i:s'));
        Session::flash('success', 'Guia concluído. Ele continua disponível no menu, em "Guia inicial".');
        redirect('/');
    }

    public function reset(): void
    {
        if (mb_strtoupper(trim((string) Request::input('confirmacao', ''))) !== 'APAGAR') {
            Session::flash('error', 'Para apagar, digite APAGAR no campo de confirmação.');
            redirect('/guia#zerar');
        }
        $bills = !empty($_POST['apagar_contas']);
        $budgets = !empty($_POST['apagar_orcamentos']);
        (new Overview())->reset($bills, $budgets, RecurringService::currentMonth()->format('Y-m-d'));

        Session::flash('success', 'Lançamentos apagados.'
            . ($bills ? ' As contas obrigatórias e opcionais também foram apagadas.' : ' As contas obrigatórias e opcionais continuam cadastradas e voltam a aparecer a partir deste mês.')
            . ($budgets ? ' Os orçamentos foram apagados.' : ''));
        redirect('/guia');
    }
}
