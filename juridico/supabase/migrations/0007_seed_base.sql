-- =====================================================================
-- 0007 Dados iniciais editáveis no painel admin
-- Todas as regras jurídicas abaixo estão marcadas [VALIDAR COM ADVOGADO].
-- =====================================================================

insert into public.planos (codigo, nome, preco_centavos, max_usuarios, max_processos, modulos, cota_assinaturas_mes, ordem) values
  ('essencial', 'Essencial', 1990, 1, 30, array['M1','M2','M3','M4','M5','M6'], 0, 1),
  ('pro', 'Pro', 4990, 1, 150, array['M1','M2','M3','M4','M4_API','M5','M6','M7','M8','M9','M10'], 5, 2),
  ('escritorio', 'Escritório', 9990, 5, 400, array['M1','M2','M3','M4','M4_API','M5','M6','M7','M8','M9','M10'], 15, 3);

insert into public.regras_prazo (codigo, nome, rito, contagem, exclui_dia_inicio, suspensao_inicio, suspensao_fim,
  dje_publicacao_dia_util_seguinte, portal_dias_ciencia_ficta, inicio_e_fim_em_dia_util, permite_dobra, fundamentacao) values
  ('civel_cpc', 'Cível (CPC)', 'civel', 'uteis', true, '12-20', '01-20', true, 10, true, true,
   'CPC art. 219 (dias úteis); art. 220 (suspensão de 20/12 a 20/1); art. 224 (exclui o dia do começo e inclui o do vencimento; §§ 2º e 3º publicação no DJe no 1º dia útil seguinte à disponibilização e início no 1º dia útil seguinte à publicação); arts. 180, 183 e 186 (prazo em dobro para MP, Fazenda Pública e Defensoria); Lei 11.419/2006 art. 5º § 3º (intimação eletrônica: 10 dias corridos). [VALIDAR COM ADVOGADO]'),
  ('trabalhista_clt', 'Trabalhista (CLT)', 'trabalhista', 'uteis', true, '12-20', '01-20', true, 10, true, true,
   'CLT art. 775 (dias úteis, com exclusão do dia do começo e inclusão do vencimento); art. 775-A (suspensão de 20/12 a 20/1); Lei 11.419/2006 art. 5º § 3º. Prazos diferenciados da Fazenda Pública seguem o Decreto-Lei 779/1969. [VALIDAR COM ADVOGADO]'),
  ('jec', 'Juizados Especiais Cíveis', 'jec', 'uteis', true, '12-20', '01-20', true, 10, true, false,
   'Lei 9.099/1995 art. 12-A (dias úteis). Aplicação da suspensão do CPC art. 220 aos Juizados a confirmar conforme orientação do tribunal. [VALIDAR COM ADVOGADO]'),
  ('penal_cpp', 'Penal (CPP)', 'penal', 'corridos', true, null, null, true, 10, true, true,
   'CPP art. 798 (prazos contínuos e peremptórios, não se interrompem por férias, domingo ou feriado; § 1º exclui o dia do começo; § 3º vencimento em dia sem expediente prorroga para o dia útil imediato); Súmula 310 do STF (início no primeiro dia útil). Prazo em dobro apenas para Defensoria Pública (LC 80/1994). [VALIDAR COM ADVOGADO]');

