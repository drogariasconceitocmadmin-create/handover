const SHEET_NAMES = {
  GERAL: 'Geral',
  MEDICAMENTOS: 'Medicamentos',
  COMPRAS_MEDICAMENTOS: 'Compras_Medicamentos',
  ARQUIVO: 'Arquivo_Resolvidos',
  CHECKLIST: 'Checklist_Turnos',
  USUARIOS: 'Usuarios_Handover',
  AUDITORIA: 'Auditoria_Handover',
};

/** Valores exatos da coluna Status_Compra (dropdown na aba operacional). */
const COMPRAS_STATUS_COMPRA = {
  PENDENTE: 'Pendente de compra',
  COMPRADO: 'Comprado',
  NAO_ENCONTRADO: 'Não encontrado',
  CANCELADO: 'Cancelado',
};

/** Encomenda: preço e data obrigatórios (criação e edição). */
var ENCOMENDA_PRECO_DATA_MSG_ =
  'Para registrar uma encomenda, informe a data prevista de entrega.';

const FORMAS_RECEBIMENTO = {
  A_COMBINAR: 'A combinar',
  RETIRA_LOJA: 'Retira na loja',
  ENTREGA_ENDERECO: 'Entregar no endereço cadastrado',
};

/** Partículas em minúsculas no meio do nome (mensagens ao cliente). */
var FORMAT_NOME_PARTICULAS_ = { de: true, da: true, do: true, das: true, dos: true };

/**
 * Formata nome do cliente para mensagens (WhatsApp / Mensagem_Cliente): título simples em pt-BR.
 * Não altera o cadastro na planilha; só uso em texto gerado.
 */
function formatNomeClienteMensagem_(raw) {
  var s = sanitizeText_(raw);
  if (!s) {
    return '';
  }
  s = s.replace(/\s+/g, ' ').trim();
  if (!s) {
    return '';
  }
  var parts = s.split(' ');
  return parts
    .map(function (word, i) {
      if (!word) {
        return '';
      }
      var lower = word.toLocaleLowerCase('pt-BR');
      if (i > 0 && FORMAT_NOME_PARTICULAS_[lower]) {
        return lower;
      }
      if (word.length === 1) {
        return word.toLocaleUpperCase('pt-BR');
      }
      return word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1).toLocaleLowerCase('pt-BR');
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Mensagem sugerida para Status_Compra = Não encontrado (só Mensagem_Cliente; sem WhatsApp automático).
 * Sem nome na coluna Cliente: primeira frase começa em "Olá!".
 * Sem Medicamento: usa "medicamento solicitado".
 */
function buildMensagemClienteNaoEncontrado_(cliente, medicamento) {
  var nome = formatNomeClienteMensagem_(cliente);
  var medRaw = sanitizeText_(medicamento);
  var sobreMedicamento = medRaw
    ? 'Sobre o medicamento ' + medRaw + ', '
    : 'Sobre o medicamento solicitado, ';
  var primeiro =
    (nome ? 'Olá, ' + nome + '! ' : 'Olá! ') +
    sobreMedicamento +
    'verificamos com nosso fornecedor e, no momento, ele não está disponível para compra imediata.';
  var segundo =
    'Para não te deixar sem atendimento, podemos procurar uma alternativa equivalente ou uma opção com o mesmo objetivo terapêutico, sempre com orientação responsável.';
  var terceiro = 'Você gostaria que a nossa equipe verificasse uma alternativa para te atender?';
  return primeiro + '\n\n' + segundo + '\n\n' + terceiro;
}

const EMAIL_ENCOMENDAS = 'drogariasconceitocm@gmail.com';
const HANDOVER_SPREADSHEET_ID_KEY = 'HANDOVER_SPREADSHEET_ID';
const HANDOVER_SPREADSHEET_TITLE = 'Handover Drogarias Conceito';
const HANDOVER_TIMEZONE = 'America/Sao_Paulo';
const COMPRAS_SPREADSHEET_ID_KEY = 'COMPRAS_SPREADSHEET_ID';
const COMPRAS_SPREADSHEET_TITLE = 'Compras_Drogarias_Conceito';

// Auth/PIN (backend-only nesta Parte 1)
const HANDOVER_USERS_HEADERS = [
  'ID',
  'Nome',
  'Usuario',
  'Pin_Hash',
  'Perfil',
  'Ativo',
  'Criado_Em',
  'Criado_Por',
  'Ultimo_Login_Em',
  /** PIN em texto só até rodar aplicarPinsTemporariosHandover(); depois a célula é limpa. */
  'PIN_Novo_Temporario',
];

const HANDOVER_AUTH_SALT_KEY = 'HANDOVER_PIN_SALT_V1';
const HANDOVER_SESSION_TTL_SECONDS = 21600; // CacheService max TTL (~6h)
const HANDOVER_SESSION_CACHE_PREFIX = 'handover_sess_v1:';

const CHECKLIST_TURNO_MANHA = 'Manhã';
const CHECKLIST_TURNO_TARDE = 'Tarde';
const CHECKLIST_TURNO_NOITE = 'Noite';
const CHECKLIST_HORARIO_REFERENCIA = '07:00';
const CHECKLIST_HORARIO_TARDE = '13:40';
const CHECKLIST_HORARIO_NOITE = '22:00';
const CHECKLIST_ALERT_HHMM = '07:30';

const CHECKLIST_STATUS = {
  PENDENTE: 'Pendente',
  FEITO: 'Feito',
  NA: 'Não aplicável',
};

const HEADERS = {
  Geral: [
    'ID',
    'Timestamp',
    'Autor',
    'Titulo',
    'Urgencia',
    'Descricao',
    'Resolvido',
    'Ultima_Acao_Por',
    'Ultima_Acao_Em',
    'Resolvido_Por',
    'Data_Resolucao',
    'ID_Reaberto_De',
    'Tem_Vencimento',
    'Data_Vencimento',
    'Hora_Vencimento',
  ],
  Medicamentos: [
    'ID',
    'Timestamp',
    'Tipo',
    'Medicamento',
    'Pre_Pago',
    'Cliente',
    'Atendente',
    'Previsao_Entrega',
    'Comprado',
    'Entregue',
    'Telefone',
    'Status',
    'Status_Aviso_WhatsApp',
    'Data_Aviso_WhatsApp',
    'Preco_Venda',
    'Ultima_Acao_Por',
    'Ultima_Acao_Em',
    'Revertido_Por',
    'Data_Reversao',
    'Status_Anterior',
    'Motivo_Reversao',
    'Cancelado_Por',
    'Data_Cancelamento',
    'Motivo_Cancelamento',
    'Fornecedor_Compra',
    'Codigo_Compra_Fornecedor',
    'Forma_Recebimento',
    'Observacao_Solicitacao',
  ],
  Compras_Medicamentos: [
    'ID_Compra',           // UUID gerado na criação da linha de compras (novo)
    'ID_Handover',         // FK → Medicamentos.ID
    'Data_Solicitacao',
    'Tipo',
    'Medicamento',
    'Atendente',
    'Cliente',
    'Telefone',
    'Preco_Venda',
    'Pre_Pago',
    'Fornecedor_Compra',
    'Codigo_Compra_Fornecedor',
    'Forma_Recebimento',
    'Previsao_Entrega',
    'Status_Compra',
    'Status_Handover',
    'Comprado',            // boolean espelhado de Medicamentos.Comprado
    'Comprado_Por',
    'Data_Compra',
    'Entregue',            // boolean espelhado de Medicamentos.Entregue
    'Entregue_Por',        // campo operacional — preenchido pelo fluxo de entrega
    'Data_Entrega',        // campo operacional — preenchido pelo fluxo de entrega
    'Cancelado',           // boolean: true quando Status_Handover = Cancelado
    'Cancelado_Por',
    'Data_Cancelamento',
    'Motivo_Cancelamento',
    'Observacao_Solicitacao',
    'Observacao_Compra',
    'Mensagem_Cliente',
    'Ultima_Atualizacao',
  ],
  Usuarios_Handover: HANDOVER_USERS_HEADERS,
  Auditoria_Handover: [
    'ID_Auditoria',
    'Data_Hora',
    'Acao',
    'Origem',
    'ID_Item',
    'Usuario',
    'Nome',
    'Perfil',
    'Campo',
    'Valor_Anterior',
    'Valor_Novo',
    'Resumo',
  ],
  Arquivo_Resolvidos: [
    'Origem',
    'ID',
    'Timestamp',
    'Tipo',
    'Autor',
    'Descricao',
    'Medicamento',
    'Pre_Pago',
    'Cliente',
    'Atendente',
    'Previsao_Entrega',
    'Comprado',
    'Resolvido',
    'Entregue',
    'Telefone',
    'Status',
    'Status_Aviso_WhatsApp',
    'Data_Aviso_WhatsApp',
    'Arquivado_Em',
    'Preco_Venda',
    'Ultima_Acao_Por',
    'Ultima_Acao_Em',
    'Resolvido_Por',
    'Data_Resolucao',
    'Titulo',
    'Urgencia',
    'Estado_Arquivo',
    'Reaberto_Por',
    'Data_Reabertura',
    'Motivo_Reabertura',
    'ID_Registro_Ativo',
    'Tem_Vencimento',
    'Data_Vencimento',
    'Hora_Vencimento',
    'Revertido_Por',
    'Data_Reversao',
    'Status_Anterior',
    'Motivo_Reversao',
  ],
  Checklist_Turnos: [
    'ID',
    'Data',
    'Turno',
    'Horario_Referencia',
    'Categoria',
    'Item',
    'Descricao',
    'Status',
    'Responsavel',
    'Data_Hora_Check',
    'Observacao',
  ],
};

function normalizeFornecedorCompraInput_(raw) {
  var s = sanitizeText_(raw).trim();
  if (!s || /^n[aã]o\s+informado$/i.test(s)) {
    return 'Não informado';
  }
  if (s === 'Panpharma') {
    return 'Panpharma';
  }
  if (s === 'Santa Cruz') {
    return 'Santa Cruz';
  }
  return 'Não informado';
}

function normalizeCodigoCompraFornecedorInput_(raw, fornecedorNorm) {
  var f = fornecedorNorm || normalizeFornecedorCompraInput_('');
  if (f !== 'Panpharma' && f !== 'Santa Cruz') {
    return '';
  }
  var c = sanitizeText_(raw).trim();
  if (!c) {
    return '';
  }
  return c.length > 160 ? c.slice(0, 160) : c;
}

function normalizeFormaRecebimento_(raw) {
  var s = sanitizeText_(raw).trim();
  if (s === FORMAS_RECEBIMENTO.RETIRA_LOJA) {
    return FORMAS_RECEBIMENTO.RETIRA_LOJA;
  }
  if (s === FORMAS_RECEBIMENTO.ENTREGA_ENDERECO) {
    return FORMAS_RECEBIMENTO.ENTREGA_ENDERECO;
  }
  return FORMAS_RECEBIMENTO.A_COMBINAR;
}

function doGet() {
  // Não chamar setupSpreadsheet aqui: evita layout pesado em Compras_Medicamentos e todas as abas
  // antes do usuário autenticar (login aparece mais rápido). Planilha é inicializada no primeiro
  // google.script.run após login ou em funções administrativas.

  const template = HtmlService.createTemplateFromFile('Index');
  // Sem dados na carga inicial: o dashboard só carrega após sessão válida no cliente (refreshDashboardBundle).
  template.initialDataB64 = Utilities.base64EncodeWebSafe(
    JSON.stringify({
      geral: [],
      medicamentos: [],
      checklistTurno: null,
    }),
    Utilities.Charset.UTF_8
  );

  return template
    .evaluate()
    .setTitle('Solicitacoes Drogaria')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = sanitizeText_(properties.getProperty(HANDOVER_SPREADSHEET_ID_KEY));

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      throw new Error(
        'Nao foi possivel abrir a planilha configurada em ' +
          HANDOVER_SPREADSHEET_ID_KEY +
          ' (' +
          spreadsheetId +
          '). Verifique o ID e as permissoes da conta.'
      );
    }
  }

  try {
    const spreadsheet = SpreadsheetApp.create(HANDOVER_SPREADSHEET_TITLE);
    properties.setProperty(HANDOVER_SPREADSHEET_ID_KEY, spreadsheet.getId());
    return spreadsheet;
  } catch (error) {
    throw new Error(
      'Nao foi possivel criar a planilha do Handover automaticamente. Configure a propriedade ' +
        HANDOVER_SPREADSHEET_ID_KEY +
        ' com um ID valido.'
    );
  }
}

/**
 * Abre a planilha separada de Compras_Drogarias_Conceito.
 * Requer que a propriedade COMPRAS_SPREADSHEET_ID esteja configurada.
 * NÃO cria planilha automaticamente — use setupComprasPlanilha() para criar e configurar.
 */
function getComprasSpreadsheet_() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = sanitizeText_(properties.getProperty(COMPRAS_SPREADSHEET_ID_KEY));
  if (!spreadsheetId) {
    throw new Error(
      'Propriedade ' + COMPRAS_SPREADSHEET_ID_KEY + ' nao configurada. ' +
      'Execute setupComprasPlanilha() para criar a planilha de Compras e configurar a propriedade automaticamente.'
    );
  }
  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    throw new Error(
      'Nao foi possivel abrir a planilha de Compras configurada em ' + COMPRAS_SPREADSHEET_ID_KEY +
      ' (' + spreadsheetId + '). Verifique o ID e as permissoes da conta.'
    );
  }
}

function getSpreadsheetIdForDebug() {
  const spreadsheet = getSpreadsheet_();
  const spreadsheetId = spreadsheet.getId();
  Logger.log('HANDOVER_SPREADSHEET_ID em uso: ' + spreadsheetId);
  return spreadsheetId;
}

// =============================================================================
// Virada de Produção — funções de setup / manutenção (executar manualmente)
// =============================================================================

/**
 * FASE 1 — MANUAL: copia a planilha do Handover como backup antes de qualquer reset.
 * Executa no editor GAS; não toca em dados nem em propriedades.
 * Retorna { ok, id, nome } do backup criado.
 */
function backupHandoverPlanilha() {
  var ss = getSpreadsheet_();
  var ts = Utilities.formatDate(new Date(), HANDOVER_TIMEZONE, 'yyyyMMdd_HHmm');
  var copy = ss.copy('BACKUP_' + ts + '_' + ss.getName());
  Logger.log('backupHandoverPlanilha: backup criado id=' + copy.getId() + ' nome=' + copy.getName() + ' url=' + copy.getUrl());
  return { ok: true, id: copy.getId(), nome: copy.getName(), url: copy.getUrl() };
}

/**
 * FASE 2 — MANUAL: cria a planilha Compras_Drogarias_Conceito, cria/formata a aba Compras_Medicamentos
 * e salva o ID na propriedade COMPRAS_SPREADSHEET_ID automaticamente.
 * Idempotente se a propriedade já existir: só recria headers/layout sem apagar dados.
 * Retorna { ok, id, url, nome }.
 */
function setupComprasPlanilha() {
  var properties = PropertiesService.getScriptProperties();
  var existingId = sanitizeText_(properties.getProperty(COMPRAS_SPREADSHEET_ID_KEY));
  var ss;
  if (existingId) {
    try {
      ss = SpreadsheetApp.openById(existingId);
      Logger.log('setupComprasPlanilha: planilha existente id=' + existingId);
    } catch (e) {
      Logger.log('setupComprasPlanilha: id existente invalido (' + existingId + '), criando nova planilha');
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(COMPRAS_SPREADSHEET_TITLE);
    properties.setProperty(COMPRAS_SPREADSHEET_ID_KEY, ss.getId());
    Logger.log('setupComprasPlanilha: nova planilha criada id=' + ss.getId());
  }

  // Garante aba Compras_Medicamentos com headers corretos
  var sheet = ss.getSheetByName(SHEET_NAMES.COMPRAS_MEDICAMENTOS);
  if (!sheet) {
    // Renomeia aba padrão "Página1" se existir, caso contrário insere nova
    var sheets = ss.getSheets();
    if (sheets.length === 1 && sheets[0].getLastRow() === 0) {
      sheet = sheets[0];
      sheet.setName(SHEET_NAMES.COMPRAS_MEDICAMENTOS);
    } else {
      sheet = ss.insertSheet(SHEET_NAMES.COMPRAS_MEDICAMENTOS);
    }
  }
  ensureHeadersLegacyAdditive_(sheet, HEADERS.Compras_Medicamentos);
  try {
    applyComprasMedicamentosLayout_(sheet);
  } catch (layoutErr) {
    Logger.log('setupComprasPlanilha layout: ' + layoutErr);
  }

  Logger.log('setupComprasPlanilha: OK id=' + ss.getId() + ' url=' + ss.getUrl());
  return { ok: true, id: ss.getId(), url: ss.getUrl(), nome: ss.getName() };
}

/**
 * FASE 5 — MANUAL: renomeia e oculta a aba Compras_Medicamentos legada na planilha do Handover.
 * Chamar APÓS confirmar que setupComprasPlanilha() foi executado e sincronizarComprasMedicamentos()
 * copiou os dados para a nova planilha.
 * Não apaga dados; apenas renomeia para LEGACY_Compras_YYYYMMDD e oculta.
 */
function renomearAbaComprasLegacy() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAMES.COMPRAS_MEDICAMENTOS);
  if (!sheet) {
    Logger.log('renomearAbaComprasLegacy: aba Compras_Medicamentos nao encontrada (ja renomeada ou inexistente)');
    return { ok: true, action: 'noop' };
  }
  var novoNome = 'LEGACY_Compras_' + Utilities.formatDate(new Date(), HANDOVER_TIMEZONE, 'yyyyMMdd');
  sheet.setName(novoNome);
  sheet.hideSheet();
  Logger.log('renomearAbaComprasLegacy: aba renomeada para ' + novoNome + ' e ocultada no Handover');
  return { ok: true, novoNome: novoNome };
}

/**
 * FASE 6 — MANUAL: limpa apenas o conteúdo de dados (linhas 2+) das abas operacionais do Handover.
 * NÃO apaga cabeçalhos, NÃO usa sheet.clear(), NÃO deleta linhas.
 * Abas limpas: Geral, Medicamentos, Arquivo_Resolvidos, Checklist_Turnos, Auditoria_Handover.
 * Chamar SOMENTE após backup (backupHandoverPlanilha) confirmado.
 */
function zerarHandoverParaProducao() {
  var ss = getSpreadsheet_();
  var abas = [
    SHEET_NAMES.GERAL,
    SHEET_NAMES.MEDICAMENTOS,
    SHEET_NAMES.ARQUIVO,
    SHEET_NAMES.CHECKLIST,
    SHEET_NAMES.AUDITORIA,
  ];
  var resultados = {};
  for (var i = 0; i < abas.length; i++) {
    var nome = abas[i];
    var sheet = ss.getSheetByName(nome);
    if (!sheet) {
      resultados[nome] = 'nao_encontrada';
      Logger.log('zerarHandoverParaProducao: ' + nome + ' nao encontrada');
      continue;
    }
    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    if (lastRow <= 1) {
      resultados[nome] = 'ja_vazia';
      Logger.log('zerarHandoverParaProducao: ' + nome + ' ja vazia');
      continue;
    }
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    resultados[nome] = 'limpa_' + (lastRow - 1) + '_linhas';
    Logger.log('zerarHandoverParaProducao: ' + nome + ' limpa (' + (lastRow - 1) + ' linhas)');
  }
  Logger.log('zerarHandoverParaProducao: ' + JSON.stringify(resultados));
  return { ok: true, resultados: resultados };
}

function setupSpreadsheet() {
  const ss = getSpreadsheet_();

  Object.keys(HEADERS).forEach(function (sheetName) {
    // Compras_Medicamentos agora fica em planilha separada (Compras_Drogarias_Conceito).
    // Use setupComprasPlanilha() para criar/configurar essa planilha.
    if (sheetName === SHEET_NAMES.COMPRAS_MEDICAMENTOS) {
      return;
    }
    ensureSheetHeadersFor_(sheetName);
  });
}

function ensureSheetHeadersFor_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  // Compras_Medicamentos foi migrada para planilha separada; não cria/atualiza headers aqui.
  if (
    sheetName === SHEET_NAMES.GERAL ||
    sheetName === SHEET_NAMES.ARQUIVO ||
    sheetName === SHEET_NAMES.MEDICAMENTOS ||
    sheetName === SHEET_NAMES.CHECKLIST ||
    sheetName === SHEET_NAMES.AUDITORIA
  ) {
    ensureHeadersLegacyAdditive_(sheet, HEADERS[sheetName]);
  } else {
    ensureHeaders_(sheet, HEADERS[sheetName]);
  }
  return sheet;
}

function getComprasMedicamentosSheet_() {
  var ss = getComprasSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAMES.COMPRAS_MEDICAMENTOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.COMPRAS_MEDICAMENTOS);
  }
  ensureHeadersLegacyAdditive_(sheet, HEADERS.Compras_Medicamentos);
  return sheet;
}

function getAuditoriaHandoverSheet_() {
  return ensureSheetHeadersFor_(SHEET_NAMES.AUDITORIA);
}

/**
 * MANUAL (público): reaplica layout/formatos da aba Compras_Medicamentos sem mexer em dados.
 * Útil quando a aba foi copiada/importada e perdeu formatação.
 */
function aplicarLayoutComprasMedicamentos() {
  return aplicarLayoutComprasMedicamentos_();
}

/** MANUAL (interno): reaplica layout/formatos da aba Compras_Medicamentos. */
function aplicarLayoutComprasMedicamentos_() {
  var sheet = getComprasMedicamentosSheet_();
  applyComprasMedicamentosLayout_(sheet);
  Logger.log('aplicarLayoutComprasMedicamentos_: OK');
  return { ok: true };
}

