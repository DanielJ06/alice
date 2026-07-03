window.AliceInvite = window.AliceInvite || {};

window.AliceInvite.digits = function digits(value) {
  return (value || "").replace(/\D/g, "");
};

window.AliceInvite.validPhone = function validPhone(value) {
  const number = window.AliceInvite.digits(value);
  return number.length === 10 || number.length === 11;
};

window.AliceInvite.setErr = function setErr(input, msgEl, message) {
  if (message) {
    input.classList.add("err");
    if (msgEl) msgEl.textContent = message;
    return false;
  }

  input.classList.remove("err");
  if (msgEl) msgEl.textContent = "";
  return true;
};
