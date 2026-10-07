(function () {
    'use strict';

    // Menu lateral no celular
    var root = document.documentElement;
    var toggle = document.querySelector('[data-menu-toggle]');
    function setMenu(open) {
        root.classList.toggle('menu-open', open);
        if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (toggle) {
        toggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    }
    document.querySelectorAll('[data-menu-close]').forEach(function (el) {
        el.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setMenu(false);
    });

    // Confirmação antes de ações destrutivas
    document.querySelectorAll('form[data-confirm]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
        });
    });

    // Seletor de cor: sincroniza o seletor nativo, o campo hex, os atalhos e a prévia
    var colorInput = document.querySelector('[data-color-input]');
    var hexInput = document.querySelector('[data-color-hex]');
    var preview = document.querySelector('[data-color-preview]');
    function applyColor(hex, source) {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
        hex = hex.toUpperCase();
        if (source !== colorInput && colorInput) colorInput.value = hex.toLowerCase();
        if (source !== hexInput && hexInput) hexInput.value = hex;
        if (preview) preview.style.setProperty('--tag-color', hex);
    }
    if (colorInput && hexInput) {
        colorInput.addEventListener('input', function () { applyColor(colorInput.value, colorInput); });
        hexInput.addEventListener('input', function () {
            var v = hexInput.value.trim();
            if (v && v.charAt(0) !== '#') v = '#' + v;
            applyColor(v, hexInput);
        });
        document.querySelectorAll('[data-color-preset]').forEach(function (btn) {
            btn.addEventListener('click', function () { applyColor(btn.getAttribute('data-color-preset'), btn); });
        });
        var nameInput = document.querySelector('input[name="name"]');
        if (nameInput && preview) {
            nameInput.addEventListener('input', function () { preview.textContent = nameInput.value || 'Prévia'; });
        }
    }

    // Dias de fechamento/vencimento só para cartões
    var typeRadios = document.querySelectorAll('[data-category-type]');
    var cardFields = document.querySelector('[data-card-fields]');
    function syncCardFields() {
        var checked = document.querySelector('[data-category-type]:checked');
        var isCard = checked && checked.value === 'cartao';
        cardFields.hidden = !isCard;
    }
    if (typeRadios.length && cardFields) {
        typeRadios.forEach(function (r) { r.addEventListener('change', syncCardFields); });
        syncCardFields();
    }
    // Seletor de mês: junta mês e ano e envia
    document.querySelectorAll('form[data-autosubmit]').forEach(function (form) {
        var hidden = form.querySelector('[data-month-value]');
        form.querySelectorAll('[data-month-part]').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var m = form.querySelector('[data-month-part="m"]').value;
                var y = form.querySelector('[data-month-part="y"]').value;
                hidden.value = y + '-' + m;
                form.submit();
            });
        });
    });

    // ---------- Valores em reais ----------
    function parseMoney(text) {
        var s = String(text || '').replace(/[\sR$ ]/g, '');
        if (!s) return null;
        if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
        else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
        if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
        return Math.round(parseFloat(s) * 100);
    }
    function formatMoney(cents) {
        var neg = cents < 0;
        cents = Math.abs(cents);
        var int = Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        var dec = String(cents % 100).padStart(2, '0');
        return (neg ? '-' : '') + 'R$ ' + int + ',' + dec;
    }
    document.querySelectorAll('[data-money]').forEach(function (input) {
        input.addEventListener('blur', function () {
            var cents = parseMoney(input.value);
            if (cents !== null) input.value = formatMoney(cents).replace('R$ ', '');
        });
    });

    // ---------- Formulários de lançamento (Lançamentos, Controle diário e edição) ----------
    var MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    var LAST_MONTH = new Date(2040, 11, 1);
    function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
    function pad(n) { return String(n).padStart(2, '0'); }
    function monthLabel(d) { return MONTHS[d.getMonth()] + '/' + d.getFullYear(); }
    function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
    function monthsBetween(a, b) { return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth(); }

    // Mesma regra de CompetenceCalculator::invoiceDueDate (o servidor é quem decide).
    function invoiceDueDate(date, closingDay, dueDay) {
        var y = date.getFullYear(), m = date.getMonth();
        var closingThisMonth = Math.min(closingDay, daysInMonth(y, m));
        var closingMonth = date.getDate() >= closingThisMonth ? m + 1 : m;
        var dueMonth = dueDay > closingDay ? closingMonth : closingMonth + 1;
        var dy = y + Math.floor(dueMonth / 12), dm = ((dueMonth % 12) + 12) % 12;
        return new Date(dy, dm, Math.min(dueDay, daysInMonth(dy, dm)));
    }

    function setupTxForm(form) {
        var keepMonths = !!document.querySelector('.alert-error'); // voltou com erro: respeita o que foi escolhido
        var dirty = {};

        function value(name) {
            var checked = form.querySelector('[name="' + name + '"]:checked');
            if (checked) return checked.value;
            var el = form.querySelector('[name="' + name + '"]');
            return el && el.type !== 'radio' && el.type !== 'checkbox' ? el.value : '';
        }
        function monthFrom(prefix) {
            var m = form.querySelector('select[name="' + prefix + '_month"]:not(:disabled)');
            var y = form.querySelector('select[name="' + prefix + '_year"]:not(:disabled)');
            return m && y ? new Date(+y.value, +m.value - 1, 1) : null;
        }
        function setMonthFields(box, date) {
            var selects = box.querySelectorAll('select');
            selects[0].value = String(date.getMonth() + 1);
            if (selects[1].querySelector('option[value="' + date.getFullYear() + '"]')) selects[1].value = String(date.getFullYear());
        }
        function originOption() {
            var sel = form.querySelector('[data-origin]');
            return sel ? sel.options[sel.selectedIndex] : null;
        }
        function purchaseDate() {
            var input = form.querySelector('[data-date]');
            if (!input || !input.value) return null;
            var p = input.value.split('-');
            return new Date(+p[0], +p[1] - 1, +p[2]);
        }

        // Mostra/esconde blocos conforme as escolhas; campos escondidos ficam desabilitados.
        var showables = form.querySelectorAll('[data-show]');
        function applyVisibility() {
            showables.forEach(function (el) {
                el.hidden = !el.getAttribute('data-show').split(';').every(function (cond) {
                    var parts = cond.split('=');
                    return parts[1].split('|').indexOf(value(parts[0])) >= 0;
                });
            });
            form.querySelectorAll('input, select, textarea').forEach(function (c) {
                if (c.type === 'hidden') return;
                c.disabled = !!c.closest('[data-show][hidden]');
            });
            var untilEnd = form.querySelector('[data-until-end]');
            var monthsInput = form.querySelector('[data-months]');
            if (untilEnd && monthsInput && !untilEnd.disabled) monthsInput.disabled = untilEnd.checked;
        }
        // Se a opção marcada ficou escondida (ex.: "Parcelado" ao trocar para Entrada), marca a primeira visível.
        function fixHiddenChoices() {
            var changed = false;
            form.querySelectorAll('input[type="radio"]:checked:disabled').forEach(function (r) {
                var alt = form.querySelector('input[type="radio"][name="' + r.name + '"]:not(:disabled)');
                if (alt) { alt.checked = true; changed = true; }
            });
            return changed;
        }

        function suggestion() {
            var date = purchaseDate();
            if (!date) return null;
            var opt = originOption();
            var closing = opt ? +opt.getAttribute('data-closing') : 0, due = opt ? +opt.getAttribute('data-due') : 0;
            if (opt && opt.getAttribute('data-type') === 'cartao' && closing && due) {
                var d = invoiceDueDate(date, closing, due);
                return { month: new Date(d.getFullYear(), d.getMonth(), 1), hint: 'Sugestão pelo fechamento do cartão: fatura com vencimento em ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + '. Pode trocar se quiser.' };
            }
            return { month: addMonths(date, 1), hint: 'Sugestão: mês seguinte ao da compra. Cadastre o fechamento e o vencimento do cartão em "Contas e cartões" para sugestões exatas.' };
        }
        function applySuggestion() {
            var s = suggestion();
            form.querySelectorAll('[data-suggest]').forEach(function (box) {
                var hint = box.parentElement.querySelector('[data-suggest-hint]');
                if (!s) { if (hint) hint.textContent = ''; return; }
                if (!dirty[box.getAttribute('data-suggest')] && !keepMonths) setMonthFields(box, s.month);
                if (hint) hint.textContent = s.hint;
            });
        }
        form.querySelectorAll('[data-suggest]').forEach(function (box) {
            box.querySelectorAll('select').forEach(function (sel) {
                sel.addEventListener('change', function () { dirty[box.getAttribute('data-suggest')] = true; update(); });
            });
        });

        // Calcula o que vai ser lançado: mês, quantidade e valor do primeiro lançamento.
        function plan() {
            var cents = parseMoney(value('amount'));
            var mode = value('mode');
            var date = purchaseDate();
            var first = null, count = 1, firstCents = cents, eachCents = cents;
            if (form.querySelector('[data-competence]')) {
                first = monthFrom('competence');
            } else if (mode === 'recorrente' || mode === 'parcelado') {
                first = monthFrom('start');
                if (mode === 'parcelado') {
                    count = parseInt(value('installments'), 10) || 0;
                    if (cents && count > 1) {
                        eachCents = Math.floor(cents / count);
                        firstCents = eachCents + (cents - eachCents * count);
                    }
                } else {
                    var untilEnd = form.querySelector('[data-until-end]');
                    count = untilEnd && untilEnd.checked && first ? monthsBetween(first, LAST_MONTH) + 1 : (parseInt(value('months'), 10) || 0);
                }
            } else if (value('payment_method') === 'credito') {
                first = monthFrom('invoice');
            } else if (date) {
                first = new Date(date.getFullYear(), date.getMonth(), 1);
            }
            return { mode: mode, first: first, count: count, cents: cents, firstCents: firstCents, eachCents: eachCents };
        }

        function renderSummary(p) {
            var el = form.querySelector('[data-tx-summary]');
            if (!el) return;
            if (!p.first || !p.cents || p.count < 1) { el.hidden = true; return; }
            var last = addMonths(p.first, p.count - 1);
            var range = p.count > 1 ? ', de <strong>' + monthLabel(p.first) + '</strong> a <strong>' + monthLabel(last) + '</strong>' : ' em <strong>' + monthLabel(p.first) + '</strong>';
            var html;
            if (p.mode === 'parcelado') {
                html = p.count + 'x de ' + formatMoney(p.eachCents) + (p.firstCents !== p.eachCents ? ' (1ª de ' + formatMoney(p.firstCents) + ')' : '') + range + '.';
            } else if (p.mode === 'recorrente') {
                html = p.count + ' lançamento(s) de ' + formatMoney(p.cents) + range + '.';
            } else {
                html = 'Vai contar' + range + (value('payment_method') === 'credito' ? ' (fatura do cartão)' : '') + '.';
            }
            if (last > LAST_MONTH) html += ' <span class="amount-out">Passa de dezembro de 2040: diminua a quantidade.</span>';
            el.innerHTML = html;
            el.hidden = false;
        }

        // Aviso de orçamento: consulta o gasto da conta/cartão no mês do primeiro lançamento.
        var budgetWarning = form.querySelector('[data-budget-warning]');
        var budgetUrl = form.getAttribute('data-budget-url');
        var excludeId = form.getAttribute('data-transaction-id') || '0';
        var budgetTimer = null, budgetSeq = 0;
        function scheduleBudgetCheck(p) {
            if (!budgetWarning) return;
            clearTimeout(budgetTimer);
            var opt = originOption();
            if (value('type') !== 'saida' || !opt || !opt.value || !p.first || !p.firstCents) {
                budgetWarning.hidden = true;
                return;
            }
            budgetTimer = setTimeout(function () {
                var seq = ++budgetSeq;
                var monthParam = p.first.getFullYear() + '-' + pad(p.first.getMonth() + 1);
                fetch(budgetUrl + '?categoria=' + encodeURIComponent(opt.value) + '&mes=' + monthParam + '&excluir=' + encodeURIComponent(excludeId),
                    { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
                    .then(function (r) { return r.ok ? r.json() : null; })
                    .then(function (data) {
                        if (seq !== budgetSeq) return;
                        if (!data || data.limit === null) { budgetWarning.hidden = true; return; }
                        var limit = Math.round(data.limit * 100);
                        var after = Math.round(data.spent * 100) + p.firstCents;
                        if (after <= limit * 0.8) { budgetWarning.hidden = true; return; }
                        var name = opt.textContent.split('·')[0].trim();
                        budgetWarning.className = 'alert budget-warning ' + (after > limit ? 'alert-error' : 'alert-warning');
                        budgetWarning.textContent = (after > limit ? 'Este lançamento faz ' + name + ' passar do orçamento' : 'Com este lançamento, ' + name + ' passa de 80% do orçamento') +
                            ' em ' + monthLabel(p.first) + ': ' + formatMoney(after) + ' de ' + formatMoney(limit) + ' (' + Math.round(after / limit * 100) + '%).';
                        budgetWarning.hidden = false;
                    })
                    .catch(function () { budgetWarning.hidden = true; });
            }, 300);
        }

        // "Já está pago?" só aparece quando algum lançamento cai depois de hoje.
        var paidQuestion = form.querySelector('[data-paid-question]');
        function syncPaidQuestion(p) {
            if (!paidQuestion) return;
            var date = purchaseDate();
            var last = date;
            if (date && p.first && (p.mode === 'recorrente' || p.mode === 'parcelado') && p.count > 0) {
                var m = addMonths(p.first, p.count - 1);
                last = new Date(m.getFullYear(), m.getMonth(), Math.min(date.getDate(), daysInMonth(m.getFullYear(), m.getMonth())));
            }
            var today = new Date(); today.setHours(0, 0, 0, 0);
            var future = !!last && last > today;
            paidQuestion.hidden = !future;
            paidQuestion.querySelectorAll('input').forEach(function (r) { r.disabled = !future; r.required = future; });
        }

        function update() {
            applyVisibility();
            if (fixHiddenChoices()) applyVisibility();
            var p = plan();
            syncPaidQuestion(p);
            renderSummary(p);
            scheduleBudgetCheck(p);
        }

        form.addEventListener('change', function (e) {
            if (e.target.matches('[data-origin], [data-date], [name="payment_method"], [name="mode"]')) applySuggestion();
            update();
        });
        form.addEventListener('input', function (e) {
            if (e.target.matches('[data-money], [data-months], [data-installments]')) update();
        });
        applySuggestion();
        keepMonths = false;
        update();
    }
    document.querySelectorAll('form[data-tx-form]').forEach(setupTxForm);

    // Caixinha "Pago" da lista: envia assim que é marcada ou desmarcada
    document.querySelectorAll('form[data-paid-toggle]').forEach(function (form) {
        var box = form.querySelector('input[type="checkbox"]');
        box.addEventListener('change', function () {
            form.querySelector('[name="pago"]').value = box.checked ? '1' : '0';
            box.disabled = true;
            form.submit();
        });
    });

    // Mostra/esconde um bloco ligado a um checkbox (ex.: "Tem data para acabar")
    document.querySelectorAll('[data-toggle-target]').forEach(function (box) {
        var target = document.getElementById(box.getAttribute('data-toggle-target'));
        function sync() {
            target.hidden = !box.checked;
            target.querySelectorAll('input, select').forEach(function (c) { c.disabled = !box.checked; });
        }
        box.addEventListener('change', sync);
        sync();
    });

    // ---------- Gráficos do Painel ----------
    var dataEl = document.getElementById('dashboard-data');
    if (dataEl && window.Chart) {
        var data = JSON.parse(dataEl.textContent);
        var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        var compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
        var css = getComputedStyle(document.documentElement);
        var surface = css.getPropertyValue('--surface').trim() || '#ffffff';
        var ink = css.getPropertyValue('--text').trim();
        var muted = css.getPropertyValue('--text-muted').trim();
        var grid = '#eef0f3';

        Chart.defaults.font.family = 'Arial, Helvetica, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = muted;
        var tooltip = {
            backgroundColor: '#1d2939', titleColor: '#fff', bodyColor: '#fff', padding: 10, cornerRadius: 6,
            boxPadding: 4, usePointStyle: true
        };

        function donut(canvasId, items) {
            var canvas = document.getElementById(canvasId);
            if (!canvas || !items.length) return;
            var total = items.reduce(function (s, c) { return s + c.value; }, 0);
            new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: items.map(function (c) { return c.label; }),
                    datasets: [{
                        data: items.map(function (c) { return c.value; }),
                        backgroundColor: items.map(function (c) { return c.color; }),
                        borderColor: surface, borderWidth: 2, hoverOffset: 6
                    }]
                },
                options: {
                    cutout: '64%', maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: Object.assign({}, tooltip, {
                            callbacks: {
                                label: function (ctx) {
                                    return ' ' + ctx.label + ': ' + brl.format(ctx.parsed) + ' (' + (ctx.parsed / total * 100).toFixed(1).replace('.', ',') + '%)';
                                }
                            }
                        })
                    }
                }
            });
        }
        donut('chart-categories', data.categories);
        donut('chart-expenses', data.expenses || []);

        var barCanvas = document.getElementById('chart-months');
        if (barCanvas) {
            var bar = { borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'start', maxBarThickness: 24, categoryPercentage: 0.6, barPercentage: 0.9 };
            new Chart(barCanvas, {
                type: 'bar',
                data: {
                    labels: data.months.map(function (m) { return m.label; }),
                    datasets: [
                        Object.assign({ label: 'Entradas', data: data.months.map(function (m) { return m.income; }), backgroundColor: '#2a78d6' }, bar),
                        Object.assign({ label: 'Saídas', data: data.months.map(function (m) { return m.expense; }), backgroundColor: '#eb6834' }, bar)
                    ]
                },
                options: {
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted } },
                        y: {
                            beginAtZero: true, grid: { color: grid }, border: { display: false },
                            ticks: { color: muted, maxTicksLimit: 5, callback: function (v) { return 'R$ ' + compact.format(v); } }
                        }
                    },
                    plugins: {
                        legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10, color: ink } },
                        tooltip: Object.assign({}, tooltip, {
                            callbacks: { label: function (ctx) { return ' ' + ctx.dataset.label + ': ' + brl.format(ctx.parsed.y); } }
                        })
                    }
                }
            });
        }
    }
})();