function applyComprasMedicamentosLayout_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.Compras_Medicamentos.length, 1);
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  // UX: larguras das 30 colunas do schema novo (ordem: ID_Compra…Ultima_Atualizacao)
  var widths = [
    120, // ID_Compra
    140, // ID_Handover
    120, // Data_Solicitacao
     90, // Tipo
    240, // Medicamento
    120, // Atendente
    170, // Cliente
    120, // Telefone
     90, // Preco_Venda
     90, // Pre_Pago
    130, // Fornecedor_Compra
    150, // Codigo_Compra_Fornecedor
    140, // Forma_Recebimento
    130, // Previsao_Entrega
    140, // Status_Compra
    140, // Status_Handover
     80, // Comprado
    140, // Comprado_Por
    120, // Data_Compra
     80, // Entregue
    140, // Entregue_Por
    120, // Data_Entrega
     80, // Cancelado
    120, // Cancelado_Por
    110, // Data_Cancelamento
    220, // Motivo_Cancelamento
    130, // Observacao_Solicitacao
    360, // Observacao_Compra
    380, // Mensagem_Cliente
    160, // Ultima_Atualizacao
  ];
  for (var c = 0; c < Math.min(widths.length, lastCol); c++) {
    sheet.setColumnWidth(c + 1, widths[c]);
  }

  var colStatus = getColumnIndex_(sheet, 'Status_Compra');
  var numRowsValidation = Math.max(Math.max(sheet.getLastRow(), 2) - 1, 500);
  var list = [
    COMPRAS_STATUS_COMPRA.PENDENTE,
    COMPRAS_STATUS_COMPRA.COMPRADO,
    COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO,
    COMPRAS_STATUS_COMPRA.CANCELADO,
  ];
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build();
  sheet.getRange(2, colStatus, numRowsValidation, 1).setDataValidation(rule);

  // Filtro na linha de cabeçalho (não afeta dados).
  try {
    if (!sheet.getFilter()) {
      headerRange.createFilter();
    }
  } catch (eFilter) {}

  // Notas operacionais no cabeçalho (ajuda para o usuário final).
  try {
    sheet.getRange(1, colStatus).setNote('Altere aqui para atualizar o Handover.');
  } catch (eNote0) {}
  try {
    var colMsg = getColumnIndex_(sheet, 'Mensagem_Cliente');
    sheet.getRange(1, colMsg).setNote('Mensagem sugerida para WhatsApp quando item não for encontrado.');
  } catch (eNote1) {}

  // Alinhamento / wrap para leitura operacional.
  try {
    sheet.getRange(1, 1, numRowsValidation + 1, lastCol).setVerticalAlignment('middle');
  } catch (eVa) {}
  try {
    var colObs = getColumnIndex_(sheet, 'Observacao_Compra');
    sheet.getRange(2, colObs, numRowsValidation, 1).setWrap(true).setVerticalAlignment('top');
  } catch (eWrap0) {}
  try {
    sheet.getRange(2, colMsg, numRowsValidation, 1).setWrap(true).setVerticalAlignment('top');
  } catch (eWrap1) {}
  try {
    sheet.getRange(2, colStatus, numRowsValidation, 1).setFontWeight('bold').setHorizontalAlignment('center');
  } catch (eBold) {}

  // Formatos: datas e moeda.
  try {
    var colSolic = getColumnIndex_(sheet, 'Data_Solicitacao');
    sheet.getRange(2, colSolic, numRowsValidation, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  } catch (eFmt0) {}
  try {
    var colPrev = getColumnIndex_(sheet, 'Previsao_Entrega');
    sheet.getRange(2, colPrev, numRowsValidation, 1).setNumberFormat('dd/MM/yyyy');
  } catch (eFmt1) {}
  try {
    var colDataCompra = getColumnIndex_(sheet, 'Data_Compra');
    sheet.getRange(2, colDataCompra, numRowsValidation, 1).setNumberFormat('dd/MM/yyyy');
  } catch (eFmt2) {}
  try {
    var colUlt = getColumnIndex_(sheet, 'Ultima_Atualizacao');
    sheet.getRange(2, colUlt, numRowsValidation, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  } catch (eFmt3) {}
  try {
    var colPreco = getColumnIndex_(sheet, 'Preco_Venda');
    sheet.getRange(2, colPreco, numRowsValidation, 1).setNumberFormat('"R$" #,##0.00');
  } catch (eFmt4) {}

  // Formatação condicional por linha inteira baseada em Status_Compra (idempotente).
  // Observação: regras antigas são limpas apenas nesta aba para evitar duplicação.
  try {
    sheet.clearConditionalFormatRules();
    var lastRowForRules = Math.max(sheet.getLastRow(), 2);
    var dataRange = sheet.getRange(2, 1, Math.max(lastRowForRules - 1, 1), lastCol);
    var colLetter = (function (colNumber) {
      var temp = colNumber;
      var letter = '';
      while (temp > 0) {
        var modulo = (temp - 1) % 26;
        letter = String.fromCharCode(65 + modulo) + letter;
        temp = Math.floor((temp - modulo) / 26);
      }
      return letter;
    })(colStatus);

    var rules = [];
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=$' + colLetter + '2="' + COMPRAS_STATUS_COMPRA.PENDENTE + '"')
        .setBackground('#FEF3C7')
        .setFontColor('#78350F')
        .setRanges([dataRange])
        .build()
    );
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=$' + colLetter + '2="' + COMPRAS_STATUS_COMPRA.COMPRADO + '"')
        .setBackground('#DCFCE7')
        .setFontColor('#14532D')
        .setRanges([dataRange])
        .build()
    );
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=$' + colLetter + '2="' + COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO + '"')
        .setBackground('#FFEDD5')
        .setFontColor('#7C2D12')
        .setRanges([dataRange])
        .build()
    );
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=$' + colLetter + '2="' + COMPRAS_STATUS_COMPRA.CANCELADO + '"')
        .setBackground('#FEE2E2')
        .setFontColor('#7F1D1D')
        .setRanges([dataRange])
        .build()
    );
    sheet.setConditionalFormatRules(rules);
  } catch (eCf) {}
}

// =============================================================================
// Auth/PIN — backend only (Parte 1)
// =============================================================================

function ensureUsuariosHandoverSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAMES.USUARIOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.USUARIOS);
  }
  ensureHeaders_(sheet, HANDOVER_USERS_HEADERS);
  return sheet;
}

function normalizeUsuarioHandover_(usuario) {
  return String(usuario || '').trim().toLowerCase();
}

function normalizePerfilHandover_(perfil) {
  var p = String(perfil || '').trim().toLowerCase();
  if (p === 'admin' || p === 'gerente' || p === 'operador') {
    return p;
  }
  return 'operador';
}

function isUsuarioAtivo_(value) {
  // Regra: vazio ou TRUE é ativo.
  if (value === '' || value === null || value === undefined) {
    return true;
  }
  return toBoolean_(value);
}

function usuariosHandoverHasAnyPinHash_() {
  try {
    var sheet = ensureUsuariosHandoverSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false;
    var col = getColumnIndex_(sheet, 'Pin_Hash');
    var vals = sheet.getRange(2, col, lastRow - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0] || '').trim()) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Cria salt apenas se ainda não existir e se não houver Pin_Hash na planilha
 * (evita invalidar hashes após limpeza de propriedades).
 */
function getHandoverPinSalt_() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(HANDOVER_AUTH_SALT_KEY);
  if (existing) {
    return existing;
  }
  if (usuariosHandoverHasAnyPinHash_()) {
    Logger.log(
      'getHandoverPinSalt_: salt_existe=NAO; ha Pin_Hash na aba Usuarios_Handover — nao sera criado salt novo. Restaure ' +
        HANDOVER_AUTH_SALT_KEY +
        ' nas propriedades do script ou use resetPinUsuarioHandover_.'
    );
    return '';
  }
  var salt =
    Utilities.getUuid() +
    ':' +
    Utilities.base64Encode(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(new Date().getTime()))
    );
  props.setProperty(HANDOVER_AUTH_SALT_KEY, salt);
  Logger.log('getHandoverPinSalt_: salt criado e persistido (planilha sem Pin_Hash preexistente). salt_existe=SIM');
  return salt;
}

function hashPin_(usuario, pin) {
  var u = normalizeUsuarioHandover_(usuario);
  var p = String(pin || '').trim();
  if (!u || !p) {
    return '';
  }
  var salt = getHandoverPinSalt_();
  if (!salt) {
    return '';
  }
  var payload = salt + '|' + u + '|' + p;
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(digest);
}

function findUsuarioRowByUsername_(sheet, usuario) {
  var u = normalizeUsuarioHandover_(usuario);
  if (!u) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;
  var col = getColumnIndex_(sheet, 'Usuario');
  var vals = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (normalizeUsuarioHandover_(vals[i][0]) === u) {
      return i + 2;
    }
  }
  return null;
}

function getUsuarioRecordByRow_(sheet, rowNumber) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  return rowCellsToObject_(headers, row);
}

function validateUsuarioLogin_(usuario, pin) {
  var sheet = ensureUsuariosHandoverSheet_();
  var rowNumber = findUsuarioRowByUsername_(sheet, usuario);
  if (!rowNumber) {
    return { ok: false, message: 'Usuário ou PIN inválido.' };
  }
  var rec = getUsuarioRecordByRow_(sheet, rowNumber);
  if (!isUsuarioAtivo_(rec.Ativo)) {
    return { ok: false, message: 'Usuário inativo.' };
  }
  var expected = String(rec.Pin_Hash || '').trim();
  if (!expected) {
    return { ok: false, message: 'Usuário sem PIN configurado. Procure um administrador.' };
  }
  var candidate = hashPin_(usuario, pin);
  if (!candidate) {
    Logger.log('validateUsuarioLogin_: hash candidato vazio (salt ausente?) u=' + normalizeUsuarioHandover_(usuario));
    return { ok: false, message: 'Falha de configuração de autenticação. Contate o administrador.' };
  }
  if (candidate === expected) {
    return {
      ok: true,
      rowNumber: rowNumber,
      usuario: normalizeUsuarioHandover_(rec.Usuario || usuario),
      nome: sanitizeText_(rec.Nome || rec.Usuario || ''),
      perfil: normalizePerfilHandover_(rec.Perfil || 'operador'),
    };
  }
  return { ok: false, message: 'Usuário ou PIN inválido.' };
}

function criarSessaoHandover_(usuario, nome, perfil) {
  var u = normalizeUsuarioHandover_(usuario);
  if (!u) {
    throw new Error('Sessão inválida: usuário ausente.');
  }
  var token = Utilities.getUuid() + '-' + Utilities.getUuid();
  var nowMs = new Date().getTime();
  var expMs = nowMs + HANDOVER_SESSION_TTL_SECONDS * 1000;
  var payload = {
    usuario: u,
    nome: sanitizeText_(nome || ''),
    perfil: normalizePerfilHandover_(perfil || 'operador'),
    createdAtMs: nowMs,
    expAtMs: expMs,
  };
  CacheService.getScriptCache().put(
    HANDOVER_SESSION_CACHE_PREFIX + token,
    JSON.stringify(payload),
    HANDOVER_SESSION_TTL_SECONDS
  );
  return { token: token, expAtMs: expMs };
}

function validarSessaoHandover_(sessionToken) {
  var tok = String(sessionToken || '').trim();
  if (!tok) return null;
  var cached = CacheService.getScriptCache().get(HANDOVER_SESSION_CACHE_PREFIX + tok);
  if (!cached) return null;
  try {
    var obj = JSON.parse(cached);
    if (!obj || !obj.usuario) return null;
    return obj;
  } catch (e) {
    return null;
  }
}

function encerrarSessaoHandover_(sessionToken) {
  var tok = String(sessionToken || '').trim();
  if (!tok) return { success: true };
  CacheService.getScriptCache().remove(HANDOVER_SESSION_CACHE_PREFIX + tok);
  return { success: true };
}

function loginHandover(usuario, pin) {
  try {
    var u = normalizeUsuarioHandover_(usuario);
    if (!u) {
      return { success: false, message: 'Informe o usuário.' };
    }
    var result = validateUsuarioLogin_(u, pin);
    if (!result.ok) {
      return { success: false, message: result.message };
    }
    var sess = criarSessaoHandover_(result.usuario, result.nome, result.perfil);
    try {
      var sheet = ensureUsuariosHandoverSheet_();
      sheet.getRange(result.rowNumber, getColumnIndex_(sheet, 'Ultimo_Login_Em')).setValue(new Date());
    } catch (e) {
      Logger.log('loginHandover Ultimo_Login_Em: ' + e);
    }
    Logger.log(
      'loginHandover ok u=' +
        result.usuario +
        ' perfil=' +
        result.perfil +
        ' token_len=' +
        String(sess.token || '').length
    );
    return {
      success: true,
      token: String(sess.token),
      usuario: result.usuario,
      nome: result.nome,
      perfil: result.perfil,
      displayName: result.nome,
    };
  } catch (e) {
    Logger.log('loginHandover excecao: ' + e);
    return { success: false, message: 'Não foi possível entrar. Tente novamente.' };
  }
}

function validateSessionHandover(sessionToken) {
  var sess = validarSessaoHandover_(sessionToken);
  if (!sess) {
    return { success: false };
  }
  return {
    success: true,
    usuario: normalizeUsuarioHandover_(sess.usuario),
    nome: sanitizeText_(sess.nome || sess.usuario || ''),
    perfil: normalizePerfilHandover_(sess.perfil || 'operador'),
  };
}

/** @returns {{usuario:string,nome:string,perfil:string,displayName:string}} */
function requireSessionHandover_(sessionToken) {
  setupSpreadsheet();
  var raw = validarSessaoHandover_(sessionToken);
  if (!raw) {
    throw new Error('Sessão inválida ou expirada. Faça login novamente.');
  }
  var u = normalizeUsuarioHandover_(raw.usuario);
  var nome = sanitizeText_(raw.nome || raw.usuario || '');
  var perfil = normalizePerfilHandover_(raw.perfil || 'operador');
  return {
    usuario: u,
    nome: nome,
    perfil: perfil,
    displayName: nome || u,
  };
}

function getSessionDisplayName_(sess) {
  if (!sess) {
    return '';
  }
  return sanitizeText_(sess.displayName || sess.nome || sess.usuario || '');
}

function getSessionPerfil_(sess) {
  if (!sess) {
    return 'operador';
  }
  return normalizePerfilHandover_(sess.perfil || 'operador');
}

function isAdminOrGerenteHandover_(sess) {
  var p = getSessionPerfil_(sess);
  return p === 'admin' || p === 'gerente';
}

function logoutHandover(sessionToken) {
  return encerrarSessaoHandover_(sessionToken);
}

function setupUsuariosHandover() {
  return setupUsuariosHandover_();
}

function setupUsuariosHandover_() {
  setupSpreadsheet();
  var sheet = ensureUsuariosHandoverSheet_();

  // Garantir cabeçalhos esperados (aditivo, sem apagar dados).
  ensureHeaders_(sheet, HANDOVER_USERS_HEADERS);

  var now = new Date();
  var seed = [
    { nome: 'Ainale', usuario: 'ainale', perfil: 'operador' },
    { nome: 'Marco', usuario: 'marco', perfil: 'admin' },
    { nome: 'Carlos', usuario: 'carlos', perfil: 'admin' },
    { nome: 'Jelcinei', usuario: 'jelcinei', perfil: 'gerente' },
    { nome: 'Priscila', usuario: 'priscila', perfil: 'operador' },
    { nome: 'Marcelo', usuario: 'marcelo', perfil: 'operador' },
  ];

  var created = 0;
  for (var i = 0; i < seed.length; i++) {
    var u = normalizeUsuarioHandover_(seed[i].usuario);
    if (!u) continue;
    var row = findUsuarioRowByUsername_(sheet, u);
    if (row) continue;
    sheet.appendRow([
      Utilities.getUuid(),
      seed[i].nome,
      u,
      '', // Pin_Hash (nunca PIN em texto puro)
      normalizePerfilHandover_(seed[i].perfil),
      true,
      now,
      'setupUsuariosHandover_',
      '',
      '',
    ]);
    created++;
  }
  Logger.log('setupUsuariosHandover_: created=' + created);
  return { ok: true, created: created };
}

/**
 * MANUAL / bootstrap administrativo — executar somente no editor Apps Script.
 * Atualiza apenas Pin_Hash; PIN temporário só no Logger.
 */
function resetPinUsuarioHandover_(usuario) {
  setupSpreadsheet();
  var u = normalizeUsuarioHandover_(usuario);
  if (!u) {
    Logger.log('resetPinUsuarioHandover_: usuario vazio');
    return;
  }
  if (!getHandoverPinSalt_()) {
    Logger.log(
      'resetPinUsuarioHandover_: impossivel — salt ausente e nao sera recriado automaticamente com Pin_Hash existente.'
    );
    return;
  }
  var sheet = ensureUsuariosHandoverSheet_();
  var row = findUsuarioRowByUsername_(sheet, u);
  if (!row) {
    Logger.log('resetPinUsuarioHandover_: usuario nao encontrado u=' + u);
    return;
  }
  var pin = String(Math.floor(100000 + Math.random() * 900000));
  var h = hashPin_(u, pin);
  if (!h) {
    Logger.log('resetPinUsuarioHandover_: hash vazio u=' + u);
    return;
  }
  sheet.getRange(row, getColumnIndex_(sheet, 'Pin_Hash')).setValue(h);
  var rec = getUsuarioRecordByRow_(sheet, row);
  Logger.log(
    'resetPinUsuarioHandover_: usuario=' +
      u +
      ' nome=' +
      sanitizeText_(rec.Nome || '') +
      ' perfil=' +
      normalizePerfilHandover_(rec.Perfil || '') +
      ' pin_temp=' +
      pin +
      ' hash_prefix=' +
      String(h).slice(0, 6) +
      '...'
  );
  return { ok: true, usuario: u };
}

function resetPinCarlosHandover_() {
  return resetPinUsuarioHandover_('carlos');
}

function criarUsuarioHandover(nome, usuario, perfil) {
  return criarUsuarioHandover_(nome, usuario, perfil);
}

function criarUsuarioHandover_(nome, usuario, perfilOpt) {
  setupSpreadsheet();
  var sheet = ensureUsuariosHandoverSheet_();
  var u = normalizeUsuarioHandover_(usuario);
  if (!u) {
    Logger.log('criarUsuarioHandover_: usuario invalido');
    return { ok: false, message: 'Usuario invalido.' };
  }
  if (findUsuarioRowByUsername_(sheet, u)) {
    Logger.log('criarUsuarioHandover_: usuario ja existe u=' + u);
    return { ok: false, message: 'Usuario ja existe.' };
  }
  var now = new Date();
  var perf = normalizePerfilHandover_(perfilOpt);
  var criador = '';
  try {
    criador = getEditorEmailForSheetHook_();
  } catch (ec) {}
  sheet.appendRow([
    Utilities.getUuid(),
    sanitizeText_(nome || u),
    u,
    '',
    perf,
    true,
    now,
    criador || 'criarUsuarioHandover_',
    '',
    '',
  ]);
  Logger.log(
    'criarUsuarioHandover_: criado u=' +
      u +
      ' perfil=' +
      perf +
      ' — defina PIN com resetPinUsuarioHandover("' +
      u +
      '") e leia o PIN no Logger.'
  );
  return { ok: true, usuario: u };
}

function ativarUsuarioHandover(usuario) {
  return setUsuarioAtivoHandover_(usuario, true);
}

function inativarUsuarioHandover(usuario) {
  return setUsuarioAtivoHandover_(usuario, false);
}

function setUsuarioAtivoHandover_(usuario, ativo) {
  setupSpreadsheet();
  var sheet = ensureUsuariosHandoverSheet_();
  var u = normalizeUsuarioHandover_(usuario);
  if (!u) {
    return { ok: false, message: 'Usuario invalido.' };
  }
  var row = findUsuarioRowByUsername_(sheet, u);
  if (!row) {
    return { ok: false, message: 'Usuario nao encontrado.' };
  }
  sheet.getRange(row, getColumnIndex_(sheet, 'Ativo')).setValue(ativo ? true : false);
  Logger.log('setUsuarioAtivoHandover_: u=' + u + ' ativo=' + ativo);
  return { ok: true, usuario: u, ativo: ativo };
}

function resetPinUsuarioHandover(usuario) {
  return resetPinUsuarioHandover_(usuario);
}

/**
 * Converte valor de célula para PIN temporário (trim; inteiro sem decimais).
 * Não registrar o retorno em Logger.
 */
function pinNovoTemporarioCellToString_(cellValue) {
  if (cellValue === '' || cellValue === null || cellValue === undefined) {
    return '';
  }
  if (typeof cellValue === 'number' && !isNaN(cellValue)) {
    if (cellValue !== Math.floor(cellValue)) {
      return '';
    }
    return String(Math.floor(cellValue));
  }
  return String(cellValue).trim();
}

/**
 * PIN vazio => ignorar linha. Caso contrário exige 4–8 dígitos numéricos.
 */
function validarPinTemporarioParaAplicacao_(pinStr) {
  var s = String(pinStr || '').trim();
  if (!s) {
    return { ignore: true };
  }
  if (!/^\d{4,8}$/.test(s)) {
    return { ignore: false, ok: false };
  }
  return { ignore: false, ok: true, pin: s };
}

/**
 * MANUAL (editor): lê PIN_Novo_Temporario na aba Usuarios_Handover, grava Pin_Hash e apaga a célula temporária.
 * Não registra PIN no Logger; não mantém PIN em texto após sucesso.
 */
function aplicarPinsTemporariosHandover() {
  var aplicados = 0;
  var ignoradosInativos = 0;
  var errosValidacao = 0;
  var errosHash = 0;
  try {
    var sheet = ensureUsuariosHandoverSheet_();
    var pinTempCol = getColumnIndex_(sheet, 'PIN_Novo_Temporario');
    var pinHashCol = getColumnIndex_(sheet, 'Pin_Hash');
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('aplicarPinsTemporariosHandover_: sem linhas de dados.');
      return {
        ok: true,
        aplicados: 0,
        ignoradosInativos: 0,
        errosValidacao: 0,
        errosHash: 0,
      };
    }
    if (!getHandoverPinSalt_()) {
      Logger.log(
        'aplicarPinsTemporariosHandover_: salt ausente — defina propriedade do script ou use cenário sem Pin_Hash preexistente.'
      );
      return { ok: false, message: 'Salt de PIN ausente; nao foi possivel aplicar hashes.' };
    }

    for (var r = 2; r <= lastRow; r++) {
      var pinRaw = sheet.getRange(r, pinTempCol).getValue();
      var pinStr = pinNovoTemporarioCellToString_(pinRaw);
      var v = validarPinTemporarioParaAplicacao_(pinStr);
      if (v.ignore) {
        continue;
      }

      var rec = getUsuarioRecordByRow_(sheet, r);
      var u = normalizeUsuarioHandover_(rec.Usuario || '');
      if (!u) {
        Logger.log(
          'aplicarPinsTemporariosHandover_: Usuario vazio na linha ' +
            r +
            ' com PIN_Novo_Temporario preenchido.'
        );
        errosValidacao++;
        continue;
      }

      if (!isUsuarioAtivo_(rec.Ativo)) {
        Logger.log('aplicarPinsTemporariosHandover_: usuario inativo ignorado u=' + u);
        ignoradosInativos++;
        continue;
      }

      if (!v.ok) {
        Logger.log(
          'aplicarPinsTemporariosHandover_: PIN invalido (exija 4 a 8 digitos numericos) usuario=' +
            u
        );
        errosValidacao++;
        continue;
      }

      var h = hashPin_(u, v.pin);
      if (!h) {
        Logger.log('aplicarPinsTemporariosHandover_: falha ao gerar hash usuario=' + u);
        errosHash++;
        continue;
      }

      sheet.getRange(r, pinHashCol).setValue(h);
      sheet.getRange(r, pinTempCol).setValue('');
      aplicados++;
      Logger.log('aplicarPinsTemporariosHandover_: pin aplicado usuario=' + u);
    }

    Logger.log(
      'aplicarPinsTemporariosHandover_: resumo aplicados=' +
        aplicados +
        ' ignorados_inativo=' +
        ignoradosInativos +
        ' erros_validacao=' +
        errosValidacao +
        ' erros_hash=' +
        errosHash
    );

    return {
      ok: true,
      aplicados: aplicados,
      ignoradosInativos: ignoradosInativos,
      errosValidacao: errosValidacao,
      errosHash: errosHash,
    };
  } catch (e) {
    Logger.log('aplicarPinsTemporariosHandover_: excecao ' + e);
    return {
      ok: false,
      message: String(e && e.message ? e.message : e),
      aplicados: aplicados,
      ignoradosInativos: ignoradosInativos,
      errosValidacao: errosValidacao,
      errosHash: errosHash,
    };
  }
}

function resetPinMarcoHandover() {
  return resetPinUsuarioHandover_('marco');
}

function resetPinJelcineiHandover() {
  return resetPinUsuarioHandover_('jelcinei');
}

function debugLoginCarlosHandover() {
  try {
    var sheet = ensureUsuariosHandoverSheet_();
    var row = findUsuarioRowByUsername_(sheet, 'carlos');
    if (!row) {
      Logger.log('debugLoginCarlosHandover: usuario "carlos" NAO encontrado na aba Usuarios_Handover.');
      return {
        ok: false,
        usuarioEncontrado: false,
        message: 'Usuario carlos nao encontrado.',
      };
    }
    var rec = getUsuarioRecordByRow_(sheet, row);
    var perfil = normalizePerfilHandover_(rec.Perfil || '');
    var ativo = isUsuarioAtivo_(rec.Ativo);
    var hashCell = String(rec.Pin_Hash || '').trim();
    var hashPresent = !!hashCell;
    var hashPrefix = hashPresent ? String(hashCell).slice(0, 6) + '...' : '(vazio)';
    var props = PropertiesService.getScriptProperties();
    var saltPresent = !!String(props.getProperty(HANDOVER_AUTH_SALT_KEY) || '').trim();

    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet
      .getRange(1, 1, 1, lastCol)
      .getValues()[0]
      .map(function (h) {
        return String(h || '').trim();
      });
    var missingHeaders = HANDOVER_USERS_HEADERS.filter(function (h) {
      return headers.indexOf(h) < 0;
    });

    Logger.log(
      'debugLoginCarlosHandover: usuario=carlos nome=' +
        sanitizeText_(rec.Nome || '') +
        ' perfil=' +
        perfil +
        ' ativo=' +
        ativo +
        ' pin_hash_presente=' +
        hashPresent +
        ' pin_hash_prefix=' +
        hashPrefix +
        ' salt_scriptProperties=' +
        saltPresent +
        ' headers_ok=' +
        (missingHeaders.length === 0 ? 'SIM' : 'NAO') +
        (missingHeaders.length ? ' faltando=' + missingHeaders.join(',') : '')
    );

    return {
      ok: true,
      usuarioEncontrado: true,
      nome: sanitizeText_(rec.Nome || ''),
      perfil: perfil,
      ativo: ativo,
      pinHashPresent: hashPresent,
      pinHashPrefix: hashPrefix,
      saltPresent: saltPresent,
      headersOk: missingHeaders.length === 0,
      headersMissing: missingHeaders,
    };
  } catch (e) {
    Logger.log('debugLoginCarlosHandover: erro ' + e);
    return { ok: false, message: String(e && e.message ? e.message : e) };
  }
}

