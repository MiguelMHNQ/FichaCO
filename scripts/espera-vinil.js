// ===== ESPERA-VINIL.JS =====
// Sistema genérico de chibi + tema por música.
// Cada entrada em TEMAS define: qual música, qual chibi, qual cor do disco e tema CSS.

(function () {

  const BASE = (function () {
    const p = window.location.pathname.replace(/\\/g, '/');
    return p.includes('/pages/') ? '../assets/images/Chibis_musicas/' : 'assets/images/Chibis_musicas/';
  })();

  // ─── Tabela de configurações por música ──────────────────────────────────────
  // nomeMusica : deve bater exatamente com MUSICAS[i].nome em audio.js
  // srcMusica  : fragmento do src do <audio> para detectar qual está tocando
  // imgNormal  : chibi em repouso
  // imgSeguro  : chibi sendo carregado
  // tema       : classe CSS adicionada ao <body>
  // corLabel1  : cor de fundo do label central do disco
  // corLabel2  : cor interna do label
  // corTexto   : cor do texto no label
  // nomeLabel  : texto do label
  const TEMAS = [
    {
      nomeMusica: 'Espera',
      srcMusica:  'Espera',
      imgNormal:  BASE + 'Kur.png',
      imgSeguro:  BASE + 'KurSeg.png',
      tema:       'tema-espera',
      corLabel1:  '#a65320', corLabel2: '#7d3b16',
      corTexto:   '#ffe0b8', corTexto2: '#f3b777',
      nomeLabel:  'ESPERA',
      tamanho:    '140px',
      tamanhoSeg: '140px',
      offsetY:    -80,
      beatRgb:    '210, 112, 45',
    },
    {
      nomeMusica: 'Nossa Canção',
      srcMusica:  'TocareinNossaCanção',
      imgNormal:  BASE + 'Agata.png',
      imgSeguro:  BASE + 'AgataSeg.png',
      tema:       'tema-cancao',
      corLabel1:  '#2e6b4f', corLabel2: '#245c42',
      corTexto:   '#a8d4bc', corTexto2: '#7fb89a',
      nomeLabel:  'NOSSA CANÇÃO',
      tamanho:    '140px',
      tamanhoSeg: '140px',
      offsetY:    -80,
      beatRgb:    '46, 107, 79',
    },
    {
      nomeMusica: 'Porque ser Forte?',
      srcMusica:  'Dequevaleserforte',
      imgNormal:  BASE + 'Gustavo.png',
      imgSeguro:  BASE + 'GustavoSeg.png',
      tema:       'tema-forte',
      corLabel1:  '#7a1a1a', corLabel2: '#5c1010',
      corTexto:   '#f1a9a0', corTexto2: '#e87b6e',
      nomeLabel:  'SER FORTE?',
      tamanho:    '130px',
      tamanhoSeg: '90px',
      offsetY:    0,
      beatRgb:    '192, 57, 43',
    },
    {
      nomeMusica: 'Dinheiro é VIDA',
      srcMusica:  'Dinheiroévida',
      imgNormal:  BASE + 'Paral.png',
      imgSeguro:  BASE + 'ParalSeg.png',
      tema:       'tema-dinheiro',
      corLabel1:  '#4a1a6b', corLabel2: '#361050',
      corTexto:   '#d7b3f5', corTexto2: '#b07de0',
      nomeLabel:  'DINHEIRO',
      tamanho:    '140px',
      tamanhoSeg: '140px',
      offsetY:    -80,
      beatRgb:    '142, 68, 173',
    },
    {
      nomeMusica: 'Serei o Amanhecer',
      srcMusica:  'SerOAmanhecer',
      imgNormal:  BASE + 'Bastos.png',
      imgSeguro:  BASE + 'BastosSeg.png',
      tema:       'tema-amanhecer',
      corLabel1:  '#0d2b4a', corLabel2: '#081c30',
      corTexto:   '#a8cfe8', corTexto2: '#6aafd6',
      nomeLabel:  'AMANHECER',
      tamanho:    '130px',
      tamanhoSeg: '160px',
      offsetY:    -80,
      beatRgb:    '41, 128, 185',
    },
  ];

  const TODOS_TEMAS = TEMAS.map(t => t.tema);

  // ─── Injeta os elementos no body ─────────────────────────────────────────────
  if (!document.getElementById('beat-flash')) {
    const el = document.createElement('div');
    el.id = 'beat-flash';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }

  if (!document.getElementById('vinil-container')) {
    const vc = document.createElement('div');
    vc.id = 'vinil-container';
    vc.setAttribute('aria-hidden', 'true');
    vc.innerHTML = `
      <svg class="vinil-disco" id="vinil-svg" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="75" cy="75" r="74" fill="#111"/>
        <circle cx="75" cy="75" r="68" fill="none" stroke="#1e1e1e" stroke-width="1.2"/>
        <circle cx="75" cy="75" r="62" fill="none" stroke="#1e1e1e" stroke-width="1.0"/>
        <circle cx="75" cy="75" r="56" fill="none" stroke="#222"    stroke-width="0.9"/>
        <circle cx="75" cy="75" r="50" fill="none" stroke="#1e1e1e" stroke-width="0.9"/>
        <circle cx="75" cy="75" r="44" fill="none" stroke="#222"    stroke-width="0.8"/>
        <circle cx="75" cy="75" r="38" fill="none" stroke="#1e1e1e" stroke-width="0.8"/>
        <circle cx="75" cy="75" r="32" fill="none" stroke="#222"    stroke-width="0.7"/>
        <circle id="disco-label1" cx="75" cy="75" r="26" fill="#2e6b4f"/>
        <circle id="disco-label2" cx="75" cy="75" r="21" fill="#245c42"/>
        <text id="disco-txt1" x="75" y="68" text-anchor="middle" fill="#a8d4bc" font-size="5" font-family="Georgia,serif" letter-spacing="1">PRIMÓRDIOS</text>
        <text id="disco-txt2" x="75" y="78" text-anchor="middle" fill="#7fb89a" font-size="4.2" font-family="Georgia,serif" letter-spacing="0.5">ESPERA</text>
        <circle cx="75" cy="75" r="4.5" fill="#0a0a0f"/>
        <ellipse cx="55" cy="48" rx="16" ry="9" fill="white" opacity="0.03" transform="rotate(-30 55 48)"/>
      </svg>
      <div class="vinil-kur-wrap" id="kur-wrap">
        <img class="vinil-kur" id="kur-img" src="" alt="" draggable="false">
      </div>`;
    document.body.appendChild(vc);
  }

  const vinil    = document.getElementById('vinil-container');
  const beatFlash = document.getElementById('beat-flash');
  const kurWrap  = document.getElementById('kur-wrap');
  const kurImg   = document.getElementById('kur-img');
  const discoL1  = document.getElementById('disco-label1');
  const discoL2  = document.getElementById('disco-label2');
  const discoT1  = document.getElementById('disco-txt1');
  const discoT2  = document.getElementById('disco-txt2');

  // ─── Estado ──────────────────────────────────────────────────────────────────
  let temaAtivo = null; // referência ao objeto de TEMAS atual
  let imgNormal = '';
  let imgSeguro = '';

  // ─── Ativa tema ──────────────────────────────────────────────────────────────
  function ativarTema(cfg) {
    if (temaAtivo === cfg) return;

    // Remove qualquer tema anterior
    TODOS_TEMAS.forEach(t => document.body.classList.remove(t));
    if (temaAtivo) vinil.classList.remove('vinil-visivel');

    temaAtivo = cfg;
    imgNormal = cfg.imgNormal;
    imgSeguro = cfg.imgSeguro;

    // Atualiza o disco
    discoL1.setAttribute('fill', cfg.corLabel1);
    discoL2.setAttribute('fill', cfg.corLabel2);
    discoT1.setAttribute('fill', cfg.corTexto);
    discoT2.setAttribute('fill', cfg.corTexto2);
    discoT2.textContent = cfg.nomeLabel;

    // Atualiza o chibi
    kurImg.src   = imgNormal;
    kurImg.alt   = cfg.nomeMusica;
    kurImg.style.width   = cfg.tamanho;
    kurImg.style.height  = cfg.tamanho;
    kurImg.style.display = 'block';

    // Ativa o tema CSS
    document.body.classList.add(cfg.tema);
    beatFlash.style.setProperty('--beat-color', cfg.beatRgb);
    vinil.classList.add('vinil-visivel');
    iniciarAnalise();
  }

  function desativarTema() {
    if (!temaAtivo) return;
    temaAtivo = null;
    TODOS_TEMAS.forEach(t => document.body.classList.remove(t));
    vinil.classList.remove('vinil-visivel');
    beatFlash.classList.remove('beat-pulse');
    pararAnalise();
    if (_fallbackId) { clearInterval(_fallbackId); _fallbackId = null; }
    // Limpa o chibi — devolve ao wrapper se saiu durante drag
    if (kurImg.parentElement !== kurWrap) kurWrap.appendChild(kurImg);
    kurImg.style.position  = '';
    kurImg.style.left      = '';
    kurImg.style.top       = '';
    kurImg.style.bottom    = '';
    kurImg.style.zIndex    = '';
    kurImg.style.transform = '';
    kurImg.style.cursor    = 'grab';
    kurImg.style.display   = 'none';
    kurWrap.style.animationPlayState = '';
    // Limpa estilos inline do disco sem usar cssText (preserva posição CSS)
    vinil.style.left       = '';
    vinil.style.top        = '';
    vinil.style.right      = '';
    vinil.style.zIndex     = '';
    vinil.style.opacity    = '';
    vinil.style.transition = '';
    angle = 0; vel = 0;
  }

  // ─── Beat detection ──────────────────────────────────────────────────────────
  let _audioCtx = null, _analyser = null, _source = null;
  let _rafId = null, _fallbackId = null, _ultimoBeat = 0;

  function iniciarAnalise() {
    const el = window._primordiosAudio || document.getElementById('audioPlayer');
    if (!el) { iniciarFallback(); return; }
    try {
      if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      if (!_source) {
        _source   = _audioCtx.createMediaElementSource(el);
        _analyser = _audioCtx.createAnalyser();
        _analyser.fftSize = 256;
        _analyser.smoothingTimeConstant = 0.82;
        _source.connect(_analyser);
        _analyser.connect(_audioCtx.destination);
      }
      if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
      loopBeat();
    } catch (e) { iniciarFallback(); }
  }

  function iniciarFallback() {
    if (_fallbackId) return;
    _fallbackId = setInterval(() => { if (temaAtivo) pulsar(150); }, 620);
  }

  function pararAnalise() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  function loopBeat() {
    if (!temaAtivo || !_analyser) return;
    const buf = new Uint8Array(_analyser.frequencyBinCount);
    _analyser.getByteFrequencyData(buf);
    let soma = 0;
    for (let i = 0; i < 8; i++) soma += buf[i];
    const media = soma / 8;
    // Log temporário removido
    const agora = performance.now();
    if (media > 30 && agora - _ultimoBeat > 200) {
      _ultimoBeat = agora;
      pulsar(media);
    }
    _rafId = requestAnimationFrame(loopBeat);
  }

  function pulsar(intensidade) {
    const t = Math.min((intensidade - 30) / 70, 1);
    beatFlash.style.setProperty('--beat-t', t.toFixed(3));
    beatFlash.classList.remove('beat-pulse');
    void beatFlash.offsetWidth;
    beatFlash.classList.add('beat-pulse');
  }

  // ─── Física de balanço ───────────────────────────────────────────────────────
  const STIFF = 0.03;
  const DAMP  = 0.06;
  const TILT  = 0.002;
  let angle = 0, vel = 0, swingRaf = null;

  function loopSwing() {
    vel   += -STIFF * angle - DAMP * vel;
    angle += vel;
    kurImg.style.transform = `rotate(${angle.toFixed(4)}rad)`;
    if (Math.abs(angle) < 0.0003 && Math.abs(vel) < 0.0003) {
      angle = 0; vel = 0;
      kurImg.style.transform = '';
      swingRaf = null;
      return;
    }
    swingRaf = requestAnimationFrame(loopSwing);
  }

  function swing(impulso) {
    vel += impulso;
    if (!swingRaf) swingRaf = requestAnimationFrame(loopSwing);
  }

  // ─── Drag ────────────────────────────────────────────────────────────────────
  let arrastando = false, ox = 0, oy = 0, kx = 0, ky = 0, prevX = 0, dragVel = 0;

  function xy(e) {
    return e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };
  }

  function onDown(e) {
    if (!e.target.classList.contains('vinil-kur')) return;
    e.preventDefault();
    const r = kurImg.getBoundingClientRect();
    kx = r.left; ky = r.top;
    kurImg.style.position = 'fixed';
    kurImg.style.left     = kx + 'px';
    kurImg.style.top      = ky + 'px';
    kurImg.style.bottom   = 'unset';
    kurImg.style.zIndex   = '10000';
    document.body.appendChild(kurImg);
    arrastando = true;
    kurImg.src = imgSeguro;
    if (temaAtivo && temaAtivo.tamanhoSeg) {
      kurImg.style.width  = temaAtivo.tamanhoSeg;
      kurImg.style.height = temaAtivo.tamanhoSeg;
    }
    kurWrap.style.animationPlayState = 'paused';
    kurImg.style.cursor = 'grabbing';
    vinil.style.opacity    = '0';
    vinil.style.transition = 'opacity 0.2s ease';
    const { x, y } = xy(e);
    ox = x - kx;
    // offsetY positivo = chibi fica abaixo do cursor; 0 = centralizado
    oy = y - ky + (temaAtivo ? temaAtivo.offsetY : 50);
    prevX = x; dragVel = 0;
  }

  function onMove(e) {
    if (!arrastando) return;
    e.preventDefault();
    const { x, y } = xy(e);
    kx = x - ox; ky = y - oy;
    kurImg.style.left = kx + 'px';
    kurImg.style.top  = ky + 'px';
    dragVel = x - prevX; prevX = x;
    vel += dragVel * TILT;
    if (!swingRaf) swingRaf = requestAnimationFrame(loopSwing);
  }

  function onUp() {
    if (!arrastando) return;
    arrastando = false;
    kurImg.src = imgNormal;
    kurImg.style.cursor  = 'grab';
    kurImg.style.display = 'block';
    if (temaAtivo) {
      kurImg.style.width  = temaAtivo.tamanho;
      kurImg.style.height = temaAtivo.tamanho;
    }
    kurWrap.style.animationPlayState = 'running';
    const discoLeft = kx + (140 / 2) - (200 / 2);
    const discoTop  = ky + (140 / 2) - (200 / 2);
    vinil.style.transition = 'opacity 0.3s ease';
    vinil.style.left    = discoLeft + 'px';
    vinil.style.top     = discoTop  + 'px';
    vinil.style.right   = 'unset';
    vinil.style.zIndex  = '9998';
    vinil.style.opacity = '1';
    swing(dragVel * TILT * 2.5);
  }

  kurImg.addEventListener('mousedown',   onDown);
  kurImg.addEventListener('touchstart',  onDown, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup',   onUp);
  document.addEventListener('touchend',  onUp);
  // Começa invisível — só mostra quando tema ativar
  kurImg.style.cursor  = 'grab';
  kurImg.style.display = 'none';

  // ─── Detecta qual música está tocando ────────────────────────────────────────
  function cfgParaSrc(src) {
    if (!src) return null;
    // Decodifica a URL para comparar sem encoding (%C3%A9 → é)
    let srcDec = src;
    try { srcDec = decodeURIComponent(src); } catch (_) {}
    // Também compara sem acentos para cobrir variações de encoding
    const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const srcNorm = normalize(srcDec);
    return TEMAS.find(t => srcNorm.includes(normalize(t.srcMusica))) || null;
  }

  function cfgParaNome(nome) {
    if (!nome) return null;
    return TEMAS.find(t => t.nomeMusica === nome) || null;
  }

  function vincular(el) {
    if (!el || el._evVinilOk) return;
    el._evVinilOk = true;
    el.addEventListener('play', () => {
      const cfg = cfgParaSrc(el.src);
      if (cfg) ativarTema(cfg); else desativarTema();
    });
    el.addEventListener('pause',   () => desativarTema());
    el.addEventListener('emptied', () => setTimeout(() => {
      if (!cfgParaSrc(el.src)) desativarTema();
    }, 50));
  }

  window.addEventListener('primordios:musica', e => {
    const cfg = cfgParaNome(e.detail && e.detail.nome);
    if (cfg) ativarTema(cfg); else desativarTema();
  });

  function checar() {
    const el = window._primordiosAudio || document.getElementById('audioPlayer');
    if (!el) return;
    vincular(el);
    const cfg = cfgParaSrc(el.src);
    if (cfg && !el.paused) { ativarTema(cfg); return; }
    if (cfg)               { ativarTema(cfg); return; }
    // Fallback: lê localStorage
    if (!el.src || el.src === window.location.href) {
      try {
        const c = JSON.parse(localStorage.getItem('primordios_config') || '{}');
        if (c.musicaAtiva !== false) {
          // Ordem espelha MUSICAS[] no audio.js
          const nomes = [
            'Espera',           // 0
            'Nossa Canção',     // 1
            'Brisa Em Waterfall', // 2
            'Porque ser Forte?', // 3
            'Dinheiro é VIDA',  // 4
            'Serei o Amanhecer', // 5
          ];
          const cfgIdx = cfgParaNome(nomes[c.musicaIdx ?? 0] || '');
          if (cfgIdx) ativarTema(cfgIdx);
        }
      } catch (_) {}
    }
  }

  checar();
  setTimeout(checar, 300);
  setTimeout(checar, 1000);
  setTimeout(checar, 2500);

  // Segurança extra: quando o audio.js termina de setar o src e começa a tocar,
  // o evento nativo 'play' no elemento também aciona o checar
  function tentarVincularEChecar() {
    const el = window._primordiosAudio || document.getElementById('audioPlayer');
    if (el) {
      vincular(el);
      checar();
    }
  }
  // audio.js dispara primordios:musica via setTimeout(0) — nosso listener já está registrado acima
  // mas como segurança extra, checamos também quando o documento termina de carregar
  if (document.readyState === 'complete') {
    tentarVincularEChecar();
  } else {
    window.addEventListener('load', tentarVincularEChecar);
  }

})();
