window.AliceInvite = window.AliceInvite || {};

window.AliceInvite.prefersReducedMotion = function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion:reduce)").matches;
};

window.AliceInvite.initPetals = function initPetals() {
  const layer = document.getElementById("petals");
  if (!layer || window.AliceInvite.prefersReducedMotion()) return;

  const colors = ["#839958", "#a7c3bb", "#c2cf9a", "#d3968c"];
  const count = window.innerWidth < 560 ? 9 : 16;

  for (let i = 0; i < count; i++) {
    const petal = document.createElement("span");
    petal.className = "petal";

    const size = 8 + Math.random() * 10;
    const color = colors[i % colors.length];
    const duration = 11 + Math.random() * 12;

    petal.style.left = Math.random() * 100 + "vw";
    petal.style.setProperty("--drift", Math.random() * 120 - 60 + "px");
    petal.style.setProperty("--spin", 160 + Math.random() * 280 + "deg");
    petal.style.animation = `fall ${duration}s linear ${(-Math.random() * duration).toFixed(1)}s infinite`;
    petal.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none"><path d="M10 1c4 4 6 6 6 10a6 6 0 01-12 0c0-4 2-6 6-10z" fill="${color}" opacity="${0.5 + Math.random() * 0.4}"/></svg>`;

    layer.appendChild(petal);
  }
};

window.AliceInvite.initReveal = function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  elements.forEach((element) => observer.observe(element));
};

window.AliceInvite.fireBurst = function fireBurst() {
  const burst = document.getElementById("successBurst");
  if (!burst || window.AliceInvite.prefersReducedMotion()) return;

  burst.innerHTML = "";
  const colors = ["#839958", "#a7c3bb", "#d3968c", "#c2cf9a", "#7c9350"];
  const cx = burst.offsetWidth / 2;
  const cy = burst.offsetHeight * 0.25;

  for (let i = 0; i < 18; i++) {
    const dot = document.createElement("span");
    const angle = (i / 18) * Math.PI * 2;
    const dist = 60 + Math.random() * 60;

    dot.className = "burst-dot";
    dot.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      background: ${colors[i % colors.length]};
      --bx: ${Math.cos(angle) * dist}px;
      --by: ${Math.sin(angle) * dist}px;
      animation-delay: ${Math.random() * 0.15}s;
    `;

    burst.appendChild(dot);
  }

  setTimeout(() => {
    burst.innerHTML = "";
  }, 1200);
};