function selfTestAuthHandover_() {
  try {
    setupSpreadsheet();
    var props = PropertiesService.getScriptProperties();
    var salt = props.getProperty(HANDOVER_AUTH_SALT_KEY);
    Logger.log('selfTestAuthHandover_: salt_present=' + !!salt);

    var sheet = ensureUsuariosHandoverSheet_();
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet
      .getRange(1, 1, 1, lastCol)
      .getValues()[0]
      .map(function (h) {
        return String(h || '').trim();
      });
    var missing = HANDOVER_USERS_HEADERS.filter(function (h) {
      return headers.indexOf(h) < 0;
    });
    Logger.log('selfTestAuthHandover_: headers_missing=' + (missing.length ? missing.join(',') : 'none'));

    var lastRow = sheet.getLastRow();
    var pinHashCol = getColumnIndex_(sheet, 'Pin_Hash');
    var perfilCol = getColumnIndex_(sheet, 'Perfil');
    var ativoCol = getColumnIndex_(sheet, 'Ativo');
    var pinCount = 0;
    var adminAtivo = false;
    if (lastRow > 1) {
      var rng = sheet.getRange(2, 1, lastRow, lastCol).getValues();
      for (var r = 0; r < rng.length; r++) {
        var row = rng[r];
        if (String(row[pinHashCol - 1] || '').trim()) {
          pinCount++;
        }
        var perf = normalizePerfilHandover_(row[perfilCol - 1]);
        if (perf === 'admin' && isUsuarioAtivo_(row[ativoCol - 1])) {
          adminAtivo = true;
        }
      }
    }
    Logger.log(
      'selfTestAuthHandover_: usuarios_linhas=' +
        Math.max(0, lastRow - 1) +
        ' pin_hash_linhas=' +
        pinCount +
        ' admin_ativo_existe=' +
        adminAtivo
    );

    var pub =
      'setupUsuariosHandover, criarUsuarioHandover, aplicarPinsTemporariosHandover, resetPinUsuarioHandover, resetPinCarlosHandover, resetPinMarcoHandover, resetPinJelcineiHandover, ativarUsuarioHandover, inativarUsuarioHandover, debugLoginCarlosHandover, debugAuthUsuariosHandover, selfTestAuthHandover';

    return {
      ok: true,
      saltPresent: !!salt,
      headersMissing: missing,
      usuariosRows: Math.max(0, lastRow - 1),
      pinHashRows: pinCount,
      adminAtivoPresent: adminAtivo,
      funcoesPublicasResumo: pub,
    };
  } catch (e) {
    Logger.log('selfTestAuthHandover_: ' + e);
    return { ok: false };
  }
}

function debugAuthUsuariosHandover_() {
  try {
    setupSpreadsheet();
    var sheet = ensureUsuariosHandoverSheet_();
    var lastRow = sheet.getLastRow();
    Logger.log('debugAuthUsuariosHandover_: lastRow=' + lastRow);
    if (lastRow <= 1) {
      return { ok: true, rows: 0 };
    }
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    for (var r = 2; r <= lastRow; r++) {
      var row = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
      var obj = rowCellsToObject_(headerCells, row);
      var u = normalizeUsuarioHandover_(obj.Usuario || '');
      var ativo = isUsuarioAtivo_(obj.Ativo);
      var perf = normalizePerfilHandover_(obj.Perfil || '');
      var hasHash = !!String(obj.Pin_Hash || '').trim();
      Logger.log('  usuario=' + u + ' perfil=' + perf + ' ativo=' + ativo + ' pin_hash=' + (hasHash ? 'SIM' : 'NAO'));
    }
    return { ok: true, rows: lastRow - 1 };
  } catch (e) {
    Logger.log('debugAuthUsuariosHandover_: ' + e);
    return { ok: false };
  }
}

function resetPinCarlosHandover() {
  return resetPinCarlosHandover_();
}

function debugAuthUsuariosHandover() {
  return debugAuthUsuariosHandover_();
}

function selfTestAuthHandover() {
  return selfTestAuthHandover_();
}

function findComprasRowByHandoverId_(sheet, handoverId) {
  var hid = sanitizeText_(handoverId);
  if (!hid) {
    return null;
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return null;
  }
  var idCol = getColumnIndex_(sheet, 'ID_Handover');
  var vals = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (sanitizeText_(vals[i][0]) === hid) {
      return i + 2;
    }
  }
  return null;
}

function normalizeComprasStatusCompraInput_(value) {
  var s = String(value || '').trim();
  if (!s) {
    return '';
  }
  var key = buildChecklistIdentityKey_(s);
  if (key === buildChecklistIdentityKey_(COMPRAS_STATUS_COMPRA.PENDENTE)) {
    return COMPRAS_STATUS_COMPRA.PENDENTE;
  }
  if (key === buildChecklistIdentityKey_(COMPRAS_STATUS_COMPRA.COMPRADO)) {
    return COMPRAS_STATUS_COMPRA.COMPRADO;
  }
  if (key === buildChecklistIdentityKey_(COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO)) {
    return COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO;
  }
  if (key === buildChecklistIdentityKey_(COMPRAS_STATUS_COMPRA.CANCELADO)) {
    return COMPRAS_STATUS_COMPRA.CANCELADO;
  }
  return s;
}

function getEditorEmailForSheetHook_() {
  try {
    var a = Session.getActiveUser().getEmail();
    if (a) {
      return a;
    }
  } catch (e0) {}
  try {
    return Session.getEffectiveUser().getEmail() || '';
  } catch (e1) {
    return '';
  }
}

/**
 * Quando Medicamentos está Cancelado, Compras_Medicamentos deve refletir cancelamento completo
 * (Status_Compra, Status_Handover, auditoria), sem manter Comprado_Por/Data_Compra do estado anterior.
 */
function applyMedicamentoCancelamentoEspelhoComprasNamed_(medItem, named) {
  if (sanitizeText_(medItem.Status).toLowerCase() !== 'cancelado') {
    return;
  }
  named.Status_Compra = COMPRAS_STATUS_COMPRA.CANCELADO;
  named.Status_Handover = 'Cancelado';
  named.Cancelado = true;
  named.Comprado_Por = '';
  named.Data_Compra = '';
  named.Cancelado_Por = sanitizeText_(medItem.Cancelado_Por || named.Cancelado_Por);
  named.Data_Cancelamento = medItem.Data_Cancelamento || named.Data_Cancelamento;
  named.Motivo_Cancelamento = sanitizeText_(medItem.Motivo_Cancelamento || named.Motivo_Cancelamento);
  named.Ultima_Atualizacao = new Date();
}

function computeStatusCompraMirrorFromMedicamento_(medItem, currentStatusCompra) {
  var st = sanitizeText_(medItem.Status).toLowerCase();
  if (st === 'cancelado') {
    return COMPRAS_STATUS_COMPRA.CANCELADO;
  }
  if (toBoolean_(medItem.Comprado) || st === 'comprado' || st === 'entregue' || toBoolean_(medItem.Entregue)) {
    return COMPRAS_STATUS_COMPRA.COMPRADO;
  }
  var cur = normalizeComprasStatusCompraInput_(currentStatusCompra);
  if (cur === COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO) {
    return COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO;
  }
  if (cur === COMPRAS_STATUS_COMPRA.COMPRADO || cur === COMPRAS_STATUS_COMPRA.CANCELADO) {
    return cur;
  }
  return COMPRAS_STATUS_COMPRA.PENDENTE;
}

function buildComprasRowNamedValuesFromMedicamento_(medItem, existingStatusCompraOpt) {
  var tipo = sanitizeText_(medItem.Tipo);
  var isFalta = tipo.toLowerCase() === 'falta';
  var statusCompra = computeStatusCompraMirrorFromMedicamento_(medItem, existingStatusCompraOpt);
  var prePago = isFalta ? false : toBoolean_(medItem.Pre_Pago);
  var preco =
    isFalta || medItem.Preco_Venda === '' || medItem.Preco_Venda === null || medItem.Preco_Venda === undefined
      ? ''
      : medItem.Preco_Venda;

  var statusHandover = sanitizeText_(medItem.Status || deriveMedicationStatus_(medItem));
  var isCancelado = statusHandover.toLowerCase() === 'cancelado';

  return {
    // ID_Compra: vazio no espelho automático; será preenchido por lógica dedicada
    // quando a linha de Compras for criada manualmente ou via fluxo de compras.
    ID_Compra: '',
    ID_Handover: sanitizeText_(medItem.ID || ''),
    Data_Solicitacao: medItem.Timestamp instanceof Date ? medItem.Timestamp : medItem.Timestamp || '',
    Tipo: tipo,
    Medicamento: sanitizeText_(medItem.Medicamento || ''),
    Atendente: sanitizeText_(medItem.Atendente || ''),
    Cliente: isFalta ? '' : sanitizeText_(medItem.Cliente || ''),
    Telefone: isFalta ? '' : sanitizeText_(medItem.Telefone || ''),
    Preco_Venda: preco,
    Pre_Pago: prePago,
    Fornecedor_Compra: normalizeFornecedorCompraInput_(medItem.Fornecedor_Compra),
    Codigo_Compra_Fornecedor: normalizeCodigoCompraFornecedorInput_(
      medItem.Codigo_Compra_Fornecedor,
      normalizeFornecedorCompraInput_(medItem.Fornecedor_Compra)
    ),
    Forma_Recebimento: isFalta ? '' : normalizeFormaRecebimento_(medItem.Forma_Recebimento),
    Previsao_Entrega: medItem.Previsao_Entrega || '',
    Status_Compra: statusCompra,
    Status_Handover: statusHandover,
    Comprado: toBoolean_(medItem.Comprado),       // espelhado de Medicamentos
    Comprado_Por: '',
    Data_Compra: '',
    Entregue: toBoolean_(medItem.Entregue),        // espelhado de Medicamentos
    Entregue_Por: '',                              // campo operacional — preenchido pelo fluxo de entrega
    Data_Entrega: '',                              // campo operacional — preenchido pelo fluxo de entrega
    Cancelado: isCancelado,                        // true quando Status_Handover = Cancelado
    Cancelado_Por: sanitizeText_(medItem.Cancelado_Por || ''),
    Data_Cancelamento: medItem.Data_Cancelamento || '',
    Motivo_Cancelamento: sanitizeText_(medItem.Motivo_Cancelamento || ''),
    Observacao_Solicitacao: sanitizeText_(medItem.Observacao_Solicitacao || ''),
    Observacao_Compra: '',
    Mensagem_Cliente: '',
    Ultima_Atualizacao: new Date(),
  };
}

/**
 * Espelha Medicamentos → Compras_Medicamentos por ID_Handover.
 * @param {string} handoverId
 * @param {{fromRevertToPending?: boolean, compradoPorHandover?: string}=} opt fromRevertToPending: após revertMedicationToPending no Handover (força Pendente de compra e limpa data/comprador).
 */
function selfTestEspelhoComprasRecebimento_() {
  var pan = buildComprasRowNamedValuesFromMedicamento_(
    {
      ID: 'SELFTEST_PANPHARMA',
      Tipo: 'Encomenda',
      Medicamento: 'SELFTEST_MEDICAMENTO',
      Atendente: 'SELFTEST',
      Cliente: 'SELFTEST',
      Telefone: '21999999999',
      Status: 'Pendente',
      Fornecedor_Compra: 'Panpharma',
      Codigo_Compra_Fornecedor: 12345,
      Forma_Recebimento: FORMAS_RECEBIMENTO.A_COMBINAR,
    },
    ''
  );
  var santa = buildComprasRowNamedValuesFromMedicamento_(
    {
      ID: 'SELFTEST_SANTA_CRUZ',
      Tipo: 'Encomenda',
      Medicamento: 'SELFTEST_MEDICAMENTO',
      Atendente: 'SELFTEST',
      Cliente: 'SELFTEST',
      Telefone: '21999999999',
      Status: 'Pendente',
      Fornecedor_Compra: 'Santa Cruz',
      Codigo_Compra_Fornecedor: ' SC-987 ',
      Forma_Recebimento: FORMAS_RECEBIMENTO.RETIRA_LOJA,
    },
    ''
  );
  var entrega = buildComprasRowNamedValuesFromMedicamento_(
    {
      ID: 'SELFTEST_ENTREGA',
      Tipo: 'Encomenda',
      Medicamento: 'SELFTEST_MEDICAMENTO',
      Atendente: 'SELFTEST',
      Cliente: 'SELFTEST',
      Telefone: '21999999999',
      Status: 'Pendente',
      Fornecedor_Compra: '',
      Codigo_Compra_Fornecedor: 'NAO_DEVE_PERSISTIR',
      Forma_Recebimento: FORMAS_RECEBIMENTO.ENTREGA_ENDERECO,
    },
    ''
  );

  var failures = [];
  if (pan.Fornecedor_Compra !== 'Panpharma' || pan.Codigo_Compra_Fornecedor !== '12345') {
    failures.push('Panpharma/codigo nao preservado');
  }
  if (pan.Forma_Recebimento !== FORMAS_RECEBIMENTO.A_COMBINAR) {
    failures.push('Forma A combinar nao preservada');
  }
  if (santa.Fornecedor_Compra !== 'Santa Cruz' || santa.Codigo_Compra_Fornecedor !== 'SC-987') {
    failures.push('Santa Cruz/codigo nao preservado');
  }
  if (santa.Forma_Recebimento !== FORMAS_RECEBIMENTO.RETIRA_LOJA) {
    failures.push('Forma Retira na loja nao preservada');
  }
  if (entrega.Fornecedor_Compra !== 'NÃ£o informado' || entrega.Codigo_Compra_Fornecedor !== '') {
    failures.push('Codigo nao foi limpo para fornecedor Nao informado');
  }
  if (entrega.Forma_Recebimento !== FORMAS_RECEBIMENTO.ENTREGA_ENDERECO) {
    failures.push('Forma Entregar no endereco cadastrado nao preservada');
  }

  if (failures.length) {
    throw new Error('selfTestEspelhoComprasRecebimento_: ' + failures.join('; '));
  }
  Logger.log('selfTestEspelhoComprasRecebimento_: OK');
  return {
    success: true,
    panpharma: pan,
    santaCruz: santa,
    entregaEndereco: entrega,
  };
}

function mirrorComprasMedicamentosRowForMedicamentoId_(handoverId, opt) {
  opt = opt || {};
  var id = sanitizeText_(handoverId);
  if (!id) {
    return;
  }
  var medLoc = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!medLoc) {
    return;
  }
  var medItem = rowToObjectFromSheetRow_(medLoc.sheet, medLoc.rowNumber);
  normalizeItemForClient_(medItem);
  try {
    var medStatusCol = getColumnIndex_(medLoc.sheet, 'Status');
    var statusLive = String(medLoc.sheet.getRange(medLoc.rowNumber, medStatusCol).getValue() || '').trim();
    if (statusLive) {
      medItem.Status = statusLive;
    }
  } catch (stLiveErr) {
    Logger.log('mirrorComprasMedicamentosRowForMedicamentoId_ statusLive: ' + stLiveErr);
  }

  var cSheet = getComprasMedicamentosSheet_();
  var existingRow = findComprasRowByHandoverId_(cSheet, id);
  var existingStatus = '';
  var prevObj = null;
  if (existingRow) {
    prevObj = rowToObjectFromSheetRow_(cSheet, existingRow);
    existingStatus = prevObj.Status_Compra;
  }
  var named = buildComprasRowNamedValuesFromMedicamento_(medItem, existingStatus);

  if (existingRow && prevObj) {
    named.Observacao_Compra = sanitizeText_(prevObj.Observacao_Compra || '');
    named.Mensagem_Cliente = sanitizeText_(prevObj.Mensagem_Cliente || '');

    if (opt.fromRevertToPending) {
      named.Status_Compra = COMPRAS_STATUS_COMPRA.PENDENTE;
      named.Status_Handover = 'Pendente';
      named.Data_Compra = '';
      named.Comprado_Por = '';
      named.Ultima_Atualizacao = new Date();
    } else {
      if (
        normalizeComprasStatusCompraInput_(existingStatus) === COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO &&
        sanitizeText_(medItem.Status).toLowerCase() !== 'cancelado'
      ) {
        named.Status_Compra = COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO;
        if (!named.Mensagem_Cliente) {
          named.Mensagem_Cliente = buildMensagemClienteNaoEncontrado_(named.Cliente, named.Medicamento);
        }
      }
      if (named.Status_Compra === COMPRAS_STATUS_COMPRA.COMPRADO) {
        if (prevObj.Data_Compra) {
          named.Data_Compra = prevObj.Data_Compra;
        } else {
          named.Data_Compra = new Date();
        }
        var cpp = sanitizeText_(prevObj.Comprado_Por || '');
        if (cpp) {
          named.Comprado_Por = cpp;
        }
      } else {
        if (prevObj.Data_Compra !== undefined && prevObj.Data_Compra !== null && prevObj.Data_Compra !== '') {
          named.Data_Compra = prevObj.Data_Compra;
        } else {
          named.Data_Compra = '';
        }
        named.Comprado_Por = sanitizeText_(prevObj.Comprado_Por || '');
      }
    }
    if (
      named.Status_Compra === COMPRAS_STATUS_COMPRA.COMPRADO &&
      !sanitizeText_(named.Comprado_Por) &&
      opt.compradoPorHandover
    ) {
      named.Comprado_Por = sanitizeText_(opt.compradoPorHandover);
    }
    if (!opt.fromRevertToPending) {
      applyMedicamentoCancelamentoEspelhoComprasNamed_(medItem, named);
    }
    var rowVals = buildAppendRowValuesFromNamedMap_(cSheet, named);
    for (var i = 0; i < rowVals.length; i++) {
      cSheet.getRange(existingRow, i + 1).setValue(rowVals[i]);
    }
    try { colorirLinhaCompraPorStatus_(cSheet, existingRow, named.Status_Compra); } catch (ce) {}
  } else {
    if (opt.fromRevertToPending) {
      named.Status_Compra = COMPRAS_STATUS_COMPRA.PENDENTE;
      named.Status_Handover = 'Pendente';
      named.Data_Compra = '';
      named.Comprado_Por = '';
    } else if (named.Status_Compra === COMPRAS_STATUS_COMPRA.COMPRADO) {
      named.Data_Compra = new Date();
      if (opt.compradoPorHandover) {
        named.Comprado_Por = sanitizeText_(opt.compradoPorHandover);
      }
    }
    if (!opt.fromRevertToPending) {
      applyMedicamentoCancelamentoEspelhoComprasNamed_(medItem, named);
    }
    cSheet.appendRow(buildAppendRowValuesFromNamedMap_(cSheet, named));
    try { colorirLinhaCompraPorStatus_(cSheet, cSheet.getLastRow(), named.Status_Compra); } catch (ce) {}
  }
}

/**
 * MANUAL: executar no editor Apps Script para popular/atualizar a aba sem duplicar ID_Handover.
 */
function sincronizarComprasMedicamentos_() {
  setupSpreadsheet();
  var sheet = getSheetOrThrow_(getSpreadsheet_(), SHEET_NAMES.MEDICAMENTOS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('sincronizarComprasMedicamentos_: sem linhas em Medicamentos');
    return { ok: true, synced: 0 };
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var n = 0;
  for (var r = 0; r < values.length; r++) {
    var obj = rowCellsToObject_(headerCells, values[r]);
    var rid = sanitizeText_(obj.ID || '');
    if (!rid) {
      continue;
    }
    mirrorComprasMedicamentosRowForMedicamentoId_(rid);
    n++;
  }
  Logger.log('sincronizarComprasMedicamentos_: sincronizados=' + n);
  return { ok: true, synced: n };
}

/**
 * Regra única Compras_Medicamentos → Medicamentos por ID_Handover (Parte 2).
 * Lê Status_Compra na linha de Compras; atualiza Medicamentos e colunas de apoio em Compras.
 * Idempotente para disparo duplo (onEdit simples + trigger): repetir o mesmo estado não deve corromper dados.
 * MANUAL: pode ser executada no editor com um UUID válido.
 */
function processarStatusCompraPorIdHandover_(idHandover) {
  var id = sanitizeText_(idHandover);
  if (!id) {
    Logger.log('processarStatusCompraPorIdHandover_: id vazio');
    return { ok: false, reason: 'id_vazio' };
  }
  setupSpreadsheet();
  var now = new Date();
  var cSheet = getComprasMedicamentosSheet_();
  var rCompras = findComprasRowByHandoverId_(cSheet, id);
  var medLoc = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);

  if (!rCompras) {
    Logger.log(
      'processarStatusCompraPorIdHandover_: id=' +
        id +
        ' compras_encontrado=NAO medicamentos_encontrado=' +
        (medLoc ? 'SIM' : 'NAO') +
        ' abort=compras_linha'
    );
    return { ok: false, reason: 'compras_linha' };
  }
  if (!medLoc) {
    var oCx = rowToObjectFromSheetRow_(cSheet, rCompras);
    Logger.log(
      'processarStatusCompraPorIdHandover_: id=' +
        id +
        ' compras_encontrado=SIM medicamentos_encontrado=NAO Status_Compra=' +
        normalizeComprasStatusCompraInput_(oCx.Status_Compra) +
        ' abort=med_linha'
    );
    return { ok: false, reason: 'medicamento' };
  }

  var oCompras = rowToObjectFromSheetRow_(cSheet, rCompras);
  var statusCompra = normalizeComprasStatusCompraInput_(oCompras.Status_Compra);
  var known =
    statusCompra === COMPRAS_STATUS_COMPRA.PENDENTE ||
    statusCompra === COMPRAS_STATUS_COMPRA.COMPRADO ||
    statusCompra === COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO ||
    statusCompra === COMPRAS_STATUS_COMPRA.CANCELADO;
  if (!known) {
    Logger.log(
      'processarStatusCompraPorIdHandover_: id=' +
        id +
        ' compras=SIM medicamentos=SIM Status_Compra_invalido=' +
        String(oCompras.Status_Compra || '').trim()
    );
    return { ok: false, reason: 'status_invalido' };
  }

  var sh = medLoc.sheet;
  var rn = medLoc.rowNumber;
  var compradoCol = getColumnIndex_(sh, 'Comprado');
  var entregueCol = getColumnIndex_(sh, 'Entregue');
  var statusCol = getColumnIndex_(sh, 'Status');
  var colUltima = getColumnIndex_(cSheet, 'Ultima_Atualizacao');
  var colStatusH = getColumnIndex_(cSheet, 'Status_Handover');
  var colMsg = getColumnIndex_(cSheet, 'Mensagem_Cliente');
  var colDataCompra = getColumnIndex_(cSheet, 'Data_Compra');
  var colCompradoPor = getColumnIndex_(cSheet, 'Comprado_Por');

  if (statusCompra === COMPRAS_STATUS_COMPRA.PENDENTE) {
    sh.getRange(rn, compradoCol).setValue(false);
    sh.getRange(rn, entregueCol).setValue(false);
    sh.getRange(rn, statusCol).setValue('Pendente');
    syncMedicationStatus_(sh, rn);
    var medP = rowToObjectFromSheetRow_(sh, rn);
    normalizeItemForClient_(medP);
    var finalP = sanitizeText_(medP.Status);
    cSheet.getRange(rCompras, colStatusH).setValue(finalP);
    cSheet.getRange(rCompras, colUltima).setValue(now);
    Logger.log(
      'processarStatusCompraPorIdHandover_: id=' +
        id +
        ' Status_Compra_aplicado=' +
        COMPRAS_STATUS_COMPRA.PENDENTE +
        ' compras=SIM medicamentos=SIM status_final=' +
        finalP
    );
    return { ok: true, statusFinal: finalP };
  }

  if (statusCompra === COMPRAS_STATUS_COMPRA.COMPRADO) {
    sh.getRange(rn, compradoCol).setValue(true);
    sh.getRange(rn, entregueCol).setValue(false);
    syncMedicationStatus_(sh, rn);
    var medA = rowToObjectFromSheetRow_(sh, rn);
    normalizeItemForClient_(medA);
    var finalC = sanitizeText_(medA.Status);
    var curDc = cSheet.getRange(rCompras, colDataCompra).getValue();
    if (curDc === '' || curDc === null || curDc === undefined) {
      cSheet.getRange(rCompras, colDataCompra).setValue(now);
    }
    var por = getEditorEmailForSheetHook_();
    if (por) {
      var curPor = String(cSheet.getRange(rCompras, colCompradoPor).getValue() || '').trim();
      if (!curPor) {
        cSheet.getRange(rCompras, colCompradoPor).setValue(por);
      }
    }
    cSheet.getRange(rCompras, colStatusH).setValue(finalC);
    cSheet.getRange(rCompras, colUltima).setValue(now);
    Logger.log(
      'processarStatusCompraPorIdHandover_: id=' +
        id +
        ' Status_Compra_aplicado=' +
        COMPRAS_STATUS_COMPRA.COMPRADO +
        ' compras=SIM medicamentos=SIM status_final=' +
        finalC
    );
    return { ok: true, statusFinal: finalC };
  }

  if (statusCompra === COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO) {
    sh.getRange(rn, compradoCol).setValue(false);
    sh.getRange(rn, entregueCol).setValue(false);
    syncMedicationStatus_(sh, rn);
    sh.getRange(rn, statusCol).setValue('Pendente');
    var medN = rowToObjectFromSheetRow_(sh, rn);
    normalizeItemForClient_(medN);
    var finalN = sanitizeText_(medN.Status);
    cSheet
      .getRange(rCompras, colMsg)
      .setValue(buildMensagemClienteNaoEncontrado_(oCompras.Cliente, oCompras.Medicamento));
    cSheet.getRange(rCompras, colStatusH).setValue(finalN);
    cSheet.getRange(rCompras, colUltima).setValue(now);
    Logger.log(
      'processarStatusCompraPorIdHandover_: id=' +
        id +
        ' Status_Compra_aplicado=' +
        COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO +
        ' compras=SIM medicamentos=SIM status_final=' +
        finalN
    );
    return { ok: true, statusFinal: finalN };
  }

  if (statusCompra === COMPRAS_STATUS_COMPRA.CANCELADO) {
    sh.getRange(rn, compradoCol).setValue(false);
    sh.getRange(rn, entregueCol).setValue(false);
    sh.getRange(rn, statusCol).setValue('Cancelado');
    cSheet.getRange(rCompras, colStatusH).setValue('Cancelado');
    cSheet.getRange(rCompras, colUltima).setValue(now);
    Logger.log(
      'processarStatusCompraPorIdHandover_: id=' +
        id +
        ' Status_Compra_aplicado=' +
        COMPRAS_STATUS_COMPRA.CANCELADO +
        ' compras=SIM medicamentos=SIM status_final=Cancelado'
    );
    return { ok: true, statusFinal: 'Cancelado' };
  }

  return { ok: false, reason: 'fim' };
}

