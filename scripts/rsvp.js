window.AliceInvite = window.AliceInvite || {};

window.AliceInvite.initRsvp = function initRsvp() {
  const app = window.AliceInvite;
  const form = document.getElementById("rsvpForm");
  const submitBtn = document.getElementById("submitBtn");
  const formError = document.getElementById("formError");
  const successBox = document.getElementById("success");
  const againBtn = document.getElementById("againBtn");
  const guestsBox = document.getElementById("guests");

  if (!form || !submitBtn || !formError || !successBox || !againBtn || !guestsBox) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.style.display = "none";

    const nameInput = document.getElementById("nome");
    const phoneInput = document.getElementById("whats");
    let ok = true;

    ok =
      app.setErr(
        nameInput,
        form.querySelector('[data-for="nome"]'),
        nameInput.value.trim().length < 3
          ? "Precisamos saber seu nome para anunciar sua chegada."
          : "",
      ) && ok;
    ok =
      app.setErr(
        phoneInput,
        form.querySelector('[data-for="whats"]'),
        !app.validPhone(phoneInput.value)
          ? "Este número não chegou até nós. Confira o DDD."
          : "",
      ) && ok;

    const seen = new Set();
    const people = [];
    const pushPerson = (nome, whats, recado) => {
      const key = app.digits(whats);
      const person = { nome: nome.trim(), whatsapp: key };
      if (recado) person.recado = recado;
      people.push(person);
      seen.add(key);
    };
    const messageInput = document.getElementById("recado");

    if (ok) {
      pushPerson(
        nameInput.value,
        phoneInput.value,
        messageInput ? messageInput.value.trim() : "",
      );
    }

    document.querySelectorAll(".guest").forEach((guest) => {
      const guestName = guest.querySelector(".g-nome");
      const guestPhone = guest.querySelector(".g-whats");
      const name = guestName.value.trim();
      const phone = guestPhone.value.trim();

      if (!name && !phone) return;

      let guestOk = true;
      guestOk =
        app.setErr(
          guestName,
          guestName.nextElementSibling,
          name.length < 3 ? "Como devemos chamá-lo?" : "",
        ) && guestOk;
      guestOk =
        app.setErr(
          guestPhone,
          guestPhone.nextElementSibling,
          !app.validPhone(phone) ? "Número com DDD, por favor." : "",
        ) && guestOk;

      if (guestOk) {
        if (seen.has(app.digits(phone))) {
          app.setErr(
            guestPhone,
            guestPhone.nextElementSibling,
            "Este número já está na nossa lista.",
          );
          ok = false;
        } else {
          pushPerson(name, phone);
        }
      } else {
        ok = false;
      }
    });

    if (!ok) {
      formError.textContent = "Alguns campos precisam de atenção.";
      formError.style.display = "block";
      return;
    }

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    try {
      await app.submitRsvp(people);
      app.showRsvpSuccess(people, form, successBox);

      try {
        localStorage.setItem("cha_alice_confirmado", "1");
      } catch (_) {}
    } catch (err) {
      console.error(err);
      formError.textContent =
        "Ops! O coelho se perdeu no caminho. Tente novamente em instantes.";
      formError.style.display = "block";
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });

  againBtn.addEventListener("click", () => {
    form.reset();
    guestsBox.innerHTML = "";
    form.querySelectorAll(".msg").forEach((message) => {
      message.textContent = "";
    });
    form.querySelectorAll("input").forEach((input) => {
      input.classList.remove("err");
    });
    successBox.classList.remove("show");
    form.style.display = "flex";
    form.style.opacity = "";
    form.style.transform = "";
    form.style.transition = "";
    document
      .getElementById("confirmar")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

window.AliceInvite.submitRsvp = async function submitRsvp(people) {
  const config = window.AliceInvite.config || {};

  if (config.appsScriptUrl) {
    const response = await fetch(config.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ people }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || (data && data.ok === false)) {
      throw new Error((data && data.error) || "Falha ao gravar");
    }

    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 900));
  console.warn(
    "[Chá da Alice] appsScriptUrl vazio — modo demonstração. Dados NÃO gravados:",
    people,
  );
};

window.AliceInvite.showRsvpSuccess = function showRsvpSuccess(people, form, successBox) {
  const config = window.AliceInvite.config || {};
  const successDateText = config.successDateText || "08 de agosto";
  const firstName = people[0].nome.split(" ")[0];
  const count = people.length;

  document.getElementById("successMsg").textContent =
    count > 1
      ? `O jardim da Alice reservou ${count} cadeiras. Nos vemos em ${successDateText}, ${firstName}!`
      : `O jardim da Alice reservou um lugar especial para você, ${firstName}. Nos vemos em ${successDateText}!`;

  const shouldAnimate = !window.AliceInvite.prefersReducedMotion();
  if (shouldAnimate) {
    form.style.transition = "opacity .32s var(--ease), transform .32s var(--ease)";
    form.style.opacity = "0";
    form.style.transform = "translateY(-10px)";
  }

  setTimeout(
    () => {
      form.style.display = "none";
      successBox.classList.add("show");
      window.AliceInvite.fireBurst();
      successBox.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    shouldAnimate ? 320 : 0,
  );
};
