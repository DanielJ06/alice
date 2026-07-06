/* ============================================================
   CONFIGURAÇÃO DO CONVITE

   Cole em appsScriptUrl a URL do Google Apps Script publicado como App da Web.
   Enquanto estiver vazio, o convite funciona em modo demonstração:
   mostra sucesso, mas NÃO grava na planilha.
   ============================================================ */
window.ALICE_INVITE_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbws4s-VJ3-h9U4MKmxtTiEsAa_CAEVJVHBFis8dYHcsDF-Qh5Z_QqbQuhbCkK53J28eMw/exec",

  // Chave de leitura do painel (painel.html). Deve ser IGUAL a READ_KEY no Code.gs.
  painelKey: "alice-2026",

  calendar: {
    filename: "cha-da-alice.ics",
    productId: "-//Cha da Alice//PT-BR//EN",
    uid: "cha-da-alice-2026@evento",
    stamp: "20260101T000000Z",
    start: "20260808T183000Z",
    end: "20260808T213000Z",
    summary: "🐰 Chá de Bebê da Alice 🍼",
    description:
      "Você está convidado(a) para o chá de bebê da Alice! Sugestão de presente: fraldas M e G (Pampers ou Huggies) + 1 mimo.",
    location: "Mansão N&N",
  },

  successDateText: "08 de agosto",
};