/**
 * Wrapper público para o gatilho criado na UI (Triggers) do Apps Script, sem usar ScriptApp.getProjectTriggers.
 */
function handleComprasMedicamentosEdit(e) {
  return handleComprasMedicamentosEdit_(e);
}

/**
 * Gatilho instalável e onEdit simples: entrada única para edições na aba Compras_Medicamentos.
 * Valida contexto, registra log mínimo e delega a processarStatusCompraPorIdHandover_ (regra única).
 */
function handleComprasMedicamentosEdit_(e) {
  if (!e || !e.range) {
    return;
  }
  var sheet = e.range.getSheet();
  var parentId = sheet.getParent().getId();
  var officialId;
  try {
    officialId = getComprasSpreadsheet_().getId();
  } catch (ex) {
    Logger.log('handleComprasMedicamentosEdit_: planilha Compras ' + ex);
    return;
  }
  if (parentId !== officialId) {
    return;
  }
  if (sheet.getName() !== SHEET_NAMES.COMPRAS_MEDICAMENTOS) {
    return;
  }
  var rowNumber = e.range.getRow();
  if (rowNumber <= 1) {
    return;
  }
  var colStatus;
  try {
    colStatus = getColumnIndex_(sheet, 'Status_Compra');
  } catch (errCol) {
    Logger.log('handleComprasMedicamentosEdit_: coluna Status_Compra ' + errCol);
    return;
  }
  if (e.range.getColumn() !== colStatus) {
    return;
  }
  var rowObj = rowToObjectFromSheetRow_(sheet, rowNumber);
  var idHandover = sanitizeText_(rowObj.ID_Handover || '');
  var statusCompra = String(
    e.value !== undefined && e.value !== null ? e.value : rowObj.Status_Compra != null ? rowObj.Status_Compra : ''
  ).trim();
  Logger.log(
    'handleComprasMedicamentosEdit_: linha=' +
      rowNumber +
      ' ID_Handover=' +
      idHandover +
      ' Status_Compra=' +
      statusCompra
  );
  // Colorir linha imediatamente no onEdit (resposta visual instantânea na planilha).
  try {
    colorirLinhaCompraPorStatus_(sheet, rowNumber, statusCompra);
  } catch (colorErr) {
    Logger.log('handleComprasMedicamentosEdit_: colorir: ' + colorErr);
  }
  if (!idHandover) {
    Logger.log('handleComprasMedicamentosEdit_: ID_Handover ausente');
    return;
  }
  try {
    processarStatusCompraPorIdHandover_(idHandover);
  } catch (procErr) {
    Logger.log(
      'handleComprasMedicamentosEdit_: erro processar id=' + idHandover + ' msg=' + (procErr && procErr.message ? procErr.message : procErr)
    );
  }
}

/**
 * Colore a linha inteira da aba Compras_Medicamentos conforme o Status_Compra.
 * Cores: Pendente = amarelo, Comprado = verde, Não encontrado = vermelho, Cancelado = cinza, vazio = branco.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} rowNumber - Linha 1-based; deve ser > 1.
 * @param {string} status - Valor de Status_Compra.
 */
function colorirLinhaCompraPorStatus_(sheet, rowNumber, status) {
  if (!sheet || rowNumber <= 1) { return; }
  var s = String(status || '').trim();
  var cor;
  if (s === COMPRAS_STATUS_COMPRA.COMPRADO) {
    cor = '#D9EAD3'; // verde claro
  } else if (s === COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO) {
    cor = '#F4CCCC'; // vermelho claro
  } else if (s === COMPRAS_STATUS_COMPRA.CANCELADO) {
    cor = '#EFEFEF'; // cinza claro
  } else if (s === COMPRAS_STATUS_COMPRA.PENDENTE) {
    cor = '#FFF2CC'; // amarelo claro
  } else {
    cor = '#FFFFFF'; // branco (padrão)
  }
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) { return; }
  sheet.getRange(rowNumber, 1, 1, lastCol).setBackground(cor);
}

/**
 * MANUAL: colore todas as linhas da aba Compras_Medicamentos conforme o Status_Compra atual.
 * Executar no editor GAS para aplicar cores a registros já existentes na planilha.
 */
function colorirTodasLinhasCompras() {
  var sheet = getComprasMedicamentosSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('colorirTodasLinhasCompras: sem linhas de dados.');
    return;
  }
  var colStatus = getColumnIndex_(sheet, 'Status_Compra');
  var statuses = sheet.getRange(2, colStatus, lastRow - 1, 1).getValues();
  for (var i = 0; i < statuses.length; i++) {
    colorirLinhaCompraPorStatus_(sheet, i + 2, String(statuses[i][0] || '').trim());
  }
  Logger.log('colorirTodasLinhasCompras: ' + (lastRow - 1) + ' linha(s) colorida(s).');
}

/** Wrapper público para execução manual no Apps Script Editor (funções com "_" não aparecem bem no seletor). */
function instalarTriggerComprasMedicamentos() {
  return instalarTriggerComprasMedicamentos_();
}

/** Wrapper público para execução manual no Apps Script Editor. */
function listarTriggersHandover() {
  return listarTriggersHandover_();
}

/** Wrapper público para execução manual no Apps Script Editor. */
function removerTriggerComprasMedicamentos() {
  return removerTriggerComprasMedicamentos_();
}

/** Opcional: lembrete no Logger; processamento real em processarStatusCompraPorIdHandover_(id). */
function testarProcessarStatusCompraPorIdHandover() {
  Logger.log('Informe um ID_Handover manualmente chamando processarStatusCompraPorIdHandover_(id).');
}

/**
 * MANUAL: instalar gatilho onEdit instalável apontando para handleComprasMedicamentosEdit_.
 * Remove gatilhos duplicados do mesmo handler antes de criar.
 */
function instalarTriggerComprasMedicamentos_() {
  var ss = getComprasSpreadsheet_();
  var all = ScriptApp.getProjectTriggers();
  var toDelete = [];
  var i;
  for (i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'handleComprasMedicamentosEdit_') {
      toDelete.push(all[i]);
    }
  }
  for (i = 0; i < toDelete.length; i++) {
    ScriptApp.deleteTrigger(toDelete[i]);
  }
  ScriptApp.newTrigger('handleComprasMedicamentosEdit_').forSpreadsheet(ss).onEdit().create();
  Logger.log(
    'instalarTriggerComprasMedicamentos_: OK spreadsheetId=' + ss.getId() + ' nome=' + sanitizeText_(ss.getName())
  );
}

/** MANUAL: listar gatilhos do projeto (handler, evento, sourceId). */
function listarTriggersHandover_() {
  var all = ScriptApp.getProjectTriggers();
  Logger.log('listarTriggersHandover_: total=' + all.length);
  for (var i = 0; i < all.length; i++) {
    var t = all[i];
    var sid = '';
    try {
      sid = t.getTriggerSourceId() || '';
    } catch (ee) {
      sid = '(indisponivel)';
    }
    Logger.log('  handler=' + t.getHandlerFunction() + ' event=' + t.getEventType() + ' sourceId=' + sid);
  }
}

/** MANUAL: remover todos os gatilhos cujo handler é handleComprasMedicamentosEdit_. */
function removerTriggerComprasMedicamentos_() {
  var all = ScriptApp.getProjectTriggers();
  var n = 0;
  var toDelete = [];
  var i;
  for (i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'handleComprasMedicamentosEdit_') {
      toDelete.push(all[i]);
    }
  }
  for (i = 0; i < toDelete.length; i++) {
    ScriptApp.deleteTrigger(toDelete[i]);
    n++;
  }
  Logger.log('removerTriggerComprasMedicamentos_: removidos=' + n);
}

/**
 * Legado: entrada por (sheet, linha, valores). Regra real apenas em processarStatusCompraPorIdHandover_.
 */
function handleComprasMedicamentosStatusEdit_(sheet, rowNumber, newValue, oldValue) {
  var statusNew = normalizeComprasStatusCompraInput_(newValue);
  var statusOld = normalizeComprasStatusCompraInput_(oldValue);
  if (!statusNew || statusNew === statusOld) {
    return;
  }
  var rowObj = rowToObjectFromSheetRow_(sheet, rowNumber);
  var handoverId = sanitizeText_(rowObj.ID_Handover || '');
  if (!handoverId) {
    return;
  }
  processarStatusCompraPorIdHandover_(handoverId);
}

/**
 * Template Manhã — Instrução de Abertura / checklist do turno da manhã (07:00, 23 itens).
 * Conteúdo alinhado ao documento oficial da loja; item_id estável para ordenação.
 */
var CHECKLIST_TEMPLATE_MANHA_ = [
  {
    item_id: 'manha_climatizacao',
    horario_referencia: '07:00',
    categoria: 'Estrutura e Ambiente',
    item: 'Climatização',
    descricao: [
      '• Ligar o ar-condicionado.',
      '• Ligar a cortina de ar.',
      '• Colocar a moto em local especificado no exterior da loja.',
      '• Verificar se o ambiente está confortável para clientes e equipe.',
      '',
      'Critério de conclusão: salão climatizado e entrada com cortina de ar ligada.',
    ].join('\n'),
  },
  {
    item_id: 'manha_iluminacao',
    horario_referencia: '07:00',
    categoria: 'Estrutura e Ambiente',
    item: 'Iluminação',
    descricao: [
      '• Acender luzes do salão.',
      '• Acender luzes da fachada.',
      '• Acender tótens e pontos visuais externos, se houver.',
      '',
      'Critério de conclusão: loja visível, iluminada e com aparência de operação ativa.',
    ].join('\n'),
  },
  {
    item_id: 'manha_som_ambiente',
    horario_referencia: '07:00',
    categoria: 'Estrutura e Ambiente',
    item: 'Som ambiente',
    descricao: [
      '• Ligar a rádio interna.',
      '• Ajustar volume para nível agradável.',
      '',
      'Critério de conclusão: som funcionando sem atrapalhar atendimento, telefone ou comunicação da equipe.',
    ].join('\n'),
  },
  {
    item_id: 'manha_fachada',
    horario_referencia: '07:00',
    categoria: 'Estrutura e Ambiente',
    item: 'Fachada',
    descricao: [
      '• Verificar limpeza da calçada.',
      '• Colocar bandeiras da loja no exterior.',
      '• Verificar se há lixo, caixas, objetos ou obstruções na entrada.',
      '• Corrigir ou acionar responsável quando houver problema.',
      '',
      'Critério de conclusão: entrada limpa, livre e convidativa para o cliente.',
    ].join('\n'),
  },
  {
    item_id: 'manha_servidor',
    horario_referencia: '07:00',
    categoria: 'Sistemas e Operação',
    item: 'Servidor',
    descricao: [
      '• Ligar o servidor.',
      '• Verificar se o banco de dados carregou corretamente.',
      '• Confirmar se o sistema principal está acessível.',
      '',
      'Critério de conclusão: sistema operacional pronto para venda.',
    ].join('\n'),
  },
  {
    item_id: 'manha_pdvs_balcao',
    horario_referencia: '07:00',
    categoria: 'Sistemas e Operação',
    item: 'PDVs e Balcão',
    descricao: [
      '• Ligar computadores.',
      '• Ligar monitores.',
      '• Ligar impressoras térmicas.',
      '• Conferir se os equipamentos respondem corretamente.',
      '',
      'Critério de conclusão: pontos de atendimento e caixa prontos para operar.',
    ].join('\n'),
  },
  {
    item_id: 'manha_troco',
    horario_referencia: '07:00',
    categoria: 'Sistemas e Operação',
    item: 'Troco',
    descricao: [
      '• Conferir o kit de troco.',
      '• Verificar se há moedas e notas suficientes para iniciar o turno.',
      '',
      'Critério de conclusão: troco disponível para as primeiras vendas do dia.',
    ].join('\n'),
  },
  {
    item_id: 'manha_caixa',
    horario_referencia: '07:00',
    categoria: 'Sistemas e Operação',
    item: 'Caixa',
    descricao: [
      '• Abrir o caixa.',
      '• Conferir valores iniciais.',
      '• Registrar qualquer divergência antes de iniciar vendas.',
      '',
      'Critério de conclusão: caixa aberto, conferido e pronto para operação.',
    ].join('\n'),
  },
  {
    item_id: 'manha_handover',
    horario_referencia: '07:00',
    categoria: 'Sistemas e Operação',
    item: 'Handover',
    descricao: [
      '• Checar mensagens do turno anterior.',
      '• Limpar do painel o que já foi resolvido.',
      '• Programar entregas do dia de medicamentos encomendados.',
      '• Verificar pendências críticas antes do início do fluxo de clientes.',
      '',
      'Critério de conclusão: pendências conhecidas, resolvidos limpos e entregas organizadas.',
    ].join('\n'),
  },
  {
    item_id: 'manha_internet_tef',
    horario_referencia: '07:00',
    categoria: 'Sistemas e Operação',
    item: 'Internet e TEF',
    descricao: [
      '• Testar conexão de internet.',
      '• Verificar máquinas de cartão.',
      '• Conferir se as maquinetas estão carregadas.',
      '• Realizar teste simples quando houver dúvida de conexão.',
      '',
      'Critério de conclusão: loja pronta para receber pagamentos por cartão e operar sistemas online.',
    ].join('\n'),
  },
  {
    item_id: 'manha_telefones_whatsapp',
    horario_referencia: '07:00',
    categoria: 'Sistemas e Operação',
    item: 'Telefones e WhatsApp',
    descricao: [
      '• Verificar bateria do celular da loja.',
      '• Confirmar conexão de internet no aparelho.',
      '• Conferir mensagens recebidas enquanto a loja estava fechada.',
      '• Priorizar mensagens ligadas a medicamentos, entregas e clientes aguardando resposta.',
      '',
      'Critério de conclusão: WhatsApp ativo e mensagens críticas identificadas.',
    ].join('\n'),
  },
  {
    item_id: 'manha_pisos_prateleiras',
    horario_referencia: '07:00',
    categoria: 'Higiene e Organização',
    item: 'Pisos e Prateleiras',
    descricao: [
      '• Conferir se a limpeza geral foi feita.',
      '• Verificar se há pó, manchas ou sujeira visível.',
      '• Acionar correção imediata quando necessário.',
      '',
      'Critério de conclusão: salão limpo e prateleiras apresentáveis.',
    ].join('\n'),
  },
  {
    item_id: 'manha_lixeiras',
    horario_referencia: '07:00',
    categoria: 'Higiene e Organização',
    item: 'Lixeiras',
    descricao: [
      '• Verificar se todas as lixeiras estão com sacos novos.',
      '• Conferir se há lixo acumulado do turno anterior.',
      '',
      'Critério de conclusão: lixeiras preparadas para o turno.',
    ].join('\n'),
  },
  {
    item_id: 'manha_banheiros_pias',
    horario_referencia: '07:00',
    categoria: 'Higiene e Organização',
    item: 'Banheiros e Pias',
    descricao: [
      '• Repor sabonete líquido.',
      '• Repor papel toalha.',
      '• Conferir pontos de uso da equipe e clientes, quando aplicável.',
      '',
      'Critério de conclusão: banheiros e pias abastecidos e utilizáveis.',
    ].join('\n'),
  },
  {
    item_id: 'manha_alcool_gel',
    horario_referencia: '07:00',
    categoria: 'Higiene e Organização',
    item: 'Álcool em gel',
    descricao: [
      '• Verificar disponibilidade de álcool em gel no balcão.',
      '• Repor quando estiver baixo ou vazio.',
      '',
      'Critério de conclusão: álcool em gel disponível para clientes e equipe.',
    ].join('\n'),
  },
  {
    item_id: 'manha_moto',
    horario_referencia: '07:00',
    categoria: 'Logística de Entrega',
    item: 'Moto',
    descricao: [
      '• Conferir condições da moto junto com o entregador.',
      '• Usar o sistema/checklist próprio, quando disponível.',
      '• Registrar qualquer impedimento operacional.',
      '',
      'Critério de conclusão: moto liberada para entregas ou pendência registrada.',
    ].join('\n'),
  },
  {
    item_id: 'manha_bau_mochila',
    horario_referencia: '07:00',
    categoria: 'Logística de Entrega',
    item: 'Baú/Mochila',
    descricao: [
      '• Verificar limpeza interna.',
      '• Confirmar se está seco.',
      '• Corrigir antes de transportar medicamentos ou produtos.',
      '',
      'Critério de conclusão: compartimento de entrega limpo e adequado.',
    ].join('\n'),
  },
  {
    item_id: 'manha_maquineta_movel',
    horario_referencia: '07:00',
    categoria: 'Logística de Entrega',
    item: 'Maquineta móvel',
    descricao: [
      '• Conferir bateria da máquina de cartão de rua.',
      '• Confirmar se está operante para entregas.',
      '',
      'Critério de conclusão: maquineta móvel pronta para uso externo.',
    ].join('\n'),
  },
  {
    item_id: 'manha_termolabeis',
    horario_referencia: '07:00',
    categoria: 'Balcão e Medicamentos',
    item: 'Termolábeis',
    descricao: [
      '• Conferir temperatura da geladeira de vacinas/insulinas.',
      '• Anotar a temperatura conforme rotina da loja.',
      '• Registrar desvio imediatamente se estiver fora do padrão esperado.',
      '',
      'Critério de conclusão: temperatura conferida e registrada.',
    ].join('\n'),
  },
  {
    item_id: 'manha_psicotropicos',
    horario_referencia: '07:00',
    categoria: 'Balcão e Medicamentos',
    item: 'Psicotrópicos',
    descricao: [
      '• Verificar se o armário controlado está fechado.',
      '• Confirmar que a chave está em local seguro e acessível para a pessoa autorizada.',
      '',
      'Critério de conclusão: controlados protegidos e acesso sob controle.',
    ].join('\n'),
  },
  {
    item_id: 'manha_reposicao',
    horario_referencia: '07:00',
    categoria: 'Balcão e Medicamentos',
    item: 'Reposição',
    descricao: [
      '• Verificar buracos nas prateleiras.',
      '• Priorizar reposição imediata dos itens de maior giro.',
      '• Acionar estoque quando houver falta aparente.',
      '',
      'Critério de conclusão: principais produtos de giro expostos e sem ruptura visual crítica.',
    ].join('\n'),
  },
  {
    item_id: 'manha_trava_saida',
    horario_referencia: '07:00',
    categoria: 'Caixa e Financeiro',
    item: 'TRAVA DE SAÍDA',
    descricao: [
      '1. Conferir caixa físico vs. sistema.',
      '2. Executar fechamento do PDV (quando aplicável).',
      '3. Conciliar TEF (cartão) com o sistema.',
      '4. Conferir PIX/links (valores e comprovantes).',
      '5. Registrar estornos/cancelamentos com motivo.',
      '6. Guardar valores e trancar o cofre.',
      '',
      'Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).',
    ].join('\n'),
  },
  {
    item_id: 'manha_fechamento_abertura',
    horario_referencia: '07:00',
    categoria: 'Fechamento da abertura',
    item: 'Conferência final no Handover',
    descricao: [
      'Antes de liberar a loja como pronta para operação, o responsável deve conferir no Handover:',
      '• total de itens do checklist;',
      '• itens feitos;',
      '• itens pendentes;',
      '• percentual concluído;',
      '• observações registradas;',
      '• pendências críticas que precisam ser comunicadas à gerência.',
    ].join('\n'),
  },
];

/**
 * Template Tarde — Passagem de turno / continuidade (13:40, 9 itens).
 */
var CHECKLIST_TEMPLATE_TARDE_ = [
  {
    item_id: 'tarde_leitura_rapida',
    horario_referencia: '13:40',
    categoria: 'Leitura rápida (2–3 min)',
    item: 'Handover — leitura inicial',
    descricao: [
      '• Abrir Handover.',
      '• Identificar pendências.',
      '• Perguntar: "tem algo fora do sistema?"',
      '',
      'Saída esperada: você sabe o que precisa agir primeiro.',
    ].join('\n'),
  },
  {
    item_id: 'tarde_limpeza_handover',
    horario_referencia: '13:40',
    categoria: 'Limpeza inteligente Handover',
    item: 'Marcar resolvido e observações',
    descricao: [
      '• Marcar como resolvido apenas o que terminou.',
      '• Manter aberto o que depende de cliente/entrega/fornecedor.',
      '• Registrar observação objetiva no que ficar pendente.',
      '',
      'Padrão de observação: o que é, impacto, próxima ação.',
    ].join('\n'),
  },
  {
    item_id: 'tarde_medicamentos',
    horario_referencia: '13:40',
    categoria: 'Medicamentos (prioridade alta)',
    item: 'Encomendas, faltas e previsões',
    descricao: [
      '• Encomendas: chegou? cliente avisado?',
      '• Faltas: ainda tem demanda?',
      '• Previsões: hoje/atrasado → agir.',
      '',
      'Erro comum: produto chegou e ninguém avisou o cliente.',
    ].join('\n'),
  },
  {
    item_id: 'tarde_entregas',
    horario_referencia: '14:00',
    categoria: 'Entregas',
    item: 'Entregas do turno',
    descricao: [
      '• O que sai hoje?',
      '• Está separado?',
      '• Forma de pagamento definida?',
      '• Moto + maquineta ok?',
      '',
      'Alerta crítico: maquineta sem bateria trava entrega.',
    ].join('\n'),
  },
  {
    item_id: 'tarde_caixa_sistema',
    horario_referencia: '14:00',
    categoria: 'Caixa e sistema',
    item: 'Caixa, TEF e internet',
    descricao: [
      '• Existe divergência?',
      '• TEF funcionando?',
      '• Internet estável?',
      '• Passagem de caixa (abertura e fechamento).',
      '• Conferência de troco.',
      '',
      'Regra: qualquer risco financeiro deve estar registrado.',
    ].join('\n'),
  },
  {
    item_id: 'tarde_whatsapp',
    horario_referencia: '14:30',
    categoria: 'WhatsApp',
    item: 'WhatsApp do balcão',
    descricao: [
      '• Conversas sem resposta.',
      '• Clientes aguardando preço/produto.',
      '• Retornos pendentes.',
      '',
      'Regra: ninguém fica sem resposta na troca de turno.',
    ].join('\n'),
  },
  {
    item_id: 'tarde_loja_rapido',
    horario_referencia: '15:00',
    categoria: 'Loja (rápido)',
    item: 'Rupturas, balcão e ronda',
    descricao: [
      '• Rupturas visíveis.',
      '• Balcão organizado.',
      '',
      'Ronda geral obrigatória (1–2 min):',
      '• Lixeiras ok (com saco e sem acúmulo).',
      '• Higiene geral (sem sujeira visível).',
      '• Papelaria (bobinas, sacolas, etiquetas disponíveis).',
      '• Máquinas carregadas (PDV e maquinetas).',
      '• WC limpo e abastecido (papel/sabão).',
      '• Sala de vacinas organizada e pronta.',
    ].join('\n'),
  },
  {
    item_id: 'tarde_trava_saida',
    horario_referencia: '17:00',
    categoria: 'Caixa e Financeiro',
    item: 'TRAVA DE SAÍDA',
    descricao: [
      '1. Conferir caixa físico vs. sistema.',
      '2. Executar fechamento do PDV (quando aplicável).',
      '3. Conciliar TEF (cartão) com o sistema.',
      '4. Conferir PIX/links (valores e comprovantes).',
      '5. Registrar estornos/cancelamentos com motivo.',
      '6. Guardar valores e trancar o cofre.',
      '',
      'Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).',
    ].join('\n'),
  },
  {
    item_id: 'tarde_validacao_final',
    horario_referencia: '17:00',
    categoria: 'Fechamento (validação final)',
    item: 'Validação antes de assumir o turno',
    descricao: [
      'Responda sem hesitar:',
      '1. O que eu preciso fazer agora?',
      '2. Quem está esperando retorno?',
      '3. O que pode dar problema hoje?',
      '',
      'Se travar em alguma resposta → não assumiu o turno corretamente.',
    ].join('\n'),
  },
];

