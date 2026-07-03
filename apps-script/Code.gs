/**
 * O Chá da Alice — backend de RSVP no Google Sheets
 * =================================================
 * Recebe as confirmações do convite e grava na planilha.
 * O WhatsApp é a CHAVE ÚNICA: se o número já existe, ATUALIZA a linha
 * (não duplica). Cada convidado (principal e acompanhantes) vira uma linha.
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
var HEADERS = ['Data/Hora', 'Nome', 'WhatsApp', 'WhatsApp (formatado)', 'Confirmações', 'Recado'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // evita corrida entre envios simultâneos

    var body = JSON.parse(e.postData.contents || '{}');
    var people = body.people || [];
    if (!people.length) return json({ ok: false, error: 'Nenhum convidado recebido' });

    var sheet = getSheet();
    var data = sheet.getDataRange().getValues(); // inclui cabeçalho
    var indexByPhone = {}; // whatsapp (dígitos) -> número da linha (1-based)
    for (var r = 1; r < data.length; r++) {
      var key = String(data[r][2] || '').replace(/\D/g, '');
      if (key) indexByPhone[key] = r + 1;
    }

    var added = 0, updated = 0;
    var now = new Date();

    people.forEach(function (p) {
      var phone = String(p.whatsapp || '').replace(/\D/g, '');
      if (!phone || !p.nome) return;
      var pretty = formatBR(phone);

      var recado = String(p.recado || '').trim();

      if (indexByPhone[phone]) {
        // Já existe: atualiza nome + incrementa contador; preserva recado se o novo vier vazio
        var row = indexByPhone[phone];
        var count = Number(sheet.getRange(row, 5).getValue()) || 1;
        var keepRecado = recado || String(sheet.getRange(row, 6).getValue() || '');
        sheet.getRange(row, 1, 1, 6).setValues([[now, p.nome, phone, pretty, count + 1, keepRecado]]);
        updated++;
      } else {
        sheet.appendRow([now, p.nome, phone, pretty, 1, recado]);
        indexByPhone[phone] = sheet.getLastRow();
        added++;
      }
    });

    return json({ ok: true, added: added, updated: updated });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// GET simples só para testar que a implantação está no ar.
function doGet() {
  return json({ ok: true, service: 'Chá da Alice RSVP', time: new Date() });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
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
