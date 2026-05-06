const SHEET_NAMES = {
  GERAL: 'Geral',
  MEDICAMENTOS: 'Medicamentos',
  ARQUIVO: 'Arquivo_Resolvidos',
  CHECKLIST: 'Checklist_Turnos',
  USUARIOS: 'Usuarios_Handover',
};

const EMAIL_ENCOMENDAS = 'drogariasconceitocm@gmail.com';
const HANDOVER_SPREADSHEET_ID_KEY = 'HANDOVER_SPREADSHEET_ID';
const HANDOVER_SPREADSHEET_TITLE = 'Handover Drogarias Conceito';
const HANDOVER_TIMEZONE = 'America/Sao_Paulo';

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
];

const HANDOVER_AUTH_SALT_KEY = 'HANDOVER_PIN_SALT_V1';
const HANDOVER_SESSION_TTL_SECONDS = 21600; // CacheService max TTL (~6h)
const HANDOVER_SESSION_CACHE_PREFIX = 'handover_sess_v1:';

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
    'Excluido',
    'Excluido_Por',
    'Data_Exclusao',
    'Motivo_Exclusao',
    'Excluido_Por_Perfil',
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
    'Excluido',
    'Excluido_Por',
    'Data_Exclusao',
    'Motivo_Exclusao',
    'Excluido_Por_Perfil',
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
  Usuarios_Handover: HANDOVER_USERS_HEADERS,
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
      sheetName === SHEET_NAMES.USUARIOS
    ) {
      ensureHeadersLegacyAdditive_(sheet, HEADERS[sheetName]);
    } else {
      ensureHeaders_(sheet, HEADERS[sheetName]);
    }
  });
}

function ensureUsuariosHandoverSheet_() {
  setupSpreadsheet();
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAMES.USUARIOS) || ss.insertSheet(SHEET_NAMES.USUARIOS);
  ensureHeadersLegacyAdditive_(sheet, HANDOVER_USERS_HEADERS);
  return sheet;
}

function normalizeUsuarioHandover_(usuario) {
  return String(usuario || '')
    .trim()
    .toLowerCase();
}

function usuariosHandoverHasAnyPinHash_() {
  try {
    var sheet = ensureUsuariosHandoverSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return false;
    }
    var colHash = getColumnIndex_(sheet, 'Pin_Hash');
    var vals = sheet.getRange(2, colHash, lastRow - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0] || '').trim() !== '') {
        return true;
      }
    }
  } catch (e) {
    Logger.log('usuariosHandoverHasAnyPinHash_: ' + e);
  }
  return false;
}

/**
 * Salt persistido em ScriptProperties (HANDOVER_PIN_SALT_V1).
 * Cria salt apenas se ainda não existir e se não houver Pin_Hash na planilha
 * (evita invalidar hashes após limpeza de propriedades ou deploy).
 */
function getHandoverPinSalt_() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(HANDOVER_AUTH_SALT_KEY);
  if (existing) {
    return existing;
  }
  if (usuariosHandoverHasAnyPinHash_()) {
    Logger.log(
      'getHandoverPinSalt_: salt_existe=NAO; ha Pin_Hash na aba Usuarios_Handover — nao sera criado salt novo. Restaure HANDOVER_PIN_SALT_V1 nas propriedades do script ou use resetPinUsuarioHandover_.'
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

function getOrCreateAuthSalt_() {
  return getHandoverPinSalt_();
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
  var uname = normalizeUsuarioHandover_(usuario);
  if (!uname) {
    return null;
  }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return null;
  }
  var colUsuario = getColumnIndex_(sheet, 'Usuario');
  var values = sheet.getRange(2, colUsuario, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    var cell = normalizeUsuarioHandover_(values[i][0]);
    if (cell === uname) {
      return 2 + i;
    }
  }
  return null;
}

function getUsuarioRecordByRow_(sheet, rowNumber) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headerCells = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  var obj = rowCellsToObject_(headerCells, row);
  return obj;
}

function isUsuarioAtivoPlanilha_(ativoVal) {
  if (ativoVal === false) {
    return false;
  }
  var s = String(ativoVal == null ? '' : ativoVal).trim();
  if (s === '') {
    return true;
  }
  var low = s.toLowerCase();
  if (low === 'falso' || low === 'false' || low === 'nao' || low === 'não' || low === 'inativo' || low === 'no' || s === '0') {
    return false;
  }
  if (low === 'verdadeiro') {
    return true;
  }
  return (
    ativoVal === true ||
    low === 'true' ||
    low === 'sim' ||
    low === 'ativo' ||
    low === 'yes' ||
    low === 's' ||
    s === '1' ||
    toBoolean_(ativoVal)
  );
}

