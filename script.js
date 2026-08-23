/* ==========================================================
   FLIP CLOCK — Relógio · Cronômetro · Temporizador
   ========================================================== */

const pad = (n, l = 2) => String(n).padStart(l, "0");

/* ---------- ABAS ---------- */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.panel).classList.add("active");
  });
});

/* ==========================================================
   1. ÁUDIO — beep-beep-beep (alarme clássico Motorola)
   ========================================================== */
class Beeper {
  constructor() { this.ctx = null; this.loop = null; }

  _ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  // um beep curto: onda quadrada 2600Hz com envelope rápido
  beep(at, dur = 0.09) {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(2600, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.28, at + 0.006);
    gain.gain.setValueAtTime(0.28, at + dur - 0.012);
    gain.gain.linearRampToValueAtTime(0, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  // padrão: 3 beeps rápidos, pausa, repete
  start() {
    const ctx = this._ensure();
    const cycle =