/**
 * Template Noite — Fechamento noturno (10 blocos operacionais).
 */
var CHECKLIST_TEMPLATE_NOITE_ = [
  {
    item_id: 'noite_medicamentos_risco_cliente',
    horario_referencia: '21:30',
    categoria: 'Medicamentos',
    item: 'RISCO DIRETO NO CLIENTE',
    descricao: [
      '1. Atualizar encomendas (chegou / não chegou / cliente avisado).',
      '2. Registrar clientes que precisam de retorno.',
      '3. Revisar previsões (hoje/atrasado → ação definida).',
      '4. Conferir e trancar controlados (psicotrópicos).',
      '5. Conferir e registrar temperatura de termolábeis.',
      '',
      'Critério de aprovação: nenhum cliente aguardando medicamento sem ação definida.',
    ].join('\n'),
  },
  {
    item_id: 'noite_entregas_trava_operacional',
    horario_referencia: '21:30',
    categoria: 'Entregas',
    item: 'TRAVA OPERACIONAL',
    descricao: [
      '1. Finalizar entregas do dia ou justificar.',
      '2. Registrar pendentes com cliente + motivo + próxima ação.',
      '3. Conferir moto (condição de uso) ou registrar problema em sistema próprio.',
      '4. Guardar moto.',
      '',
      'Critério de aprovação: nenhuma entrega sem status e próximo passo.',
    ].join('\n'),
  },
  {
    item_id: 'noite_fechamento_moto',
    horario_referencia: '22:00',
    categoria: 'Entregas',
    item: 'Fechamento da Moto',
    descricao: [
      'Preencher sistema da moto com entregador e guardar chaves em local pré estipulado.',
      'Guardar moto no interior da loja.',
    ].join('\n'),
  },
  {
    item_id: 'noite_clientes_whatsapp_experiencia',
    horario_referencia: '21:30',
    categoria: 'Clientes e WhatsApp',
    item: 'EXPERIÊNCIA',
    descricao: [
      '1. Responder conversas críticas (preço, disponibilidade, entrega).',
      '2. Atualizar conversas importantes.',
      '3. Registrar no Handover clientes que exigem retorno.',
      '',
      'Critério de aprovação: 0 clientes críticos sem resposta/registro.',
    ].join('\n'),
  },
  {
    item_id: 'noite_loja_higiene_pronto_abrir',
    horario_referencia: '22:00',
    categoria: 'Loja e Higiene',
    item: 'PRONTO PRA ABRIR',
    descricao: [
      '1. Limpar e organizar balcão.',
      '2. Esvaziar lixeiras e repor sacos.',
      '3. Garantir loja sem sujeira visível.',
      '4. Limpar e abastecer WC (papel/sabão).',
      '5. Organizar sala de vacinas.',
      '6. Retirar bandeiras da fachada e guardar em local adequado.',
      '',
      'Critério de aprovação: ambiente pronto para abertura imediata.',
    ].join('\n'),
  },
  {
    item_id: 'noite_equipamentos_nao_travar_amanha',
    horario_referencia: '22:00',
    categoria: 'Equipamentos',
    item: 'NÃO TRAVAR AMANHÃ',
    descricao: [
      '1. Encerrar PDVs/computadores corretamente.',
      '2. Desligar o servidor conforme procedimento da loja (quando aplicável).',
      '3. Colocar todas as maquinetas em carga.',
      '4. Colocar celular da loja em carga.',
      '5. Verificar internet/roteador (ou registrar problema).',
      '',
      'Critério de aprovação: nenhum equipamento crítico indisponível sem registro.',
    ].join('\n'),
  },
  {
    item_id: 'noite_seguranca_risco_zero',
    horario_referencia: '22:15',
    categoria: 'Segurança',
    item: 'RISCO ZERO',
    descricao: [
      '1. Trancar cofre e armários sensíveis (incluindo controlados).',
      '2. Fechar portas, grades e vitrines.',
      '3. Ativar alarme.',
      '4. Conferir área externa (fachada) sem itens expostos indevidamente.',
      '',
      'Critério de aprovação: loja segura após saída da equipe.',
    ].join('\n'),
  },
  {
    item_id: 'noite_caixa_financeiro_trava_saida',
    horario_referencia: '22:15',
    categoria: 'Caixa e Financeiro',
    item: 'TRAVA DE SAÍDA',
    descricao: [
      '1. Conferir caixa físico vs. sistema.',
      '2. Executar fechamento do PDV (quando aplicável).',
      '3. Conciliar TEF (cartão) com o sistema.',
      '4. Conferir PIX/links (valores e comprovantes).',
      '5. Registrar estornos/cancelamentos com motivo.',
      '6. Guardar valores e trancar o cofre.',
      '',
      'Critério de aprovação: saldo bate ou divergência registrada (valor + possível causa + ação).',
    ].join('\n'),
  },
  {
    item_id: 'noite_handover_passar_jogo_limpo',
    horario_referencia: '22:00',
    categoria: 'Handover',
    item: 'PASSAR O JOGO LIMPO',
    descricao: [
      '1. Registrar todas as pendências reais.',
      '2. Marcar como resolvido apenas o que está concluído.',
      '3. Para cada pendência, registrar: o que é + impacto + próxima ação + prazo.',
      '',
      'Critério de aprovação: qualquer pessoa consegue assumir sabendo o que fazer agora.',
    ].join('\n'),
  },
  {
    item_id: 'noite_validacao_final',
    horario_referencia: '22:15',
    categoria: 'Validação final',
    item: 'Validação final (30–60s)',
    descricao: [
      'Responder sem hesitar:',
      '• O que o próximo turno faz primeiro?',
      '• Há cliente aguardando retorno?',
      '• Há entrega pendente?',
      '• Existe algum risco não registrado?',
      '',
      'Se houver dúvida → voltar e registrar no Handover.',
    ].join('\n'),
  },
];

function getChecklistTemplateForTurno_(turnoParam) {
  var turno = sanitizeChecklistTurno_(turnoParam);
  if (turno === CHECKLIST_TURNO_TARDE) {
    return CHECKLIST_TEMPLATE_TARDE_;
  }
  if (turno === CHECKLIST_TURNO_NOITE) {
    return CHECKLIST_TEMPLATE_NOITE_;
  }
  return CHECKLIST_TEMPLATE_MANHA_;
}

/** @deprecated Use getChecklistTemplateForTurno_; mantido para compatibilidade legada. */
function getChecklistTemplate_() {
  return getChecklistTemplateForTurno_(CHECKLIST_TURNO_MANHA);
}

function getChecklistDateKey_(date) {
  return Utilities.formatDate(date || new Date(), HANDOVER_TIMEZONE, 'yyyy-MM-dd');
}

function getChecklistTemplateOrderMap_(turnoParam) {
  var turno = sanitizeChecklistTurno_(turnoParam);
  return getChecklistTemplateForTurno_(turno).reduce(function (orderMap, checklistItem, index) {
    orderMap[buildChecklistIdentityKey_(checklistItem.item)] = index;
    if (checklistItem.item_id) {
      orderMap[buildChecklistIdentityKey_(checklistItem.item_id)] = index;
    }
    return orderMap;
  }, {});
}

/** Chaves normalizadas dos textos de Item permitidos no template do turno (exclui linhas legadas na leitura). */
function getChecklistTemplateAllowedItemKeys_(turnoParam) {
  var tmpl = getChecklistTemplateForTurno_(turnoParam);
  var map = {};
  for (var i = 0; i < tmpl.length; i++) {
    map[buildChecklistIdentityKey_(sanitizeText_(tmpl[i].item))] = true;
  }
  return map;
}

/**
 * Remove linhas em Checklist_Turnos para a data e o turno dados quando o texto de Item
 * não existe no template atual daquele turno (ex.: Noite com 21 itens antigos da Manhã).
 * Só afeta a combinação (dateKey, turno) passada — tipicamente o dia corrente ao gerar checklist.
 */
function purgeChecklistRowsNotInTemplate_(sheet, lastCol, headerCells, dateKey, turno, template) {
  var allowed = {};
  for (var ti = 0; ti < template.length; ti++) {
    allowed[buildChecklistIdentityKey_(sanitizeText_(template[ti].item))] = true;
  }
  var dk = String(dateKey || '').trim();
  var turnoOk = sanitizeChecklistTurno_(turno);
  var removed = 0;
  var lr = sheet.getLastRow();
  if (lr <= 1) {
    return removed;
  }
  for (var rn = lr; rn >= 2; rn--) {
    var row = sheet.getRange(rn, 1, 1, lastCol).getValues()[0];
    var rowObject = rowCellsToObject_(headerCells, row);
    var rowDate = normalizeDateKeyCell_(rowObject.Data);
    var rowTurno = sanitizeText_(rowObject.Turno);
    if (!rowDate || !rowTurno) {
      continue;
    }
    if (String(rowDate).trim() !== dk || sanitizeChecklistTurno_(rowTurno) !== turnoOk) {
      continue;
    }
    var itemText = sanitizeText_(rowObject.Item);
    if (!itemText || !allowed[buildChecklistIdentityKey_(itemText)]) {
      sheet.deleteRow(rn);
      removed++;
    }
  }
  return removed;
}

function sanitizeChecklistTurno_(value) {
  var label = sanitizeText_(value);
  if (label === CHECKLIST_TURNO_TARDE) {
    return CHECKLIST_TURNO_TARDE;
  }
  if (label === CHECKLIST_TURNO_NOITE) {
    return CHECKLIST_TURNO_NOITE;
  }
  return CHECKLIST_TURNO_MANHA;
}

function horarioReferenciaForTurno_(turno) {
  var t = sanitizeChecklistTurno_(turno);
  if (t === CHECKLIST_TURNO_TARDE) {
    return CHECKLIST_HORARIO_TARDE;
  }
  if (t === CHECKLIST_TURNO_NOITE) {
    return CHECKLIST_HORARIO_NOITE;
  }
  return CHECKLIST_HORARIO_REFERENCIA;
}

function inferDefaultChecklistTurno_() {
  var hourText = Utilities.formatDate(new Date(), HANDOVER_TIMEZONE, 'HH');
  var hour = Number(hourText);
  if (hour >= 5 && hour < 13) {
    return CHECKLIST_TURNO_MANHA;
  }
  if (hour >= 13 && hour < 21) {
    return CHECKLIST_TURNO_TARDE;
  }
  return CHECKLIST_TURNO_NOITE;
}

function checklistSummaryForItemContext_(checklistItem) {
  var dateKey = getChecklistDateKey_();
  var turno =
    checklistItem && checklistItem.Turno
      ? sanitizeChecklistTurno_(checklistItem.Turno)
      : CHECKLIST_TURNO_MANHA;
  return getChecklistSummary_(fetchChecklistItems_(dateKey, turno));
}

function ensureTodayMorningChecklist_() {
  return ensureTodayChecklistForTurno_(CHECKLIST_TURNO_MANHA);
}

function ensureTodayChecklistForTurno_(turnoParam) {
  const ss = getSpreadsheet_();
  const sheet = getSheetOrThrow_(ss, SHEET_NAMES.CHECKLIST);
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const dateKey = getChecklistDateKey_();
  const turno = sanitizeChecklistTurno_(turnoParam);
  const template = getChecklistTemplateForTurno_(turno);
  const horarioRef = horarioReferenciaForTurno_(turno);
  const identityPrefix = buildChecklistIdentityKey_(dateKey) + '|' + buildChecklistIdentityKey_(turno);

  var purged = 0;
  try {
    purged = purgeChecklistRowsNotInTemplate_(sheet, lastCol, headerCells, dateKey, turno, template);
    if (purged > 0) {
      Logger.log('purgeChecklistRowsNotInTemplate_ date=' + dateKey + ' turno=' + turno + ' removed=' + purged);
    }
  } catch (purgeErr) {
    Logger.log('purgeChecklistRowsNotInTemplate_: ' + purgeErr);
  }

  const existingKeys = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    values.forEach(function (row) {
      const rowObject = rowCellsToObject_(headerCells, row);
      const rowDate = normalizeDateKeyCell_(rowObject.Data);
      const rowTurno = sanitizeText_(rowObject.Turno);
      const rowItem = sanitizeText_(rowObject.Item);
      if (!rowDate || !rowTurno || !rowItem) {
        return;
      }

      const rowKey =
        buildChecklistIdentityKey_(rowDate) +
        '|' +
        buildChecklistIdentityKey_(rowTurno) +
        '|' +
        buildChecklistIdentityKey_(rowItem);
      existingKeys.add(rowKey);
    });
  }

  let rowsToInsert = [];
  template.forEach(function (templateItem) {
    const itemKey =
      identityPrefix + '|' + buildChecklistIdentityKey_(sanitizeText_(templateItem.item));
    if (existingKeys.has(itemKey)) {
      return;
    }

    var rowHorario =
      templateItem.horario_referencia != null && String(templateItem.horario_referencia).trim() !== ''
        ? sanitizeText_(templateItem.horario_referencia)
        : horarioRef;

    rowsToInsert.push([
      Utilities.getUuid(),
      dateKey,
      turno,
      rowHorario,
      sanitizeText_(templateItem.categoria),
      sanitizeText_(templateItem.item),
      sanitizeText_(templateItem.descricao),
      CHECKLIST_STATUS.PENDENTE,
      '',
      '',
      '',
    ]);
  });

  if (rowsToInsert.length > 0) {
    var insertWidth = rowsToInsert[0].length;
    if (insertWidth < lastCol) {
      rowsToInsert = rowsToInsert.map(function (row) {
        var extended = row.slice();
        while (extended.length < lastCol) {
          extended.push('');
        }
        return extended;
      });
    }
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, lastCol).setValues(rowsToInsert);
  }

  return {
    dateKey: dateKey,
    turno: turno,
    insertedCount: rowsToInsert.length,
    purgedCount: purged,
  };
}

