// ===== AUDIO.JS =====

// Detecta base dos áudios conforme localização da página
const _audioBase = (function () {
  const path = window.location.pathname.replace(/\\/g, '/');
  return path.includes('/pages/') ? '../assets/audio/' : 'assets/audio/';
})();

const MUSICAS = [
  { nome: 'Espera',             arquivo: _audioBase + 'Espera.mp3' },
  { nome: 'Nossa Canção',  arquivo: _audioBase + 'TocareinNossaCanção.MP3' },
  { nome: 'Porque ser Forte?',             arquivo: _audioBase + 'Dequevaleserforte.mp3' },
  { nome: 'Dinheiro é VIDA',          arquivo: _audioBase + 'Dinheiroévida.mp3' },
  { nome: 'Serei o Amanhecer',     arquivo: _audioBase + 'SerOAmanhecer.mp3' },
];

(function () {
  const config = JSON.parse(localStorage.getItem('primordios_config') || '{}');

  const volume = (config.volume ?? 20) / 100;
  const modo   = config.modo || 'unica';
  let   idx    = config.musicaIdx ?? 0;

  const audio  = new Audio();
  audio.volume = volume;
  audio.crossOrigin = 'anonymous'; // necessário para Web Audio API

  // Expõe globalmente SEMPRE — necessário para espera-vinil.js e beat detection
  window._primordiosAudio = audio;
  window._primordiosMusicaAtual = null;

  // Se música estiver desativada, não inicia — mas o elemento fica exposto
  if (config.musicaAtiva === false) return;

  // Salva posição a cada segundo
  setInterval(() => {
    if (!audio.paused && audio.duration)
      sessionStorage.setItem('primordios_audio_pos', audio.currentTime);
  }, 1000);

  window.addEventListener('beforeunload', () => {
    if (!audio.paused && audio.duration)
      sessionStorage.setItem('primordios_audio_pos', audio.currentTime);
  });

  function dispararEventoMusica(nome) {
    window._primordiosMusicaAtual = nome;
    // Usa setTimeout 0 para garantir que listeners registrados no mesmo frame ainda recebam
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('primordios:musica', { detail: { nome } }));
    }, 0);
  }

  function tocar(i, posicao) {
    idx = ((i % MUSICAS.length) + MUSICAS.length) % MUSICAS.length;
    audio.src = MUSICAS[idx].arquivo;

    audio.addEventListener('canplay', () => {
      if (posicao) audio.currentTime = posicao;
      audio.play()
        .then(() => dispararEventoMusica(MUSICAS[idx].nome))
        .catch(() => {});
    }, { once: true });

    const cfg = JSON.parse(localStorage.getItem('primordios_config') || '{}');
    cfg.musicaIdx   = idx;
    cfg.musicaAtiva = true;
    localStorage.setItem('primordios_config', JSON.stringify(cfg));
  }

  audio.addEventListener('ended', () => {
    sessionStorage.removeItem('primordios_audio_pos');
    if (modo === 'aleatoria') tocar(Math.floor(Math.random() * MUSICAS.length));
    else tocar(idx);
  });

  const posSalva = parseFloat(sessionStorage.getItem('primordios_audio_pos') || '0');
  const idxSalvo = config.musicaIdx ?? 0;

  const iniciar = () => {
    tocar(idxSalvo, posSalva > 0 ? posSalva : null);
    document.removeEventListener('click', iniciar);
  };

  // Tentativa de autoplay; se bloqueado aguarda primeiro clique
  audio.src = MUSICAS[idxSalvo].arquivo;
  audio.addEventListener('canplay', () => {
    if (posSalva > 0) audio.currentTime = posSalva;
    const p = audio.play();
    if (p) {
      p.then(() => dispararEventoMusica(MUSICAS[idx].nome))
       .catch(() => document.addEventListener('click', iniciar, { once: true }));
    } else {
      dispararEventoMusica(MUSICAS[idxSalvo].nome);
    }
  }, { once: true });

  // Sincroniza com mudanças feitas na tela de configurações
  window.addEventListener('storage', e => {
    if (e.key !== 'primordios_config') return;
    const c = JSON.parse(e.newValue || '{}');
    audio.volume = (c.volume ?? 20) / 100;
    if (c.musicaAtiva === false) {
      audio.pause();
      dispararEventoMusica(null);
    } else if (audio.paused) {
      tocar(c.musicaIdx ?? idx);
    } else if (c.musicaIdx !== idx) {
      sessionStorage.removeItem('primordios_audio_pos');
      tocar(c.musicaIdx);
    }
  });
})();