function validateUsuarioLogin_(usuario, pin) {
  var sheet = ensureUsuariosHandoverSheet_();
  var rowNumber = findUsuarioRowByUsername_(sheet, usuario);
  if (!rowNumber) {
    Logger.log('validateUsuarioLogin_: usuario nao encontrado u=' + normalizeUsuarioHandover_(usuario));
    return { ok: false, message: 'Usuário ou PIN inválido.' };
  }
  var record = getUsuarioRecordByRow_(sheet, rowNumber);
  if (!isUsuarioAtivoPlanilha_(record.Ativo)) {
    Logger.log('validateUsuarioLogin_: inativo u=' + normalizeUsuarioHandover_(usuario));
    return { ok: false, message: 'Usuário inativo.' };
  }
  var expected = String(record.Pin_Hash || '').trim();
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
      id: sanitizeText_(record.ID || ''),
      nome: sanitizeText_(record.Nome || record.Usuario || ''),
      usuario: normalizeUsuarioHandover_(record.Usuario || usuario),
      perfil: normalizePerfilHandover_(record.Perfil || 'operador'),
    };
  }
  var pinLen = String(String(pin || '').trim()).length;
  var expPfx = expected.slice(0, 6);
  var canPfx = candidate.slice(0, 6);
  Logger.log(
    'validateUsuarioLogin_: pin nao confere u=' +
      normalizeUsuarioHandover_(usuario) +
      ' pin_len=' +
      pinLen +
      ' hash_bateu=NAO exp_pfx=' +
      expPfx +
      ' cand_pfx=' +
      canPfx
  );
  return { ok: false, message: 'Usuário ou PIN inválido.' };
}

/**
 * MANUAL / bootstrap administrativo — executar somente no editor Apps Script (não expor na UI).
 * Atualiza apenas Pin_Hash; mantém Nome, Perfil, Ativo. PIN temporário só no Logger.
 */
