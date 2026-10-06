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
})();