insert into public.leis_referencia (sigla, nome, apelidos, ultimo_artigo, fonte) values
  ('CF', 'Constituição Federal de 1988', array['CF','CF/88','CRFB','CRFB/88','Constituição Federal','Constituição da República'], 250, 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm'),
  ('CPC', 'Código de Processo Civil (Lei 13.105/2015)', array['CPC','CPC/15','CPC/2015','NCPC','Código de Processo Civil'], 1072, 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm'),
  ('CC', 'Código Civil (Lei 10.406/2002)', array['CC','CC/02','CC/2002','Código Civil'], 2046, 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm'),
  ('CLT', 'Consolidação das Leis do Trabalho', array['CLT'], 922, 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm'),
  ('CPP', 'Código de Processo Penal', array['CPP','Código de Processo Penal'], 811, 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689.htm'),
  ('CP', 'Código Penal', array['CP','Código Penal'], 361, 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm'),
  ('CDC', 'Código de Defesa do Consumidor (Lei 8.078/1990)', array['CDC','Código de Defesa do Consumidor'], 119, 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm'),
  ('ECA', 'Estatuto da Criança e do Adolescente (Lei 8.069/1990)', array['ECA'], 267, 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm'),
  ('CTN', 'Código Tributário Nacional (Lei 5.172/1966)', array['CTN','Código Tributário Nacional'], 218, 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm'),
  ('L9099', 'Lei dos Juizados Especiais (Lei 9.099/1995)', array['Lei 9.099/95','Lei 9.099/1995','Lei nº 9.099/95','Lei nº 9.099/1995'], 97, 'https://www.planalto.gov.br/ccivil_03/leis/l9099.htm'),
  ('L8245', 'Lei do Inquilinato (Lei 8.245/1991)', array['Lei 8.245/91','Lei 8.245/1991','Lei nº 8.245/91','Lei do Inquilinato'], 90, 'https://www.planalto.gov.br/ccivil_03/leis/l8245.htm'),
  ('L8906', 'Estatuto da Advocacia (Lei 8.906/1994)', array['Lei 8.906/94','Lei 8.906/1994','Lei nº 8.906/94','EAOAB','Estatuto da OAB'], 87, 'https://www.planalto.gov.br/ccivil_03/leis/l8906.htm'),
  ('L6830', 'Lei de Execuções Fiscais (Lei 6.830/1980)', array['Lei 6.830/80','Lei 6.830/1980','LEF'], 42, 'https://www.planalto.gov.br/ccivil_03/leis/l6830.htm'),
  ('L12016', 'Lei do Mandado de Segurança (Lei 12.016/2009)', array['Lei 12.016/09','Lei 12.016/2009','Lei nº 12.016/2009'], 29, 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12016.htm'),
  ('L11419', 'Lei do Processo Eletrônico (Lei 11.419/2006)', array['Lei 11.419/06','Lei 11.419/2006','Lei nº 11.419/2006'], 22, 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11419.htm'),
  ('LINDB', 'Lei de Introdução às Normas do Direito Brasileiro', array['LINDB','LICC'], 19, 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del4657compilado.htm');

insert into public.modelos_documento (escritorio_id, tipo, nome, conteudo) values
(null, 'contrato_honorarios', 'Contrato de honorários (padrão)',
'CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS

CONTRATANTE: {{cliente_nome}}, {{cliente_qualificacao}}, inscrito(a) no CPF/CNPJ sob o nº {{cliente_documento}}, residente e domiciliado(a) em {{cliente_endereco}}.

CONTRATADO(A): {{advogado_nome}}, advogado(a) inscrito(a) na OAB/{{advogado_oab_uf}} sob o nº {{advogado_oab}}, integrante de {{escritorio_nome}}.

CLÁUSULA 1ª. DO OBJETO
O(A) CONTRATADO(A) prestará serviços advocatícios ao(à) CONTRATANTE para: {{objeto}}.

CLÁUSULA 2ª. DOS HONORÁRIOS
Pelos serviços, o(a) CONTRATANTE pagará o valor de {{valor}}, da seguinte forma: {{forma_pagamento}}.
Parágrafo único. Em caso de êxito, serão devidos ainda honorários de {{percentual_exito}} sobre o proveito econômico obtido.

CLÁUSULA 3ª. DOS HONORÁRIOS DE SUCUMBÊNCIA
Os honorários de sucumbência pertencem ao(à) advogado(a), nos termos do art. 23 da Lei 8.906/1994, sem prejuízo dos honorários contratados.

CLÁUSULA 4ª. DAS DESPESAS
Custas, emolumentos e despesas processuais correm por conta do(a) CONTRATANTE.

CLÁUSULA 5ª. DA RESCISÃO
O contrato pode ser rescindido por qualquer das partes, mediante comunicação escrita, sendo devidos os honorários proporcionais aos serviços já prestados.

CLÁUSULA 6ª. DO FORO
Fica eleito o foro da comarca de {{cidade}} para dirimir dúvidas oriundas deste contrato.

{{cidade}}, {{data_extenso}}.


______________________________
{{cliente_nome}}
CONTRATANTE


______________________________
{{advogado_nome}}
OAB/{{advogado_oab_uf}} {{advogado_oab}}'),
(null, 'procuracao', 'Procuração ad judicia et extra (padrão)',
'PROCURAÇÃO AD JUDICIA ET EXTRA

OUTORGANTE: {{cliente_nome}}, {{cliente_qualificacao}}, inscrito(a) no CPF/CNPJ sob o nº {{cliente_documento}}, residente e domiciliado(a) em {{cliente_endereco}}.

OUTORGADO(A): {{advogado_nome}}, advogado(a) inscrito(a) na OAB/{{advogado_oab_uf}} sob o nº {{advogado_oab}}, integrante de {{escritorio_nome}}.

PODERES: pelo presente instrumento, o(a) OUTORGANTE confere ao(à) OUTORGADO(A) os poderes da cláusula ad judicia et extra para o foro em geral, podendo propor ações, contestar, recorrer e praticar todos os atos necessários ao bom desempenho deste mandato, inclusive os poderes especiais para confessar, reconhecer a procedência do pedido, transigir, desistir, renunciar ao direito sobre o qual se funda a ação, receber, dar quitação, firmar compromisso e assinar declaração de hipossuficiência econômica (CPC art. 105), podendo substabelecer com ou sem reservas.

FINALIDADE ESPECÍFICA: {{objeto}}.

{{cidade}}, {{data_extenso}}.


______________________________
{{cliente_nome}}');