function resetPinUsuarioHandover_(usuario) {
  setupSpreadsheet();
  var u = normalizeUsuarioHandover_(usuario);
  if (!u) {
    Logger.log('resetPinUsuarioHandover_: usuario vazio');
    return;
  }
  if (!getHandoverPinSalt_()) {
    Logger.log('resetPinUsuarioHandover_: impossivel — salt ausente e nao sera recriado automaticamente com Pin_Hash existente.');
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
  var col = getColumnIndex_(sheet, 'Pin_Hash');
  sheet.getRange(row, col).setValue(h);
  var rec = getUsuarioRecordByRow_(sheet, row);
  var nome = sanitizeText_(rec.Nome || rec.Usuario || '');
  var perf = normalizePerfilHandover_(rec.Perfil || '');
  var check = validateUsuarioLogin_(u, pin);
  Logger.log(
    'resetPinUsuarioHandover_: usuario=' +
      u +
      ' nome=' +
      nome +
      ' perfil=' +
      perf +
      ' pin_temp=' +
      pin +
      ' validacao_interna_pin_novo=' +
      (check.ok ? 'OK' : 'FALHA')
  );
}

/** MANUAL / bootstrap — somente editor Apps Script. Reseta PIN do usuario carlos. */
function resetPinCarlosHandover_() {
  resetPinUsuarioHandover_('carlos');
}

/** MANUAL — somente editor. Instruções; validação interna ocorre em resetPinCarlosHandover_. */
function selfTestLoginCarlosHandover_() {
  Logger.log(
    'selfTestLoginCarlosHandover_: execute resetPinCarlosHandover_() no editor; o Log mostra pin_temp e validacao_interna_pin_novo=OK quando o fluxo de hash/salt esta consistente.'
  );
}

/**
 * MANUAL — somente editor Apps Script (Run). Diagnostico de hash sem gravar PIN na planilha.
 * Nao loga o PIN; apenas comprimento e prefixos curtos de hash.
 */
function debugCheckPinUsuarioHandover_(usuario, pin) {
  setupSpreadsheet();
  var u = normalizeUsuarioHandover_(usuario);
  var p = String(pin || '').trim();
  if (!u || !p) {
    Logger.log('debugCheckPinUsuarioHandover_: informe usuario e PIN na execucao (parametros da funcao).');
    return;
  }
  var sheet = ensureUsuariosHandoverSheet_();
  var row = findUsuarioRowByUsername_(sheet, u);
  if (!row) {
    Logger.log('debugCheckPinUsuarioHandover_: usuario nao encontrado u=' + u);
    return;
  }
  var record = getUsuarioRecordByRow_(sheet, row);
  var expected = String(record.Pin_Hash || '').trim();
  var candidate = hashPin_(u, p);
  var match = !!(candidate && expected && candidate === expected);
  Logger.log(
    'debugCheckPinUsuarioHandover_: u=' +
      u +
      ' pin_len=' +
      p.length +
      ' hash_bateu=' +
      (match ? 'SIM' : 'NAO') +
      ' exp_pfx=' +
      (expected ? expected.slice(0, 6) : '') +
      ' cand_pfx=' +
      (candidate ? candidate.slice(0, 6) : '')
  );
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
    perfil: sanitizeText_(perfil || 'operador'),
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
  if (!tok) {
    return null;
  }
  var cached = CacheService.getScriptCache().get(HANDOVER_SESSION_CACHE_PREFIX + tok);
  if (!cached) {
    return null;
  }
  try {
    var obj = JSON.parse(cached);
    if (!obj || !obj.usuario) {
      return null;
    }
    if (obj.expAtMs && new Date().getTime() > obj.expAtMs) {
      return null;
    }
    return obj;
  } catch (e) {
    return null;
  }
}

function encerrarSessaoHandover_(sessionToken) {
  var tok = String(sessionToken || '').trim();
  if (!tok) {
    return { success: true };
  }
  CacheService.getScriptCache().remove(HANDOVER_SESSION_CACHE_PREFIX + tok);
  return { success: true };
}

function resolveOperadorFromSessionOrThrow_(sessionToken) {
  var sess = validarSessaoHandover_(sessionToken);
  if (!sess) {
    throw new Error('Sessão inválida ou expirada. Faça login novamente.');
  }
  var nome = sanitizeText_(sess.nome || sess.usuario || '');
  var usuario = normalizeUsuarioHandover_(sess.usuario || '');
  return nome ? nome + ' (' + usuario + ')' : usuario;
}

function requireSessionHandover_(sessionToken) {
  var sess = validarSessaoHandover_(sessionToken);
  if (!sess) {
    throw new Error('Sessão inválida ou expirada. Faça login novamente.');
  }
  return sess;
}

function normalizePerfilHandover_(perfil) {
  return String(perfil || '')
    .trim()
    .toLowerCase();
}

function canDeleteHandoverBySession_(sess) {
  var p = normalizePerfilHandover_(sess && sess.perfil);
  return p === 'admin' || p === 'gerente';
}

function requireDeleteRoleOrThrow_(sess) {
  if (!canDeleteHandoverBySession_(sess)) {
    throw new Error('Apenas admin ou gerente podem excluir itens.');
  }
}

function isRowExcluded_(item) {
  return toBoolean_(item && item.Excluido);
}

function loginHandover(usuario, pin) {
  try {
    setupSpreadsheet();
    var u = normalizeUsuarioHandover_(usuario);
    if (!u) {
      return { success: false, message: 'Informe o usuário.' };
    }
    var result = validateUsuarioLogin_(u, pin);
    if (!result.ok) {
      return { success: false, message: result.message || 'Usuário ou PIN inválido.' };
    }
    var sess = criarSessaoHandover_(result.usuario, result.nome, result.perfil);

    try {
      var sheet = ensureUsuariosHandoverSheet_();
      sheet.getRange(result.rowNumber, getColumnIndex_(sheet, 'Ultimo_Login_Em')).setValue(new Date());
    } catch (e) {
      Logger.log('loginHandover Ultimo_Login_Em: ' + e);
    }

    var nome = sanitizeText_(result.nome || result.usuario || '');
    var perfil = normalizePerfilHandover_(result.perfil || 'operador');
    Logger.log(
      'loginHandover ok u=' + result.usuario + ' perfil=' + perfil + ' token_len=' + String(sess.token || '').length
    );

    return {
      success: true,
      token: String(sess.token),
      usuario: result.usuario,
      nome: nome,
      perfil: perfil,
      displayName: nome,
    };
  } catch (e) {
    Logger.log('loginHandover excecao: ' + e);
    return { success: false, message: 'Não foi possível entrar. Tente novamente.' };
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
      var pinPresent = String(obj.Pin_Hash || '').trim().length > 0;
      var perf = normalizePerfilHandover_(obj.Perfil || '');
      var avRaw = String(obj.Ativo == null ? '' : obj.Ativo).trim();
      var ativoOk = isUsuarioAtivoPlanilha_(obj.Ativo);
      Logger.log(
        'debugAuth row=' + r + ' usuario=' + u + ' perfil=' + perf + ' ativo=' + ativoOk + ' ativo_raw=' + avRaw + ' pin_hash_present=' + pinPresent
      );
    }
    return { ok: true, rows: lastRow - 1 };
  } catch (e) {
    Logger.log('debugAuthUsuariosHandover_: ' + e);
    return { ok: false };
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
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h || '').trim();
    });
    var missing = HANDOVER_USERS_HEADERS.filter(function (h) {
      return headers.indexOf(h) < 0;
    });
    Logger.log('selfTestAuthHandover_: headers_missing=' + (missing.length ? missing.join(',') : 'none'));

    var lastRow = sheet.getLastRow();
    var adminAtivos = 0;
    if (lastRow > 1) {
      var headerCells2 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      for (var r = 2; r <= lastRow; r++) {
        var row2 = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
        var obj2 = rowCellsToObject_(headerCells2, row2);
        if (normalizePerfilHandover_(obj2.Perfil) === 'admin' && isUsuarioAtivoPlanilha_(obj2.Ativo)) {
          adminAtivos++;
        }
      }
    }
    Logger.log('selfTestAuthHandover_: admin_ativo_count=' + adminAtivos);

    var probe = loginHandover('__handover_selftest_user__', '000000');
    Logger.log('selfTestAuthHandover_: probe_success=' + probe.success + ' probe_msg=' + (probe.message || ''));

    return {
      ok: true,
      saltPresent: !!salt,
      headersOk: missing.length === 0,
      adminAtivos: adminAtivos,
      probeReturnedObject: typeof probe === 'object',
    };
  } catch (e) {
    Logger.log('selfTestAuthHandover_: ' + e);
    return { ok: false };
  }
}

