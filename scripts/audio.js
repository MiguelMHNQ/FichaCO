// Player compartilhado por todas as páginas, incluindo configurações.
const _audioBase = location.pathname.replace(/\\/g,'/').includes('/pages/') ? '../assets/audio/' : 'assets/audio/';
const MUSICAS = [
  {nome:'Espera',arquivo:_audioBase+'Espera.mp3'},
  {nome:'Nossa Canção',arquivo:_audioBase+'TocareinNossaCanção.MP3'},
  {nome:'Porque ser Forte?',arquivo:_audioBase+'Dequevaleserforte.MP3'},
  {nome:'Dinheiro é VIDA',arquivo:_audioBase+'Dinheiroévida.MP3'},
  {nome:'Serei o Amanhecer',arquivo:_audioBase+'SerOAmanhecer.MP3'}
];
(() => {
  const mesaDaSessao=location.pathname.endsWith('/editor-mapa.html')&&/^\d{6}$/.test(new URLSearchParams(location.search).get('sessao')||'');
  const suspenso=()=>mesaDaSessao||window.PrimordiosAudioSuspenso;
  try{if(window.parent!==window&&window.parent.PrimordiosSessao)window.PrimordiosAudioSuspenso=true;}catch{}
  const lerConfig = () => { try { return JSON.parse(localStorage.getItem('primordios_config') || '{}') || {}; } catch { return {}; } };
  const indice = valor => Math.max(0,Math.min(MUSICAS.length-1,Math.trunc(Number(valor)||0)));
  const audio = document.getElementById('audioPlayer') || new Audio();
  audio.crossOrigin = 'anonymous';
  let idx = indice(lerConfig().musicaIdx);
  // Migração única da posição usada por versões anteriores do player.
  try{
    const saved=JSON.parse(sessionStorage.getItem('primordios_audio_estado')||'null');
    const old=sessionStorage.getItem('primordios_audio_pos');
    let valid=saved&&Number.isInteger(saved.indice)&&saved.indice>=0&&saved.indice<MUSICAS.length&&Number.isFinite(saved.segundos)&&saved.segundos>=0;
    if(!valid&&old!==null&&Number.isFinite(Number(old))&&Number(old)>=0){sessionStorage.setItem('primordios_audio_estado',JSON.stringify({indice:idx,segundos:Number(old)}));valid=true;}
    if(valid)sessionStorage.removeItem('primordios_audio_pos');
  }catch{}
  let retomando = false;
  window._primordiosAudio = audio; window._primordiosMusicaAtual = null;
  function evento(nome) {
    window._primordiosMusicaAtual = nome;
    window.dispatchEvent(new CustomEvent('primordios:musica',{detail:{nome}}));
  }
  function tocar() {
    if(suspenso())return;
    if (retomando || !window.ConsentimentoAudio?.permitido() || lerConfig().musicaAtiva !== true) return;
    audio.play().catch(() => {});
  }
  function carregar(i, retomar = false) {
    idx = indice(i);
    let salvo; try { salvo = JSON.parse(sessionStorage.getItem('primordios_audio_estado')); } catch {}
    const pos = retomar ? Math.max(0,Number(salvo?.indice === idx ? salvo.segundos : 0)||0) : 0;
    if (!retomar) { try { sessionStorage.setItem('primordios_audio_estado',JSON.stringify({indice:idx,segundos:0})); } catch {} }
    retomando = true;
    const concluir = () => { retomando = false; salvarPosicao(); tocar(); };
    audio.onseeked = () => { if (retomando) concluir(); };
    audio.onloadedmetadata = () => {
      if (pos && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(pos,Math.max(0,audio.duration-.1));
        if (audio.seeking) return;
      }
      concluir();
    };
    audio.src = MUSICAS[idx].arquivo;
    audio.load();
  }
  function aplicar() {
    if(suspenso()){salvarPosicao();audio.pause();return;}
    const cfg = lerConfig();
    audio.volume = Math.max(0,Math.min(1,(Number(cfg.volume ?? 20)||0)/100));
    if (!window.ConsentimentoAudio?.permitido() || cfg.musicaAtiva !== true) { audio.pause(); return; }
    if (!audio.getAttribute('src')) carregar(cfg.musicaIdx,true);
    else if (indice(cfg.musicaIdx) !== idx) carregar(cfg.musicaIdx);
    else tocar();
  }
  audio.addEventListener('play', () => evento(MUSICAS[idx].nome));
  audio.addEventListener('pause', () => evento(null));
  function salvarPosicao() {
    if (retomando || !Number.isFinite(audio.duration)) return;
    try {
      sessionStorage.setItem('primordios_audio_estado',JSON.stringify({indice:idx,segundos:audio.currentTime}));
    } catch {}
  }
  audio.addEventListener('timeupdate',salvarPosicao);
  window.addEventListener('pagehide',salvarPosicao);
  window.addEventListener('beforeunload',salvarPosicao);
  audio.addEventListener('ended', () => {
    const cfg = lerConfig();
    cfg.musicaIdx = cfg.modo === 'aleatoria' ? Math.floor(Math.random()*MUSICAS.length) : idx;
    localStorage.setItem('primordios_config',JSON.stringify(cfg));
    carregar(cfg.musicaIdx);
    window.dispatchEvent(new CustomEvent('primordios:faixa',{detail:{idx:cfg.musicaIdx}}));
  });
  window.addEventListener('storage',e => { if (e.key === 'primordios_config') aplicar(); });
  window.addEventListener('primordios:config',aplicar);
  window.addEventListener('primordios:audio-sessao',aplicar);
  document.addEventListener('click',() => { if (audio.paused) aplicar(); });
  window.AudioPrimordios = {audio,carregar,salvarPosicao,state:()=>({track:MUSICAS[idx],indice:idx,playing:!audio.paused&&!audio.ended&&!suspenso(),position:audio.currentTime})};
  audio.volume = Math.max(0,Math.min(1,(Number(lerConfig().volume ?? 20)||0)/100));
  if (!suspenso() && window.ConsentimentoAudio?.permitido() && lerConfig().musicaAtiva === true) carregar(idx,true);
  window.dispatchEvent(new Event('primordios:audio-pronto'));
})();
