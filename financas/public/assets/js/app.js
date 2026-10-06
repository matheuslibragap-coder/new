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
            if (manual.checked || !opt || !opt.value || !dateInput.value) {
                if (!isEdit) preview.textContent = '';
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
            if (!manual.checked) {
                txForm.querySelector('[name="competence_month"]').value = String(compMonth.getMonth() + 1);
                var yearSel = txForm.querySelector('[name="competence_year"]');
                if (yearSel.querySelector('option[value="' + compMonth.getFullYear() + '"]')) yearSel.value = String(compMonth.getFullYear());
            }
        }

        txForm.querySelectorAll('[data-tx-type]').forEach(function (r) { r.addEventListener('change', update); });
        [categorySel, dateInput, manual].forEach(function (el) { el.addEventListener('change', update); });
        [amountInput, installmentsInput].forEach(function (el) { if (el) el.addEventListener('input', update); });
        update();
    }
})();
