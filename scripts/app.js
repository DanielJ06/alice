window.AliceInvite = window.AliceInvite || {};
window.AliceInvite.config = window.ALICE_INVITE_CONFIG || {};

window.AliceInvite.init = function init() {
  const app = window.AliceInvite;

  app.initPetals();
  app.initReveal();
  app.bindPhone(document.getElementById("whats"));
  app.initGuests();
  app.initRsvp();
  app.setupCalendarDownload();
};

document.addEventListener("DOMContentLoaded", window.AliceInvite.init);
