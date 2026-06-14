// ===== AUDIO.JS =====
const MUSICAS = [
  { nome: 'Espera',             arquivo: 'audios/Espera.mp3' },
  { nome: 'Na Minha Floresta',  arquivo: 'audios/NaMinhaFloresta.mp3' },
  { nome: 'Brisa Em Waterfall', arquivo: 'audios/BrisaEmWaterfall.mp3' },
  { nome: 'Gustas',             arquivo: 'audios/Gustas.mp3' },
  { nome: 'O Monarca',          arquivo: 'audios/OMonarca.mp3' },
  { nome: 'Minha Dimensão',     arquivo: 'audios/MinhaDImensão.mp3' },
  { nome: 'O Rei',              arquivo: 'audios/ORei.mp3' },
];

(function () {
  const config = JSON.parse(localStorage.getItem('primordios_config') || '{}');
  if (config.musicaAtiva === false) return;

  const volume = (config.volume ?? 20) / 100;
  const modo   = config.modo || 'unica';
  let   idx    = config.musicaIdx ?? 0;

  const audio  = new Audio();
  audio.volume = volume;

  // Salva posição a cada segundo
  setInterval(() => {
    if (!audio.paused && audio.duration)
      sessionStorage.setItem('primordios_audio_pos', audio.currentTime);
  }, 1000);

  // Salva posição antes de sair da página
  window.addEventListener('beforeunload', () => {
    if (!audio.paused && audio.duration)
      sessionStorage.setItem('primordios_audio_pos', audio.currentTime);
  });

  function tocar(i, posicao) {
    idx = ((i % MUSICAS.length) + MUSICAS.length) % MUSICAS.length;
    audio.src = MUSICAS[idx].arquivo;

    audio.addEventListener('canplay', () => {
      if (posicao) audio.currentTime = posicao;
      audio.play().catch(() => {});
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

  // Retoma da posição salva se for a mesma música
  const posSalva   = parseFloat(sessionStorage.getItem('primordios_audio_pos') || '0');
  const idxSalvo   = config.musicaIdx ?? 0;

  const iniciar = () => {
    tocar(idxSalvo, posSalva > 0 ? posSalva : null);
    document.removeEventListener('click', iniciar);
  };

  // Tenta autoplay; se bloqueado aguarda clique
  audio.src = MUSICAS[idxSalvo].arquivo;
  audio.addEventListener('canplay', () => {
    if (posSalva > 0) audio.currentTime = posSalva;
    const p = audio.play();
    if (p) p.catch(() => document.addEventListener('click', iniciar));
  }, { once: true });

  // Sincroniza com alterações feitas em configurações
  window.addEventListener('storage', e => {
    if (e.key !== 'primordios_config') return;
    const c = JSON.parse(e.newValue || '{}');
    audio.volume = (c.volume ?? 20) / 100;
    if (c.musicaAtiva === false) {
      audio.pause();
    } else if (audio.paused) {
      tocar(c.musicaIdx ?? idx);
    } else if (c.musicaIdx !== idx) {
      sessionStorage.removeItem('primordios_audio_pos');
      tocar(c.musicaIdx);
    }
  });
})();