function fetchChecklistItems_(dateKey, turno) {
  const ss = getSpreadsheet_();
  const sheet = getSheetOrThrow_(ss, SHEET_NAMES.CHECKLIST);
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const filterDateKey = dateKey || getChecklistDateKey_();
  const filterTurno = sanitizeChecklistTurno_(turno || CHECKLIST_TURNO_MANHA);

  if (sheet.getLastRow() <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  const orderMap = getChecklistTemplateOrderMap_(filterTurno);
  const allowedItemKeys = getChecklistTemplateAllowedItemKeys_(filterTurno);

  return values
    .map(function (row) {
      const item = rowCellsToObject_(headerCells, row);
      normalizeChecklistItemForClient_(item);
      return item;
    })
    .filter(function (item) {
      if (item.Data !== filterDateKey || item.Turno !== filterTurno) {
        return false;
      }
      var itemKey = buildChecklistIdentityKey_(sanitizeText_(item.Item));
      return !!allowedItemKeys[itemKey];
    })
    .sort(function (a, b) {
      const orderA = orderMap[buildChecklistIdentityKey_(a.Item)];
      const orderB = orderMap[buildChecklistIdentityKey_(b.Item)];
      const safeA = typeof orderA === 'number' ? orderA : Number.MAX_SAFE_INTEGER;
      const safeB = typeof orderB === 'number' ? orderB : Number.MAX_SAFE_INTEGER;
      if (safeA !== safeB) {
        return safeA - safeB;
      }
      return String(a.Item).localeCompare(String(b.Item));
    });
}

function fetchChecklistItemsForToday_() {
  const dateKey = getChecklistDateKey_();
  return fetchChecklistItems_(dateKey, CHECKLIST_TURNO_MANHA);
}

function getChecklistSummary_(items) {
  const totalItens = items.length;
  const itensFeitos = items.filter(function (item) {
    return item.Status === CHECKLIST_STATUS.FEITO;
  }).length;
  const itensNaoAplicaveis = items.filter(function (item) {
    return item.Status === CHECKLIST_STATUS.NA;
  }).length;
  const itensPendentes = items.filter(function (item) {
    return item.Status === CHECKLIST_STATUS.PENDENTE;
  }).length;
  const concluidos = itensFeitos + itensNaoAplicaveis;
  const percentualConcluido = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

  return {
    totalItens: totalItens,
    itensFeitos: itensFeitos,
    itensNaoAplicaveis: itensNaoAplicaveis,
    itensPendentes: itensPendentes,
    percentualConcluido: percentualConcluido,
  };
}

function updateChecklistItemStatus(id, status, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const sess = requireSessionHandover_(sessionToken);
  const responsavelValue = getSessionDisplayName_(sess);

  const location = findRowById_(SHEET_NAMES.CHECKLIST, id);
  if (!location) {
    throw new Error('Item de checklist nao encontrado: ' + id);
  }

  const normalizedStatus = parseChecklistStatusInput_(status);
  const statusColumn = getColumnIndex_(location.sheet, 'Status');
  const dataHoraCheckColumn = getColumnIndex_(location.sheet, 'Data_Hora_Check');
  const responsavelColumn = getColumnIndex_(location.sheet, 'Responsavel');

  location.sheet.getRange(location.rowNumber, statusColumn).setValue(normalizedStatus);
  location.sheet
    .getRange(location.rowNumber, dataHoraCheckColumn)
    .setValue(normalizedStatus === CHECKLIST_STATUS.PENDENTE ? '' : new Date());
  location.sheet
    .getRange(location.rowNumber, responsavelColumn)
    .setValue(normalizedStatus === CHECKLIST_STATUS.PENDENTE ? '' : responsavelValue);

  const updatedItem = fetchChecklistItemById_(id);
  Logger.log('updateChecklistItemStatus ms=' + (Date.now() - started));
  return {
    success: true,
    checklistItem: updatedItem,
    checklistSummary: checklistSummaryForItemContext_(updatedItem),
  };
}

function updateChecklistItemObservation(id, observacao, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const sess = requireSessionHandover_(sessionToken);
  const responsavelValue = getSessionDisplayName_(sess);

  const location = findRowById_(SHEET_NAMES.CHECKLIST, id);
  if (!location) {
    throw new Error('Item de checklist nao encontrado: ' + id);
  }

  const observacaoColumn = getColumnIndex_(location.sheet, 'Observacao');
  const responsavelColumn = getColumnIndex_(location.sheet, 'Responsavel');

  location.sheet.getRange(location.rowNumber, observacaoColumn).setValue(sanitizeText_(observacao));
  location.sheet
    .getRange(location.rowNumber, responsavelColumn)
    .setValue(sanitizeText_(responsavelValue));

  const updatedItem = fetchChecklistItemById_(id);
  Logger.log('updateChecklistItemObservation ms=' + (Date.now() - started));
  return {
    success: true,
    checklistItem: updatedItem,
    checklistSummary: checklistSummaryForItemContext_(updatedItem),
  };
}

function generateTodayMorningChecklist() {
  setupSpreadsheet();
  return generateChecklistForTurno_(CHECKLIST_TURNO_MANHA);
}

function generateChecklistForTurno_(turno) {
  ensureTodayChecklistForTurno_(turno);
  return {
    success: true,
    checklistTurno: buildChecklistTurnoPayload_(turno),
  };
}

function generateChecklistForTurno(turno, sessionToken) {
  setupSpreadsheet();
  requireSessionHandover_(sessionToken);
  return generateChecklistForTurno_(turno);
}

function refreshDashboardBundle(checklistTurnoOpt, sessionToken) {
  setupSpreadsheet();
  requireSessionHandover_(sessionToken);
  var turno = sanitizeChecklistTurno_(checklistTurnoOpt || inferDefaultChecklistTurno_());
  var checklistPayload = null;
  try {
    checklistPayload = buildChecklistTurnoPayload_(turno);
  } catch (eChecklist) {
    Logger.log('[Handover] refreshDashboardBundle: checklist falhou, retornando null. ' + eChecklist.message);
  }
  return {
    geral: fetchSheetItems_(SHEET_NAMES.GERAL).filter(function (item) {
      return !item.Resolvido;
    }),
    medicamentos: fetchSheetItems_(SHEET_NAMES.MEDICAMENTOS).filter(function (m) {
      return String(m.Status || '').trim().toLowerCase() !== 'cancelado';
    }),
    checklistTurno: checklistPayload,
    bundleTurno: turno,
  };
}

function buildChecklistTurnoPayload_(turnoOpt) {
  var turno = sanitizeChecklistTurno_(turnoOpt || inferDefaultChecklistTurno_());
  var checklistContext = ensureTodayChecklistForTurno_(turno);
  var checklistItems = fetchChecklistItems_(checklistContext.dateKey, checklistContext.turno);
  var horarioRef = horarioReferenciaForTurno_(turno);
  var deadline =
    turno === CHECKLIST_TURNO_MANHA && isAfterMorningDeadline_(checklistContext.dateKey);

  return {
    data: checklistContext.dateKey,
    turno: checklistContext.turno,
    horarioReferencia: horarioRef,
    isAfterDeadline: deadline,
    items: checklistItems,
    summary: getChecklistSummary_(checklistItems),
  };
}

function saveData(tab, data, sessionToken) {
  const started = Date.now();
  const sess = requireSessionHandover_(sessionToken);
  const authorLabel = getSessionDisplayName_(sess);
  const result = appendHandoverRecord_(tab, data, authorLabel);
  // Registrar evento de criação na trilha de auditoria.
  try {
    var novoId = result && result.record && result.record.ID ? result.record.ID : '';
    if (novoId) {
      var sheetNameAudit = tab === 'Medicamentos' ? SHEET_NAMES.MEDICAMENTOS : SHEET_NAMES.GERAL;
      var titulo = tab === 'Medicamentos'
        ? sanitizeText_(data.medicamento || data.tipo || 'Medicamento')
        : sanitizeText_(data.titulo || data.descricao || 'Pendência');
      writeHandoverEditAudit_(sheetNameAudit, novoId, sess, [
        { campo: 'Status', anterior: '', novo: 'Criado', resumo: authorLabel + ' criou: ' + titulo },
      ]);
    }
  } catch (auditErr) {
    Logger.log('saveData audit: ' + auditErr);
  }
  Logger.log('[Handover][perf] saveData total tab=' + tab + ' ms=' + (Date.now() - started));
  return result;
}

function updateHandoverItem(id, origem, payload, sessionToken) {
  const started = Date.now();
  const sess = requireSessionHandover_(sessionToken);
  const itemId = sanitizeText_(id);
  const sheetName = normalizeEditOrigem_(origem);
  if (!itemId) {
    throw new Error('ID do item obrigatorio para edicao.');
  }
  if (!sheetName) {
    throw new Error('Origem invalida para edicao.');
  }

  ensureSheetHeadersFor_(sheetName);
  const location = findRowById_(sheetName, itemId);
  if (!location) {
    throw new Error('Item nao encontrado para edicao: ' + itemId);
  }

  var before = rowToObjectFromSheetRow_(location.sheet, location.rowNumber);
  normalizeItemForClient_(before);
  if (toBoolean_(before.Excluido)) {
    throw new Error('Item excluido nao pode ser editado.');
  }
  if (
    sheetName === SHEET_NAMES.MEDICAMENTOS &&
    sanitizeText_(before.Status).toLowerCase() === 'cancelado'
  ) {
    throw new Error('Item cancelado nao pode ser editado nesta etapa.');
  }

  var patch = buildAllowedEditPatch_(sheetName, before, payload || {});
  var changes = [];
  Object.keys(patch).forEach(function (field) {
    var oldValue = before[field];
    var newValue = patch[field];
    if (auditComparableValue_(oldValue) === auditComparableValue_(newValue)) {
      return;
    }
    setCellByHeader_(location.sheet, location.rowNumber, field, newValue);
    changes.push({ campo: field, anterior: oldValue, novo: newValue });
  });

  if (!changes.length) {
    return {
      success: true,
      itemAtualizado:
        sheetName === SHEET_NAMES.GERAL ? fetchGeralRecordById_(itemId) : fetchMedicationRecordById_(itemId),
      audit: [],
      message: 'Nenhuma alteracao detectada.',
    };
  }

  setCellByHeader_(location.sheet, location.rowNumber, 'Ultima_Acao_Por', getSessionDisplayName_(sess));
  setCellByHeader_(location.sheet, location.rowNumber, 'Ultima_Acao_Em', new Date());

  if (sheetName === SHEET_NAMES.MEDICAMENTOS) {
    mirrorComprasMedicamentosRowForMedicamentoId_(itemId);
  }

  writeHandoverEditAudit_(sheetName, itemId, sess, changes);
  var updated =
    sheetName === SHEET_NAMES.GERAL ? fetchGeralRecordById_(itemId) : fetchMedicationRecordById_(itemId);

  Logger.log('[Handover][perf] updateHandoverItem origem=' + sheetName + ' ms=' + (Date.now() - started));
  return {
    success: true,
    itemAtualizado: updated,
    audit: changes.map(function (c) {
      return {
        Campo: c.campo,
        Valor_Anterior: formatAuditValue_(c.anterior),
        Valor_Novo: formatAuditValue_(c.novo),
      };
    }),
  };
}

function getHandoverAuditTrail(id, sessionToken) {
  requireSessionHandover_(sessionToken);
  var itemId = sanitizeText_(id);
  if (!itemId) {
    throw new Error('ID do item obrigatorio para auditoria.');
  }
  var sheet = getAuditoriaHandoverSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { success: true, auditoria: [] };
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = values
    .map(function (row) {
      return rowCellsToObject_(headers, row);
    })
    .filter(function (row) {
      return sanitizeText_(row.ID_Item) === itemId;
    })
    .map(function (row) {
      Object.keys(row).forEach(function (key) {
        if (row[key] instanceof Date) {
          row[key] = Utilities.formatDate(row[key], HANDOVER_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
        }
      });
      return row;
    })
    .reverse();
  return { success: true, auditoria: out };
}

/**
 * Insere registro em Geral ou Medicamentos com autoria explícita (usado por saveData após sessão e por populateTestData manual).
 */
function appendHandoverRecord_(tab, data, authorLabel) {
  const started = Date.now();

  if (tab !== SHEET_NAMES.GERAL && tab !== SHEET_NAMES.MEDICAMENTOS) {
    throw new Error('Aba invalida: ' + tab);
  }

  const sheet = ensureSheetHeadersFor_(tab);
  const id = Utilities.getUuid();
  const timestamp = new Date();
  const op = authorLabel;
  const nowAcao = new Date();

  if (tab === SHEET_NAMES.GERAL) {
    var temVenc = toBoolean_(data.temVencimento);
    var dataVenCell = '';
    var horaVenCell = '';
    if (temVenc) {
      var parsedVen = parseDate_(data.dataVencimento);
      if (!parsedVen) {
        throw new Error('Data de vencimento invalida. Use YYYY-MM-DD.');
      }
      dataVenCell = parsedVen;
      horaVenCell = sanitizeText_(data.horaVencimento || '');
    }
    const namedRow = {
      ID: id,
      Timestamp: timestamp,
      Autor: authorLabel,
      Titulo: sanitizeText_(data.titulo),
      Urgencia: normalizeUrgenciaGeral_(data.urgencia),
      Descricao: sanitizeText_(data.descricao),
      Resolvido: false,
      Ultima_Acao_Por: op,
      Ultima_Acao_Em: op ? nowAcao : '',
      Resolvido_Por: '',
      Data_Resolucao: '',
      ID_Reaberto_De: '',
      Tem_Vencimento: temVenc,
      Data_Vencimento: temVenc ? dataVenCell : '',
      Hora_Vencimento: temVenc ? horaVenCell : '',
    };
    sheet.appendRow(buildAppendRowValuesFromNamedMap_(sheet, namedRow));

    Logger.log('saveData Geral ms=' + (Date.now() - started));
    return {
      success: true,
      record: fetchGeralRecordById_(id),
    };
  }

  if (tab === SHEET_NAMES.MEDICAMENTOS) {
    const tipo = sanitizeText_(data.tipo);
    const isFalta = tipo.toLowerCase() === 'falta';
    var fnCompra = normalizeFornecedorCompraInput_(data.fornecedorCompra);
    var codCompra = normalizeCodigoCompraFornecedorInput_(data.codigoCompraFornecedor, fnCompra);

    if (isFalta) {
      if (!sanitizeText_(data.medicamento)) {
        throw new Error('Informe o medicamento.');
      }
      if (!sanitizeText_(data.atendente)) {
        throw new Error('Informe o atendente.');
      }
      var previsaoFalta = parseDate_(data.previsaoEntrega);
      const rowValuesFalta = buildAppendRowValuesFromNamedMap_(sheet, {
        ID: id,
        Timestamp: timestamp,
        Tipo: tipo,
        Medicamento: sanitizeText_(data.medicamento),
        Pre_Pago: false,
        Cliente: '',
        Atendente: sanitizeText_(data.atendente),
        Previsao_Entrega: previsaoFalta || '',
        Comprado: false,
        Entregue: false,
        Telefone: '',
        Status: 'Pendente',
        Status_Aviso_WhatsApp: '',
        Data_Aviso_WhatsApp: '',
        Preco_Venda: '',
        Ultima_Acao_Por: op,
        Ultima_Acao_Em: op ? nowAcao : '',
        Revertido_Por: '',
        Data_Reversao: '',
        Status_Anterior: '',
        Motivo_Reversao: '',
        Cancelado_Por: '',
        Data_Cancelamento: '',
        Motivo_Cancelamento: '',
        Fornecedor_Compra: fnCompra,
        Codigo_Compra_Fornecedor: codCompra,
        Forma_Recebimento: '',
        Observacao_Solicitacao: sanitizeText_(data.observacaoSolicitacao || ''),
      });
      sheet.appendRow(rowValuesFalta);
      try {
        mirrorComprasMedicamentosRowForMedicamentoId_(id);
      } catch (comprasErr) {
        Logger.log('saveData mirror Compras Falta: ' + comprasErr);
      }

      Logger.log('saveData Medicamentos Falta ms=' + (Date.now() - started));
      return {
        success: true,
        record: fetchMedicationRecordById_(id),
      };
    }

    const previsaoEntrega = parseDate_(data.previsaoEntrega);
    if (!previsaoEntrega) {
      throw new Error(ENCOMENDA_PRECO_DATA_MSG_);
    }
    const precoVenda = parseSalePrice_(data.precoVenda); // opcional para Encomenda
    const formaRecebimento = normalizeFormaRecebimento_(data.formaRecebimento);

    const rowValues = buildAppendRowValuesFromNamedMap_(sheet, {
      ID: id,
      Timestamp: timestamp,
      Tipo: tipo,
      Medicamento: sanitizeText_(data.medicamento),
      Pre_Pago: toBoolean_(data.prePago),
      Cliente: sanitizeText_(data.cliente),
      Atendente: sanitizeText_(data.atendente),
      Previsao_Entrega: previsaoEntrega,
      Comprado: false,
      Entregue: false,
      Telefone: sanitizeText_(data.telefone),
      Status: 'Pendente',
      Status_Aviso_WhatsApp: '',
      Data_Aviso_WhatsApp: '',
      Preco_Venda: precoVenda,
      Ultima_Acao_Por: op,
      Ultima_Acao_Em: op ? nowAcao : '',
      Revertido_Por: '',
      Data_Reversao: '',
      Status_Anterior: '',
      Motivo_Reversao: '',
      Cancelado_Por: '',
      Data_Cancelamento: '',
      Motivo_Cancelamento: '',
      Fornecedor_Compra: fnCompra,
      Codigo_Compra_Fornecedor: codCompra,
      Forma_Recebimento: formaRecebimento,
      Observacao_Solicitacao: sanitizeText_(data.observacaoSolicitacao || ''),
    });
    sheet.appendRow(rowValues);
    try {
      mirrorComprasMedicamentosRowForMedicamentoId_(id);
    } catch (comprasErr2) {
      Logger.log('saveData mirror Compras: ' + comprasErr2);
    }

    if (tipo.toLowerCase() === 'encomenda') {
      sendOrderEmail_({
        id: id,
        timestamp: timestamp,
        tipo: tipo,
        medicamento: sanitizeText_(data.medicamento),
        prePago: toBoolean_(data.prePago),
        cliente: sanitizeText_(data.cliente),
        atendente: sanitizeText_(data.atendente),
        previsaoEntrega: previsaoEntrega,
      });
    }

    Logger.log('saveData Medicamentos ms=' + (Date.now() - started));
    return {
      success: true,
      record: fetchMedicationRecordById_(id),
    };
  }

  throw new Error('Aba invalida: ' + tab);
}

function fetchData() {
  setupSpreadsheet();

  return {
    geral: fetchSheetItems_(SHEET_NAMES.GERAL).filter(function (item) {
      return !item.Resolvido;
    }),
    medicamentos: fetchSheetItems_(SHEET_NAMES.MEDICAMENTOS).filter(function (m) {
      return String(m.Status || '').trim().toLowerCase() !== 'cancelado';
    }),
    checklistTurno: buildChecklistTurnoPayload_(inferDefaultChecklistTurno_()),
  };
}

function normalizeEditOrigem_(origem) {
  var s = sanitizeText_(origem);
  if (s === SHEET_NAMES.GERAL || s.toLowerCase() === 'geral') {
    return SHEET_NAMES.GERAL;
  }
  if (s === SHEET_NAMES.MEDICAMENTOS || s.toLowerCase() === 'medicamentos') {
    return SHEET_NAMES.MEDICAMENTOS;
  }
  return '';
}

function buildAllowedEditPatch_(sheetName, current, payload) {
  if (sheetName === SHEET_NAMES.GERAL) {
    var temVenc = toBoolean_(payload.temVencimento);
    var dataVen = '';
    if (temVenc) {
      dataVen = parseDate_(payload.dataVencimento);
      if (!dataVen) {
        throw new Error('Data de vencimento invalida. Use YYYY-MM-DD.');
      }
    }
    return {
      Titulo: sanitizeText_(payload.titulo),
      Descricao: sanitizeText_(payload.descricao),
      Urgencia: normalizeUrgenciaGeral_(payload.urgencia),
      Tem_Vencimento: temVenc,
      Data_Vencimento: temVenc ? dataVen : '',
      Hora_Vencimento: temVenc ? sanitizeText_(payload.horaVencimento || '') : '',
    };
  }

  var tipo = sanitizeText_(current.Tipo);
  var isFalta = tipo.toLowerCase() === 'falta';
  var out = {
    Medicamento: sanitizeText_(payload.medicamento),
    Atendente: sanitizeText_(payload.atendente),
    Observacao_Solicitacao: sanitizeText_(payload.observacaoSolicitacao || ''),
    Previsao_Entrega: parseDate_(payload.previsaoEntrega) || '',
  };

  if (!out.Medicamento) {
    throw new Error('Informe o medicamento.');
  }
  if (!out.Atendente) {
    throw new Error('Informe o atendente.');
  }

  if (!isFalta) {
    var fornecedor = normalizeFornecedorCompraInput_(payload.fornecedorCompra);
    out.Cliente = sanitizeText_(payload.cliente);
    out.Telefone = sanitizeText_(payload.telefone);
    out.Preco_Venda = parseSalePrice_(payload.precoVenda);
    out.Pre_Pago = toBoolean_(payload.prePago);
    out.Fornecedor_Compra = fornecedor;
    out.Codigo_Compra_Fornecedor = normalizeCodigoCompraFornecedorInput_(
      payload.codigoCompraFornecedor,
      fornecedor
    );
    out.Forma_Recebimento = normalizeFormaRecebimento_(payload.formaRecebimento);
    if (!out.Cliente) {
      throw new Error('Informe o cliente.');
    }
    if (!out.Telefone) {
      throw new Error('Informe o telefone do cliente.');
    }
    if (!out.Previsao_Entrega) {
      throw new Error(ENCOMENDA_PRECO_DATA_MSG_);
    }
    // Preco_Venda é opcional para Encomenda
  }

  return out;
}

function setCellByHeader_(sheet, rowNumber, headerName, value) {
  var col = getColumnIndex_(sheet, headerName);
  sheet.getRange(rowNumber, col).setValue(value);
}

function auditComparableValue_(value) {
  if (value instanceof Date) {
    if (value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0) {
      return Utilities.formatDate(value, HANDOVER_TIMEZONE, 'yyyy-MM-dd');
    }
    return Utilities.formatDate(value, HANDOVER_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  }
  if (value === true || value === false) {
    return value ? 'true' : 'false';
  }
  return sanitizeText_(value);
}

function formatAuditValue_(value) {
  if (value instanceof Date) {
    if (value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0) {
      return Utilities.formatDate(value, HANDOVER_TIMEZONE, 'dd/MM/yyyy');
    }
    return Utilities.formatDate(value, HANDOVER_TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
  }
  if (value === true || value === false) {
    return value ? 'TRUE' : 'FALSE';
  }
  return sanitizeText_(value);
}

function writeHandoverEditAudit_(origem, itemId, sess, changes) {
  if (!changes || !changes.length) {
    return;
  }
  var sheet = getAuditoriaHandoverSheet_();
  var nome = getSessionDisplayName_(sess);
  var usuario = sanitizeText_(sess && sess.usuario);
  var perfil = sanitizeText_(sess && sess.perfil);
  var now = new Date();
  changes.forEach(function (change) {
    var oldVal = formatAuditValue_(change.anterior);
    var newVal = formatAuditValue_(change.novo);
    sheet.appendRow(
      buildAppendRowValuesFromNamedMap_(sheet, {
        ID_Auditoria: Utilities.getUuid(),
        Data_Hora: now,
        Acao: 'EDITAR',
        Origem: origem,
        ID_Item: itemId,
        Usuario: usuario,
        Nome: nome,
        Perfil: perfil,
        Campo: change.campo,
        Valor_Anterior: oldVal,
        Valor_Novo: newVal,
        Resumo: nome + ' editou ' + change.campo + ' de "' + oldVal + '" para "' + newVal + '".',
      })
    );
  });
}

function fetchHistoricoResolvidos(limit, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();
  requireSessionHandover_(sessionToken);

  const sheet = getSheetOrThrow_(getSpreadsheet_(), SHEET_NAMES.ARQUIVO);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    Logger.log('fetchHistoricoResolvidos ms=' + (Date.now() - started));
    return {
      success: true,
      historico: [],
    };
  }

  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var lim = Number(limit);
  if (isNaN(lim) || lim < 1) {
    lim = 80;
  }
  lim = Math.min(Math.max(lim, 1), 350);

  const firstRow = Math.max(2, lastRow - lim + 1);
  const numRows = lastRow - firstRow + 1;
  const values = sheet.getRange(firstRow, 1, numRows, lastCol).getValues();

  const historico = values
    .map(function (row) {
      const archived = rowCellsToObject_(headerCells, row);
      archived.Origem = sanitizeText_(archived.Origem) || SHEET_NAMES.ARQUIVO;
      normalizeItemForClient_(archived);
      return archived;
    })
    .reverse();

  // Incluir medicamentos cancelados que ainda estejam na aba Medicamentos
  // (fallback: archive pode ter falhado — não aparecem em Arquivo_Resolvidos).
  var archivedIds = {};
  historico.forEach(function (h) { if (h.ID) { archivedIds[h.ID] = true; } });

  var canceladosMed = fetchSheetItems_(SHEET_NAMES.MEDICAMENTOS).filter(function (m) {
    return String(m.Status || '').trim().toLowerCase() === 'cancelado' && !archivedIds[m.ID];
  }).map(function (m) {
    m.Origem = SHEET_NAMES.MEDICAMENTOS;
    m.Estado_Arquivo = 'Cancelado';
    m.Arquivado_Em = m.Data_Cancelamento || m.Ultima_Acao_Em || '';
    normalizeItemForClient_(m);
    return m;
  });

  Logger.log('fetchHistoricoResolvidos ms=' + (Date.now() - started) +
    ' arquivo=' + historico.length + ' cancelados_med=' + canceladosMed.length);
  return {
    success: true,
    historico: canceladosMed.concat(historico),
  };
}

function markAsPurchased(id, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const sess = requireSessionHandover_(sessionToken);
  var author = getSessionDisplayName_(sess);

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error('Medicamento nao encontrado: ' + id);
  }
  var rowPeek = rowToObjectFromSheetRow_(location.sheet, location.rowNumber);
  normalizeItemForClient_(rowPeek);
  if (sanitizeText_(rowPeek.Status).toLowerCase() === 'cancelado') {
    throw new Error('Pedido cancelado pela compra; não é possível marcar como comprado.');
  }

  const compradoColumn = getColumnIndex_(location.sheet, 'Comprado');
  location.sheet.getRange(location.rowNumber, compradoColumn).setValue(true);
  syncMedicationStatus_(location.sheet, location.rowNumber);
  writeMedicationUltimaAcao_(location.sheet, location.rowNumber, author);
  try {
    mirrorComprasMedicamentosRowForMedicamentoId_(id, { compradoPorHandover: author });
  } catch (ce) {
    Logger.log('markAsPurchased mirror compras: ' + ce);
  }

  Logger.log('markAsPurchased ms=' + (Date.now() - started));
  return {
    success: true,
    record: fetchMedicationRecordById_(id),
  };
}

function markAsDelivered(id, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const sess = requireSessionHandover_(sessionToken);
  var author = getSessionDisplayName_(sess);

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error('Medicamento nao encontrado: ' + id);
  }
  var rowPeekD = rowToObjectFromSheetRow_(location.sheet, location.rowNumber);
  normalizeItemForClient_(rowPeekD);
  if (sanitizeText_(rowPeekD.Status).toLowerCase() === 'cancelado') {
    throw new Error('Pedido cancelado pela compra; não é possível marcar como entregue.');
  }

  const compradoColumn = getColumnIndex_(location.sheet, 'Comprado');
  const entregueColumn = getColumnIndex_(location.sheet, 'Entregue');
  location.sheet.getRange(location.rowNumber, compradoColumn).setValue(true);
  location.sheet.getRange(location.rowNumber, entregueColumn).setValue(true);
  syncMedicationStatus_(location.sheet, location.rowNumber);
  writeMedicationUltimaAcao_(location.sheet, location.rowNumber, author);
  try {
    mirrorComprasMedicamentosRowForMedicamentoId_(id);
  } catch (ce2) {
    Logger.log('markAsDelivered mirror compras: ' + ce2);
  }

  Logger.log('markAsDelivered ms=' + (Date.now() - started));
  return {
    success: true,
    record: fetchMedicationRecordById_(id),
  };
}

function revertMedicationToPending(id, sessionToken, motivo) {
  const started = Date.now();
  setupSpreadsheet();

  var ctx = '[revertMedicationToPending] ID=' + sanitizeText_(id) + ' acao=reverter_medicamento ';
  var sess = requireSessionHandover_(sessionToken);
  var op = getSessionDisplayName_(sess);
  if (!op) {
    throw new Error(ctx + 'Sessão sem nome de usuário.');
  }

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error(ctx + 'Medicamento nao encontrado.');
  }

  var sheet = location.sheet;
  var rn = location.rowNumber;
  var rowObj = rowToObjectFromSheetRow_(sheet, rn);
  normalizeItemForClient_(rowObj);

  var comprado = toBoolean_(rowObj.Comprado);
  var entregue = toBoolean_(rowObj.Entregue);
  var statusTxt = sanitizeText_(rowObj.Status).toLowerCase();

  if (statusTxt === 'cancelado') {
    throw new Error(ctx + 'Pedido cancelado pela compra; não use reverter.');
  }

  var precisaRevert =
    comprado ||
    entregue ||
    statusTxt === 'resolvido parcialmente' ||
    statusTxt === 'entregue' ||
    statusTxt === 'comprado';

  if (!precisaRevert) {
    throw new Error(ctx + 'Este item ja esta pendente.');
  }

  var snapshot =
    'Status:' +
    sanitizeText_(rowObj.Status) +
    '|Comprado:' +
    comprado +
    '|Entregue:' +
    entregue;

  sheet.getRange(rn, getColumnIndex_(sheet, 'Comprado')).setValue(false);
  sheet.getRange(rn, getColumnIndex_(sheet, 'Entregue')).setValue(false);
  syncMedicationStatus_(sheet, rn);

  var statusColumn = getColumnIndex_(sheet, 'Status');
  sheet.getRange(rn, statusColumn).setValue('Pendente');

  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Revertido_Por')).setValue(op);
    sheet.getRange(rn, getColumnIndex_(sheet, 'Data_Reversao')).setValue(new Date());
    sheet.getRange(rn, getColumnIndex_(sheet, 'Status_Anterior')).setValue(snapshot);
    sheet.getRange(rn, getColumnIndex_(sheet, 'Motivo_Reversao')).setValue(sanitizeText_(motivo));
  } catch (auditErr) {
    Logger.log('revertMedicationToPending audit cols: ' + auditErr);
  }

  writeMedicationUltimaAcao_(sheet, rn, op);
  try {
    mirrorComprasMedicamentosRowForMedicamentoId_(id, { fromRevertToPending: true });
  } catch (ce3) {
    Logger.log('revertMedicationToPending mirror compras: ' + ce3);
  }

  Logger.log('revertMedicationToPending ms=' + (Date.now() - started));
  return {
    success: true,
    record: fetchMedicationRecordById_(id),
  };
}

/**
 * Cancela solicitação de medicamento diretamente pelo Handover (qualquer operador).
 * Atualiza Medicamentos por ID e espelha para Compras_Medicamentos por ID_Handover.
 */
function cancelMedicationRequest(id, sessionToken, motivo) {
  const started = Date.now();
  setupSpreadsheet();

  var ctx = '[cancelMedicationRequest] ID=' + sanitizeText_(id) + ' acao=cancelar_medicamento ';
  var sess = requireSessionHandover_(sessionToken);
  var op = getSessionDisplayName_(sess);
  if (!op) {
    throw new Error(ctx + 'Sessão sem nome de usuário.');
  }

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error(ctx + 'Medicamento nao encontrado.');
  }

  var sheet = location.sheet;
  var rn = location.rowNumber;
  var now = new Date();

  // Zerar flags de compra/entrega (defensivo).
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Comprado')).setValue(false);
  } catch (eC0) {}
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Entregue')).setValue(false);
  } catch (eE0) {}

  // Status explícito: Cancelado.
  sheet.getRange(rn, getColumnIndex_(sheet, 'Status')).setValue('Cancelado');

  // Auditoria/colunas defensivas (só se existirem no schema).
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Cancelado_Por')).setValue(op);
  } catch (eA0) {}
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Data_Cancelamento')).setValue(now);
  } catch (eA1) {}
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Motivo_Cancelamento')).setValue(sanitizeText_(motivo));
  } catch (eA2) {}

  writeMedicationUltimaAcao_(sheet, rn, op);

  // Registrar cancelamento na trilha de auditoria.
  try {
    writeHandoverEditAudit_(SHEET_NAMES.MEDICAMENTOS, sanitizeText_(id), sess, [
      { campo: 'Status', anterior: 'Pendente', novo: 'Cancelado',
        resumo: op + ' cancelou o pedido.' + (sanitizeText_(motivo) ? ' Motivo: ' + sanitizeText_(motivo) : '') },
    ]);
  } catch (auditCancelErr) {
    Logger.log('cancelMedicationRequest audit: ' + auditCancelErr);
  }

  // Espelhar em Compras_Medicamentos preservando Observacao_Compra/Mensagem_Cliente.
  try {
    SpreadsheetApp.flush();
    mirrorComprasMedicamentosRowForMedicamentoId_(id);
  } catch (ce) {
    Logger.log('cancelMedicationRequest mirror compras: ' + ce);
  }

  // Mover para Arquivo_Resolvidos — cancelado sai da fila e aparece só no Histórico.
  try {
    SpreadsheetApp.flush();
    var ss2 = getSpreadsheet_();
    var archSh = getSheetOrThrow_(ss2, SHEET_NAMES.ARQUIVO);
    // Ler a linha ANTES de deletar (sheet já validado acima).
    var canceledObj = rowToObjectFromSheetRow_(sheet, rn);
    appendArchiveNamedRow_(archSh, SHEET_NAMES.MEDICAMENTOS, canceledObj);
    SpreadsheetApp.flush();
    // Usar getLastRow() para localizar a linha recém-adicionada — sem scan por ID.
    var arcRow = archSh.getLastRow();
    if (arcRow > 1) {
      archSh.getRange(arcRow, getColumnIndex_(archSh, 'Estado_Arquivo')).setValue('Cancelado');
    }
    sheet.deleteRow(rn);
    Logger.log('cancelMedicationRequest arquivado id=' + sanitizeText_(id) + ' ms=' + (Date.now() - started));
    return { success: true, removedId: sanitizeText_(id) };
  } catch (archErr) {
    Logger.log('cancelMedicationRequest archive falhou: ' + archErr);
    return {
      success: true,
      record: fetchMedicationRecordById_(id),
    };
  }
}

