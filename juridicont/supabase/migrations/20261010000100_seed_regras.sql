-- Seed inicial da base de regras.
-- ATENÇÃO: todas as regras entram com revisao_pendente = true.
-- Os dispositivos marcados com [CONFERIR] precisam ser verificados no texto oficial
-- do Provimento 205/2021 e do Código de Ética e Disciplina da OAB antes do lançamento.

insert into public.regras
  (codigo, titulo, dispositivo, descricao, exemplos_vedados, exemplos_conformes, severidade_padrao, ativa, revisao_pendente)
values
(
  'OSTENTACAO',
  'Ostentação de bens',
  'Provimento 205/2021, art. 6º, parágrafo único',
  'Exibição de bens (veículos, viagens, hospedagens, bens de consumo) associada à publicidade profissional. Há divergência interpretativa quando se trata de perfil pessoal, por isso a severidade padrão é amarela.',
  array[
    'Foto ao lado de carro de luxo com a legenda "o sucesso de quem advoga com estratégia"',
    'Post do escritório mostrando relógio de grife e viagem internacional como prova de resultado',
    'Stories em hotel cinco estrelas com a frase "mais um mês de vitórias"'
  ],
  array[
    'Foto profissional em ambiente neutro com conteúdo informativo sobre direitos do consumidor',
    'Registro de participação em congresso jurídico, sem destaque a bens'
  ],
  'amarelo', true, true
),
(
  'PROMESSA_RESULTADO',
  'Promessa ou sugestão de resultado',
  'Provimento 205/2021, art. 6º, parágrafo único',
  'Qualquer promessa, garantia ou sugestão de resultado em causa judicial ou administrativa, inclusive percentuais de êxito.',
  array[
    'Ganhe sua causa trabalhista com quem entende',
    '100% de êxito em ações de revisão',
    'Sua aposentadoria garantida em 30 dias',
    'Recupere seu dinheiro, com certeza'
  ],
  array[
    'Entenda quais documentos costumam ser pedidos em uma ação de revisão',
    'Cada caso é analisado de forma individual; o resultado depende das provas e do entendimento do juízo'
  ],
  'vermelho', true, true
),
(
  'CASO_CONCRETO_OFERTA',
  'Uso de caso concreto para oferecer serviço',
  'Provimento 205/2021, art. 6º, parágrafo único',
  'Divulgação de casos concretos, valores obtidos ou vitórias de clientes como forma de oferecer serviços advocatícios.',
  array[
    'Consegui R$ 50 mil para meu cliente, fale comigo',
    'Print de sentença favorável com a legenda "você pode ser o próximo"',
    'Mais uma cliente indenizada pelo banco! Chama no direct'
  ],
  array[
    'Explicação em tese sobre como o STJ tem decidido casos de negativação indevida, sem identificar clientes nem valores'
  ],
  'vermelho', true, true
),
(
  'ESTRUTURA_ESCRITORIO',
  'Destaque à estrutura do escritório em publicidade ativa',
  'Provimento 205/2021, art. 6º, caput [CONFERIR NO TEXTO OFICIAL]',
  'Em publicidade ativa (impulsionada ou dirigida a público indeterminado), informações sobre dimensões, qualidades ou estrutura física do escritório.',
  array[
    'O maior escritório da região, com 500 m² de estrutura para atender você',
    'Anúncio pago destacando a sala de reunião luxuosa e a equipe de 30 pessoas'
  ],
  array[
    'Endereço, horário de atendimento e áreas de atuação, de forma objetiva'
  ],
  'amarelo', true, true
),
(
  'CAPTACAO_MERCANTILIZACAO',
  'Captação de clientela e mercantilização',
  'Provimento 205/2021 e Código de Ética e Disciplina da OAB [CONFERIR ARTIGOS]',
  'Chamadas de venda, linguagem comercial, urgência artificial, preços promocionais, descontos, sorteios ou qualquer forma de captação direta de clientela.',
  array[
    'Últimas vagas! Consulta grátis só hoje',
    'Divórcio a partir de R$ 999, parcelado no cartão',
    'Black Friday jurídica: 30% de desconto em contratos',
    'Clique no link e contrate agora'
  ],
  array[
    'Se você tem dúvidas sobre pensão alimentícia, procure um advogado ou a Defensoria Pública da sua cidade',
    'Conteúdo informativo sobre prazos de garantia no Código de Defesa do Consumidor'
  ],
  'vermelho', true, true
),
(
  'MALA_DIRETA',
  'Mala direta e mensagens em massa',
  'Provimento 205/2021 [CONFERIR ARTIGO]',
  'Envio de mensagens em massa (WhatsApp, e-mail, SMS, direct) a pessoas indeterminadas oferecendo serviços advocatícios.',
  array[
    'Roteiro de mensagem para disparar em listas de transmissão oferecendo revisão de aposentadoria',
    'Texto para enviar no direct de seguidores desconhecidos: "vi que você foi demitido, posso te ajudar"'
  ],
  array[
    'Newsletter enviada apenas a quem se inscreveu voluntariamente, com conteúdo informativo'
  ],
  'vermelho', true, true
),
(
  'SEGREDO_PROCESSUAL',
  'Exposição de processo, cliente ou ato processual',
  'Código de Ética e Disciplina da OAB e orientações dos Tribunais de Ética [CONFERIR]',
  'Exposição de processo sob segredo de justiça, dados de clientes ou gravações de audiências e atos processuais para fins publicitários.',
  array[
    'Vídeo de trecho de audiência com a legenda "olha como eu conduzi"',
    'Print de processo de família com nomes visíveis',
    'Número de processo e nome do cliente em post comemorativo'
  ],
  array[
    'Explicação genérica sobre como funciona uma audiência de conciliação, sem imagens de casos reais'
  ],
  'vermelho', true, true
),
(
  'COMPARACAO_COLEGAS',
  'Comparação com colegas e autoelogio superlativo',
  '[CONFERIR]',
  'Comparação com outros advogados ou escritórios, ou autoelogio em tom superlativo.',
  array[
    'O melhor advogado de Santa Maria',
    'Diferente dos outros escritórios, aqui você é tratado com respeito',
    'A advogada número 1 em direito previdenciário'
  ],
  array[
    'Advogada com atuação em direito previdenciário, inscrita na OAB/RS'
  ],
  'amarelo', true, true
);
