<?php
/** Guia inicial. Variáveis: $counts, $done */
$steps = [
    [
        'title' => $counts['origins'] > 0 ? 'Confira suas contas e cartões' : 'Cadastre suas contas e cartões',
        'where' => ['/categorias', 'Contas e cartões'],
        'ok'    => $counts['origins'] > 0,
        'count' => $counts['origins'] . ' ativo(s)',
        'text'  => 'São as <strong>origens do dinheiro</strong>: contas bancárias, carteiras (Pix, 99 Pay) e cartões de crédito. Em todo lançamento o sistema pergunta de qual delas o dinheiro saiu. ' . ($counts['origins'] > 0 ? 'Edite os que já existem, desative os que não usa e crie os que faltam.' : 'Sua conta começa vazia: cadastre cada conta, carteira e cartão que você usa.') . ' Nos cartões, os dias de fechamento e vencimento são opcionais (servem só para sugerir o mês da fatura).',
    ],
    [
        'title' => $counts['expense_categories'] > 0 ? 'Confira as categorias de gasto' : 'Crie suas categorias de gasto',
        'where' => ['/diario/categorias', 'Controle diário → Gerenciar categorias'],
        'ok'    => $counts['expense_categories'] > 0,
        'count' => $counts['expense_categories'] . ' ativa(s)',
        'text'  => 'Dizem <strong>com o que</strong> você gastou: Alimentação, Lazer, Transporte, Saúde… ' . ($counts['expense_categories'] > 0 ? 'Revise as que existem e crie as que fizerem sentido para você.' : 'Crie as que fizerem sentido para você. Sem pelo menos uma, o Controle diário não funciona.'),
    ],
    [
        'title' => 'Cadastre as contas obrigatórias',
        'where' => ['/contas/obrigatorias', 'Contas obrigatórias'],
        'ok'    => $counts['mandatory'] > 0,
        'count' => $counts['mandatory'] . ' cadastrada(s)',
        'text'  => 'Despesas fixas essenciais: aluguel, luz, água, internet, condomínio. Elas aparecem todo mês como <strong>pendentes</strong> até você marcar como pagas. Deixe sem data para acabar e elas seguem mês a mês (até ' . APP_MAX_YEAR . ').',
    ],
    [
        'title' => 'Cadastre assinaturas e dívidas postergáveis',
        'where' => ['/dividas', 'Dívidas postergáveis'],
        'ok'    => $counts['optional'] > 0,
        'count' => $counts['optional'] . ' cadastrada(s)',
        'text'  => 'Assinaturas e gastos que dá para cortar (YT Premium, Netflix, academia): cadastre como recorrentes e escolha <strong>em qual cartão ou conta</strong> cada uma é cobrada. Na aba Lançamentos, o botão <strong>"Postergável"</strong> também transforma qualquer pagamento em dívida postergável, que pode ser adiada para o mês seguinte.',
    ],
    [
        'title' => 'Lance suas entradas',
        'where' => ['/lancamentos', 'Lançamentos → Entrada'],
        'ok'    => $counts['incomes'] > 0,
        'count' => $counts['incomes'] . ' lançamento(s)',
        'text'  => 'Salário e outras rendas. Para o salário, escolha <strong>Recorrente</strong> e marque "Sem data para acabar": ele é lançado em todos os meses até dezembro de ' . APP_MAX_YEAR . '. Se o valor mudar, edite e aplique "esta e as próximas".',
    ],
    [
        'title' => 'Lance as compras parceladas que ainda estão correndo',
        'where' => ['/lancamentos', 'Lançamentos → Saída → Parcelado'],
        'ok'    => $counts['installments'] > 0,
        'count' => $counts['installments'] . ' compra(s)',
        'text'  => 'Para cada compra parcelada em andamento, informe o <strong>valor total</strong>, o número de parcelas e o <strong>mês da 1ª parcela</strong> (pode ser um mês passado). Assim as parcelas que faltam aparecem nos meses certos. Depois, apague as parcelas que já passaram, se quiser.',
    ],
    [
        'title' => 'Defina orçamentos (opcional)',
        'where' => ['/orcamentos', 'Orçamentos'],
        'ok'    => $counts['budgets'] > 0,
        'count' => $counts['budgets'] . ' limite(s)',
        'text'  => 'Um limite mensal por conta ou cartão. O sistema avisa quando passar de 80% e quando estourar.',
    ],
    [
        'title' => 'No dia a dia, use o Controle diário',
        'where' => ['/diario', 'Controle diário'],
        'ok'    => $counts['daily'] > 0,
        'count' => $counts['daily'] . ' gasto(s)',
        'text'  => 'Comprou um energético de R$ 12? Lance ali: valor, o que foi, categoria, de onde saiu e como pagou. Se foi no crédito, o sistema pergunta em qual mês cai na fatura.',
    ],
];
$completed = count(array_filter($steps, static fn ($s) => $s['ok']));
?>
<div class="page-header">
    <h1>Guia inicial</h1>
    <span class="muted"><?= $completed ?> de <?= count($steps) ?> passos com algo cadastrado</span>
