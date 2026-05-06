const SHEET_NAMES = {
  GERAL: 'Geral',
  MEDICAMENTOS: 'Medicamentos',
  COMPRAS_MEDICAMENTOS: 'Compras_Medicamentos',
  ARQUIVO: 'Arquivo_Resolvidos',
  CHECKLIST: 'Checklist_Turnos',
};

/** Valores exatos da coluna Status_Compra (dropdown na aba operacional). */
const COMPRAS_STATUS_COMPRA = {
  PENDENTE: 'Pendente de compra',
  COMPRADO: 'Comprado',
  NAO_ENCONTRADO: 'Não encontrado',
  CANCELADO: 'Cancelado',
};

const COMPRAS_MENSAGEM_CLIENTE_NAO_ENCONTRADO =
  'Olá! Sobre o medicamento solicitado, verificamos com a compra e no momento não encontramos esse item disponível. Você aceita que a gente procure uma alternativa equivalente ou outra opção para te atender?';

const EMAIL_ENCOMENDAS = 'drogariasconceitocm@gmail.com';
const HANDOVER_SPREADSHEET_ID_KEY = 'HANDOVER_SPREADSHEET_ID';
const HANDOVER_SPREADSHEET_TITLE = 'Handover Drogarias Conceito';
const HANDOVER_TIMEZONE = 'America/Sao_Paulo';