function validateSessionHandover(sessionToken) {
  setupSpreadsheet();
  var sess = validarSessaoHandover_(sessionToken);
  if (!sess) {
    return { success: false };
  }
  return {
    success: true,
    usuario: normalizeUsuarioHandover_(sess.usuario),
    nome: sanitizeText_(sess.nome || ''),
    perfil: sanitizeText_(sess.perfil || 'operador'),
    displayName: sanitizeText_(sess.nome || '') ? sanitizeText_(sess.nome || '') + ' (' + sess.usuario + ')' : sess.usuario,
    expAtMs: sess.expAtMs || '',
  };
}

function logoutHandover(sessionToken) {
  setupSpreadsheet();
  return encerrarSessaoHandover_(sessionToken);
}

function setupUsuariosHandover() {
  return setupUsuariosHandover_();
}

function setupUsuariosHandover_() {
  var sheet = ensureUsuariosHandoverSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    Logger.log('Usuarios_Handover já possui dados (linhas=' + lastRow + '). Nenhuma ação executada.');
    return { success: true, created: 0, note: 'Já existe conteúdo na aba.' };
  }

  var created = 0;
  var now = new Date();
  var bootstrapUsers = [
    { nome: 'Ainale', usuario: 'ainale', perfil: 'operador' },
    { nome: 'Marco', usuario: 'marco', perfil: 'admin' },
    { nome: 'Carlos', usuario: 'carlos', perfil: 'admin' },
    { nome: 'Jelcinei', usuario: 'jelcinei', perfil: 'gerente' },
    { nome: 'Priscila', usuario: 'priscila', perfil: 'operador' },
    { nome: 'Marcelo', usuario: 'marcelo', perfil: 'operador' },
  ];

  bootstrapUsers.forEach(function (u) {
    var username = normalizeUsuarioHandover_(u.usuario);
    if (!username) {
      return;
    }
    var pin = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
    var row = buildRowFromHeaders_(HANDOVER_USERS_HEADERS, {
      ID: Utilities.getUuid(),
      Nome: sanitizeText_(u.nome || u.usuario || ''),
      Usuario: username,
      Pin_Hash: hashPin_(username, pin),
      Perfil: sanitizeText_(u.perfil || 'operador').toLowerCase(),
      Ativo: 'TRUE',
      Criado_Em: now,
      Criado_Por: 'setupUsuariosHandover_',
      Ultimo_Login_Em: '',
    });
    sheet.appendRow(row);
    created++;
    Logger.log('Handover bootstrap user=' + username + ' perfil=' + (u.perfil || 'operador') + ' pin=' + pin);
  });

  return { success: true, created: created };
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