function markAsResolved(id, sessionToken) {
  const started = Date.now();
  var ctx =
    '[markAsResolved] ID=' +
    sanitizeText_(id) +
    ' aba=' +
    SHEET_NAMES.GERAL +
    ' acao=arquivar status=';
  try {
    setupSpreadsheet();

    const sess = requireSessionHandover_(sessionToken);
    var operador = getSessionDisplayName_(sess);

    const location = findRowById_(SHEET_NAMES.GERAL, id);
    if (!location) {
      throw new Error(
        'Solicitacao geral nao encontrada (verifique se o ID ainda esta na aba Geral e nao foi arquivado).'
      );
    }

    const sheet = location.sheet;
    const rowNumber = location.rowNumber;
    const op = sanitizeText_(operador);
    const now = new Date();

    sheet.getRange(rowNumber, getColumnIndex_(sheet, 'Ultima_Acao_Por')).setValue(op);
    sheet.getRange(rowNumber, getColumnIndex_(sheet, 'Ultima_Acao_Em')).setValue(now);
    sheet.getRange(rowNumber, getColumnIndex_(sheet, 'Resolvido_Por')).setValue(op);
    sheet.getRange(rowNumber, getColumnIndex_(sheet, 'Data_Resolucao')).setValue(now);

    const resolvidoColumn = getColumnIndex_(sheet, 'Resolvido');
    sheet.getRange(rowNumber, resolvidoColumn).setValue(true);
    moveRowToResolved(SHEET_NAMES.GERAL, rowNumber);

    Logger.log('markAsResolved ms=' + (Date.now() - started));
    return {
      success: true,
      removedId: id,
    };
  } catch (error) {
    throw new Error(ctx + 'erro mensagem=' + error.message);
  }
}

function writeArchiveReopenAudit_(archiveSheet, rowNumber, operador, motivo, novoIdAtivo) {
  archiveSheet.getRange(rowNumber, getColumnIndex_(archiveSheet, 'Estado_Arquivo')).setValue('Reaberto');
  archiveSheet.getRange(rowNumber, getColumnIndex_(archiveSheet, 'Reaberto_Por')).setValue(sanitizeText_(operador));
  archiveSheet.getRange(rowNumber, getColumnIndex_(archiveSheet, 'Data_Reabertura')).setValue(new Date());
  archiveSheet.getRange(rowNumber, getColumnIndex_(archiveSheet, 'Motivo_Reabertura')).setValue(sanitizeText_(motivo));
  archiveSheet
    .getRange(rowNumber, getColumnIndex_(archiveSheet, 'ID_Registro_Ativo'))
    .setValue(sanitizeText_(novoIdAtivo));
}

/**
 * Medicamento cancelado ainda na aba Medicamentos (fallback do histórico): reabre na mesma linha como Pendente.
 */
function reopenMedicamentoCanceladoFromHistorico_(location, sess, op, mot, rid) {
  var sheet = location.sheet;
  var rn = location.rowNumber;
  var rowObj = rowToObjectFromSheetRow_(sheet, rn);
  normalizeItemForClient_(rowObj);
  if (sanitizeText_(rowObj.Status).toLowerCase() !== 'cancelado') {
    throw new Error('Medicamento encontrado na fila, mas nao esta cancelado; nao e possivel reabrir por este fluxo.');
  }

  sheet.getRange(rn, getColumnIndex_(sheet, 'Comprado')).setValue(false);
  sheet.getRange(rn, getColumnIndex_(sheet, 'Entregue')).setValue(false);
  sheet.getRange(rn, getColumnIndex_(sheet, 'Status')).setValue('Pendente');
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Cancelado_Por')).setValue('');
  } catch (e0) {}
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Data_Cancelamento')).setValue('');
  } catch (e1) {}
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Motivo_Cancelamento')).setValue('');
  } catch (e2) {}

  syncMedicationStatus_(sheet, rn);
  writeMedicationUltimaAcao_(sheet, rn, op);

  try {
    writeHandoverEditAudit_(SHEET_NAMES.MEDICAMENTOS, rid, sess, [
      {
        campo: 'Status',
        anterior: 'Cancelado',
        novo: 'Pendente',
        resumo: op + ' reabriu o pedido a partir do historico.' + (sanitizeText_(mot) ? ' Motivo: ' + sanitizeText_(mot) : ''),
      },
    ]);
  } catch (audE) {
    Logger.log('reopenMedicamentoCanceladoFromHistorico_ audit: ' + audE);
  }

  try {
    mirrorComprasMedicamentosRowForMedicamentoId_(rid);
  } catch (ce) {
    Logger.log('reopenMedicamentoCanceladoFromHistorico_ mirror compras: ' + ce);
  }

  return {
    success: true,
    tipo: 'Medicamentos',
    record: fetchMedicationRecordById_(rid),
    arquivoId: rid,
    novoId: rid,
  };
}

function reopenHistoricoItem(archivedRecordId, sessionToken, motivo) {
  const started = Date.now();
  var rid = sanitizeText_(archivedRecordId);
  var sess = requireSessionHandover_(sessionToken);
  var op = getSessionDisplayName_(sess);
  var mot = sanitizeText_(motivo);
  var ctx = '[reopenHistoricoItem] ID=' + rid + ' aba=' + SHEET_NAMES.ARQUIVO + ' acao=reabrir ';
  if (!rid) {
    throw new Error(ctx + 'Registro sem ID.');
  }
  if (!op) {
    throw new Error(ctx + 'Sessão sem nome de usuário.');
  }

  try {
    setupSpreadsheet();

    var loc = findRowByIdWithOptionalIdHandover_(SHEET_NAMES.ARQUIVO, rid);
    if (!loc) {
      var locMed = findRowById_(SHEET_NAMES.MEDICAMENTOS, rid);
      if (locMed) {
        var peekMed = rowToObjectFromSheetRow_(locMed.sheet, locMed.rowNumber);
        normalizeItemForClient_(peekMed);
        if (sanitizeText_(peekMed.Status).toLowerCase() === 'cancelado') {
          Logger.log('reopenHistoricoItem via Medicamentos cancelado id=' + rid);
          return reopenMedicamentoCanceladoFromHistorico_(locMed, sess, op, mot, rid);
        }
      }
      throw new Error(
        'Nao foi possivel reabrir: item nao encontrado nem em Arquivo_Resolvidos nem em Medicamentos.'
      );
    }

    var archived = rowToObjectFromSheetRow_(loc.sheet, loc.rowNumber);
    var estado = sanitizeText_(archived.Estado_Arquivo || 'Resolvido');
    if (estado === 'Reaberto') {
      throw new Error(
        'Este registro ja foi reaberto. ID ativo vinculado: ' + sanitizeText_(archived.ID_Registro_Ativo || '-')
      );
    }

    var origem = sanitizeText_(archived.Origem);
    var ss = getSpreadsheet_();

    if (origem === SHEET_NAMES.GERAL || origem === 'Geral') {
      var gsheet = getSheetOrThrow_(ss, SHEET_NAMES.GERAL);
      var newId = Utilities.getUuid();
      var now = new Date();
      var namedRow = {
        ID: newId,
        Timestamp: now,
        Autor: op,
        Titulo: sanitizeText_(archived.Titulo || archived.Assunto || ''),
        Urgencia: normalizeUrgenciaGeral_(archived.Urgencia || ''),
        Descricao: sanitizeText_(
          archived.Descricao !== undefined && archived.Descricao !== null && archived.Descricao !== ''
            ? archived.Descricao
            : archived['Descrição'] || ''
        ),
        Resolvido: false,
        Ultima_Acao_Por: op,
        Ultima_Acao_Em: now,
        Resolvido_Por: '',
        Data_Resolucao: '',
        ID_Reaberto_De: rid,
        Tem_Vencimento: toBoolean_(archived.Tem_Vencimento),
        Data_Vencimento:
          archived.Data_Vencimento instanceof Date
            ? archived.Data_Vencimento
            : parseDate_(String(archived.Data_Vencimento || '')) || '',
        Hora_Vencimento: sanitizeText_(archived.Hora_Vencimento || ''),
      };
      gsheet.appendRow(buildAppendRowValuesFromNamedMap_(gsheet, namedRow));
      writeArchiveReopenAudit_(loc.sheet, loc.rowNumber, op, mot, newId);

      Logger.log('reopenHistoricoItem Geral ms=' + (Date.now() - started));
      return {
        success: true,
        tipo: 'Geral',
        record: fetchGeralRecordById_(newId),
        arquivoId: rid,
        novoId: newId,
      };
    }

    if (origem === SHEET_NAMES.MEDICAMENTOS || origem === 'Medicamentos') {
      var msheet = getSheetOrThrow_(ss, SHEET_NAMES.MEDICAMENTOS);
      var newMedId = Utilities.getUuid();
      var tipoMed = sanitizeText_(archived.Tipo) || 'Encomenda';
      var previsaoMed = parseDate_(String(archived.Previsao_Entrega || ''));
      if (!previsaoMed) {
        previsaoMed = new Date();
      }
      var faltaMed = tipoMed.toLowerCase() === 'falta';
      var precoMed = '';
      if (!faltaMed) {
        try {
          precoMed =
            archived.Preco_Venda === '' || archived.Preco_Venda === null || archived.Preco_Venda === undefined
              ? ''
              : parseSalePrice_(archived.Preco_Venda);
        } catch (priceErr) {
          precoMed = '';
        }
      }
      var fnAr = normalizeFornecedorCompraInput_(archived.Fornecedor_Compra);
      var codAr = normalizeCodigoCompraFornecedorInput_(archived.Codigo_Compra_Fornecedor, fnAr);
      var namedMed = {
        ID: newMedId,
        Timestamp: new Date(),
        Tipo: tipoMed,
        Medicamento: sanitizeText_(archived.Medicamento),
        Pre_Pago: toBoolean_(archived.Pre_Pago),
        Cliente: sanitizeText_(archived.Cliente),
        Atendente: sanitizeText_(archived.Atendente),
        Previsao_Entrega: previsaoMed,
        Comprado: false,
        Entregue: false,
        Telefone: sanitizeText_(archived.Telefone),
        Status: 'Pendente',
        Status_Aviso_WhatsApp: '',
        Data_Aviso_WhatsApp: '',
        Preco_Venda: precoMed,
        Ultima_Acao_Por: op,
        Ultima_Acao_Em: op ? new Date() : '',
        Revertido_Por: '',
        Data_Reversao: '',
        Status_Anterior: '',
        Motivo_Reversao: '',
        Cancelado_Por: '',
        Data_Cancelamento: '',
        Motivo_Cancelamento: '',
        Fornecedor_Compra: fnAr,
        Codigo_Compra_Fornecedor: codAr,
      };
      msheet.appendRow(buildAppendRowValuesFromNamedMap_(msheet, namedMed));
      try {
        mirrorComprasMedicamentosRowForMedicamentoId_(newMedId);
      } catch (mirRe) {
        Logger.log('reopenHistoricoItem mirror compras: ' + mirRe);
      }
      writeArchiveReopenAudit_(loc.sheet, loc.rowNumber, op, mot, newMedId);

      Logger.log('reopenHistoricoItem Medicamentos ms=' + (Date.now() - started));
      return {
        success: true,
        tipo: 'Medicamentos',
        record: fetchMedicationRecordById_(newMedId),
        arquivoId: rid,
        novoId: newMedId,
      };
    }

    throw new Error('Origem nao suportada para reabertura: ' + origem);
  } catch (error) {
    var inner = String(error.message || '');
    if (
      inner.indexOf('Nao foi possivel reabrir') === 0 ||
      inner.indexOf('Este registro ja foi reaberto') === 0 ||
      inner.indexOf('Medicamento encontrado na fila') === 0 ||
      inner.indexOf('Registro sem ID') === 0 ||
      inner.indexOf('Sessao sem nome') === 0
    ) {
      throw new Error(inner);
    }
    throw new Error(ctx + 'erro mensagem=' + inner);
  }
}

function moveRowToResolved(sheetName, rowNumber) {
  setupSpreadsheet();

  const ss = getSpreadsheet_();
  const sourceSheet = getSheetOrThrow_(ss, sheetName);
  const archiveSheet = getSheetOrThrow_(ss, SHEET_NAMES.ARQUIVO);

  if (rowNumber <= 1 || rowNumber > sourceSheet.getLastRow()) {
    throw new Error('Linha invalida para arquivamento: ' + rowNumber);
  }

  const sourceObject = rowToObjectFromSheetRow_(sourceSheet, rowNumber);
  appendArchiveNamedRow_(archiveSheet, sheetName, sourceObject);

  sourceSheet.deleteRow(rowNumber);

  return true;
}

function onEdit(e) {
  if (!e || !e.range) {
    return;
  }

  const sheet = e.range.getSheet();
  const officialSpreadsheet = getSpreadsheet_();
  if (sheet.getParent().getId() !== officialSpreadsheet.getId()) {
    return;
  }

  const sheetName = sheet.getName();
  const rowNumber = e.range.getRow();

  if (rowNumber <= 1) {
    return;
  }

  if (sheetName === SHEET_NAMES.GERAL) {
    const resolvidoColumn = getColumnIndex_(sheet, 'Resolvido');
    if (e.range.getColumn() === resolvidoColumn && toBoolean_(e.value)) {
      moveRowToResolved(sheetName, rowNumber);
    }
  }

  if (sheetName === SHEET_NAMES.MEDICAMENTOS) {
    const compradoColumn = getColumnIndex_(sheet, 'Comprado');
    const entregueColumn = getColumnIndex_(sheet, 'Entregue');
    const statusColumn = getColumnIndex_(sheet, 'Status');

    if (e.range.getColumn() === compradoColumn || e.range.getColumn() === entregueColumn) {
      syncMedicationStatus_(sheet, rowNumber);
      try {
        var medRowObj = rowToObjectFromSheetRow_(sheet, rowNumber);
        var mid = sanitizeText_(medRowObj.ID || '');
        if (mid) {
          mirrorComprasMedicamentosRowForMedicamentoId_(mid);
        }
      } catch (medEditMir) {
        Logger.log('onEdit Medicamentos mirror compras: ' + medEditMir);
      }
    }

    // Cancelamento direto na planilha: arquivar igual ao cancelamento via UI.
    if (e.range.getColumn() === statusColumn &&
        sanitizeText_(String(e.value || '')).toLowerCase() === 'cancelado') {
      try {
        var medObj = rowToObjectFromSheetRow_(sheet, rowNumber);
        var medId = sanitizeText_(medObj.ID || '');
        if (medId) {
          mirrorComprasMedicamentosRowForMedicamentoId_(medId);
        }
        SpreadsheetApp.flush();
        moveRowToResolved(SHEET_NAMES.MEDICAMENTOS, rowNumber);
        var archiveSheet = getSheetOrThrow_(getSpreadsheet_(), SHEET_NAMES.ARQUIVO);
        var arcLoc = findRowById_(SHEET_NAMES.ARQUIVO, medId);
        if (arcLoc) {
          archiveSheet
            .getRange(arcLoc.rowNumber, getColumnIndex_(archiveSheet, 'Estado_Arquivo'))
            .setValue('Cancelado');
        }
      } catch (cancelEditErr) {
        Logger.log('onEdit Medicamentos cancelamento: ' + cancelEditErr);
      }
    }
  }

  if (sheetName === SHEET_NAMES.COMPRAS_MEDICAMENTOS) {
    try {
      handleComprasMedicamentosEdit_(e);
    } catch (comprasEditErr) {
      Logger.log('onEdit Compras_Medicamentos: ' + comprasEditErr);
    }
  }

  if (sheetName === SHEET_NAMES.CHECKLIST) {
    const statusColumn = getColumnIndex_(sheet, 'Status');
    if (e.range.getColumn() === statusColumn) {
      const normalizedStatus = normalizeChecklistStatus_(e.value);
      const dataHoraCheckColumn = getColumnIndex_(sheet, 'Data_Hora_Check');
      const responsavelColumn = getColumnIndex_(sheet, 'Responsavel');
      sheet.getRange(rowNumber, statusColumn).setValue(normalizedStatus);
      sheet
        .getRange(rowNumber, dataHoraCheckColumn)
        .setValue(normalizedStatus === CHECKLIST_STATUS.PENDENTE ? '' : new Date());
      if (normalizedStatus === CHECKLIST_STATUS.PENDENTE) {
        sheet.getRange(rowNumber, responsavelColumn).setValue('');
      }
    }
  }
}

function populateTestData() {
  setupSpreadsheet();

  appendHandoverRecord_(SHEET_NAMES.GERAL, {
    autor: 'Maria',
    titulo: 'Conferencia de caixa',
    urgencia: 'Normal',
    descricao: 'Conferir divergencia no caixa do turno da tarde.',
  }, 'Maria');

  appendHandoverRecord_(SHEET_NAMES.MEDICAMENTOS, {
    tipo: 'Encomenda',
    medicamento: 'Losartana 50mg',
    prePago: true,
    cliente: 'Joao Silva',
    telefone: '(11) 91234-5678',
    atendente: 'Ana',
    previsaoEntrega: formatDateForInput_(new Date()),
  }, 'Ana');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  appendHandoverRecord_(SHEET_NAMES.MEDICAMENTOS, {
    tipo: 'Falta',
    medicamento: 'Dipirona gotas',
    prePago: false,
    cliente: 'Estoque loja',
    telefone: '(11) 3333-4444',
    atendente: 'Carlos',
    previsaoEntrega: formatDateForInput_(tomorrow),
  }, 'Carlos');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function fetchSheetItems_(sheetName) {
  const sheet = getSheetOrThrow_(getSpreadsheet_(), sheetName);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values.map(function (row) {
    const item = rowCellsToObject_(headerCells, row);
    item.Origem = sheetName;
    normalizeItemForClient_(item);
    return item;
  });
}

function ensureHeadersLegacyAdditive_(sheet, expectedHeaders) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var lastRow = sheet.getLastRow();
  var raw = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var labels = raw.map(function (cell) {
    return String(cell || '').trim();
  });

  var hasAnyHeader = labels.some(function (label) {
    return !!label;
  });

  if (!hasAnyHeader) {
    writeHeaderRow_(sheet, expectedHeaders, Math.max(lastCol, expectedHeaders.length));
    return;
  }

  var missing = computeMissingExpectedHeaders_(labels, expectedHeaders);
  if (missing.length === 0) {
    sheet.setFrozenRows(1);
    return;
  }

  var effectiveLast = labels.length;
  while (effectiveLast > 0 && !labels[effectiveLast - 1]) {
    effectiveLast--;
  }

  var nextCol = effectiveLast + 1;
  missing.forEach(function (headerLabel) {
    sheet.getRange(1, nextCol).setValue(headerLabel);
    nextCol++;
  });

  sheet.setFrozenRows(1);
}

function ensureHeaders_(sheet, expectedHeaders) {
  const targetColumns = Math.max(sheet.getLastColumn(), expectedHeaders.length, 1);
  const rawHeaders = sheet.getRange(1, 1, 1, targetColumns).getValues()[0];
  const currentHeaders = trimTrailingEmpty_(rawHeaders.map(function (value) {
    return String(value || '').trim();
  }));
  const hasDataRows = sheet.getLastRow() > 1;
  const expectedNormalized = expectedHeaders.map(normalizeHeaderName_);
  const currentNormalized = currentHeaders.map(normalizeHeaderName_);

  if (currentHeaders.length === 0) {
    writeHeaderRow_(sheet, expectedHeaders, targetColumns);
    return;
  }

  const exactNormalizedMatch =
    currentNormalized.length === expectedNormalized.length &&
    currentNormalized.every(function (value, index) {
      return value === expectedNormalized[index];
    });

  const isExpectedPrefix =
    currentNormalized.length < expectedNormalized.length &&
    currentNormalized.every(function (value, index) {
      return value === expectedNormalized[index];
    });

  if (exactNormalizedMatch || isExpectedPrefix || !hasDataRows) {
    writeHeaderRow_(sheet, expectedHeaders, targetColumns);
    return;
  }

  throw new Error(
    'Estrutura de cabecalho incompativel na aba "' +
      sheet.getName() +
      '". Ajuste manualmente os cabecalhos para: ' +
      expectedHeaders.join(', ') +
      '.'
  );
}

function buildRowFromHeaders_(headers, valuesByHeader) {
  return headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(valuesByHeader, header)
      ? valuesByHeader[header]
      : '';
  });
}

function fetchMedicationRecordById_(id) {
  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    return null;
  }

  const item = rowToObjectFromSheetRow_(location.sheet, location.rowNumber);
  item.Origem = SHEET_NAMES.MEDICAMENTOS;
  normalizeItemForClient_(item);
  return item;
}

function fetchGeralRecordById_(id) {
  const location = findRowById_(SHEET_NAMES.GERAL, id);
  if (!location) {
    return null;
  }

  const item = rowToObjectFromSheetRow_(location.sheet, location.rowNumber);
  item.Origem = SHEET_NAMES.GERAL;
  normalizeItemForClient_(item);
  return item;
}

function fetchChecklistItemById_(id) {
  const location = findRowById_(SHEET_NAMES.CHECKLIST, id);
  if (!location) {
    return null;
  }

  const item = rowToObjectFromSheetRow_(location.sheet, location.rowNumber);
  normalizeChecklistItemForClient_(item);
  return item;
}

function writeMedicationUltimaAcao_(sheet, rowNumber, operador) {
  const op = sanitizeText_(operador);
  if (!op) {
    return;
  }

  try {
    const colPor = getColumnIndex_(sheet, 'Ultima_Acao_Por');
    const colEm = getColumnIndex_(sheet, 'Ultima_Acao_Em');
    sheet.getRange(rowNumber, colPor).setValue(op);
    sheet.getRange(rowNumber, colEm).setValue(new Date());
  } catch (error) {
    Logger.log('writeMedicationUltimaAcao_: ' + error);
  }
}

function buildArchiveNamedValues_(sheetName, item) {
  var descricao =
    item.Descricao !== undefined && item.Descricao !== null && item.Descricao !== ''
      ? item.Descricao
      : item['Descrição'];

  return {
    Origem: sheetName,
    ID: item.ID || '',
    Timestamp: item.Timestamp || '',
    Tipo: item.Tipo || '',
    Autor: item.Autor || '',
    Descricao: descricao || '',
    Titulo: sanitizeText_(item.Titulo || item['Título'] || item.Assunto || ''),
    Urgencia: normalizeUrgenciaGeral_(item.Urgencia || ''),
    Medicamento: item.Medicamento || '',
    Pre_Pago: item.Pre_Pago || false,
    Cliente: item.Cliente || '',
    Atendente: item.Atendente || '',
    Previsao_Entrega: item.Previsao_Entrega || '',
    Comprado: item.Comprado || false,
    Resolvido: item.Resolvido || false,
    Entregue: item.Entregue || false,
    Telefone: item.Telefone || '',
    Status: item.Status || '',
    Status_Aviso_WhatsApp: item.Status_Aviso_WhatsApp || '',
    Data_Aviso_WhatsApp: item.Data_Aviso_WhatsApp || '',
    Arquivado_Em: new Date(),
    Preco_Venda:
      item.Preco_Venda === '' || item.Preco_Venda === null || item.Preco_Venda === undefined
        ? ''
        : item.Preco_Venda,
    Ultima_Acao_Por: sanitizeText_(item.Ultima_Acao_Por || ''),
    Ultima_Acao_Em: item.Ultima_Acao_Em || '',
    Resolvido_Por: sanitizeText_(item.Resolvido_Por || ''),
    Data_Resolucao: item.Data_Resolucao || '',
    Estado_Arquivo:
      sanitizeText_(String(item.Status || '').trim().toLowerCase()) === 'cancelado'
        ? 'Cancelado'
        : 'Resolvido',
    Reaberto_Por: '',
    Data_Reabertura: '',
    Motivo_Reabertura: '',
    ID_Registro_Ativo: '',
    Tem_Vencimento: toBoolean_(item.Tem_Vencimento),
    Data_Vencimento: item.Data_Vencimento || '',
    Hora_Vencimento: sanitizeText_(item.Hora_Vencimento || ''),
    Revertido_Por: sanitizeText_(item.Revertido_Por || ''),
    Data_Reversao: item.Data_Reversao || '',
    Status_Anterior: sanitizeText_(item.Status_Anterior || ''),
    Motivo_Reversao: sanitizeText_(item.Motivo_Reversao || ''),
  };
}

