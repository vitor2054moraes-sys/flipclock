"use strict";
/* ==========================================================
   VIRADA — Relógio de virar · Cronômetro · Temporizador
   Tudo conta pela hora do aparelho (nunca "um tique por vez"), então nada atrasa com a aba em segundo plano.
   A tela é montada pelo DOM (sem innerHTML).
   ========================================================== */

const pad = (n, l = 2) => String(n).padStart(l, "0");
const $ = (id) => document.getElementById(id);
const on = (id, fn) => $(id)?.addEventListener("click", fn);

function ler(chave, padrao) {
  try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; }
}
function gravar(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento: só não lembra */ }
}

/* ---------- ABAS ---------- */
let painelAberto = "clock";
function abrirPainel(id) {
  painelAberto = id;
  for (const t of document.querySelectorAll(".tab")) {
    const ativa = t.dataset.panel === id;
    t.classList.toggle("active", ativa);
    t.setAttribute("aria-selected", String(ativa));
  }
  for (const p of document.querySelectorAll(".panel")) p.classList.toggle("active", p.id === id);
}
for (const t of document.querySelectorAll(".tab")) t.addEventListener("click", () => abrirPainel(t.dataset.panel));

/* ==========================================================
   ÁUDIO — bip-bip-bip (um canal de som só, reaproveitado)
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
      navigator.vibrate?.([90, 80, 90, 80, 90]);
    };
    fire();
    this.loop = setInterval(fire, 1100);
  }

  stop() { if (this.loop) { clearInterval(this.loop); this.loop = null; } }
  get tocando() { return this.loop !== null; }
}
const beeper = new Beeper();

/* ==========================================================
   1. RELÓGIO
   ========================================================== */
let use24 = ler("virada.formato24", true) !== false;   // a escolha 12h/24h fica guardada

function flip(card, value) {
  const top = card?.querySelector(".top");
  if (!top || top.textContent === value) return;
  const bottom = card.querySelector(".bottom");
  const fTop = card.querySelector(".flip-top");
  const fBottom = card.querySelector(".flip-bottom");

  fTop.textContent = top.textContent;   // o número antigo cai
  fBottom.textContent = value;          // o novo sobe
  top.textContent = value;

  card.classList.remove("flipping");
  void card.offsetWidth;                // reinicia a animação
  card.classList.add("flipping");

  setTimeout(() => {
    bottom.textContent = value;
    card.classList.remove("flipping");
  }, 620);
}

let ultimaLida = "";
function tickClock() {
  const d = new Date();
  let h = d.getHours();
  const mer = h >= 12 ? "PM" : "AM";
  if (!use24) h = h % 12 || 12;

  flip($("c-h"), pad(h));
  flip($("c-m"), pad(d.getMinutes()));
  $("c-s").textContent = pad(d.getSeconds());
  $("meridiem").textContent = mer;
  $("meridiem").classList.toggle("escondido", use24);
  $("data").textContent = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  // Para o leitor de tela: a hora uma vez por minuto (os cartões de virar ficam escondidos dele).
  const lida = `${pad(h)}:${pad(d.getMinutes())}${use24 ? "" : ` ${mer}`}`;
  if (lida !== ultimaLida) { ultimaLida = lida; $("horaLida").textContent = `São ${lida}`; }
}

function mostrarFormato() {
  $("formatToggle").textContent = use24 ? "24h" : "12h";
}
on("formatToggle", () => {
  use24 = !use24;
  gravar("virada.formato24", use24);
  mostrarFormato();
  tickClock();
});

// Tela cheia (relógio de mesa) e a tela acesa enquanto isso, onde o navegador deixa.
let trava = null;
on("telaCheia", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { /* o navegador não deixou */ }
});
document.addEventListener("fullscreenchange", async () => {
  const cheia = Boolean(document.fullscreenElement);
  $("telaCheia").textContent = cheia ? "Sair da tela cheia" : "Tela cheia";
  document.body.classList.toggle("cheia", cheia);
  try {
    if (cheia) trava = await navigator.wakeLock?.request("screen");
    else { await trava?.release(); trava = null; }
  } catch { trava = null; }
});

mostrarFormato();
tickClock();
setInterval(tickClock, 250);

/* ==========================================================
   2. CRONÔMETRO
   ========================================================== */
let swT0 = 0, swAcc = 0, swRaf = null, swLapCount = 0;