function updateChecklistItemStatus(id, status, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const location = findRowById_(SHEET_NAMES.CHECKLIST, id);
  if (!location) {
    throw new Error('Item de checklist nao encontrado: ' + id);
  }

  const normalizedStatus = parseChecklistStatusInput_(status);
  const responsavelValue = resolveOperadorFromSessionOrThrow_(sessionToken);
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

  const location = findRowById_(SHEET_NAMES.CHECKLIST, id);
  if (!location) {
    throw new Error('Item de checklist nao encontrado: ' + id);
  }

  const observacaoColumn = getColumnIndex_(location.sheet, 'Observacao');
  const responsavelColumn = getColumnIndex_(location.sheet, 'Responsavel');

  location.sheet.getRange(location.rowNumber, observacaoColumn).setValue(sanitizeText_(observacao));
  location.sheet
    .getRange(location.rowNumber, responsavelColumn)
    .setValue(resolveOperadorFromSessionOrThrow_(sessionToken));

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
      return !item.Resolvido && !isRowExcluded_(item);
    }),
    medicamentos: fetchSheetItems_(SHEET_NAMES.MEDICAMENTOS).filter(function (item) {
      return !isRowExcluded_(item);
    }),
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

function saveData(tab, data, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  if (tab !== SHEET_NAMES.GERAL && tab !== SHEET_NAMES.MEDICAMENTOS) {
    throw new Error('Aba invalida: ' + tab);
  }

  const ss = getSpreadsheet_();
  const sheet = getSheetOrThrow_(ss, tab);
  const id = Utilities.getUuid();
  const timestamp = new Date();
  const op = resolveOperadorFromSessionOrThrow_(sessionToken);
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
      return !item.Resolvido && !isRowExcluded_(item);
    }),
    medicamentos: fetchSheetItems_(SHEET_NAMES.MEDICAMENTOS).filter(function (item) {
      return !isRowExcluded_(item);
    }),
    checklistTurno: buildChecklistTurnoPayload_(inferDefaultChecklistTurno_()),
  };
}

function findItemLocationForDelete_(id, tabOpt) {
  var rid = sanitizeText_(id);
  var tab = sanitizeText_(tabOpt);
  if (!rid) {
    return null;
  }

  if (tab === SHEET_NAMES.GERAL || tab === 'Geral') {
    var locG = findRowById_(SHEET_NAMES.GERAL, rid);
    if (locG) return { sheetName: SHEET_NAMES.GERAL, sheet: locG.sheet, rowNumber: locG.rowNumber };
  }

  if (tab === SHEET_NAMES.MEDICAMENTOS || tab === 'Medicamentos') {
    var locM = findRowById_(SHEET_NAMES.MEDICAMENTOS, rid);
    if (locM) return { sheetName: SHEET_NAMES.MEDICAMENTOS, sheet: locM.sheet, rowNumber: locM.rowNumber };
  }

  // tab não confiável: tenta resolver por busca nas abas ativas
  var g = findRowById_(SHEET_NAMES.GERAL, rid);
  if (g) return { sheetName: SHEET_NAMES.GERAL, sheet: g.sheet, rowNumber: g.rowNumber };
  var m = findRowById_(SHEET_NAMES.MEDICAMENTOS, rid);
  if (m) return { sheetName: SHEET_NAMES.MEDICAMENTOS, sheet: m.sheet, rowNumber: m.rowNumber };

  return null;
}

