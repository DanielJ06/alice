window.AliceInvite = window.AliceInvite || {};

window.AliceInvite.initGuests = function initGuests() {
  const guestsBox = document.getElementById("guests");
  const addGuest = document.getElementById("addGuest");
  if (!guestsBox || !addGuest) return;

  let guestSeq = 0;

  addGuest.addEventListener("click", () => {
    guestSeq++;

    const guest = document.createElement("div");
    guest.className = "guest";
    guest.dataset.guest = guestSeq;
    guest.innerHTML = `
      <div class="gnum">Mais um à mesa</div>
      <button type="button" class="rm" aria-label="Remover convidado">✕</button>
      <div class="field">
        <label>Nome</label>
        <input type="text" class="g-nome" autocomplete="name" placeholder="Como devemos chamá-lo?" />
        <div class="msg"></div>
      </div>
      <div class="field">
        <label>WhatsApp</label>
        <input type="tel" class="g-whats" inputmode="numeric" placeholder="(00) 00000-0000" />
        <div class="msg"></div>
      </div>`;

    guestsBox.appendChild(guest);
    window.AliceInvite.bindPhone(guest.querySelector(".g-whats"));

    guest.querySelector(".rm").addEventListener("click", () => {
      guest.style.transition = "opacity .35s, transform .35s";
      guest.style.opacity = "0";
      guest.style.transform = "translateY(-8px)";
      setTimeout(() => guest.remove(), 340);
    });

    guest.querySelector(".g-nome").focus();
  });
};
