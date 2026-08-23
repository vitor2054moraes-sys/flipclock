/* ==========================================================
   FLIP CLOCK — Relógio · Cronômetro · Temporizador
   ========================================================== */

const pad = (n, l = 2) => String(n).padStart(l, "0");
const $   = id => document.getElementById(id);
const on  = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };

/* ---------- ABAS ---------- */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    const panel = $(tab.dataset.panel);
    if (panel) panel.classList.add("active");
  });
});

/* ==========================================================
   ÁUDIO — beep-beep-beep
   ========================================================== */
class Beeper {
  constructor() { this.ctx = null; this.loop = null; }

  _ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  beep(at, dur = 0.09) {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(2600, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.25, at + 0.006);
    gain.gain.setValueAtTime(0.25, at + dur - 0.012);
    gain.gain.linearRampToValueAtTime(0, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  start() {
    const ctx = this._ensure();
    this.stop();
    const fire = () => {
      const t = ctx.currentTime + 0.02;
      this.beep(t); this.beep(t + 0.17); this.beep(t + 0.34);
    };
    fire();
    this.loop = setInterval(fire, 1100);
  }

  stop() { if (this.loop) { clearInterval(this.loop); this.loop = null; } }
}
const beeper = new Beeper();

/* ==========================================================
   1. RELÓGIO
   ========================================================== */
let use24 = true;

function flip(card, value) {
  if (!card) return;
  const top = card.querySelector(".top");
  if (!top || top.textContent === value) return;

  const bottom  = card.querySelector(".bottom");
  const fTop    = card.querySelector(".flip-top");
  const fBottom = card.querySelector(".flip-bottom");

  fTop.textContent    = top.textContent;   // valor antigo cai
  fBottom.textContent = value;             // valor novo sobe
  top.textContent     = value;

  card.classList.remove("flipping");
  void card.offsetWidth;                   // reinicia animação
  card.classList.add("flipping");

  setTimeout(() => {
    bottom.textContent = value;
    card.classList.remove("flipping");
  }, 620);
}

function tickClock() {
  const d = new Date();
  let h = d.getHours();
  const mer = h >= 12 ? "PM" : "AM";
  if (!use24) h = h % 12 || 12;

  flip($("c-h"), pad(h));
  flip($("c-m"), pad(d.getMinutes()));

  const sec = $("c-s");
  if (sec) sec.textContent = pad(d.getSeconds());

  const m = $("meridiem");
  if (m) { m.textContent = mer; m.style.visibility = use24 ? "hidden" : "visible"; }
}

on("formatToggle", e => {
  use24 = !use24;
  e.currentTarget.textContent = use24 ? "24h" : "12h";
  tickClock();
});

tickClock();
setInterval(tickClock, 250);

/* ==========================================================
   2. CRONÔMETRO
   ========================================================== */
let swT0 = 0, swAcc = 0, swRaf = null, swLapCount = 0;

const fmtSw = ms => {
  const cs = Math.floor(ms / 10) % 100;
  const s  = Math.floor(ms / 1000) % 60;
  const m  = Math.floor(ms / 60000);
  return `${pad(m)}:${pad(s)}<span class="ms">.${pad(cs)}</span>`;
};

function swElapsed() { return swAcc + (swRaf ? Date.now() - swT0 : 0); }

function swRender() {
  const el = $("swDisplay");
  if (el) el.innerHTML = fmtSw(swElapsed());
  if (swRaf) swRaf = requestAnimationFrame(swRender);
}

on("swStart", e => {
  const btn = e.currentTarget;
  if (swRaf) {
    swAcc += Date.now() - swT0;
    cancelAnimationFrame(swRaf);
    swRaf = null;
    btn.textContent = "Iniciar";
    btn.classList.add("primary");
  } else {
    swT0 = Date.now();
    swRaf = requestAnimationFrame(swRender);
    btn.textContent = "Pausar";
    btn.classList.remove("primary");
  }
});

on("swLap", () => {
  const el = swElapsed();
  if (!el) return;
  const list = $("swLaps");
  if (!list) return;
  const li = document.createElement("li");
  li.innerHTML = `Volta ${++swLapCount} — ${fmtSw(el)}`;
  list.prepend(li);
});

on("swReset", () => {
  if (swRaf) cancelAnimationFrame(swRaf);
  swRaf = null; swAcc = 0; swLapCount = 0;
  const btn = $("swStart");
  if (btn) { btn.textContent = "Iniciar"; btn.classList.add("primary"); }
  const list = $("swLaps");
  if (list) list.innerHTML = "";
  swRender();
});

swRender();

/* ==========================================================
   3. TEMPORIZADOR
   ========================================================== */
let tmEnd = 0, tmRemain = 0, tmInt = null;

const fmtTm = ms => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
};

function tmRender() {
  const el = $("tmDisplay");
  if (el) el.textContent = fmtTm(tmRemain);
}

function readInputs() {
  const h = +($("tmH")?.value || 0);
  const m = +($("tmM")?.value || 0);
  const s = +($("tmS")?.value || 0);
  return (h * 3600 + m * 60 + s) * 1000;
}

document.querySelectorAll(".presets button").forEach(b => {
  b.addEventListener("click", () => {
    if ($("tmH")) $("tmH").value = "";
    if ($("tmM")) $("tmM").value = b.dataset.min;
    if ($("tmS")) $("tmS").value = "";
    tmRemain = +b.dataset.min * 60000;
    tmRender();
  });
});

on("tmStart", e => {
  const btn = e.currentTarget;

  if (tmInt) {                                  // pausar
    tmRemain = tmEnd - Date.now();
    clearInterval(tmInt); tmInt = null;
    btn.textContent = "Iniciar";
    btn.classList.add("primary");
    return;
  }

  if (tmRemain <= 0) tmRemain = readInputs();
  if (tmRemain <= 0) return;

  beeper._ensure();                             // libera áudio no clique
  tmEnd = Date.now() + tmRemain;
  btn.textContent = "Pausar";
  btn.classList.remove("primary");

  tmInt = setInterval(() => {
    tmRemain = tmEnd - Date.now();
    if (tmRemain <= 0) {
      tmRemain = 0;
      clearInterval(tmInt); tmInt = null;
      btn.textContent = "Iniciar";
      btn.classList.add("primary");
      $("tmStop")?.classList.remove("hidden");
      beeper.start();
    }
    tmRender();
  }, 100);
});

on("tmReset", () => {
  clearInterval(tmInt); tmInt = null;
  tmRemain = 0;
  beeper.stop();
  $("tmStop")?.classList.add("hidden");
  const btn = $("tmStart");
  if (btn) { btn.textContent = "Iniciar"; btn.classList.add("primary"); }
  tmRender();
});

on("tmStop", () => {
  beeper.stop();
  $("tmStop")?.classList.add("hidden");
});

tmRender();
