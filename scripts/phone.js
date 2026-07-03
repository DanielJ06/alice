window.AliceInvite = window.AliceInvite || {};

window.AliceInvite.maskPhone = function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return "(" + digits;
  if (digits.length <= 6) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
  if (digits.length <= 10) {
    return (
      "(" +
      digits.slice(0, 2) +
      ") " +
      digits.slice(2, 6) +
      "-" +
      digits.slice(6)
    );
  }

  return (
    "(" +
    digits.slice(0, 2) +
    ") " +
    digits.slice(2, 7) +
    "-" +
    digits.slice(7)
  );
};

window.AliceInvite.bindPhone = function bindPhone(input) {
  if (!input) return;

  input.addEventListener("input", () => {
    const start = input.selectionStart;
    const before = input.value;
    input.value = window.AliceInvite.maskPhone(input.value);

    if (start === before.length) {
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });
};
