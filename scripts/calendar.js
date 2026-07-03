window.AliceInvite = window.AliceInvite || {};

window.AliceInvite.escapeCalendarText = function escapeCalendarText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
};

window.AliceInvite.setupCalendarDownload = function setupCalendarDownload() {
  const config = window.AliceInvite.config || {};
  const event = config.calendar || {};
  const escape = window.AliceInvite.escapeCalendarText;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escape(event.productId)}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escape(event.uid)}`,
    `DTSTAMP:${event.stamp}`,
    `DTSTART:${event.start}`,
    `DTEND:${event.end}`,
    `SUMMARY:${escape(event.summary)}`,
    `DESCRIPTION:${escape(event.description)}`,
    `LOCATION:${escape(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const calBtn = document.getElementById("calBtn");

  if (!calBtn) return;

  calBtn.href = URL.createObjectURL(blob);
  calBtn.download = event.filename || "convite.ics";
};