function deleteItemHandover(id, tabOpt, sessionToken, motivoOpt) {
  var started = Date.now();
  setupSpreadsheet();

  var sess = requireSessionHandover_(sessionToken);
  requireDeleteRoleOrThrow_(sess);

  var loc = findItemLocationForDelete_(id, tabOpt);
  if (!loc) {
    throw new Error('Item não encontrado para exclusão: ' + sanitizeText_(id));
  }

  var sheet = loc.sheet;
  var rn = loc.rowNumber;
  var now = new Date();
  var op = resolveOperadorFromSessionOrThrow_(sessionToken);
  var perfil = normalizePerfilHandover_(sess.perfil || '');
  var motivo = sanitizeText_(motivoOpt || '');

  // se já estiver excluído, idempotente
  try {
    var rowObj = rowToObjectFromSheetRow_(sheet, rn);
    if (toBoolean_(rowObj.Excluido)) {
      return { success: true, removedId: sanitizeText_(id), tab: loc.sheetName, alreadyExcluded: true };
    }
  } catch (e) {
    // segue
  }

  sheet.getRange(rn, getColumnIndex_(sheet, 'Excluido')).setValue(true);
  sheet.getRange(rn, getColumnIndex_(sheet, 'Excluido_Por')).setValue(op);
  sheet.getRange(rn, getColumnIndex_(sheet, 'Data_Exclusao')).setValue(now);
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Motivo_Exclusao')).setValue(motivo);
  } catch (e2) {}
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Excluido_Por_Perfil')).setValue(perfil);
  } catch (e3) {}

  // atualiza auditoria padrão quando existir
  try {
    sheet.getRange(rn, getColumnIndex_(sheet, 'Ultima_Acao_Por')).setValue(op);
    sheet.getRange(rn, getColumnIndex_(sheet, 'Ultima_Acao_Em')).setValue(now);
  } catch (e4) {}

  Logger.log('deleteItemHandover ms=' + (Date.now() - started) + ' tab=' + loc.sheetName + ' id=' + id);
  return { success: true, removedId: sanitizeText_(id), tab: loc.sheetName };
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

function markAsPurchased(id, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error('Medicamento nao encontrado: ' + id);
  }

  var op = resolveOperadorFromSessionOrThrow_(sessionToken);
  const compradoColumn = getColumnIndex_(location.sheet, 'Comprado');
  location.sheet.getRange(location.rowNumber, compradoColumn).setValue(true);
  syncMedicationStatus_(location.sheet, location.rowNumber);
  writeMedicationUltimaAcao_(location.sheet, location.rowNumber, op);

  Logger.log('markAsPurchased ms=' + (Date.now() - started));
  return {
    success: true,
    record: fetchMedicationRecordById_(id),
  };
}

function markAsDelivered(id, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error('Medicamento nao encontrado: ' + id);
  }

  var op = resolveOperadorFromSessionOrThrow_(sessionToken);
  const compradoColumn = getColumnIndex_(location.sheet, 'Comprado');
  const entregueColumn = getColumnIndex_(location.sheet, 'Entregue');
  location.sheet.getRange(location.rowNumber, compradoColumn).setValue(true);
  location.sheet.getRange(location.rowNumber, entregueColumn).setValue(true);
  syncMedicationStatus_(location.sheet, location.rowNumber);
  writeMedicationUltimaAcao_(location.sheet, location.rowNumber, op);

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
  var op = resolveOperadorFromSessionOrThrow_(sessionToken);

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

  Logger.log('revertMedicationToPending ms=' + (Date.now() - started));
  return {
    success: true,
    record: fetchMedicationRecordById_(id),
  };
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

    const location = findRowById_(SHEET_NAMES.GERAL, id);
    if (!location) {
      throw new Error(
        'Solicitacao geral nao encontrada (verifique se o ID ainda esta na aba Geral e nao foi arquivado).'
      );
    }

    const sheet = location.sheet;
    const rowNumber = location.rowNumber;
    const op = resolveOperadorFromSessionOrThrow_(sessionToken);
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

function reopenHistoricoItem(archivedRecordId, sessionToken, motivo) {
  const started = Date.now();
  var rid = sanitizeText_(archivedRecordId);
  var op = resolveOperadorFromSessionOrThrow_(sessionToken);
  var mot = sanitizeText_(motivo);
  var ctx = '[reopenHistoricoItem] ID=' + rid + ' aba=' + SHEET_NAMES.ARQUIVO + ' acao=reabrir ';
  if (!rid) {
    throw new Error(ctx + 'Registro sem ID.');
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

function registerWhatsAppAttempt(id, sessionToken) {
  const started = Date.now();
  setupSpreadsheet();

  const location = findRowById_(SHEET_NAMES.MEDICAMENTOS, id);
  if (!location) {
    throw new Error('Medicamento nao encontrado para aviso no WhatsApp: ' + id);
  }

  var op = resolveOperadorFromSessionOrThrow_(sessionToken);
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
  writeMedicationUltimaAcao_(sheet, location.rowNumber, op);

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
