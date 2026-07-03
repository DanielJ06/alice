/**
 * O Chá da Alice — backend de RSVP no Google Sheets
 * =================================================
 * Recebe as confirmações do convite e grava na planilha.
 * O WhatsApp é a CHAVE ÚNICA: se o número já existe, ATUALIZA a linha
 * (não duplica). Cada convidado (principal e acompanhantes) vira uma linha.
 * Edições do mesmo formulário usam o mesmo Grupo; acompanhantes removidos
 * ficam marcados como "Removido" para a planilha continuar auditável.
 *
 * COMO PUBLICAR (uma vez só):
 * 1. Abra sua planilha no Google Sheets.
 * 2. Menu  Extensões → Apps Script.
 * 3. Apague o conteúdo padrão e cole ESTE arquivo inteiro.
 * 4. Clique em  Implantar → Nova implantação.
 * 5. Tipo:  App da Web.
 *      - Executar como:  Eu (sua conta)
 *      - Quem tem acesso:  Qualquer pessoa
 * 6. Copie a URL que termina em /exec.
 * 7. Cole essa URL em appsScriptUrl no arquivo scripts/config.js.
 *
 * A cada mudança no código, use  Implantar → Gerenciar implantações → Editar (lápis)
 * → Versão: Nova versão, para publicar a atualização.
 */

// Nome da aba onde os dados serão gravados (criada automaticamente se não existir).
var SHEET_NAME = 'Confirmações';
var HEADERS = [
  'Data/Hora',
  'Nome',
  'WhatsApp',
  'WhatsApp (formatado)',
  'Confirmações',
  'Recado',
  'Grupo',
  'Tipo',
  'Status',
  'Última ação'
];
var MAX_PEOPLE = 12;

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000); // evita corrida entre envios simultâneos

    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: 'Nenhum dado recebido' });
    }

    var body = JSON.parse(e.postData.contents || '{}');
    var people = normalizePeople(body.people);
    var groupId = normalizeGroupId(body.responseId) || 'phone:' + people[0].whatsapp;

    var sheet = getSheet();
    var cols = headerMap(sheet);
    var data = sheet.getDataRange().getValues(); // inclui cabeçalho
    var indexByPhone = {}; // whatsapp (dígitos) -> número da linha (1-based)
    var rowsInGroup = [];
    for (var r = 1; r < data.length; r++) {
      var key = String(data[r][cols['WhatsApp']] || '').replace(/\D/g, '');
      if (key) indexByPhone[key] = r + 1;
      if (String(data[r][cols['Grupo']] || '') === groupId) rowsInGroup.push(r + 1);
    }

    var added = 0, updated = 0;
    var now = new Date();
    var incomingPhones = {};

    people.forEach(function (p, index) {
      incomingPhones[p.whatsapp] = true;

      if (indexByPhone[p.whatsapp]) {
        var row = indexByPhone[p.whatsapp];
        var current = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
        var count = Number(current[cols['Confirmações']]) || 0;
        var keepRecado = p.recado || String(current[cols['Recado']] || '');
        writeKnownColumns(sheet, row, cols, current, {
          'Data/Hora': now,
          'Nome': p.nome,
          'WhatsApp': p.whatsapp,
          'WhatsApp (formatado)': p.pretty,
          'Confirmações': count + 1,
          'Recado': keepRecado,
          'Grupo': groupId,
          'Tipo': index === 0 ? 'Principal' : 'Acompanhante',
          'Status': 'Confirmado',
          'Última ação': 'Atualizado'
        });
        updated++;
      } else {
        appendKnownColumns(sheet, cols, {
          'Data/Hora': now,
          'Nome': p.nome,
          'WhatsApp': p.whatsapp,
          'WhatsApp (formatado)': p.pretty,
          'Confirmações': 1,
          'Recado': p.recado,
          'Grupo': groupId,
          'Tipo': index === 0 ? 'Principal' : 'Acompanhante',
          'Status': 'Confirmado',
          'Última ação': 'Criado'
        });
        indexByPhone[p.whatsapp] = sheet.getLastRow();
        added++;
      }
    });

    var removed = markRemovedGuests(sheet, cols, rowsInGroup, incomingPhones, now);

    return json({ ok: true, added: added, updated: updated, removed: removed });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// Chave de leitura do painel (painel.html). Troque por algo só seu e
// coloque o MESMO valor em scripts/config.js → painelKey.
// Deixe vazio ('') para liberar a leitura sem chave (não recomendado).
var READ_KEY = 'alice-2026';

// GET: sem parâmetros → teste de saúde. Com ?action=list&key=... → dados do painel.
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action === 'list') {
    if (READ_KEY && String(params.key || '') !== READ_KEY) {
      return json({ ok: false, error: 'Chave inválida' });
    }
    return json(listConfirmations());
  }
  return json({ ok: true, service: 'Chá da Alice RSVP', time: new Date() });
}