</div>

<p class="muted">Siga os passos na ordem. Cada passo leva direto à aba certa. Os seletores de mês vão até dezembro de <?= APP_MAX_YEAR ?>, então você pode lançar tudo que já sabe que vai acontecer.</p>

<div class="card card-flush">
    <details class="reset-box" id="zerar">
        <summary><strong>Passo 0 (opcional): começar do zero</strong> <span class="muted small">· <?= $counts['transactions'] ?> lançamento(s) no sistema</span></summary>
        <form method="post" action="<?= e(url('/guia/zerar')) ?>" class="form">
            <?= csrf_field() ?>
            <p>Apaga <strong>todos os lançamentos</strong> (entradas, saídas, parcelas, gastos diários e o histórico de contas pagas). Contas e cartões e categorias de gasto continuam. <strong>Não dá para desfazer.</strong></p>
            <label class="checkbox"><input type="checkbox" name="apagar_contas" value="1"> Apagar também as contas obrigatórias e as assinaturas de Dívidas postergáveis cadastradas</label>
            <label class="checkbox"><input type="checkbox" name="apagar_orcamentos" value="1"> Apagar também os orçamentos</label>
            <label class="field">
                <span>Para confirmar, digite APAGAR</span>
                <input type="text" name="confirmacao" autocomplete="off" required pattern="[Aa][Pp][Aa][Gg][Aa][Rr]">
            </label>
            <div class="form-actions">
                <button type="submit" class="btn btn-danger-solid">Apagar lançamentos</button>
            </div>
        </form>
    </details>
</div>

<ol class="guide">
    <?php foreach ($steps as $i => $step): ?>
        <li class="guide-step<?= $step['ok'] ? ' is-done' : '' ?>">
            <span class="guide-number" aria-hidden="true"><?= $step['ok'] ? '✓' : $i + 1 ?></span>
            <div class="guide-body">
                <h2><?= e($step['title']) ?></h2>
                <p><?= $step['text'] ?></p>
                <div class="guide-footer">
                    <a href="<?= e(url($step['where'][0])) ?>" class="btn btn-small">Ir para <?= e($step['where'][1]) ?></a>
                    <span class="muted small"><?= e($step['count']) ?></span>
                </div>
            </div>
        </li>
    <?php endforeach; ?>
</ol>

<?php if (!$done): ?>
    <form method="post" action="<?= e(url('/guia/concluir')) ?>" class="guide-finish">
        <?= csrf_field() ?>
        <button type="submit" class="btn btn-primary">Concluir guia e ir para o Painel</button>
        <span class="muted small">Enquanto não concluir, o guia abre no lugar do Painel. Ele fica sempre disponível no menu.</span>
    </form>
<?php endif; ?>
