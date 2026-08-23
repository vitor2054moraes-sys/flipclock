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

/* ---------- ÁUDIO ---------- */
class Beeper {
  constructor() { this.ctx = null; this.loop = null; }
  _ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }
  beep(at, dur = 0.09) {
    const ctx = this._ensure();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(2600, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.28, at + 0.006);
    gain.gain.setValueAtTime(0.28, at + dur - 0.012);
    gain.gain.linearRampToValueAtTime(0, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at); osc.stop(at + dur + 0.02);
  }
  start() {
    const ctx = this._ensure();
    const fire = () => {
      const t = ctx.currentTime;
      this.beep(t); this.beep(t + 0.16); this.beep(t + 0.32);
    };
    this.stop();
    fire();
    this.loop = setInterval(fire, 1000);
  }
  stop() { if (this.loop) { clearInterval(this.loop); this.loop = null; } }
}
const beeper = new Beeper();

/* ---------- RELÓGIO FLIP ---------- */
let use24 = true;

function flip(card, value) {
  if (!card) return;
  const top = card.querySelector(".top");
  if (top.textContent === value) return;           // nada mudou
  const bottom = card.querySelector(".bottom");
  const fTop = card.querySelector(".flip-top");
  const fBottom = card.querySelector(".flip-bottom");

  fTop.textContent = top.textContent;              // valor antigo cai
  fBottom.textContent = value;                     // valor novo sobe
  top.textContent = value;

  card.classList.remove("flipping");
  void card.offsetWidth;                           // reinicia animação
  card.classList.add("flipping");

  setTimeout(() => {
    bottom.textContent = value;
    card.classList.remove("flipping");
  }, 600);
}

function tickClock() {
  const d = new Date();
  let h = d.getHours();
  const mer = h >= 12 ? "PM" : "AM";
  if (!use24) h = h % 12 || 12;

  flip(document.getElementById("c-h"), pad(h));
  flip(document.getElementById("c-m"), pad(d.getMinutes()));
  document.getElementById("c-s").textContent = pad(d.getSeconds());

  const m = document.getElementById("meridiem");
  m.textContent = mer;
  m.style.visibility = use24 ? "hidden" : "visible";
}

document.getElementById("formatToggle").addEventListener("click", e => {
  use24 = !use24;
  e.target.textContent = use24 ? "24h" : "12h";
  tickClock();
});

tickClock();
setInterval(tickClock, 250);

/* ---------- CRONÔMETRO ---------- */
let swT0 = 0, swAcc = 0, swRaf = null, swLapCount = 0;
const swDisplay = document.getElementById("swDisplay");

const fmtSw = ms => {
  const cs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${pad(m)}:${pad(s)}<span class="ms">.${pad(cs)}</span>`;
};

