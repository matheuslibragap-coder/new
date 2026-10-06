<?php
// Copie este arquivo para config.php (mesma pasta) e preencha os dados.
// O config.php não vai para o repositório.

return [
    'app' => [
        'name'     => 'Finanças',
        'timezone' => 'America/Sao_Paulo',

        // Deixe vazio para detectar automaticamente. Preencha só se os links
        // saírem errados, ex.: '/financas' quando o sistema fica numa subpasta.
        'base_url' => '',

        // Minutos sem uso até a sessão expirar.
        'session_idle_minutes' => 240,

        // true apenas para desenvolvimento: mostra detalhes dos erros na tela.
        'debug' => false,

        // Redefinição de senha pelo navegador (/redefinir-senha?token=...).
        // Fica desligada enquanto estiver vazio. Para usar, coloque um texto
        // aleatório com 32+ caracteres e apague de novo depois de redefinir.
        'reset_token' => '',
    ],

    'db' => [
        'host'    => 'localhost',
        'port'    => 3306,
        'name'    => 'financas',
        'user'    => 'usuario',
        'pass'    => 'senha',
        'charset' => 'utf8mb4',
    ],
];
