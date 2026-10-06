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
        cardFields.querySelectorAll('input').forEach(function (input) { input.required = !!isCard; });
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

    // ---------- Formulário de lançamento ----------
    var MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
    function pad(n) { return String(n).padStart(2, '0'); }

    // Mesma regra de CompetenceCalculator::invoiceDueDate (o servidor é quem decide).
    function invoiceDueDate(date, closingDay, dueDay) {
        var y = date.getFullYear(), m = date.getMonth();
        var closingThisMonth = Math.min(closingDay, daysInMonth(y, m));
        var closingMonth = date.getDate() >= closingThisMonth ? m + 1 : m;
        var dueMonth = dueDay > closingDay ? closingMonth : closingMonth + 1;
        var dy = y + Math.floor(dueMonth / 12), dm = ((dueMonth % 12) + 12) % 12;
        return new Date(dy, dm, Math.min(dueDay, daysInMonth(dy, dm)));
    }

    var txForm = document.querySelector('[data-transaction-form]');
    if (txForm) {
        var categorySel = txForm.querySelector('[data-tx-category]');
        var dateInput = txForm.querySelector('[data-tx-date]');
        var amountInput = txForm.querySelector('[data-money]');
        var installmentsField = txForm.querySelector('[data-installments-field]');
        var installmentsInput = txForm.querySelector('[data-installments]');
        var installmentsPreview = txForm.querySelector('[data-installments-preview]');
        var preview = txForm.querySelector('[data-competence-preview]');
        var manual = txForm.querySelector('[data-competence-manual]');
        var manualFields = txForm.querySelector('[data-competence-fields]');
        var inHint = txForm.querySelector('[data-in-hint]');
        var parcelNumber = parseInt(txForm.getAttribute('data-parcel-number'), 10) || 1;
        var isEdit = !installmentsField;

        function currentType() {
            var checked = txForm.querySelector('[data-tx-type]:checked');
            return checked ? checked.value : 'saida';
        }
        function selectedCategory() {
            return categorySel.options[categorySel.selectedIndex];
        }

        function update() {
            var type = currentType();
            // Entradas: só contas/carteiras
            Array.prototype.forEach.call(categorySel.options, function (opt) {
                if (!opt.value) return;
                var blocked = type === 'entrada' && opt.getAttribute('data-type') !== 'conta';
                opt.disabled = blocked;
                opt.hidden = blocked;
            });
            if (selectedCategory().disabled) categorySel.value = '';
            if (inHint) inHint.hidden = type !== 'entrada';

            var opt = selectedCategory();
            var isCard = opt && opt.getAttribute('data-type') === 'cartao';
            if (installmentsField) {
                installmentsField.hidden = !(type === 'saida' && isCard);
                if (installmentsField.hidden) installmentsInput.value = 1;
            }

            var count = installmentsInput ? parseInt(installmentsInput.value, 10) || 1 : 1;
            var cents = parseMoney(amountInput.value);
            if (installmentsPreview) {
                if (count > 1 && cents) {
                    var base = Math.floor(cents / count);
                    var first = base + (cents - base * count);
                    installmentsPreview.textContent = first === base
                        ? count + 'x de ' + formatMoney(base)
                        : '1ª de ' + formatMoney(first) + ' + ' + (count - 1) + 'x de ' + formatMoney(base);
                } else {
                    installmentsPreview.textContent = '';
                }
            }

            manualFields.hidden = !manual.checked;
            var firstAmount = cents;
            if (cents && count > 1) firstAmount = Math.floor(cents / count) + (cents - Math.floor(cents / count) * count);

            if (manual.checked) {
                var mm = +txForm.querySelector('[name="competence_month"]').value;
                var yy = +txForm.querySelector('[name="competence_year"]').value;
                if (!isEdit) preview.textContent = '';
                scheduleBudgetCheck(type, opt, new Date(yy, mm - 1, 1), firstAmount);
                return;
            }
            if (!opt || !opt.value || !dateInput.value) {
                if (!isEdit) preview.textContent = '';
                scheduleBudgetCheck(type, null, null, null);
                return;
            }
            var parts = dateInput.value.split('-');
            var date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
            var compMonth, html;
            if (isCard) {
                var due = invoiceDueDate(date, +opt.getAttribute('data-closing'), +opt.getAttribute('data-due'));
                compMonth = new Date(due.getFullYear(), due.getMonth() + (parcelNumber - 1), 1);
                html = (parcelNumber > 1
                    ? 'Parcela ' + parcelNumber
                    : 'Fatura com vencimento em ' + pad(due.getDate()) + '/' + pad(due.getMonth() + 1) + '/' + due.getFullYear()) +
                    ' → competência <strong>' + MONTHS[compMonth.getMonth()] + '/' + compMonth.getFullYear() + '</strong>';
                if (count > 1) {
                    var last = new Date(compMonth.getFullYear(), compMonth.getMonth() + count - 1, 1);
                    html += ' até <strong>' + MONTHS[last.getMonth()] + '/' + last.getFullYear() + '</strong>';
                }
            } else {
                compMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                html = 'Competência <strong>' + MONTHS[compMonth.getMonth()] + '/' + compMonth.getFullYear() + '</strong>';
            }
            preview.innerHTML = html;

            // Deixa o ajuste manual já posicionado no mês calculado
            txForm.querySelector('[name="competence_month"]').value = String(compMonth.getMonth() + 1);
            var yearSel = txForm.querySelector('[name="competence_year"]');
            if (yearSel.querySelector('option[value="' + compMonth.getFullYear() + '"]')) yearSel.value = String(compMonth.getFullYear());

            scheduleBudgetCheck(type, opt, compMonth, firstAmount);
        }

        // Aviso de orçamento: consulta o gasto da categoria no mês de competência
        var budgetWarning = txForm.querySelector('[data-budget-warning]');
        var budgetUrl = txForm.getAttribute('data-budget-url');
        var excludeId = txForm.getAttribute('data-transaction-id');
        var budgetTimer = null, budgetSeq = 0;
        function scheduleBudgetCheck(type, opt, month, amountCents) {
            clearTimeout(budgetTimer);
            if (type !== 'saida' || !opt || !opt.value || !month || !amountCents) {
                budgetWarning.hidden = true;
                return;
            }
            budgetTimer = setTimeout(function () {
                var seq = ++budgetSeq;
                var monthParam = month.getFullYear() + '-' + pad(month.getMonth() + 1);
                var url = budgetUrl + '?categoria=' + encodeURIComponent(opt.value) + '&mes=' + monthParam + '&excluir=' + encodeURIComponent(excludeId);
                fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
                    .then(function (r) { return r.ok ? r.json() : null; })
                    .then(function (data) {
                        if (seq !== budgetSeq) return;
                        if (!data || data.limit === null) { budgetWarning.hidden = true; return; }
                        var limit = Math.round(data.limit * 100);
                        var after = Math.round(data.spent * 100) + amountCents;
                        var pct = Math.round(after / limit * 100);
                        if (after <= limit * 0.8) { budgetWarning.hidden = true; return; }
                        var name = opt.textContent.split('·')[0].trim();
                        var monthLabel = MONTHS[month.getMonth()] + '/' + month.getFullYear();
                        budgetWarning.className = 'alert budget-warning ' + (after > limit ? 'alert-error' : 'alert-warning');
                        budgetWarning.textContent = (after > limit ? 'Este lançamento faz ' + name + ' passar do orçamento' : 'Com este lançamento, ' + name + ' passa de 80% do orçamento') +
                            ' em ' + monthLabel + ': ' + formatMoney(after) + ' de ' + formatMoney(limit) + ' (' + pct + '%).';
                        budgetWarning.hidden = false;
                    })
                    .catch(function () { budgetWarning.hidden = true; });
            }, 300);
        }

        txForm.querySelectorAll('[data-tx-type]').forEach(function (r) { r.addEventListener('change', update); });
        [categorySel, dateInput, manual].forEach(function (el) { el.addEventListener('change', update); });
        txForm.querySelectorAll('[name="competence_month"], [name="competence_year"]').forEach(function (el) { el.addEventListener('change', update); });
        [amountInput, installmentsInput].forEach(function (el) { if (el) el.addEventListener('input', update); });
        update();
    }
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

        var donutCanvas = document.getElementById('chart-categories');
        if (donutCanvas && data.categories.length) {
            var total = data.categories.reduce(function (s, c) { return s + c.value; }, 0);
            new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: data.categories.map(function (c) { return c.label; }),
                    datasets: [{
                        data: data.categories.map(function (c) { return c.value; }),
                        backgroundColor: data.categories.map(function (c) { return c.color; }),
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
