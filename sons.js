// ===== SONS.JS =====
const Sons = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tocar(fn) {
    const cfg = JSON.parse(localStorage.getItem('primordios_config') || '{}');
    if (cfg.sons === false) return;
    try { fn(getCtx()); } catch(e) {}
  }

  // Som de clique seco
  function click() {
    tocar(ctx => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(820, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      o.start(); o.stop(ctx.currentTime + 0.09);
    });
  }

  // Tick leve de hover
  function hover() {
    tocar(ctx => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(1100, ctx.currentTime);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      o.start(); o.stop(ctx.currentTime + 0.05);
    });
  }

  // Confirmar / selecionar — acorde ascendente
  function confirm() {
    tocar(ctx => {
      [[520, 0], [660, 0.08], [820, 0.16]].forEach(([freq, t]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, ctx.currentTime + t);
        g.gain.setValueAtTime(0.22, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.18);
      });
    });
  }

  // Voltar / fechar — nota descendente
  function back() {
    tocar(ctx => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(600, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.start(); o.stop(ctx.currentTime + 0.18);
    });
  }

  // Erro — buzzer grave duplo
  function error() {
    tocar(ctx => {
      [0, 0.13].forEach(t => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(160, ctx.currentTime + t);
        g.gain.setValueAtTime(0.15, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.1);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.1);
      });
    });
  }

  // Sucesso — fanfarra ascendente
  function success() {
    tocar(ctx => {
      [[400,0],[500,0.1],[630,0.2],[840,0.3]].forEach(([freq, t]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, ctx.currentTime + t);
        g.gain.setValueAtTime(0.2, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.22);
      });
    });
  }

  // Delete — pancada grave
  function del() {
    tocar(ctx => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
      g.gain.setValueAtTime(0.28, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      o.start(); o.stop(ctx.currentTime + 0.28);
    });
  }

  // Toggle (ligar/desligar) — click metálico
  function toggle() {
    tocar(ctx => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(1400, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.06);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      o.start(); o.stop(ctx.currentTime + 0.07);
    });
  }

  // Navegar entre páginas — whoosh suave
  function nav() {
    tocar(ctx => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(300, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      o.start(); o.stop(ctx.currentTime + 0.14);
    });
  }

  return { click, hover, confirm, back, error, success, del, toggle, nav };
})();