const CHECKLIST_TURNO_MANHA = 'Manhã';
const CHECKLIST_TURNO_TARDE = 'Tarde';
const CHECKLIST_TURNO_NOITE = 'Noite';
const CHECKLIST_HORARIO_REFERENCIA = '07:00';
const CHECKLIST_HORARIO_TARDE = '13:00';
const CHECKLIST_HORARIO_NOITE = '21:00';
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
  ],
  Compras_Medicamentos: [
    'ID_Handover',
    'Data_Solicitacao',
    'Tipo',
    'Medicamento',
    'Atendente',
    'Cliente',
    'Telefone',
    'Previsao_Entrega',
    'Preco_Venda',
    'Pre_Pago',
    'Status_Compra',
    'Data_Compra',
    'Comprado_Por',
    'Observacao_Compra',
    'Mensagem_Cliente',
    'Status_Handover',
    'Ultima_Atualizacao',
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

function doGet() {
  setupSpreadsheet();

  const template = HtmlService.createTemplateFromFile('Index');
  template.initialDataB64 = Utilities.base64EncodeWebSafe(
    JSON.stringify(fetchData()),
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

function getSpreadsheetIdForDebug() {
  const spreadsheet = getSpreadsheet_();
  const spreadsheetId = spreadsheet.getId();
  Logger.log('HANDOVER_SPREADSHEET_ID em uso: ' + spreadsheetId);
  return spreadsheetId;
}

function setupSpreadsheet() {
  const ss = getSpreadsheet_();

  Object.keys(HEADERS).forEach(function (sheetName) {
    const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    if (
      sheetName === SHEET_NAMES.GERAL ||
      sheetName === SHEET_NAMES.ARQUIVO ||
      sheetName === SHEET_NAMES.MEDICAMENTOS ||
      sheetName === SHEET_NAMES.COMPRAS_MEDICAMENTOS
    ) {
      ensureHeadersLegacyAdditive_(sheet, HEADERS[sheetName]);
    } else {
      ensureHeaders_(sheet, HEADERS[sheetName]);
    }
    if (sheetName === SHEET_NAMES.COMPRAS_MEDICAMENTOS) {
      try {
        applyComprasMedicamentosLayout_(sheet);
      } catch (layoutErr) {
        Logger.log('applyComprasMedicamentosLayout_: ' + layoutErr);
      }
    }
  });
}

function getComprasMedicamentosSheet_() {
  setupSpreadsheet();
  return getSheetOrThrow_(getSpreadsheet_(), SHEET_NAMES.COMPRAS_MEDICAMENTOS);
}

function applyComprasMedicamentosLayout_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.Compras_Medicamentos.length, 1);
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  var widths = [180, 130, 90, 220, 120, 160, 120, 110, 90, 80, 150, 110, 140, 260, 320, 120, 130];
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

  return {
    ID_Handover: sanitizeText_(medItem.ID || ''),
    Data_Solicitacao: medItem.Timestamp instanceof Date ? medItem.Timestamp : medItem.Timestamp || '',
    Tipo: tipo,
    Medicamento: sanitizeText_(medItem.Medicamento || ''),
    Atendente: sanitizeText_(medItem.Atendente || ''),
    Cliente: isFalta ? '' : sanitizeText_(medItem.Cliente || ''),
    Telefone: isFalta ? '' : sanitizeText_(medItem.Telefone || ''),
    Previsao_Entrega: medItem.Previsao_Entrega || '',
    Preco_Venda: preco,
    Pre_Pago: prePago,
    Status_Compra: statusCompra,
    Data_Compra: '',
    Comprado_Por: '',
    Observacao_Compra: '',
    Mensagem_Cliente: '',
    Status_Handover: sanitizeText_(medItem.Status || deriveMedicationStatus_(medItem)),
    Ultima_Atualizacao: new Date(),
  };
}

function mirrorComprasMedicamentosRowForMedicamentoId_(handoverId) {
  var id = sanitizeText_(handoverId);
  if (!id) {
    return;
  }
  setupSpreadsheet();
  var medLoc = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!medLoc) {
    return;
  }
  var medItem = rowToObjectFromSheetRow_(medLoc.sheet, medLoc.rowNumber);
  normalizeItemForClient_(medItem);

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
    if (normalizeComprasStatusCompraInput_(existingStatus) === COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO) {
      named.Status_Compra = COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO;
      if (!named.Mensagem_Cliente) {
        named.Mensagem_Cliente = COMPRAS_MENSAGEM_CLIENTE_NAO_ENCONTRADO;
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
      named.Data_Compra = '';
      named.Comprado_Por = '';
    }
    var rowVals = buildAppendRowValuesFromNamedMap_(cSheet, named);
    for (var i = 0; i < rowVals.length; i++) {
      cSheet.getRange(existingRow, i + 1).setValue(rowVals[i]);
    }
  } else {
    if (named.Status_Compra === COMPRAS_STATUS_COMPRA.COMPRADO) {
      named.Data_Compra = new Date();
    }
    cSheet.appendRow(buildAppendRowValuesFromNamedMap_(cSheet, named));
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
 * Parte 1: diagnóstico por ID_Handover — localiza Compras e Medicamentos; não aplica regra de status.
 * MANUAL: pode ser executada no editor com um UUID de teste.
 */
function processarStatusCompraPorIdHandover_(idHandover) {
  var id = sanitizeText_(idHandover);
  if (!id) {
    Logger.log('processarStatusCompraPorIdHandover_: id vazio');
    return;
  }
  setupSpreadsheet();
  var cSheet = getComprasMedicamentosSheet_();
  var rCompras = findComprasRowByHandoverId_(cSheet, id);
  var stCompra = '';
  if (rCompras) {
    var oC = rowToObjectFromSheetRow_(cSheet, rCompras);
    stCompra = String(oC.Status_Compra != null ? oC.Status_Compra : '').trim();
  }
  var medLoc = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  Logger.log(
    'processarStatusCompraPorIdHandover_: id=' +
      id +
      ' compras_encontrado=' +
      (rCompras ? 'SIM' : 'NAO') +
      ' Status_Compra=' +
      stCompra +
      ' medicamentos_encontrado=' +
      (medLoc ? 'SIM' : 'NAO')
  );
}

/**
 * Gatilho instalável e onEdit simples: entrada única para edições na aba Compras_Medicamentos.
 * Parte 1: valida contexto, registra log seguro e delega a processarStatusCompraPorIdHandover_ (somente diagnóstico).
 */
function handleComprasMedicamentosEdit_(e) {
  if (!e || !e.range) {
    return;
  }
  var sheet = e.range.getSheet();
  var parentId = sheet.getParent().getId();
  var officialId;
  try {
    officialId = getSpreadsheet_().getId();
  } catch (ex) {
    Logger.log('handleComprasMedicamentosEdit_: planilha ' + ex);
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
  if (!idHandover) {
    Logger.log('handleComprasMedicamentosEdit_: ID_Handover ausente');
    return;
  }
  processarStatusCompraPorIdHandover_(idHandover);
}

/**
 * MANUAL: instalar gatilho onEdit instalável apontando para handleComprasMedicamentosEdit_.
 * Remove gatilhos duplicados do mesmo handler antes de criar.
 */
function instalarTriggerComprasMedicamentos_() {
  var ss = getSpreadsheet_();
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
 * Regra completa de Status_Compra → Medicamentos (Parte 2+).
 * Não invocar de onEdit na Parte 1 — mantida para reutilização futura.
 */
function handleComprasMedicamentosStatusEdit_(sheet, rowNumber, newValue, oldValue) {
  var colStatus = getColumnIndex_(sheet, 'Status_Compra');
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

  var medLoc = findRowById_(SHEET_NAMES.MEDICAMENTOS, handoverId);
  if (!medLoc) {
    Logger.log('handleComprasMedicamentosStatusEdit_: medicamento nao encontrado id=' + handoverId);
    return;
  }

  var medBase = rowToObjectFromSheetRow_(medLoc.sheet, medLoc.rowNumber);
  normalizeItemForClient_(medBase);
  var medStatusLow = sanitizeText_(medBase.Status).toLowerCase();
  if (medStatusLow === 'cancelado' && statusNew !== COMPRAS_STATUS_COMPRA.CANCELADO) {
    Logger.log('handleComprasMedicamentosStatusEdit_: item ja Cancelado no Handover id=' + handoverId);
    return;
  }

  var now = new Date();
  var colUltima = getColumnIndex_(sheet, 'Ultima_Atualizacao');
  var colStatusH = getColumnIndex_(sheet, 'Status_Handover');
  var colMsg = getColumnIndex_(sheet, 'Mensagem_Cliente');
  var colObs = getColumnIndex_(sheet, 'Observacao_Compra');
  var colDataCompra = getColumnIndex_(sheet, 'Data_Compra');
  var colCompradoPor = getColumnIndex_(sheet, 'Comprado_Por');
  var obs = sanitizeText_(rowObj.Observacao_Compra || '');
  var por = getEditorEmailForSheetHook_();

  if (statusNew === COMPRAS_STATUS_COMPRA.PENDENTE) {
    sheet.getRange(rowNumber, colUltima).setValue(now);
    var medPeek = rowToObjectFromSheetRow_(medLoc.sheet, medLoc.rowNumber);
    normalizeItemForClient_(medPeek);
    sheet.getRange(rowNumber, colStatusH).setValue(sanitizeText_(medPeek.Status || ''));
    return;
  }

  if (statusNew === COMPRAS_STATUS_COMPRA.COMPRADO) {
    if (medStatusLow === 'cancelado') {
      return;
    }
    medLoc.sheet.getRange(medLoc.rowNumber, getColumnIndex_(medLoc.sheet, 'Comprado')).setValue(true);
    syncMedicationStatus_(medLoc.sheet, medLoc.rowNumber);
    var medAfter = rowToObjectFromSheetRow_(medLoc.sheet, medLoc.rowNumber);
    normalizeItemForClient_(medAfter);
    sheet.getRange(rowNumber, colDataCompra).setValue(now);
    if (por) {
      sheet.getRange(rowNumber, colCompradoPor).setValue(por);
    }
    sheet.getRange(rowNumber, colStatusH).setValue(sanitizeText_(medAfter.Status || ''));
    sheet.getRange(rowNumber, colUltima).setValue(now);
    return;
  }

  if (statusNew === COMPRAS_STATUS_COMPRA.NAO_ENCONTRADO) {
    sheet.getRange(rowNumber, colMsg).setValue(COMPRAS_MENSAGEM_CLIENTE_NAO_ENCONTRADO);
    sheet.getRange(rowNumber, colUltima).setValue(now);
    var medN = rowToObjectFromSheetRow_(medLoc.sheet, medLoc.rowNumber);
    normalizeItemForClient_(medN);
    sheet.getRange(rowNumber, colStatusH).setValue(sanitizeText_(medN.Status || ''));
    return;
  }

  if (statusNew === COMPRAS_STATUS_COMPRA.CANCELADO) {
    medLoc.sheet.getRange(medLoc.rowNumber, getColumnIndex_(medLoc.sheet, 'Comprado')).setValue(false);
    medLoc.sheet.getRange(medLoc.rowNumber, getColumnIndex_(medLoc.sheet, 'Entregue')).setValue(false);
    medLoc.sheet.getRange(medLoc.rowNumber, getColumnIndex_(medLoc.sheet, 'Status')).setValue('Cancelado');
    sheet.getRange(rowNumber, colStatusH).setValue('Cancelado');
    sheet.getRange(rowNumber, colUltima).setValue(now);
    if (obs) {
      sheet.getRange(rowNumber, colObs).setValue(obs);
    }
  }
}

function getChecklistTemplate_() {
  return [
    {
      categoria: 'Estrutura e Ambiente',
      item: 'Climatização',
      descricao: 'Ligar ar-condicionado e cortina de ar',
    },
    {
      categoria: 'Estrutura e Ambiente',
      item: 'Iluminação',
      descricao: 'Acender luzes do salão, fachada e tótens',
    },
    {
      categoria: 'Estrutura e Ambiente',
      item: 'Som ambiente',
      descricao: 'Ligar rádio interna em volume agradável',
    },
    {
      categoria: 'Estrutura e Ambiente',
      item: 'Fachada',
      descricao: 'Verificar limpeza da calçada e se há obstruções na entrada',
    },
    {
      categoria: 'Sistemas e Operação',
      item: 'Servidor',
      descricao: 'Ligar e verificar se o banco de dados carregou corretamente',
    },
    {
      categoria: 'Sistemas e Operação',
      item: 'PDVs e Balcão',
      descricao: 'Ligar computadores, monitores e impressoras térmicas',
    },
    {
      categoria: 'Sistemas e Operação',
      item: 'Troco',
      descricao: 'Conferir o kit de troco',
    },
    {
      categoria: 'Sistemas e Operação',
      item: 'Caixa',
      descricao: 'Abrir e conferir',
    },
    {
      categoria: 'Sistemas e Operação',
      item: 'Handover',
      descricao:
        'Checar mensagens do turno anterior, limpar o que foi resolvido e programar entregas do dia de medicamentos encomendados',
    },
    {
      categoria: 'Sistemas e Operação',
      item: 'Internet e TEF',
      descricao: 'Testar conexão e máquinas de cartão',
    },
    {
      categoria: 'Sistemas e Operação',
      item: 'Telefones/WhatsApp',
      descricao: 'Verificar bateria, conexão e mensagens recebidas enquanto a loja estava fechada',
    },
    {
      categoria: 'Higiene e Organização',
      item: 'Pisos e Prateleiras',
      descricao: 'Conferir limpeza geral, sem pó ou manchas',
    },
    {
      categoria: 'Higiene e Organização',
      item: 'Lixeiras',
      descricao: 'Verificar se todas estão com sacos novos',
    },
    {
      categoria: 'Higiene e Organização',
      item: 'Banheiros e Pias',
      descricao: 'Repor sabonete líquido e papel toalha',
    },
    {
      categoria: 'Higiene e Organização',
      item: 'Álcool em gel',
      descricao: 'Verificar disponibilidade no balcão',
    },
    {
      categoria: 'Logística de Entrega',
      item: 'Moto',
      descricao: 'Usar sistema para conferir condições da moto junto com entregador',
    },
    {
      categoria: 'Logística de Entrega',
      item: 'Baú/Mochila',
      descricao: 'Verificar limpeza interna e se está seco',
    },
    {
      categoria: 'Logística de Entrega',
      item: 'Maquineta móvel',
      descricao: 'Checar bateria da máquina de cartão de rua',
    },
    {
      categoria: 'Balcão e Medicamentos',
      item: 'Termolábeis',
      descricao: 'Conferir e anotar temperatura da geladeira de vacinas/insulinas',
    },
    {
      categoria: 'Balcão e Medicamentos',
      item: 'Psicotrópicos',
      descricao: 'Verificar se armário controlado está fechado e chave acessível',
    },
    {
      categoria: 'Balcão e Medicamentos',
      item: 'Reposição',
      descricao: 'Verificar buracos nas prateleiras de curva A para abastecimento imediato',
    },
  ];
}

function getChecklistDateKey_(date) {
  return Utilities.formatDate(date || new Date(), HANDOVER_TIMEZONE, 'yyyy-MM-dd');
}

function getChecklistTemplateOrderMap_() {
  return getChecklistTemplate_().reduce(function (orderMap, checklistItem, index) {
    orderMap[buildChecklistIdentityKey_(checklistItem.item)] = index;
    return orderMap;
  }, {});
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
  const template = getChecklistTemplate_();
  const dateKey = getChecklistDateKey_();
  const turno = sanitizeChecklistTurno_(turnoParam);
  const horarioRef = horarioReferenciaForTurno_(turno);
  const identityPrefix = buildChecklistIdentityKey_(dateKey) + '|' + buildChecklistIdentityKey_(turno);

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

  const rowsToInsert = [];
  template.forEach(function (templateItem) {
    const itemKey =
      identityPrefix + '|' + buildChecklistIdentityKey_(sanitizeText_(templateItem.item));
    if (existingKeys.has(itemKey)) {
      return;
    }

    rowsToInsert.push([
      Utilities.getUuid(),
      dateKey,
      turno,
      horarioRef,
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
  const orderMap = getChecklistTemplateOrderMap_();

  return values
    .map(function (row) {
      const item = rowCellsToObject_(headerCells, row);
      normalizeChecklistItemForClient_(item);
      return item;
    })
    .filter(function (item) {
      return item.Data === filterDateKey && item.Turno === filterTurno;
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

function updateChecklistItemStatus(id, status, responsavel) {
  const started = Date.now();
  setupSpreadsheet();

  const location = findRowById_(SHEET_NAMES.CHECKLIST, id);
  if (!location) {
    throw new Error('Item de checklist nao encontrado: ' + id);
  }

  const normalizedStatus = parseChecklistStatusInput_(status);
  const responsavelValue = sanitizeText_(responsavel);
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

function updateChecklistItemObservation(id, observacao, responsavel) {
  const started = Date.now();
  setupSpreadsheet();

  const location = findRowById_(SHEET_NAMES.CHECKLIST, id);
  if (!location) {
    throw new Error('Item de checklist nao encontrado: ' + id);
  }

  const observacaoColumn = getColumnIndex_(location.sheet, 'Observacao');
  const responsavelColumn = getColumnIndex_(location.sheet, 'Responsavel');

  location.sheet.getRange(location.rowNumber, observacaoColumn).setValue(sanitizeText_(observacao));
  location.sheet
    .getRange(location.rowNumber, responsavelColumn)
    .setValue(sanitizeText_(responsavel));

  const updatedItem = fetchChecklistItemById_(id);
  Logger.log('updateChecklistItemObservation ms=' + (Date.now() - started));
  return {
    success: true,
    checklistItem: updatedItem,
    checklistSummary: checklistSummaryForItemContext_(updatedItem),
  };
}

function generateTodayMorningChecklist() {
  return generateChecklistForTurno(CHECKLIST_TURNO_MANHA);
}

function generateChecklistForTurno(turno) {
  setupSpreadsheet();
  ensureTodayChecklistForTurno_(turno);
  return {
    success: true,
    checklistTurno: buildChecklistTurnoPayload_(turno),
  };
}

function refreshDashboardBundle(checklistTurnoOpt) {
  setupSpreadsheet();
  var turno = sanitizeChecklistTurno_(checklistTurnoOpt || inferDefaultChecklistTurno_());
  return {
    geral: fetchSheetItems_(SHEET_NAMES.GERAL).filter(function (item) {
      return !item.Resolvido;
    }),
    medicamentos: fetchSheetItems_(SHEET_NAMES.MEDICAMENTOS),
    checklistTurno: buildChecklistTurnoPayload_(turno),
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

function saveData(tab, data, operador) {
  const started = Date.now();
  setupSpreadsheet();

  if (tab !== SHEET_NAMES.GERAL && tab !== SHEET_NAMES.MEDICAMENTOS) {
    throw new Error('Aba invalida: ' + tab);
  }

  const ss = getSpreadsheet_();
  const sheet = getSheetOrThrow_(ss, tab);
  const id = Utilities.getUuid();
  const timestamp = new Date();
  const op = sanitizeText_(operador);
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
      Autor: sanitizeText_(data.autor),
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

    if (isFalta) {
      if (!sanitizeText_(data.medicamento)) {
        throw new Error('Informe o medicamento.');
      }
      if (!sanitizeText_(data.atendente)) {
        throw new Error('Informe o atendente.');
      }
      var previsaoFalta = parseDate_(data.previsaoEntrega);
      const rowValuesFalta = buildRowFromHeaders_(HEADERS.Medicamentos, {
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
      throw new Error('Previsao_Entrega invalida. Use o formato YYYY-MM-DD com data real.');
    }
    const precoVenda = parseSalePrice_(data.precoVenda);

    const rowValues = buildRowFromHeaders_(HEADERS.Medicamentos, {
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
    medicamentos: fetchSheetItems_(SHEET_NAMES.MEDICAMENTOS),
    checklistTurno: buildChecklistTurnoPayload_(inferDefaultChecklistTurno_()),
  };
}

function fetchHistoricoResolvidos(limit) {
  const started = Date.now();
  setupSpreadsheet();

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

  Logger.log('fetchHistoricoResolvidos ms=' + (Date.now() - started));
  return {
    success: true,
    historico: historico,
  };
}

function markAsPurchased(id, operador) {
  const started = Date.now();
  setupSpreadsheet();

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
  writeMedicationUltimaAcao_(location.sheet, location.rowNumber, operador);
  try {
    mirrorComprasMedicamentosRowForMedicamentoId_(id);
  } catch (ce) {
    Logger.log('markAsPurchased mirror compras: ' + ce);
  }

  Logger.log('markAsPurchased ms=' + (Date.now() - started));
  return {
    success: true,
    record: fetchMedicationRecordById_(id),
  };
}

function markAsDelivered(id, operador) {
  const started = Date.now();
  setupSpreadsheet();

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
  writeMedicationUltimaAcao_(location.sheet, location.rowNumber, operador);
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

function revertMedicationToPending(id, operador, motivo) {
  const started = Date.now();
  setupSpreadsheet();

  var ctx = '[revertMedicationToPending] ID=' + sanitizeText_(id) + ' acao=reverter_medicamento ';
  var op = sanitizeText_(operador);
  if (!op) {
    throw new Error(ctx + 'Operador obrigatorio.');
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
    mirrorComprasMedicamentosRowForMedicamentoId_(id);
  } catch (ce3) {
    Logger.log('revertMedicationToPending mirror compras: ' + ce3);
  }

  Logger.log('revertMedicationToPending ms=' + (Date.now() - started));
  return {
    success: true,
    record: fetchMedicationRecordById_(id),
  };
}

function markAsResolved(id, operador) {
  const started = Date.now();
  var ctx =
    '[markAsResolved] ID=' +
    sanitizeText_(id) +
    ' aba=' +
    SHEET_NAMES.GERAL +
    ' acao=arquivar status=';
  try {
    setupSpreadsheet();

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

function reopenHistoricoItem(archivedRecordId, operador, motivo) {
  const started = Date.now();
  var rid = sanitizeText_(archivedRecordId);
  var op = sanitizeText_(operador);
  var mot = sanitizeText_(motivo);
  var ctx = '[reopenHistoricoItem] ID=' + rid + ' aba=' + SHEET_NAMES.ARQUIVO + ' acao=reabrir ';
  if (!rid) {
    throw new Error(ctx + 'Registro sem ID.');
  }
  if (!op) {
    throw new Error(ctx + 'Operador obrigatorio.');
  }

  try {
    setupSpreadsheet();

    var loc = findRowById_(SHEET_NAMES.ARQUIVO, rid);
    if (!loc) {
      throw new Error('Linha do arquivo nao encontrada para este ID.');
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
        Autor: sanitizeText_(archived.Autor),
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
    throw new Error(ctx + 'erro mensagem=' + error.message);
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

  saveData(SHEET_NAMES.GERAL, {
    autor: 'Maria',
    titulo: 'Conferencia de caixa',
    urgencia: 'Normal',
    descricao: 'Conferir divergencia no caixa do turno da tarde.',
  });

  saveData(SHEET_NAMES.MEDICAMENTOS, {
    tipo: 'Encomenda',
    medicamento: 'Losartana 50mg',
    prePago: true,
    cliente: 'Joao Silva',
    telefone: '(11) 91234-5678',
    atendente: 'Ana',
    previsaoEntrega: formatDateForInput_(new Date()),
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  saveData(SHEET_NAMES.MEDICAMENTOS, {
    tipo: 'Falta',
    medicamento: 'Dipirona gotas',
    prePago: false,
    cliente: 'Estoque loja',
    telefone: '(11) 3333-4444',
    atendente: 'Carlos',
    previsaoEntrega: formatDateForInput_(tomorrow),
  });
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
    Estado_Arquivo: 'Resolvido',
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

  var idCol = getIdColumnIndexSafe_(sheet);
  const ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();

  for (var index = 0; index < ids.length; index++) {
    if (ids[index][0] === id) {
      return {
        sheet: sheet,
        rowNumber: index + 2,
      };
    }
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
  item.Horario_Referencia = sanitizeText_(item.Horario_Referencia) || CHECKLIST_HORARIO_REFERENCIA;
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

  const subject = 'Nova encomenda de medicamento - ' + order.medicamento;
  const body = [
    'Uma nova encomenda de medicamento foi cadastrada.',
    '',
    'ID: ' + order.id,
    'Medicamento: ' + order.medicamento,
    'Cliente: ' + order.cliente,
    'Atendente: ' + order.atendente,
    'Pre-pago: ' + (order.prePago ? 'Sim' : 'Nao'),
    'Previsao de entrega: ' + previsao,
    '',
    'Este email e enviado apenas para registros com Tipo = Encomenda.',
  ].join('\n');

  MailApp.sendEmail(EMAIL_ENCOMENDAS, subject, body);
}

function registerWhatsAppAttempt(id, operador) {
  const started = Date.now();
  setupSpreadsheet();

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
  const message = buildWhatsAppMessage_(item.Cliente, item.Medicamento);

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
  if (curSt === 'cancelado') {
    return;
  }
  const comprado = toBoolean_(sheet.getRange(rowNumber, compradoColumn).getValue());
  const entregue = toBoolean_(sheet.getRange(rowNumber, entregueColumn).getValue());

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

function buildWhatsAppMessage_(clientName, medicineName) {
  const name = sanitizeText_(clientName) || 'cliente';
  const medicine = sanitizeText_(medicineName) || 'informado';

  return [
    'Olá, ' + name + '. Seu medicamento ' + medicine + ' chegou na Drogarias Conceito.',
    '',
    'Pode retirar na loja hoje.',
    '',
    'Se preferir, responda esta mensagem que verificamos a melhor forma de entrega.',
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