// Lê a aba e devolve os convidados agrupados por Grupo (família), do mais
// recente para o mais antigo. Cada grupo traz o principal primeiro.
function listConfirmations() {
  var sheet = getSheet();
  var cols = headerMap(sheet);
  var data = sheet.getDataRange().getValues();
  var groups = {};
  var order = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var nome = String(row[cols['Nome']] || '').trim();
    if (!nome) continue;

    var groupId = String(row[cols['Grupo']] || '') || ('linha-' + r);
    if (!groups[groupId]) {
      groups[groupId] = { id: groupId, updatedAt: 0, people: [] };
      order.push(groupId);
    }

    var ts = row[cols['Data/Hora']];
    var updatedAt = ts instanceof Date ? ts.getTime() : (ts ? new Date(ts).getTime() : 0);
    if (updatedAt > groups[groupId].updatedAt) groups[groupId].updatedAt = updatedAt;

    groups[groupId].people.push({
      nome: nome,
      whatsapp: String(row[cols['WhatsApp']] || '').replace(/\D/g, ''),
      pretty: String(row[cols['WhatsApp (formatado)']] || ''),
      confirmacoes: Number(row[cols['Confirmações']]) || 0,
      recado: String(row[cols['Recado']] || '').trim(),
      tipo: String(row[cols['Tipo']] || ''),
      status: String(row[cols['Status']] || ''),
      updatedAt: updatedAt
    });
  }

  var list = order.map(function (id) { return groups[id]; });
  list.forEach(function (g) {
    g.people.sort(function (a, b) {
      if (a.tipo === 'Principal' && b.tipo !== 'Principal') return -1;
      if (b.tipo === 'Principal' && a.tipo !== 'Principal') return 1;
      return 0;
    });
  });
  list.sort(function (a, b) { return b.updatedAt - a.updatedAt; });

  return { ok: true, groups: list, serverTime: Date.now() };
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    ensureHeaders(sheet);
  }
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  var existing = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (h) {
    return String(h || '').trim();
  });
  HEADERS.forEach(function (header) {
    if (existing.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      existing.push(header);
    }
  });
}

function headerMap(sheet) {
  ensureHeaders(sheet);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  headers.forEach(function (header, index) {
    var key = String(header || '').trim();
    if (key) cols[key] = index;
  });
  return cols;
}

function appendKnownColumns(sheet, cols, values) {
  var width = sheet.getLastColumn();
  var row = new Array(width);
  for (var i = 0; i < width; i++) row[i] = '';
  Object.keys(values).forEach(function (key) {
    if (cols[key] !== undefined) row[cols[key]] = values[key];
  });
  sheet.appendRow(row);
}

function writeKnownColumns(sheet, rowNumber, cols, current, values) {
  var width = sheet.getLastColumn();
  var row = current.slice(0, width);
  while (row.length < width) row.push('');
  Object.keys(values).forEach(function (key) {
    if (cols[key] !== undefined) row[cols[key]] = values[key];
  });
  sheet.getRange(rowNumber, 1, 1, width).setValues([row]);
}

function markRemovedGuests(sheet, cols, rowsInGroup, incomingPhones, now) {
  var removed = 0;
  rowsInGroup.forEach(function (rowNumber) {
    var current = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    var phone = String(current[cols['WhatsApp']] || '').replace(/\D/g, '');
    var status = String(current[cols['Status']] || '');
    if (!phone || incomingPhones[phone] || status === 'Removido') return;
    writeKnownColumns(sheet, rowNumber, cols, current, {
      'Data/Hora': now,
      'Status': 'Removido',
      'Última ação': 'Removido na edição'
    });
    removed++;
  });
  return removed;
}

function normalizePeople(rawPeople) {
  if (!Array.isArray(rawPeople) || rawPeople.length === 0) {
    throw new Error('Nenhum convidado recebido');
  }
  if (rawPeople.length > MAX_PEOPLE) {
    throw new Error('Muitos convidados no mesmo envio');
  }

  var seen = {};
  return rawPeople.map(function (p, index) {
    p = p || {};
    var nome = sanitizeText(p.nome, 80).replace(/\s+/g, ' ').trim();
    var phone = normalizePhone(p.whatsapp);
    if (nome.length < 3) throw new Error('Nome inválido no convidado ' + (index + 1));
    if (!validPhone(phone)) throw new Error('WhatsApp inválido no convidado ' + (index + 1));
    if (seen[phone]) throw new Error('WhatsApp repetido no envio');
    seen[phone] = true;
    return {
      nome: protectFormula(nome),
      whatsapp: phone,
      pretty: formatBR(phone),
      recado: protectFormula(sanitizeText(p.recado, 500).trim())
    };
  });
}

function normalizePhone(value) {
  var d = String(value || '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.indexOf('55') === 0) d = d.slice(2);
  return d;
}

function validPhone(d) {
  if (d.length !== 10 && d.length !== 11) return false;
  var ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  return !/^0+$/.test(d.slice(2));
}

function sanitizeText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, maxLength);
}

function protectFormula(value) {
  value = String(value || '');
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function normalizeGroupId(value) {
  var id = String(value || '').trim();
  return /^[A-Za-z0-9:_-]{6,80}$/.test(id) ? id : '';
}

function formatBR(d) {
  d = String(d).replace(/\D/g, '');
  if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return d;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