// [mm:ss, centésimos]
const partesSw = (ms) => [`${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}`, `.${pad(Math.floor(ms / 10) % 100)}`];
const tempoSw = (ms) => { const [principal, cs] = partesSw(ms); return [principal, Object.assign(document.createElement("span"), { className: "ms", textContent: cs })]; };

const swElapsed = () => swAcc + (swRaf ? Date.now() - swT0 : 0);

function swRender() {
  $("swDisplay").replaceChildren(...tempoSw(swElapsed()));
  if (swRaf) swRaf = requestAnimationFrame(swRender);
}

function swToggle() {
  const btn = $("swStart");
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
}

function swLap() {
  const ms = swElapsed();
  if (!ms) return;
  const li = document.createElement("li");
  li.append(`Volta ${++swLapCount} — `, ...tempoSw(ms));
  $("swLaps").prepend(li);
}

function swReset() {
  if (swRaf) cancelAnimationFrame(swRaf);
  swRaf = null; swAcc = 0; swLapCount = 0;
  $("swStart").textContent = "Iniciar";
  $("swStart").classList.add("primary");
  $("swLaps").replaceChildren();
  swRender();
}

on("swStart", swToggle);
on("swLap", swLap);
on("swReset", swReset);
swRender();

/* ==========================================================
   3. TEMPORIZADOR
   ========================================================== */
let tmEnd = 0, tmRemain = 0, tmInt = null;
const tituloOriginal = document.title;

const fmtTm = (ms) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
};

function tmRender() {
  $("tmDisplay").textContent = fmtTm(tmRemain);
  document.title = tmInt ? `${fmtTm(tmRemain)} · Virada` : beeper.tocando ? "⏰ Tempo! · Virada" : tituloOriginal;
}

// Lê os campos dentro dos limites (99 h, 59 min, 59 s): número estranho não vira um tempo absurdo.
const campo = (id, max) => Math.min(max, Math.max(0, Math.floor(Number($(id).value) || 0)));
const readInputs = () => (campo("tmH", 99) * 3600 + campo("tmM", 59) * 60 + campo("tmS", 59)) * 1000;

for (const b of document.querySelectorAll(".presets button")) {
  b.addEventListener("click", () => {
    $("tmH").value = "";
    $("tmM").value = b.dataset.min;
    $("tmS").value = "";
    tmRemain = Number(b.dataset.min) * 60000;
    tmRender();
  });
}

function pararAlarme() {
  beeper.stop();
  $("tmStop").classList.add("hidden");
  tmRender();
}

function tmToggle() {
  const btn = $("tmStart");
  if (tmInt) {                                  // pausar
    tmRemain = tmEnd - Date.now();
    clearInterval(tmInt); tmInt = null;
    btn.textContent = "Iniciar";
    btn.classList.add("primary");
    tmRender();
    return;
  }
  if (tmRemain <= 0) tmRemain = readInputs();
  if (tmRemain <= 0) return;

  beeper._ensure();                             // libera o som no toque
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
      $("tmStop").classList.remove("hidden");
      beeper.start();
    }
    tmRender();
  }, 100);
  tmRender();   // já mostra o tempo, sem esperar o primeiro passo
}

function tmReset() {
  clearInterval(tmInt); tmInt = null;
  tmRemain = 0;
  pararAlarme();
  $("tmStart").textContent = "Iniciar";
  $("tmStart").classList.add("primary");
  tmRender();
}

on("tmStart", tmToggle);
on("tmReset", tmReset);
on("tmStop", pararAlarme);
tmRender();

/* ==========================================================
   4. TECLADO (o README já prometia): Espaço, L, R e Esc
   ========================================================== */
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
  const tecla = e.key.toLowerCase();
  if (tecla === "escape" && beeper.tocando) { pararAlarme(); return; }
  if (e.target.matches("button") && (tecla === " " || tecla === "enter")) return;   // o botão em foco faz o dele
  if (tecla === " ") {
    e.preventDefault();
    if (beeper.tocando) pararAlarme();
    else if (painelAberto === "stopwatch") swToggle();
    else if (painelAberto === "timer") tmToggle();
  } else if (tecla === "l" && painelAberto === "stopwatch") swLap();
  else if (tecla === "r") {
    if (painelAberto === "stopwatch") swReset();
    else if (painelAberto === "timer") tmReset();
  }
});