function appendArchiveNamedRow_(archiveSheet, sheetName, sourceObject) {
  var archiveNamed = buildArchiveNamedValues_(sheetName, sourceObject);
  archiveSheet.appendRow(buildAppendRowValuesFromNamedMap_(archiveSheet, archiveNamed));
}

function getIdColumnIndexSafe_(sheet) {
  try {
    return getColumnIndex_(sheet, 'ID');
  } catch (error) {
    return 1;
  }
}

function findRowById_(sheetName, id) {
  const sheet = getSheetOrThrow_(getSpreadsheet_(), sheetName);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return null;
  }

  var want = sanitizeText_(String(id == null ? '' : id));
  if (!want) {
    return null;
  }

  var idCol = getIdColumnIndexSafe_(sheet);
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();

  for (var index = 0; index < ids.length; index++) {
    var got = sanitizeText_(String(ids[index][0] == null ? '' : ids[index][0]));
    if (got === want) {
      return {
        sheet: sheet,
        rowNumber: index + 2,
      };
    }
  }

  return null;
}

/** Localiza linha por coluna ID ou, se existir na aba, por ID_Handover (mesmo valor). */
function findRowByIdWithOptionalIdHandover_(sheetName, id) {
  var loc = findRowById_(sheetName, id);
  if (loc) {
    return loc;
  }
  var sheet = getSheetOrThrow_(getSpreadsheet_(), sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return null;
  }
  var want = sanitizeText_(String(id == null ? '' : id));
  if (!want) {
    return null;
  }
  try {
    var colH = getColumnIndex_(sheet, 'ID_Handover');
    var vals = sheet.getRange(2, colH, lastRow - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (sanitizeText_(String(vals[i][0] == null ? '' : vals[i][0])) === want) {
        return { sheet: sheet, rowNumber: i + 2 };
      }
    }
  } catch (err) {
    return null;
  }
  return null;
}

function getColumnIndex_(sheet, headerName) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var target = canonicalHeaderKey_(headerName);

  for (var index = 0; index < row.length; index++) {
    var label = String(row[index] || '').trim();
    if (!label) {
      continue;
    }
    if (canonicalHeaderKey_(label) === target) {
      return index + 1;
    }
  }

  throw new Error('Coluna nao encontrada: ' + headerName);
}

function getSheetOrThrow_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(
      'Aba obrigatoria nao encontrada na planilha ' + spreadsheet.getId() + ': ' + sheetName
    );
  }
  return sheet;
}

function normalizeItemForClient_(item) {
  Object.keys(item).forEach(function (key) {
    if (item[key] instanceof Date) {
      item[key] = Utilities.formatDate(
        item[key],
        Session.getScriptTimeZone(),
        key === 'Previsao_Entrega' || key === 'Data_Vencimento' ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss"
      );
    }
  });

  item.Pre_Pago = toBoolean_(item.Pre_Pago);
  item.Comprado = toBoolean_(item.Comprado);
  item.Resolvido = toBoolean_(item.Resolvido);
  item.Entregue = toBoolean_(item.Entregue);
  item.Tem_Vencimento = toBoolean_(item.Tem_Vencimento);
  item.Telefone = sanitizeText_(item.Telefone);
  item.Status = sanitizeText_(item.Status) || deriveMedicationStatus_(item);
  item.Status_Aviso_WhatsApp = sanitizeText_(item.Status_Aviso_WhatsApp);
  item.Preco_Venda = normalizeSalePriceForClient_(item.Preco_Venda);

  if (sanitizeText_(item.Arquivado_Em)) {
    item.Estado_Arquivo = sanitizeText_(item.Estado_Arquivo) || 'Resolvido';
  }

  if (isGeralLikeRecord_(item)) {
    normalizeGeralAliases_(item);
    item.Titulo =
      sanitizeText_(item.Titulo) ||
      sanitizeText_(item.Assunto) ||
      summarizeDescricaoForTitle_(item.Descricao) ||
      'Solicitação geral';
    item.Urgencia = normalizeUrgenciaGeral_(item.Urgencia);
  } else {
    item.Titulo = sanitizeText_(item.Titulo);
    item.Urgencia = normalizeUrgenciaGeral_(item.Urgencia);
  }

  if (sanitizeText_(item.Tipo).toLowerCase() === 'falta') {
    item.Preco_Venda = '';
  }

  var tipoMedNorm = sanitizeText_(item.Tipo).toLowerCase();
  if (tipoMedNorm === 'falta' || tipoMedNorm === 'encomenda') {
    item.Fornecedor_Compra = normalizeFornecedorCompraInput_(item.Fornecedor_Compra);
    item.Codigo_Compra_Fornecedor = normalizeCodigoCompraFornecedorInput_(
      item.Codigo_Compra_Fornecedor,
      item.Fornecedor_Compra
    );
    item.Forma_Recebimento =
      tipoMedNorm === 'encomenda' ? normalizeFormaRecebimento_(item.Forma_Recebimento) : '';
  }
}

function normalizeChecklistItemForClient_(item) {
  if (item.Data_Hora_Check instanceof Date) {
    item.Data_Hora_Check = Utilities.formatDate(
      item.Data_Hora_Check,
      HANDOVER_TIMEZONE,
      "yyyy-MM-dd'T'HH:mm:ss"
    );
  }

  item.Data = normalizeDateKeyCell_(item.Data);
  item.Turno = sanitizeText_(item.Turno) || CHECKLIST_TURNO_MANHA;
  item.Horario_Referencia =
    sanitizeText_(item.Horario_Referencia) || horarioReferenciaForTurno_(item.Turno) || CHECKLIST_HORARIO_REFERENCIA;
  item.Categoria = sanitizeText_(item.Categoria);
  item.Item = sanitizeText_(item.Item);
  item.Descricao = sanitizeText_(item.Descricao);
  item.Status = normalizeChecklistStatus_(item.Status);
  item.Responsavel = sanitizeText_(item.Responsavel);
  item.Observacao = sanitizeText_(item.Observacao);
}

function parseChecklistStatusInput_(status) {
  const normalized = buildChecklistIdentityKey_(status);
  if (normalized === buildChecklistIdentityKey_(CHECKLIST_STATUS.PENDENTE)) {
    return CHECKLIST_STATUS.PENDENTE;
  }
  if (normalized === buildChecklistIdentityKey_(CHECKLIST_STATUS.FEITO)) {
    return CHECKLIST_STATUS.FEITO;
  }
  if (
    normalized === buildChecklistIdentityKey_(CHECKLIST_STATUS.NA) ||
    normalized === 'na' ||
    normalized === 'n/a'
  ) {
    return CHECKLIST_STATUS.NA;
  }

  throw new Error(
    'Status invalido para checklist. Use apenas: ' +
      CHECKLIST_STATUS.PENDENTE +
      ', ' +
      CHECKLIST_STATUS.FEITO +
      ' ou ' +
      CHECKLIST_STATUS.NA +
      '.'
  );
}

function normalizeChecklistStatus_(status) {
  try {
    return parseChecklistStatusInput_(status);
  } catch (error) {
    return CHECKLIST_STATUS.PENDENTE;
  }
}

function normalizeDateKeyCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, HANDOVER_TIMEZONE, 'yyyy-MM-dd');
  }

  const textValue = sanitizeText_(value);
  if (!textValue) {
    return '';
  }

  const parsed = parseDate_(textValue);
  if (!parsed) {
    return '';
  }

  return Utilities.formatDate(parsed, HANDOVER_TIMEZONE, 'yyyy-MM-dd');
}

function isAfterMorningDeadline_(dateKey) {
  const currentDateKey = getChecklistDateKey_();
  if (dateKey < currentDateKey) {
    return true;
  }
  if (dateKey > currentDateKey) {
    return false;
  }

  const hhmmNow = Utilities.formatDate(new Date(), HANDOVER_TIMEZONE, 'HH:mm');
  return hhmmNow >= CHECKLIST_ALERT_HHMM;
}

function buildChecklistIdentityKey_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseDate_(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return null;
    }
    const cloned = new Date(value.getTime());
    cloned.setHours(0, 0, 0, 0);
    return cloned;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function parseSalePrice_(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '';
  }

  if (typeof value === 'number') {
    if (isNaN(value)) {
      throw new Error('Preco de venda invalido. Informe um valor numerico valido.');
    }
    if (value < 0) {
      throw new Error('Preco de venda nao pode ser negativo.');
    }
    return roundCurrency_(value);
  }

  let normalized = String(value).trim();
  normalized = normalized.replace(/\s/g, '').replace(/^R\$/i, '');

  if (!normalized) {
    return '';
  }

  if (normalized.indexOf('-') === 0) {
    throw new Error('Preco de venda nao pode ser negativo.');
  }

  if (normalized.indexOf(',') >= 0 && normalized.indexOf('.') >= 0) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.indexOf(',') >= 0) {
    normalized = normalized.replace(',', '.');
  }

  const parsed = Number(normalized);
  if (isNaN(parsed)) {
    throw new Error('Preco de venda invalido. Informe um valor numerico valido.');
  }
  if (parsed < 0) {
    throw new Error('Preco de venda nao pode ser negativo.');
  }

  return roundCurrency_(parsed);
}

function normalizeSalePriceForClient_(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    if (isNaN(value)) {
      return '';
    }
    return roundCurrency_(value);
  }

  try {
    const parsed = parseSalePrice_(value);
    return parsed === '' ? '' : parsed;
  } catch (error) {
    return sanitizeText_(value);
  }
}

function roundCurrency_(value) {
  return Math.round(Number(value) * 100) / 100;
}

function formatDateForInput_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function sanitizeText_(value) {
  return String(value || '').trim();
}

function normalizeUrgenciaGeral_(value) {
  const normalized = sanitizeText_(value).toLowerCase();
  if (normalized === 'urgente') {
    return 'Urgente';
  }
  return 'Normal';
}

function toBoolean_(value) {
  return value === true || value === 'TRUE' || value === 'true' || value === 'Sim' || value === 'on';
}

function sendOrderEmail_(order) {
  const hasValidPrevisao =
    order.previsaoEntrega instanceof Date && !isNaN(order.previsaoEntrega.getTime());
  const previsao = hasValidPrevisao
    ? Utilities.formatDate(order.previsaoEntrega, Session.getScriptTimeZone(), 'dd/MM/yyyy')
    : 'Nao informada';

  var props = PropertiesService.getScriptProperties();
  var handoverId = sanitizeText_(props.getProperty(HANDOVER_SPREADSHEET_ID_KEY) || '');
  var handoverUrl = handoverId
    ? 'https://docs.google.com/spreadsheets/d/' + handoverId + '/edit'
    : '';
  var comprasUrl = 'https://docs.google.com/spreadsheets/d/1x5l0HcR_9RZGnuxwR8tL_WW7-6pKO3Obamucbnx8cqA/edit?usp=sharing';

  const subject = 'Nova encomenda de medicamento - ' + order.medicamento;

  var plainBody = [
    'Uma nova encomenda de medicamento foi cadastrada.',
    '',
    'ID: ' + order.id,
    'Medicamento: ' + order.medicamento,
    'Cliente: ' + order.cliente,
    'Atendente: ' + order.atendente,
    'Pre-pago: ' + (order.prePago ? 'Sim' : 'Nao'),
    'Previsao de entrega: ' + previsao,
    '',
    'Clique aqui para acessar a lista de compras: ' + comprasUrl,
    handoverUrl ? 'Planilha Handover: ' + handoverUrl : '',
    '',
    'Este email e enviado apenas para registros com Tipo = Encomenda.',
  ].filter(function(l) { return l !== null && l !== undefined; }).join('\n');

  var htmlBody = [
    '<p>Uma nova encomenda de medicamento foi cadastrada.</p>',
    '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">',
    '  <tr><td style="padding:4px 12px 4px 0;color:#666;">ID</td><td style="padding:4px 0;">' + order.id + '</td></tr>',
    '  <tr><td style="padding:4px 12px 4px 0;color:#666;">Medicamento</td><td style="padding:4px 0;font-weight:bold;">' + order.medicamento + '</td></tr>',
    '  <tr><td style="padding:4px 12px 4px 0;color:#666;">Cliente</td><td style="padding:4px 0;">' + order.cliente + '</td></tr>',
    '  <tr><td style="padding:4px 12px 4px 0;color:#666;">Atendente</td><td style="padding:4px 0;">' + order.atendente + '</td></tr>',
    '  <tr><td style="padding:4px 12px 4px 0;color:#666;">Pré-pago</td><td style="padding:4px 0;">' + (order.prePago ? 'Sim' : 'Não') + '</td></tr>',
    '  <tr><td style="padding:4px 12px 4px 0;color:#666;">Previsão de entrega</td><td style="padding:4px 0;">' + previsao + '</td></tr>',
    '</table>',
    '<br>',
    '<p><a href="' + comprasUrl + '" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Clique aqui para acessar a lista de compras</a></p>',
    handoverUrl ? '<p style="font-size:12px;color:#888;">Handover: <a href="' + handoverUrl + '">' + handoverUrl + '</a></p>' : '',
    '<p style="font-size:11px;color:#aaa;">Este email é enviado apenas para registros com Tipo = Encomenda.</p>',
  ].filter(Boolean).join('\n');

  MailApp.sendEmail({
    to: EMAIL_ENCOMENDAS,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
  });
}

function registerWhatsAppAttempt(id, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const sess = requireSessionHandover_(sessionToken);
  var operador = getSessionDisplayName_(sess);

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error('Medicamento nao encontrado para aviso no WhatsApp: ' + id);
  }

  const sheet = location.sheet;
  const item = rowToObjectFromSheetRow_(sheet, location.rowNumber);
  normalizeItemForClient_(item);

  if (!canShowWhatsAppButton_(item)) {
    throw new Error(
      'O aviso no WhatsApp so pode ser usado quando o item estiver Comprado, Entregue ou Resolvido parcialmente.'
    );
  }

  const normalizedPhone = normalizeBrazilPhone_(item.Telefone);
  if (!normalizedPhone) {
    throw new Error(
      'Telefone do cliente vazio ou invalido. Informe DDD + numero, com ou sem mascara.'
    );
  }

  const statusAvisoColumn = getColumnIndex_(sheet, 'Status_Aviso_WhatsApp');
  const dataAvisoColumn = getColumnIndex_(sheet, 'Data_Aviso_WhatsApp');
  const message = buildWhatsAppMessage_(item.Cliente, item.Medicamento, item.Forma_Recebimento);

  sheet.getRange(location.rowNumber, statusAvisoColumn).setValue('Tentativa registrada');
  sheet.getRange(location.rowNumber, dataAvisoColumn).setValue(new Date());
  writeMedicationUltimaAcao_(sheet, location.rowNumber, operador);

  Logger.log('registerWhatsAppAttempt ms=' + (Date.now() - started));
  return {
    success: true,
    whatsAppUrl: 'https://wa.me/' + normalizedPhone + '?text=' + encodeURIComponent(message),
    record: fetchMedicationRecordById_(id),
  };
}

function syncMedicationStatus_(sheet, rowNumber) {
  const compradoColumn = getColumnIndex_(sheet, 'Comprado');
  const entregueColumn = getColumnIndex_(sheet, 'Entregue');
  const statusColumn = getColumnIndex_(sheet, 'Status');
  var curSt = String(sheet.getRange(rowNumber, statusColumn).getValue() || '')
    .trim()
    .toLowerCase();
  const comprado = toBoolean_(sheet.getRange(rowNumber, compradoColumn).getValue());
  const entregue = toBoolean_(sheet.getRange(rowNumber, entregueColumn).getValue());
  if (curSt === 'cancelado' && !comprado && !entregue) {
    return;
  }

  let status = 'Pendente';
  if (entregue) {
    status = 'Entregue';
  } else if (comprado) {
    status = 'Comprado';
  }

  sheet.getRange(rowNumber, statusColumn).setValue(status);
}

function deriveMedicationStatus_(item) {
  var st = sanitizeText_(item.Status).toLowerCase();
  if (st === 'cancelado') {
    return 'Cancelado';
  }
  if (toBoolean_(item.Entregue)) {
    return 'Entregue';
  }
  if (toBoolean_(item.Comprado)) {
    return 'Comprado';
  }
  return 'Pendente';
}

function canShowWhatsAppButton_(item) {
  const status = sanitizeText_(item.Status).toLowerCase();
  if (status === 'cancelado') {
    return false;
  }
  return toBoolean_(item.Comprado) || toBoolean_(item.Entregue) || status === 'resolvido parcialmente';
}

function normalizeBrazilPhone_(phoneValue) {
  const digits = String(phoneValue || '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');

  if (!digits) {
    return '';
  }

  if (digits.indexOf('55') === 0) {
    return digits.length === 12 || digits.length === 13 ? digits : '';
  }

  return digits.length === 10 || digits.length === 11 ? '55' + digits : '';
}

function buildWhatsAppMessageLegacy_(clientName, medicineName) {
  const name = formatNomeClienteMensagem_(clientName) || 'Cliente';
  const medicine = sanitizeText_(medicineName) || 'informado';

  return [
    'Olá, ' + name + '. Seu medicamento ' + medicine + ' chegou na Drogarias Conceito.',
    '',
    'Pode retirar na loja hoje.',
    '',
    'Se preferir, responda esta mensagem que verificamos a melhor forma de entrega.',
  ].join('\n');
}

function buildWhatsAppMessage_(clientName, medicineName, formaRecebimento) {
  const name = formatNomeClienteMensagem_(clientName);
  const greeting = name ? 'Ol\u00e1, ' + name + '!' : 'Ol\u00e1!';
  const medicine = sanitizeText_(medicineName) || 'seu medicamento';
  const forma = normalizeFormaRecebimento_(formaRecebimento);

  if (forma === FORMAS_RECEBIMENTO.RETIRA_LOJA) {
    return [
      greeting +
        ' Passando para avisar que o medicamento ' +
        medicine +
        ' j\u00e1 chegou aqui na Drogarias Conceito e est\u00e1 separado para retirada na loja.',
      '',
      'Pode vir buscar! Responda essa mensagem se precisar de entrega.',
    ].join('\n');
  }

  if (forma === FORMAS_RECEBIMENTO.ENTREGA_ENDERECO) {
    return [
      greeting +
        ' Passando para avisar que o medicamento ' +
        medicine +
        ' j\u00e1 chegou aqui na Drogarias Conceito e est\u00e1 separado para entrega no endere\u00e7o cadastrado.',
      '',
      'Podemos seguir com a entrega?',
    ].join('\n');
  }

  return [
    greeting +
      ' Passando para avisar que o medicamento ' +
      medicine +
      ' j\u00e1 chegou aqui na Drogarias Conceito e est\u00e1 separado para voc\u00ea.',
    '',
    'Voc\u00ea prefere retirar na loja ou quer que a gente combine a entrega? Obrigado!',
  ].join('\n');
}

function writeHeaderRow_(sheet, expectedHeaders, targetColumns) {
  const totalColumns = Math.max(targetColumns, expectedHeaders.length, 1);
  const values = new Array(totalColumns).fill('');

  expectedHeaders.forEach(function (header, index) {
    values[index] = header;
  });

  sheet.getRange(1, 1, 1, totalColumns).setValues([values]);
  sheet.setFrozenRows(1);
}

function trimTrailingEmpty_(values) {
  const copy = values.slice();
  while (copy.length > 0 && !copy[copy.length - 1]) {
    copy.pop();
  }
  return copy;
}

function normalizeHeaderName_(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function canonicalHeaderKey_(header) {
  var base = normalizeHeaderName_(header);
  try {
    if (typeof base.normalize === 'function') {
      return base
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
  } catch (error) {
    Logger.log('canonicalHeaderKey_: ' + error);
  }
  return base;
}

function computeMissingExpectedHeaders_(existingHeaderCells, expectedHeaders) {
  var existsNorm = {};
  existingHeaderCells.forEach(function (label) {
    var trimmed = String(label || '').trim();
    if (trimmed) {
      existsNorm[canonicalHeaderKey_(trimmed)] = true;
    }
  });

  var missing = [];
  expectedHeaders.forEach(function (expected) {
    var key = canonicalHeaderKey_(expected);
    if (!existsNorm[key]) {
      missing.push(expected);
      existsNorm[key] = true;
    }
  });
  return missing;
}

function rowCellsToObject_(headerCells, valueCells) {
  var object = {};
  for (var index = 0; index < headerCells.length; index++) {
    var header = String(headerCells[index] || '').trim();
    if (!header) {
      continue;
    }
    object[header] = valueCells[index];
  }
  return object;
}

function rowToObjectFromSheetRow_(sheet, rowNumber) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var valueCells = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  return rowCellsToObject_(headerCells, valueCells);
}

function lookupNamedValueInMap_(namedValues, sheetHeaderLabel) {
  var rawLabel = String(sheetHeaderLabel || '').trim();
  if (!rawLabel) {
    return '';
  }
  if (Object.prototype.hasOwnProperty.call(namedValues, rawLabel)) {
    return namedValues[rawLabel];
  }
  var target = canonicalHeaderKey_(rawLabel);
  var keys = Object.keys(namedValues);
  for (var i = 0; i < keys.length; i++) {
    if (canonicalHeaderKey_(keys[i]) === target) {
      return namedValues[keys[i]];
    }
  }
  return '';
}

function buildAppendRowValuesFromNamedMap_(sheet, namedValues) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var out = [];
  for (var i = 0; i < headerCells.length; i++) {
    out.push(lookupNamedValueInMap_(namedValues, headerCells[i]));
  }
  return out;
}

function summarizeDescricaoForTitle_(text, maxLen) {
  var s = sanitizeText_(text);
  if (!s) {
    return '';
  }
  var limit = maxLen || 80;
  if (s.length <= limit) {
    return s;
  }
  return s.substring(0, limit - 1) + '\u2026';
}

function normalizeGeralAliases_(item) {
  if (!item) {
    return;
  }
  if (
    (item.Descricao === undefined || item.Descricao === '' || item.Descricao === null) &&
    item['Descrição'] !== undefined &&
    item['Descrição'] !== '' &&
    item['Descrição'] !== null
  ) {
    item.Descricao = item['Descrição'];
  }
}

function isGeralLikeRecord_(item) {
  return !sanitizeText_(item.Medicamento);
}

/**
 * Autoteste local: sem alterar planilha; validar deduplicação de headers e fallbacks de Geral.
 * Executar no editor Apps Script: selecionar função e Rodar.
 */
function selfTestSchemaGeralCompat_() {
  var failures = [];

  var legacyLabels = ['ID', 'Timestamp', 'Autor', 'Descricao', 'Resolvido'];
  var missing = computeMissingExpectedHeaders_(legacyLabels, HEADERS.Geral);
  var expectedMissing = [
    'Titulo',
    'Urgencia',
    'Ultima_Acao_Por',
    'Ultima_Acao_Em',
    'Resolvido_Por',
    'Data_Resolucao',
    'ID_Reaberto_De',
    'Tem_Vencimento',
    'Data_Vencimento',
    'Hora_Vencimento',
  ];
  if (missing.join('|') !== expectedMissing.join('|')) {
    failures.push('missing headers: ' + missing.join(',') + ' (esperado ' + expectedMissing.join(',') + ')');
  }

  if (canonicalHeaderKey_('Descrição') !== canonicalHeaderKey_('Descricao')) {
    failures.push('accent fold Descricao/Descrição');
  }

  var longBody =
    'Um texto bem longo para testar o resumo automático usado quando não há título nem assunto no legacy ';
  longBody = longBody + longBody + longBody;

  var item = {
    Descricao: longBody,
    Medicamento: '',
  };
  normalizeItemForClient_(item);
  if (!item.Titulo || item.Titulo.length > 85) {
    failures.push('titulo fallback por descricao (comprimento)');
  }
  if (item.Urgencia !== 'Normal') {
    failures.push('urgencia default');
  }

  var item2 = {
    Titulo: '',
    Assunto: 'Pedido especial',
    Descricao: 'detalhe',
    Medicamento: '',
  };
  normalizeItemForClient_(item2);
  if (item2.Titulo !== 'Pedido especial') {
    failures.push('titulo via Assunto');
  }

  if (failures.length) {
    Logger.log('selfTestSchemaGeralCompat_ FALHA: ' + failures.join(' | '));
    return false;
  }
  Logger.log('selfTestSchemaGeralCompat_ OK');
  return true;
}
