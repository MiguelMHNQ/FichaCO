// ===== FICHA.JS =====

function sincronizarPersonagem() {
  const user = JSON.parse(localStorage.getItem('primordios_logado') || 'null');
  if (!user) return;
  const lista = JSON.parse(localStorage.getItem('primordios_personagens_' + user.usuario) || '[]');
  const idx = lista.findIndex(p => p.nomePersonagem === estado.nomePersonagem);
  if (idx === -1) return;
  lista[idx] = Object.assign(lista[idx], {
    classe:  estado.classe,
    nivel:   estado.nivel,
    foto:    sessionStorage.getItem('fragmentados_foto') || '',
    desc:    sessionStorage.getItem('fragmentados_desc') || '',
    pvMax:   sessionStorage.getItem('fragmentados_pvmax'),
    peMax:   sessionStorage.getItem('fragmentados_pemax'),
    pv:      sessionStorage.getItem('fragmentados_pv'),
    pe:      sessionStorage.getItem('fragmentados_pe'),
    ca:      sessionStorage.getItem('fragmentados_ca'),
    xp:      sessionStorage.getItem('fragmentados_xp'),
    dados:   coletarDadosFicha(), // inventário, peso, checks, PCE...
    estadoCompleto: { ...estado }
  });
  gravarPersonagens(user.usuario, lista);
}

// Para campos digitados letra por letra (inventário): salva 0,4s depois da última tecla
let _timerSync = null;
function agendarSync() {
  clearTimeout(_timerSync);
  _timerSync = setTimeout(sincronizarPersonagem, 400);
}

// Garante o salvamento ao fechar a aba/navegador, recarregar ou sair da página
function _salvarAoSair() {
  clearTimeout(_timerSync);
  sincronizarPersonagem();
}
window.addEventListener('pagehide', _salvarAoSair);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') _salvarAoSair();
});

const XP_TABLE = [0,300,500,700,900,1100,1300,1500,1700,1900,2100,2300,2500,2700,2900,3100,3300,3500,3700,4000,0];

function calcularPV() {
  const info = CLASSES_PREVIEW[estado.classe];
  const dado = info ? info.dadoVidaNum : 8;
  const vidaAtrib = info ? info.vidaAtributo : 'Vigor';
  const vigor = calcBonus((estado.constancias[vidaAtrib] || 0) + bonusAcessorioConstancia(vidaAtrib));
  let total = (info ? info.vidaBase : dado) + vigor;
  for (let i = 1; i < estado.nivel; i++) total += Math.floor(Math.random() * dado) + 1 + vigor;
  return total;
}

function calcularPE() {
  const info = CLASSES_PREVIEW[estado.classe];
  const atribs = info ? info.energiaAtributos : ['Sabedoria', 'Vigor'];
  const energiaInicial = atribs.reduce((s, a) => s + calcBonus((estado.constancias[a] || 0) + bonusAcessorioConstancia(a)), 0);
  const atribNivel = info ? (info.energiaNivelAtributo || atribs[0]) : 'Sabedoria';
  const bonusNivel = bonusDeClasse() + calcBonus((estado.constancias[atribNivel] || 0) + bonusAcessorioConstancia(atribNivel));
  let total = energiaInicial;
  for (let i = 1; i < estado.nivel; i++) total += bonusNivel;
  return Math.max(1, total);
}

function alterarCA(delta) {
  const el = document.getElementById('caValor');
  if (!el) return;
  const bonusEscama = sessionStorage.getItem('fragmentados_anel_escama_ativo') === 'true' ? 2 : 0;
  const base = Number.parseInt(sessionStorage.getItem('fragmentados_ca') ?? String(Number.parseInt(el.textContent, 10) - bonusEscama), 10);
  definirCAFicha(Math.max(0, base + delta));
}

function definirCAFicha(valor) {
  const caBase = Number.parseInt(valor, 10);
  if (!Number.isFinite(caBase)) return;
  sessionStorage.setItem('fragmentados_ca', caBase);
  const el = document.getElementById('caValor');
  if (el) {
    const bonusEscama = sessionStorage.getItem('fragmentados_anel_escama_ativo') === 'true' ? 2 : 0;
    el.textContent = caBase + bonusEscama;
  }
  const ajuste = document.getElementById('caAjuste');
  if (ajuste) ajuste.value = caBase;
  sincronizarPersonagem();
}

function alterarPV(delta) {
  const el = document.getElementById('pvAtual');
  const max = parseInt(document.getElementById('pvMax').value) || 20;
  if (!el) return;
  let val = Math.max(0, parseInt(el.textContent) + delta);
  el.textContent = val;
  el.style.color = val <= 0 ? '#ff4444' : val <= max * 0.3 ? '#ff9944' : '#e0d6c8';
  sessionStorage.setItem('fragmentados_pv', val);
  sincronizarPersonagem();
}

function alterarPE(delta) {
  const el = document.getElementById('peAtual');
  const max = parseInt(document.getElementById('peMax').value) || 15;
  if (!el) return;
  let val = Math.max(0, parseInt(el.textContent) + delta);
  el.textContent = val;
  el.style.color = val <= 0 ? '#ff4444' : val <= max * 0.3 ? '#ff9944' : '#e0d6c8';
  sessionStorage.setItem('fragmentados_pe', val);
  sincronizarPersonagem();
}

const _timersFeedbackPE = new WeakMap();

function animarFeedbackPE(el, classe) {
  if (!el) return;
  el.classList.remove(classe);
  void el.offsetWidth;
  el.classList.add(classe);
  clearTimeout(_timersFeedbackPE.get(el));
  _timersFeedbackPE.set(el, setTimeout(() => {
    el.classList.remove(classe);
    if (classe === 'pe-gasto') el.removeAttribute('data-gasto');
    _timersFeedbackPE.delete(el);
  }, 1300));
}

function gastarPE(custo, recurso = 'PE', botao = null) {
  const el = document.getElementById('peAtual');
  if (!el || !Number.isFinite(custo) || custo <= 0) return false;
  const peAtual = parseInt(sessionStorage.getItem('fragmentados_pe') ?? el.textContent, 10);
  if (!Number.isFinite(peAtual)) {
    alert(`Não foi possível identificar seus ${recurso} atuais.`);
    return false;
  }
  if (peAtual < custo) {
    alert(`${recurso} insuficiente. Esta habilidade requer ${custo} ${recurso}; você tem ${peAtual} ${recurso}.`);
    return false;
  }
  alterarPE(-custo);
  el.dataset.gasto = `−${custo} ${recurso}`;
  animarFeedbackPE(el, 'pe-gasto');
  animarFeedbackPE(botao, 'habilidade-usada');
  return true;
}

function gastarPV(custo) {
  const el = document.getElementById('pvAtual');
  if (!el || !Number.isFinite(custo) || custo <= 0) return false;
  const pvAtual = parseInt(sessionStorage.getItem('fragmentados_pv') ?? el.textContent, 10);
  if (!Number.isFinite(pvAtual)) {
    alert('Não foi possível identificar seus PV atuais.');
    return false;
  }
  if (pvAtual < custo) {
    alert(`PV insuficiente. Esta magia requer ${custo} PV; você tem ${pvAtual} PV.`);
    return false;
  }
  alterarPV(-custo);
  return true;
}

function obterMagiaDoLivro(nome) {
  return obterListaMagiasDoLivro().find(magia => magia.titulo === nome) || null;
}

function obterListaMagiasDoLivro() {
  const volumes = [
    LIVRO_MAGIAS_V1, LIVRO_MAGIAS_V2, LIVRO_MAGIAS_V3, LIVRO_MAGIAS_V4,
    LIVRO_MAGIAS_V5, LIVRO_MAGIAS_V6, LIVRO_MAGIAS_V7, LIVRO_MAGIAS_V8,
    LIVRO_MAGIAS_V9
  ];
  const unicas = new Map();
  volumes.flat().forEach(magia => {
    if (!magia.subtitulo && /livro-tag-nivel">Vol\.\s*\d+/.test(magia.texto) && !unicas.has(magia.titulo)) {
      unicas.set(magia.titulo, magia);
    }
  });
  return [...unicas.values()];
}

function capacidadeGrimorio() {
  const checks = JSON.parse(sessionStorage.getItem('fragmentados_const_checks') || '{}');
  const arcanismo = calcBonus((estado.constancias['Inteligência'] || 0) + totalBonusRaca('Inteligência'))
    + bonusDeClasse() + (checks.Arcanismo || 0);
  return Math.max(0, estado.nivel + arcanismo);
}

function adicionarMagiaGrimorio(nome) {
  if (estado.classe !== 'Mago' || !obterMagiaDoLivro(nome)) return;
  if (!estado.magiasGrimorio) estado.magiasGrimorio = [];
  if (estado.magiasGrimorio.includes(nome)) return;
  const termoAtual = document.getElementById('grimorioBusca')?.value || '';
  const limite = capacidadeGrimorio();
  if (estado.magiasGrimorio.length >= limite) {
    alert(`Grimório cheio. O limite atual é ${limite} magias.`);
    return;
  }
  estado.magiasGrimorio.push(nome);
  salvarEstado();
  renderFicha();
  sincronizarPersonagem();
  abrirPopupGerenciarGrimorio(document.getElementById('btnGerenciarGrimorio'));
  const busca = document.getElementById('grimorioBusca');
  if (busca) {
    busca.value = termoAtual;
    busca.dispatchEvent(new Event('input'));
  }
}

function removerMagiaGrimorio(indice) {
  if (estado.classe !== 'Mago' || !Array.isArray(estado.magiasGrimorio)) return;
  estado.magiasGrimorio.splice(indice, 1);
  salvarEstado();
  renderFicha();
  sincronizarPersonagem();
}

function abrirPopupGerenciarGrimorio(anchorEl) {
  if (estado.classe !== 'Mago' || !anchorEl) return;
  const escolhidas = estado.magiasGrimorio || [];
  const limite = capacidadeGrimorio();
  const titulo = document.getElementById('popupCTTitulo');
  const cont = document.getElementById('popupCTLista');
  titulo.textContent = `Adicionar magia (${escolhidas.length}/${limite})`;
  cont.innerHTML = `
    <input id="grimorioBusca" type="search" placeholder="Buscar magia pelo nome..."
      style="box-sizing:border-box;width:100%;margin-bottom:8px;padding:7px 9px;background:#0e0c16;border:1px solid #3a3550;border-radius:3px;color:#e0d6c8;font-family:'Georgia',serif;">
    <div id="grimorioResultados" style="overflow-y:auto;max-height:45vh;"></div>`;
  const busca = document.getElementById('grimorioBusca');
  const resultados = document.getElementById('grimorioResultados');

  const renderResultados = () => {
    if (escolhidas.length >= limite) {
      resultados.innerHTML = '<div style="font-size:0.75rem;color:#888;padding:8px 2px;">Limite do grimório atingido. Exclua uma magia antes de adicionar outra.</div>';
      return;
    }
    const termo = busca.value.trim().toLocaleLowerCase('pt-BR');
    const disponiveis = obterListaMagiasDoLivro().filter(magia =>
      !escolhidas.includes(magia.titulo) && magia.titulo.toLocaleLowerCase('pt-BR').includes(termo)
    );
    resultados.innerHTML = '';
    if (!disponiveis.length) {
      resultados.innerHTML = '<div style="font-size:0.75rem;color:#666;padding:8px 2px;">Nenhuma magia disponível com esse nome.</div>';
      return;
    }
    disponiveis.slice(0, 40).forEach(magia => {
      const volume = magia.texto.match(/livro-tag-nivel">Vol\.\s*(\d+)/)?.[1];
      const linha = document.createElement('div');
      linha.className = 'item-linha';
      linha.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer;';
      const nome = document.createElement('span');
      nome.textContent = magia.titulo;
      const detalhe = document.createElement('span');
      detalhe.style.cssText = 'flex-shrink:0;font-size:0.65rem;color:#9d8bdb;';
      detalhe.textContent = `Vol. ${volume || '?'}`;
      linha.append(nome, detalhe);
      linha.title = magia.texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      linha.onclick = () => adicionarMagiaGrimorio(magia.titulo);
      resultados.appendChild(linha);
    });
    if (disponiveis.length > 40) {
      const aviso = document.createElement('div');
      aviso.style.cssText = 'font-size:0.68rem;color:#666;padding:4px 2px;';
      aviso.textContent = 'Refine a busca para ver mais resultados.';
      resultados.appendChild(aviso);
    }
  };

  busca.addEventListener('input', renderResultados);
  renderResultados();
  _posicionarPopupCT(anchorEl);
}

function custoManaMagia(magia) {
  const volume = magia.texto.match(/livro-tag-nivel">Vol\.\s*(\d+)/);
  if (!volume) return /livro-tag-nivel">Truque/i.test(magia.texto) ? 0 : null;
  return [0, 2, 4, 6, 10, 14, 18, 24, 30, 36][parseInt(volume[1], 10)] ?? null;
}

function conjurarMagiaDoGrimorio(indice) {
  const nome = estado.magiasGrimorio?.[indice];
  const magia = nome && obterMagiaDoLivro(nome);
  if (estado.classe !== 'Mago' || !magia) {
    alert('Não foi possível encontrar esta magia no grimório.');
    return;
  }

  const custo = custoManaMagia(magia);
  if (custo === null) {
    alert(`Não foi possível identificar o custo de ${nome}.`);
    return;
  }
  const usaPV = /Usa PV em vez de PE/i.test(magia.texto);
  const gastoConcluido = custo === 0 || (usaPV ? gastarPV(custo) : gastarPE(custo, 'Mana'));
  if (!gastoConcluido) return;
  alert(`${nome} conjurada. ${custo} ${usaPV ? 'PV' : 'Mana'} gastos.`);
}

function calcularPCEMax() {
  const n = estado.nivel;
  if (n >= 17) return 15;
  if (n >= 13) return 11;
  if (n >= 9)  return 9;
  if (n >= 5)  return 5;
  return 2;
}

function alterarPCE(delta) {
  const el  = document.getElementById('pceAtual');
  const max = calcularPCEMax();
  if (!el) return;
  let val = Math.min(max, Math.max(0, parseInt(el.textContent) + delta));
  el.textContent = val;
  el.style.color = val <= 0 ? '#ff4444' : val <= max * 0.3 ? '#ff9944' : '#e0d6c8';
  sessionStorage.setItem('fragmentados_pce', val);
  sincronizarPersonagem();
}

function alterarXP(delta) {
  setXP(Math.max(0, (parseInt(sessionStorage.getItem('fragmentados_xp') || '0')) + delta));
}

function setXP(val) {
  val = Math.max(0, val);
  while (estado.nivel < 20 && val >= XP_TABLE[estado.nivel]) { val = 0; estado.nivel++; salvarEstado(); _ganhoNivel(); }
  sessionStorage.setItem('fragmentados_xp', val);
  const xpEl    = document.getElementById('xpValor');
  const xpIn    = document.getElementById('xpInput');
  const barra   = document.getElementById('xpBarra');
  const nivelEl = document.getElementById('fichaNivel');
  if (xpEl)    xpEl.textContent  = val;
  if (xpIn)    xpIn.value        = val;
  if (nivelEl) nivelEl.textContent = estado.nivel;
  const xpNec  = XP_TABLE[estado.nivel] || 4000;
  const xpAnt  = XP_TABLE[estado.nivel - 1] || 0;
  const pct    = estado.nivel >= 20 ? 100 : Math.min(100, Math.round((val - xpAnt) / (xpNec - xpAnt) * 100));
  if (barra) barra.style.width = Math.max(0, pct) + '%';
  const contador = document.getElementById('xpContador');
  if (contador) contador.textContent = estado.nivel >= 20 ? 'Nível máximo' : val + ' / ' + xpNec + ' XP';
  sincronizarPersonagem();
  XP_TABLE.slice(1).forEach((xp, i) => {
    const lv  = i + 1;
    const row = document.getElementById('xp-row-' + lv);
    if (!row) return;
    row.style.color      = lv === estado.nivel ? '#c9a84c' : lv < estado.nivel ? '#555' : '#666';
    row.style.fontWeight = lv === estado.nivel ? 'bold' : 'normal';
  });
}

function _ganhoNivel() {
  const info = CLASSES_PREVIEW[estado.classe];
  if (!info) return;
  const dado      = info.dadoVidaNum || 8;
  const vigor     = calcBonus((estado.constancias[info.vidaAtributo] || 0) + bonusAcessorioConstancia(info.vidaAtributo));
  const rolado    = Math.floor(Math.random() * dado) + 1;
  const ganhoPV   = rolado + vigor;
  const atribPE   = info.energiaNivelAtributo || (info.energiaAtributos ? info.energiaAtributos[0] : 'Sabedoria');
  const bonusPE   = bonusDeClasse() + calcBonus((estado.constancias[atribPE] || 0) + bonusAcessorioConstancia(atribPE));

  const pvMaxAtual = parseInt(sessionStorage.getItem('fragmentados_pvmax')) || 1;
  const peMaxAtual = parseInt(sessionStorage.getItem('fragmentados_pemax')) || 1;
  const pvAtualVal = parseInt(sessionStorage.getItem('fragmentados_pv'))    || pvMaxAtual;
  const peAtualVal = parseInt(sessionStorage.getItem('fragmentados_pe'))    || peMaxAtual;

  const novoPVMax = pvMaxAtual + ganhoPV;
  const novoPEMax = peMaxAtual + bonusPE;
  const novoPV    = pvAtualVal + ganhoPV;
  const novoPE    = peAtualVal + bonusPE;

  sessionStorage.setItem('fragmentados_pvmax', novoPVMax);
  sessionStorage.setItem('fragmentados_pv',    novoPV);
  sessionStorage.setItem('fragmentados_pemax', novoPEMax);
  sessionStorage.setItem('fragmentados_pe',    novoPE);

  // popup canto superior direito
  let toast = document.getElementById('_nivelToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_nivelToast';
    toast.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;background:#1a1726;border:1px solid #c9a84c55;border-radius:6px;padding:14px 18px;font-size:0.8rem;color:#e0d6c8;line-height:1.8;box-shadow:0 4px 24px #0009;min-width:200px;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin-bottom:6px;">⬆ SUBIU DE NÍVEL!</div>
    <div>🎲 <b>1d${dado}</b> → <b style="color:#c9a84c">${rolado}</b> ${vigor > 0 ? `+ ${vigor} (${info.vidaAtributo})` : ''}</div>
    <div style="margin-top:4px;">❤️ PV +<b style="color:#c9a84c">${ganhoPV}</b></div>
    <div>⚡ PE +<b style="color:#c9a84c">${bonusPE}</b></div>`;
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

function fichaAlterarNivel(delta) {
  const nivelAntes = estado.nivel;
  estado.nivel = Math.min(20, Math.max(1, estado.nivel + delta));
  if (delta > 0 && estado.nivel > nivelAntes) _ganhoNivel();
  salvarEstado();
  renderFicha();
  sincronizarPersonagem();
}

function fichaAlterarAtributo(nome, delta) {
  const total = Object.values(estado.constancias).reduce((a,b) => a+b, 0);
  const max   = pontosTotal();
  if (delta > 0 && total >= max) return;
  if (delta > 0 && estado.constancias[nome] >= 20) return;
  if (delta < 0 && estado.constancias[nome] <= 0)  return;
  estado.constancias[nome] += delta;
  salvarEstado();
  const racaBonus = totalBonusRaca(nome) + bonusAcessorioConstancia(nome);
  const vTotal = estado.constancias[nome] + racaBonus;
  const el = document.getElementById('fa-' + nome);
  if (el) el.textContent = vTotal;
  const bonus    = calcBonus(vTotal);
  const bonusStr = bonus === 0 ? '—' : '+' + bonus;
  const fbEl = document.getElementById('fb-' + nome);
  if (fbEl) {
    fbEl.textContent   = bonusStr;
    fbEl.style.color      = bonus === 0 ? '#555' : '#c9a84c';
    fbEl.style.textShadow = bonus === 0 ? 'none' : '0 0 10px #c9a84c88';
  }
  atualizarConstanciasFicha();
  const ptGasto = Object.values(estado.constancias).reduce((a,b) => a+b, 0);
  const ptLivre = pontosTotal() - ptGasto;
  const ptEl    = document.getElementById('fichaPtUsados');
  if (ptEl) ptEl.textContent = ptGasto;
  const bloco = document.getElementById('fichaAtributosBloco');
  if (bloco) {
    let av = document.getElementById('fichaPontosAviso');
    if (ptLivre > 0 && !av) {
      const d = document.createElement('div');
      d.id = 'fichaPontosAviso';
      d.style.cssText = 'background:#c9a84c22;border:1px solid #c9a84c55;border-radius:3px;padding:8px 12px;margin-bottom:12px;font-size:0.78rem;color:#c9a84c;text-align:center;';
      d.innerHTML = `✨ Você tem <strong>${ptLivre}</strong> ponto${ptLivre > 1 ? 's' : ''} para distribuir!`;
      bloco.insertBefore(d, bloco.children[0].nextSibling);
    } else if (av) {
      if (ptLivre > 0) av.innerHTML = `✨ Você tem <strong>${ptLivre}</strong> ponto${ptLivre > 1 ? 's' : ''} para distribuir!`;
      else av.remove();
    }
  }
  if (nome === 'Força') {
    const pmEl = document.getElementById('pesoMax');
    if (pmEl) { pmEl.value = 7 * (estado.constancias['Força'] + 5); atualizarPeso(); }
  }
  sincronizarPersonagem();
}

function atualizarConstanciasFicha() {
  const info = CLASSES_PREVIEW[estado.classe];
  if (!info) return;
  const bc    = bonusDeClasse();
  const fixas = info.constanciasFixas || [];
  const esc   = estado.constanciasEscolhidas || [];
  const map   = {};
  Object.entries(CONSTANCIAS_MAP).forEach(([a, lista]) => lista.forEach(c => map[c] = a));
  const checks = JSON.parse(sessionStorage.getItem('fragmentados_const_checks') || '{}');
  [...fixas, ...esc].forEach(c => {
    const el = document.getElementById('ficha-const-' + c);
    if (!el) return;
    const atrib = map[c];
    const base = atrib ? (estado.constancias[atrib] || 0) : 0;
    const racaB = atrib ? totalBonusRaca(atrib) + bonusAcessorioConstancia(atrib) : 0;
    const bonusAtrib = calcBonus(base + racaB);
    el.textContent = '+' + (bonusAtrib + bc + (checks[c] || 0));
  });
}

function toggleConstCheck(cn, idx) {
  const checks = JSON.parse(sessionStorage.getItem('fragmentados_const_checks') || '{}');
  const atual  = checks[cn] || 0;
  checks[cn]   = idx < atual ? idx : idx + 1;
  sessionStorage.setItem('fragmentados_const_checks', JSON.stringify(checks));
  agendarSync();
  const novo = checks[cn];
  // atualiza badge na ficha (se estiver visível)
  const fichaEl = document.getElementById('ficha-const-' + cn);
  if (fichaEl) {
    const map = {};
    Object.entries(CONSTANCIAS_MAP).forEach(([a, lista]) => lista.forEach(c => map[c] = a));
    const atrib = map[cn];
    const base  = atrib ? (estado.constancias[atrib] || 0) : 0;
    const racaB = atrib ? totalBonusRaca(atrib) + bonusAcessorioConstancia(atrib) : 0;
    fichaEl.textContent = '+' + (calcBonus(base + racaB) + bonusDeClasse() + novo);
  }
  // atualiza boxes no popup
  [0,1,2].forEach(i => {
    const b = document.getElementById(`ccb-${cn}-${i}`);
    if (b) b.textContent = i < novo ? '*' : '';
  });
  // atualiza valor exibido no popup
  const popEl = document.getElementById('cpop-' + cn);
  if (popEl) {
    const map = {};
    Object.entries(CONSTANCIAS_MAP).forEach(([a, lista]) => lista.forEach(c => map[c] = a));
    const atrib = map[cn];
    const base  = atrib ? (estado.constancias[atrib] || 0) : 0;
    const racaB = atrib ? totalBonusRaca(atrib) + bonusAcessorioConstancia(atrib) : 0;
    const bonusBase = calcBonus(base + racaB);
    popEl.textContent = '+' + (bonusBase + novo);
  }
}

function limparEquip(slot) {
  if (slot === 'acessorio') {
    estado.acessoriosEquipados = {};
  }
  estado[slot] = null;
  salvarEstado();
  renderFicha();
  sincronizarPersonagem();
}

const SLOTS_ACESSORIOS = [
  { id: 'cabeca', nome: 'Cabeça', aceitos: ['coroa', 'tiara', 'óculos', 'monóculo'] },
  { id: 'pescoco', nome: 'Pescoço', aceitos: ['colar', 'amuleto'] },
  { id: 'costas', nome: 'Costas', aceitos: ['capa', 'manto'] },
  { id: 'maos', nome: 'Mãos · 1 par', aceitos: ['luvas', 'dados', 'laço'] },
  { id: 'dedo1', nome: 'Dedo · mão esquerda', aceitos: ['anel', 'anéis', 'dedo falso'] },
  { id: 'dedo2', nome: 'Dedo · mão direita', aceitos: ['anel', 'anéis', 'dedo falso'] },
  { id: 'cintura', nome: 'Cintura', aceitos: ['bolsa', 'bússola'] },
  { id: 'pes', nome: 'Pés · 1 par', aceitos: ['botas', 'sapatilhas'] },
  { id: 'pulsos', nome: 'Pulsos · opcional', aceitos: ['bracelete'] }
];

function slotCompativelAcessorio(item, slot) {
  const categoria = (item.tipo || '').split(' — ').pop().trim().toLocaleLowerCase('pt-BR');
  return slot.aceitos.some(tipo => categoria.includes(tipo));
}

function encontrarSlotAcessorio(item) {
  return SLOTS_ACESSORIOS.find(slot =>
    slotCompativelAcessorio(item, slot) &&
    !estado.acessoriosEquipados[slot.id]
  ) || null;
}

function normalizarAcessoriosEquipados() {
  const slots = Object.fromEntries(SLOTS_ACESSORIOS.map(slot => [slot.id, null]));
  if (estado.acessoriosEquipados && typeof estado.acessoriosEquipados === 'object') {
    Object.entries(estado.acessoriosEquipados).forEach(([id, nome]) => {
      if (id in slots && typeof nome === 'string' && ACESSORIOS.some(item => item.nome === nome)) {
        slots[id] = nome;
      }
    });
  }
  estado.acessoriosEquipados = slots;

  const legado = ACESSORIOS.find(item => item.nome === estado.acessorio);
  if (legado && !Object.values(slots).includes(legado.nome)) {
    const slot = encontrarSlotAcessorio(legado);
    if (slot) slots[slot.id] = legado.nome;
  }
  estado.acessorio = Object.values(slots).find(Boolean) || null;
}

function acessorioEstaEquipado(nome) {
  return Object.values(estado.acessoriosEquipados || {}).includes(nome) || estado.acessorio === nome;
}

function equiparAcessorioSlot(slotId, nome) {
  const slot = SLOTS_ACESSORIOS.find(item => item.id === slotId);
  if (!slot) return;
  const anterior = estado.acessoriosEquipados[slotId];
  const acessorio = nome ? ACESSORIOS.find(item => item.nome === nome) : null;
  if (nome && (!acessorio || !slotCompativelAcessorio(acessorio, slot))) {
    console.error(`Acessório incompatível com o espaço ${slot.nome}: ${nome}`);
    return;
  }
  if (acessorio && Object.entries(estado.acessoriosEquipados).some(([id, equipado]) => id !== slotId && equipado === nome)) {
    alert('Esse acessório já está equipado em outro espaço.');
    renderFicha();
    return;
  }

  if (anterior === 'Anel de Escama Endurecida' && anterior !== nome) {
    sessionStorage.setItem('fragmentados_anel_escama_ativo', 'false');
  }
  estado.acessoriosEquipados[slotId] = acessorio ? acessorio.nome : null;
  estado.acessorio = Object.values(estado.acessoriosEquipados).find(Boolean) || null;
  salvarEstado();
  renderFicha();
  sincronizarPersonagem();
}

function bonusAcessorioConstancia(nome) {
  return nome === 'Destreza' && acessorioEstaEquipado('Anel de Adrenalina') ? 2 : 0;
}

function inicializarCargasAcessorio(nome, chave, quantidade) {
  if (acessorioEstaEquipado(nome) && sessionStorage.getItem(chave) === null) {
    sessionStorage.setItem(chave, quantidade);
  }
}

function obterCargasAcessorio(item) {
  if (!estado.acessoriosCargas || typeof estado.acessoriosCargas !== 'object') {
    estado.acessoriosCargas = {};
  }
  const salvo = estado.acessoriosCargas[item.nome];
  if (!Number.isInteger(salvo) || salvo < 0 || salvo > item.carga) {
    estado.acessoriosCargas[item.nome] = item.carga;
    salvarEstado();
    return item.carga;
  }
  return salvo;
}

function definirCargasAcessorio(item, quantidade) {
  estado.acessoriosCargas[item.nome] = Math.max(0, Math.min(item.carga, quantidade));
  salvarEstado();
  sincronizarPersonagem();
  atualizarCargasAcessorios();
}

function consumirCargaAcessorio(item) {
  const cargas = obterCargasAcessorio(item);
  if (cargas <= 0) {
    alert(`${item.nome} está sem cargas. Recarregue conforme a condição indicada no acessório.`);
    return false;
  }
  definirCargasAcessorio(item, cargas - 1);
  return true;
}

function atualizarCargasAcessorios() {
  SLOTS_ACESSORIOS.forEach(slot => {
    const item = ACESSORIOS.find(acessorio => acessorio.nome === estado.acessoriosEquipados[slot.id]);
    if (!item || item.carga === null || ['Anel de Escama Endurecida', 'Puxa Corte', 'Colar de Cura', 'Pedra da Reflexão'].includes(item.nome)) return;
    const cargas = obterCargasAcessorio(item);
    const info = document.getElementById(`acessorioCargas-${slot.id}`);
    if (info) info.textContent = `Cargas: ${cargas}/${item.carga}`;
    const usar = document.getElementById(`acessorioUsar-${slot.id}`);
    if (usar) usar.disabled = cargas <= 0;
    const recarregar = document.getElementById(`acessorioRecarregar-${slot.id}`);
    if (recarregar) {
      recarregar.disabled = cargas >= item.carga;
      recarregar.title = item.recarga ? `Recarregue após: ${item.recarga}` : 'Recarregar cargas';
    }
  });
}

function renderAcessorioSlot(slot) {
  const nome = estado.acessoriosEquipados[slot.id];
  const item = ACESSORIOS.find(acessorio => acessorio.nome === nome);
  const opcoes = ACESSORIOS.filter(acessorio => slotCompativelAcessorio(acessorio, slot));
  if (item) {
    inicializarCargasAcessorio('Anel de Escama Endurecida', 'fragmentados_anel_escama_cargas', 2);
    inicializarCargasAcessorio('Anel de Escama Endurecida', 'fragmentados_anel_escama_ativo', 'false');
    inicializarCargasAcessorio('Puxa Corte', 'fragmentados_puxa_corte_cargas', 5);
    inicializarCargasAcessorio('Colar de Cura', 'fragmentados_colar_cura_cargas', 2);
    inicializarCargasAcessorio('Pedra da Reflexão', 'fragmentados_pedra_reflexao_cargas', 6);
    if (item.carga !== null && !['Anel de Escama Endurecida', 'Puxa Corte', 'Colar de Cura', 'Pedra da Reflexão'].includes(item.nome)) {
      obterCargasAcessorio(item);
    }
  }

  const seletor = `<select class="acessorio-slot-select" data-slot="${slot.id}" autocomplete="off" onchange="equiparAcessorioSlot(this.dataset.slot, this.value)" aria-label="Equipar acessório em ${slot.nome}">
    <option value="">Vazio</option>
    ${opcoes.map(opcao => `<option value="${opcao.nome}" ${opcao.nome === nome ? 'selected' : ''}>${opcao.nome}</option>`).join('')}
  </select>`;
  let conteudo = `<div class="acessorio-slot-card${item ? ' preenchido' : ''}">
    <div class="acessorio-slot-nome">${slot.nome}</div>
    ${seletor}`;

  if (item) {
    conteudo += `<div class="acessorio-slot-descricao">${item.desc}</div>`;
    conteudo += `<div class="acessorio-slot-detalhes">Raridade: ${item.raridade || '—'} · Ação: ${item.acao || 'Não especificada'}${item.recarga ? ` · Recarga: ${item.recarga}` : ''}</div>`;
    if (item.nome === 'Anel de Escama Endurecida') {
      conteudo += '<div id="anelEscamaInfo" class="acessorio-slot-cargas"></div>';
      conteudo += '<button id="anelEscamaUsar" class="c-btn acessorio-acao-btn" onclick="ativarAnelEscama()">✦ Ativar escudo (+2 CA)</button>';
      conteudo += '<button id="anelEscamaRecarregar" class="c-btn acessorio-acao-btn" onclick="recarregarAnelEscama()">↻ Recarregar (submerso por 1 turno)</button>';
    } else if (item.nome === 'Puxa Corte') {
      conteudo += '<div id="puxaCorteInfo" class="acessorio-slot-cargas"></div>';
      conteudo += '<button id="puxaCorteUsar" class="c-btn acessorio-acao-btn" onclick="usarCargaPuxaCorte()">✦ Anular 10 de dano cortante</button>';
      conteudo += '<button id="puxaCorteRecarregar" class="c-btn acessorio-acao-btn" onclick="recarregarPuxaCorte()">↻ Recarregar (descanso/meditação longa)</button>';
    } else if (item.nome === 'Colar de Cura') {
      conteudo += '<div id="colarCuraInfo" class="acessorio-slot-cargas"></div>';
      conteudo += '<button id="colarCuraUsar" class="c-btn acessorio-acao-btn" onclick="usarColarCura()">✦ Rolar cura (1d12 PV)</button>';
      conteudo += '<button id="colarCuraRecarregar" class="c-btn acessorio-acao-btn" onclick="recarregarColarCura()">↻ Recarregar (descanso/meditação média+)</button>';
    } else if (item.nome === 'Pedra da Reflexão') {
      conteudo += '<div id="pedraReflexaoInfo" class="acessorio-slot-cargas"></div>';
      conteudo += '<button id="pedraReflexaoUsar" class="c-btn acessorio-acao-btn" onclick="usarPedraReflexao()">✦ Rolar previsão (1d6)</button>';
      conteudo += '<button id="pedraReflexaoRecarregar" class="c-btn acessorio-acao-btn" onclick="recarregarPedraReflexao()">↻ Recarregar (descanso/meditação média+)</button>';
    } else if (item.carga !== null) {
      conteudo += `<div id="acessorioCargas-${slot.id}" class="acessorio-slot-cargas"></div>`;
      conteudo += `<button id="acessorioUsar-${slot.id}" class="c-btn acessorio-acao-btn" onclick="usarAcessorio('${item.nome}')">✦ Usar acessório</button>`;
      conteudo += `<button id="acessorioRecarregar-${slot.id}" class="c-btn acessorio-acao-btn" onclick="recarregarAcessorio('${item.nome}')">↻ Recarregar</button>`;
    } else {
      conteudo += `<button class="c-btn acessorio-acao-btn" onclick="usarAcessorio('${item.nome}')">${item.acao === 'Passiva' ? 'Ver efeito passivo' : '✦ Usar acessório'}</button>`;
    }
  } else {
    conteudo += '<div class="acessorio-slot-vazio">Escolha um acessório para este espaço</div>';
  }
  return conteudo + '</div>';
}

function abrirPopupEquip(slot) {
  const lista  = slot === 'arma' ? ARMAS : slot === 'armadura' ? ARMADURAS : ACESSORIOS;
  const popup  = document.getElementById('popupEquip');
  const titulo = document.getElementById('popupEquipTitulo');
  const cont   = document.getElementById('popupEquipLista');
  titulo.textContent = slot === 'arma' ? 'Arma' : slot === 'armadura' ? 'Armadura' : 'Acessório';
  cont.innerHTML = '';
  lista.forEach(item => {
    const ativo = estado[slot] === item.nome;
    const div   = document.createElement('div');
    div.className = 'item-linha' + (ativo ? ' ativo' : '');
    div.innerHTML = `<div style="font-size:0.85rem;">${item.nome}</div><div style="font-size:0.72rem;color:#666;margin-top:2px;">${item.dano || item.tipo || ''}</div>`;
    div.onclick = () => { estado[slot] = item.nome; salvarEstado(); fecharPopupEquip(); renderFicha(); sincronizarPersonagem(); };
    cont.appendChild(div);
  });
  popup.classList.add('aberto');
}

function fecharPopupEquip() {
  document.getElementById('popupEquip').classList.remove('aberto');
}

function rolarAtaqueArma() {
  const arma = ARMAS.find(item => item.nome === estado.arma);
  if (!arma) return;

  const formula = arma.dano.match(/(\d+)d(\d+)/i);
  const atributoAbreviado = arma.dano.match(/\+\s*(For|Des)\b/i)?.[1];
  const atributo = atributoAbreviado === 'For' ? 'Força' : atributoAbreviado === 'Des' ? 'Destreza' : null;
  const bonus = atributo
    ? calcBonus((estado.constancias[atributo] || 0) + totalBonusRaca(atributo) + bonusAcessorioConstancia(atributo))
    : 0;
  const descricao = `Ataque: ${arma.nome} (${arma.dano})`;

  if (formula) {
    const quantidade = Number(formula[1]);
    const lados = Number(formula[2]);
    rolagemRapida(Array(quantidade).fill(lados), bonus, descricao);
    return;
  }

  const danoFixo = arma.dano.match(/^\s*(\d+)(?:\s*\+\s*(For|Des))?/i);
  if (danoFixo) {
    const atributoFixo = danoFixo[2] === 'For' ? 'Força' : danoFixo[2] === 'Des' ? 'Destreza' : null;
    const bonusFixo = atributoFixo
      ? calcBonus((estado.constancias[atributoFixo] || 0) + totalBonusRaca(atributoFixo) + bonusAcessorioConstancia(atributoFixo))
      : 0;
    rolagemRapida([], Number(danoFixo[1]) + bonusFixo, descricao);
    return;
  }

  alert(`Não foi possível interpretar o dano de ${arma.nome}: ${arma.dano}`);
}

function ajustarRecursoFicha(recurso, quantidade) {
  const atualEl = document.getElementById(recurso === 'pv' ? 'pvAtual' : 'peAtual');
  const maxEl = document.getElementById(recurso === 'pv' ? 'pvMax' : 'peMax');
  if (!atualEl || !maxEl) return 0;

  const atual = Number.parseInt(atualEl.textContent, 10);
  const maximo = Number.parseInt(maxEl.value, 10);
  if (!Number.isFinite(atual) || !Number.isFinite(maximo)) return 0;

  const novo = Math.min(maximo, Math.max(0, atual + quantidade));
  const aplicado = novo - atual;
  if (recurso === 'pv') alterarPV(aplicado);
  else alterarPE(aplicado);
  return aplicado;
}

function usarAcessorio(nome = estado.acessorio) {
  const acessorio = ACESSORIOS.find(item => item.nome === nome);
  if (!acessorio) return;

  if (acessorio.nome === 'Colar de Cura') {
    usarColarCura();
    return;
  }

  if (acessorio.nome === 'Pedra da Reflexão') {
    usarPedraReflexao();
    return;
  }

  if (acessorio.nome === 'Puxa Corte') {
    usarCargaPuxaCorte();
    return;
  }

  if (acessorio.nome === 'Anel de Escama Endurecida') {
    ativarAnelEscama();
    return;
  }

  if (acessorio.nome === 'Membrana Pendente') {
    if (!consumirCargaAcessorio(acessorio)) return;
    const aplicado = ajustarRecursoFicha('pv', 18);
    alert(`Membrana Pendente: gastou 1 carga e ${aplicado > 0 ? `recuperou ${aplicado} PV` : 'PV já está no máximo'}. Remova manualmente uma condição menor, se houver.`);
    return;
  }

  if (acessorio.nome === 'Anel de Energia') {
    if (!consumirCargaAcessorio(acessorio)) return;
    const aplicado = ajustarRecursoFicha('pe', 16);
    alert(`Anel de Energia: gastou 1 carga e ${aplicado > 0 ? `recuperou ${aplicado} PE` : 'PE já está no máximo'}.`);
    return;
  }

  if (acessorio.nome === 'Óculos da Segunda Vida') {
    const pvAtual = Number.parseInt(sessionStorage.getItem('fragmentados_pv') || '0', 10);
    if (pvAtual > 0) {
      alert('Os Óculos da Segunda Vida só podem ser usados quando você chega a 0 PV.');
      return;
    }
    if (!consumirCargaAcessorio(acessorio)) return;

    const mapa = {};
    Object.entries(CONSTANCIAS_MAP).forEach(([atributo, lista]) => lista.forEach(nome => { mapa[nome] = atributo; }));
    const atributoVontade = mapa.Vontade;
    const checks = JSON.parse(sessionStorage.getItem('fragmentados_const_checks') || '{}');
    const bonusVontade = calcBonus((estado.constancias[atributoVontade] || 0) + totalBonusRaca(atributoVontade))
      + bonusDeClasse() + (checks.Vontade || 0);
    rolagemRapida([10], bonusVontade, 'Óculos da Segunda Vida: recuperação de PV', resultado => {
      const recuperado = ajustarRecursoFicha('pv', resultado);
      alert(`Óculos da Segunda Vida: você recuperou ${recuperado} PV.`);
    });
    return;
  }

  if (acessorio.acao === 'Passiva') {
    alert(`${acessorio.nome} é um acessório passivo.\n\n${acessorio.desc}`);
    return;
  }

  const cargasRestantes = acessorio.carga !== null
    ? obterCargasAcessorio(acessorio)
    : null;
  if (acessorio.carga !== null && !consumirCargaAcessorio(acessorio)) return;
  const recarga = acessorio.recarga ? `\nRecarga: ${acessorio.recarga}.` : '';
  const gasto = acessorio.carga !== null
    ? `\n\n1 carga gasta (${cargasRestantes - 1}/${acessorio.carga}).`
    : '';
  alert(`${acessorio.nome} — ${acessorio.acao || 'Ativação'}\n\n${acessorio.desc}${gasto}${recarga}\n\nResolva o efeito descrito conforme a situação da aventura.`);
}

function recarregarAcessorio(nome) {
  const acessorio = ACESSORIOS.find(item => item.nome === nome);
  if (!acessorio || acessorio.carga === null || !acessorioEstaEquipado(nome)) return;
  const cargas = obterCargasAcessorio(acessorio);
  if (cargas >= acessorio.carga) {
    alert(`${nome} já está com todas as cargas.`);
    return;
  }
  definirCargasAcessorio(acessorio, acessorio.carga);
  alert(`${nome} recarregado. Condição de recarga: ${acessorio.recarga || 'não especificada'}.`);
}

function atualizarColarCuraUI(mensagem = '') {
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_colar_cura_cargas') || '2', 10);
  const info = document.getElementById('colarCuraInfo');
  if (info) info.textContent = mensagem ? `Cargas: ${cargas}/2 · ${mensagem}` : `Cargas: ${cargas}/2`;
  const usar = document.getElementById('colarCuraUsar');
  if (usar) usar.disabled = cargas <= 0;
  const recarregar = document.getElementById('colarCuraRecarregar');
  if (recarregar) recarregar.disabled = cargas >= 2;
}

function usarColarCura() {
  if (!acessorioEstaEquipado('Colar de Cura')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_colar_cura_cargas') || '2', 10);
  if (cargas <= 0) {
    atualizarColarCuraUI('sem cargas; recarregue após descanso ou meditação média+');
    return;
  }

  sessionStorage.setItem('fragmentados_colar_cura_cargas', cargas - 1);
  atualizarColarCuraUI();
  sincronizarPersonagem();
  rolagemRapida([12], 0, 'Colar de Cura: recuperação de PV', resultado => {
    const recuperado = ajustarRecursoFicha('pv', resultado);
    atualizarColarCuraUI(`rolou ${resultado}; recuperou ${recuperado} PV`);
  });
}

function recarregarColarCura() {
  if (!acessorioEstaEquipado('Colar de Cura')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_colar_cura_cargas') || '2', 10);
  if (cargas >= 2) {
    atualizarColarCuraUI('já está com as 2 cargas');
    return;
  }
  sessionStorage.setItem('fragmentados_colar_cura_cargas', '2');
  atualizarColarCuraUI('recarregado após descanso ou meditação média+');
  sincronizarPersonagem();
}

function atualizarPedraReflexaoUI(mensagem = '') {
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_pedra_reflexao_cargas') || '6', 10);
  const info = document.getElementById('pedraReflexaoInfo');
  if (info) info.textContent = mensagem ? `Cargas: ${cargas}/6 · ${mensagem}` : `Cargas: ${cargas}/6`;
  const usar = document.getElementById('pedraReflexaoUsar');
  if (usar) usar.disabled = cargas <= 0;
  const recarregar = document.getElementById('pedraReflexaoRecarregar');
  if (recarregar) recarregar.disabled = cargas >= 6;
}

function usarPedraReflexao() {
  if (!acessorioEstaEquipado('Pedra da Reflexão')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_pedra_reflexao_cargas') || '6', 10);
  if (cargas <= 0) {
    atualizarPedraReflexaoUI('sem cargas; recarregue após descanso ou meditação média+');
    return;
  }

  sessionStorage.setItem('fragmentados_pedra_reflexao_cargas', cargas - 1);
  atualizarPedraReflexaoUI('rolando d6...');
  sincronizarPersonagem();
  rolagemRapida([6], 0, 'Pedra da Reflexão: visão do futuro', resultado => {
    const efeito = resultado <= 3
      ? 'desvantagem no próximo ataque'
      : 'vantagem no próximo ataque';
    atualizarPedraReflexaoUI(`saiu ${resultado}: ${efeito}`);
    sincronizarPersonagem();
  });
}

function recarregarPedraReflexao() {
  if (!acessorioEstaEquipado('Pedra da Reflexão')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_pedra_reflexao_cargas') || '6', 10);
  if (cargas >= 6) {
    atualizarPedraReflexaoUI('já está com as 6 cargas');
    return;
  }
  sessionStorage.setItem('fragmentados_pedra_reflexao_cargas', '6');
  atualizarPedraReflexaoUI('recarregada após descanso ou meditação média+');
  sincronizarPersonagem();
}

function atualizarAnelEscamaUI() {
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_anel_escama_cargas') || '2', 10);
  const ativo = sessionStorage.getItem('fragmentados_anel_escama_ativo') === 'true';
  const base = Number.parseInt(sessionStorage.getItem('fragmentados_ca') || '0', 10);
  const caEl = document.getElementById('caValor');
  if (caEl && base > 0) caEl.textContent = base + (ativo ? 2 : 0);

  const caInfo = document.getElementById('anelEscamaCAInfo');
  if (caInfo) {
    caInfo.style.display = ativo ? 'block' : 'none';
    caInfo.textContent = ativo ? `Anel ativo: +2 CA (total ${base + 2})` : '';
  }

  const info = document.getElementById('anelEscamaInfo');
  if (info) {
    info.textContent = `Cargas: ${cargas}/2 · ${ativo ? 'Escudo ativo (+2 CA)' : 'Escudo inativo'}`;
    info.style.color = ativo ? '#7ecfb3' : '#888';
  }

  const usar = document.getElementById('anelEscamaUsar');
  if (usar) {
    usar.textContent = ativo ? 'Fui acertado — encerrar escudo' : '✦ Ativar escudo (+2 CA)';
    usar.onclick = ativo ? encerrarEscudoAnelEscama : ativarAnelEscama;
    usar.disabled = !ativo && cargas <= 0;
    usar.title = ativo ? 'O escudo termina quando você é acertado' : cargas > 0 ? 'Gasta 1 carga; ação bônus ou reação' : 'Sem cargas. Recarregue ficando submerso por 1 turno.';
  }

  const recarregar = document.getElementById('anelEscamaRecarregar');
  if (recarregar) recarregar.disabled = cargas >= 2;
}

function ativarAnelEscama() {
  if (!acessorioEstaEquipado('Anel de Escama Endurecida')) return;
  if (sessionStorage.getItem('fragmentados_anel_escama_ativo') === 'true') {
    alert('O escudo do Anel de Escama Endurecida já está ativo.');
    return;
  }
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_anel_escama_cargas') || '2', 10);
  if (cargas <= 0) {
    alert('O Anel de Escama Endurecida está sem cargas. Fique submerso embaixo da água por 1 turno para recarregá-lo.');
    return;
  }
  sessionStorage.setItem('fragmentados_anel_escama_cargas', cargas - 1);
  sessionStorage.setItem('fragmentados_anel_escama_ativo', 'true');
  atualizarAnelEscamaUI();
  sincronizarPersonagem();
}

function encerrarEscudoAnelEscama() {
  if (sessionStorage.getItem('fragmentados_anel_escama_ativo') !== 'true') return;
  sessionStorage.setItem('fragmentados_anel_escama_ativo', 'false');
  atualizarAnelEscamaUI();
  sincronizarPersonagem();
}

function recarregarAnelEscama() {
  if (!acessorioEstaEquipado('Anel de Escama Endurecida')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_anel_escama_cargas') || '2', 10);
  if (cargas >= 2) {
    alert('O Anel de Escama Endurecida já está com as 2 cargas.');
    return;
  }
  sessionStorage.setItem('fragmentados_anel_escama_cargas', '2');
  atualizarAnelEscamaUI();
  sincronizarPersonagem();
  alert('Anel de Escama Endurecida recarregado após ficar submerso por 1 turno.');
}

function atualizarPuxaCorteUI() {
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_puxa_corte_cargas') || '5', 10);
  const info = document.getElementById('puxaCorteInfo');
  if (info) info.textContent = `Cargas: ${cargas}/5`;
  const usar = document.getElementById('puxaCorteUsar');
  if (usar) usar.disabled = cargas <= 0;
  const recarregar = document.getElementById('puxaCorteRecarregar');
  if (recarregar) recarregar.disabled = cargas >= 5;
}

function usarCargaPuxaCorte() {
  if (!acessorioEstaEquipado('Puxa Corte')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_puxa_corte_cargas') || '5', 10);
  if (cargas <= 0) {
    alert('O anel Puxa Corte está sem cargas. Recarregue-o após um descanso longo ou meditação longa.');
    return;
  }
  sessionStorage.setItem('fragmentados_puxa_corte_cargas', cargas - 1);
  atualizarPuxaCorteUI();
  sincronizarPersonagem();
  alert(`Puxa Corte: 1 carga gasta (${cargas - 1}/5). Reduza em 10 o dano cortante recebido e ignore o ferimento complementar desse golpe.`);
}

function recarregarPuxaCorte() {
  if (!acessorioEstaEquipado('Puxa Corte')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_puxa_corte_cargas') || '5', 10);
  if (cargas >= 5) {
    alert('O anel Puxa Corte já está com as 5 cargas.');
    return;
  }
  sessionStorage.setItem('fragmentados_puxa_corte_cargas', '5');
  atualizarPuxaCorteUI();
  sincronizarPersonagem();
  alert('Anel Puxa Corte recarregado após um descanso longo ou meditação longa.');
}

function abrirConstancias(atributo, vTotal) {
  const bonusBase = calcBonus(vTotal);
  const checks    = JSON.parse(sessionStorage.getItem('fragmentados_const_checks') || '{}');
  const lista     = CONSTANCIAS_MAP[atributo] || [];
  document.getElementById('popupAtributoTitulo').textContent = atributo + ' (bônus: +' + bonusBase + ')';
  document.getElementById('popupAtributoLista').innerHTML = lista.map(c => {
    const ch  = checks[c] || 0;
    const val = bonusBase + ch;
    const boxes = [0,1,2].map(i => `<span id="ccb-${c}-${i}" onclick="toggleConstCheck('${c}',${i})" style="cursor:pointer;font-size:0.75rem;display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;border:1px solid #3a3550;border-radius:2px;margin-right:2px;color:#c9a84c;">${i < ch ? '*' : ''}</span>`).join('');
    return `<div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-size:0.82rem;color:#e0d6c8;">${c}</span>
        <span id="cpop-${c}" style="font-size:1rem;color:#c9a84c;font-weight:bold;min-width:32px;text-align:right;">+${val}</span>
      </div>
      <div>${boxes}</div>
    </div>`;
  }).join('');
  document.getElementById('popupAtributo').classList.add('aberto');
}

function abrirInfoClasse() {
  const d = CLASSES_PREVIEW[estado.classe];
  if (!d) return;
  const extra = CLASSES_INFO_EXTRA[estado.classe];

  const sec = (t) => `<div style="font-size:0.62rem;letter-spacing:2px;color:#c9a84c;margin:14px 0 8px;padding-top:10px;border-top:1px solid #1a1726;">${t}</div>`;
  const row = (l,v) => `<div style="font-size:0.78rem;color:#aaa;margin-bottom:5px;">${l}: <span style="color:#e0d6c8;">${v}</span></div>`;
  const tbl = (rows) => `<table style="width:100%;border-collapse:collapse;font-size:0.72rem;margin-bottom:4px;">${rows.map((r,i)=>`<tr>${r.map(c=>`<td style="padding:3px 6px 3px 0;border-bottom:1px solid #1a1726;color:${i===0?'#c9a84c':r[0]==='—'?'#444':'#aaa'}">${c}</td>`).join('')}</tr>`).join('')}</table>`;

  // monta abas
  const abas = [{ id:'base', label:'Geral' }];
  if (extra) extra.secoes.forEach((s,i) => abas.push({ id:'s'+i, label: s.titulo.split(' ')[0] }));

  // conteúdo de cada aba
  const conteudos = {};

  // aba base
  let base = `<div style="font-size:0.75rem;color:#888;line-height:1.7;margin-bottom:12px;font-style:italic;">${d.desc}</div>`;
  base += sec('VIDA & ENERGIA');
  base += row('Dado de vida', d.dadoVida) + row('Vida inicial', d.vidaInicial) + row('Vida por nível', d.vidaNivel);
  base += row('Energia inicial', d.energiaInicial) + row('Energia por nível', d.energiaNivel);
  if (d.especificacoes && d.especificacoes !== 'Nenhuma') { base += sec('ESPECIFICAÇÕES'); base += `<div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${d.especificacoes}</div>`; }
  base += sec('CONSTÂNCIAS FIXAS') + `<div style="font-size:0.78rem;color:#e0d6c8;margin-bottom:4px;">${d.constanciasFixas.join(', ')}</div>`;
  base += sec('PROFICIÊNCIAS') + row('Armas', (d.armas||[]).join(', ')) + row('Armaduras', (d.armaduras||[]).join(', '));
  conteudos['base'] = base;

  if (extra) {
    extra.secoes.forEach((s,i) => {
      let html = `<div style="font-size:0.62rem;letter-spacing:2px;color:#c9a84c;margin-bottom:10px;">${s.titulo}</div>`;
      if (s.texto) html += `<div style="font-size:0.75rem;color:#888;line-height:1.6;margin-bottom:8px;">${s.texto}</div>`;
      if (s.itens) s.itens.forEach(it => { html += row(it.label, it.valor); });
      if (s.tabela) html += tbl(s.tabela);
      if (s.textoExtra) html += `<div style="font-size:0.7rem;color:#666;font-style:italic;margin-top:4px;">${s.textoExtra}</div>`;
      if (s.lista) html += `<ul style="font-size:0.75rem;color:#aaa;line-height:1.8;padding-left:14px;margin:4px 0;">${s.lista.map(l=>`<li>${l}</li>`).join('')}</ul>`;
      conteudos['s'+i] = html;
    });
  }

  document.getElementById('picTitulo').textContent = estado.classe;
  const navbar = document.getElementById('picNavbar');
  navbar.innerHTML = '';
  abas.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'pic-aba' + (a.id === 'base' ? ' ativa' : '');
    btn.textContent = a.label;
    btn.onclick = () => {
      navbar.querySelectorAll('.pic-aba').forEach(b => b.classList.remove('ativa'));
      btn.classList.add('ativa');
      document.getElementById('picConteudo').innerHTML = conteudos[a.id];
    };
    navbar.appendChild(btn);
  });
  document.getElementById('picConteudo').innerHTML = conteudos['base'];
  document.getElementById('popupInfoClasse').classList.add('aberto');
}

function fecharPopupInfoClasse() {
  document.getElementById('popupInfoClasse').classList.remove('aberto');
}

function fecharPopupAtributo() {
  document.getElementById('popupAtributo').classList.remove('aberto');
}

function carregarFoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    // Reduz a foto antes de guardar, senão ela estoura o limite de espaço do navegador
    const img = new Image();
    img.onload = () => {
      const MAX = 500;
      const escala = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.max(1, Math.round(img.width  * escala));
      canvas.height = Math.max(1, Math.round(img.height * escala));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = file.type === 'image/jpeg'
        ? canvas.toDataURL('image/jpeg', 0.85)
        : canvas.toDataURL('image/png');
      try {
        sessionStorage.setItem('fragmentados_foto', dataUrl);
      } catch (err) {
        alert('A foto é grande demais para salvar. Tente uma imagem menor.');
        return;
      }
      renderFicha();
      sincronizarPersonagem();
    };
    img.onerror = () => alert('Não consegui abrir essa imagem.');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removerFoto() {
  sessionStorage.removeItem('fragmentados_foto');
  renderFicha();
  sincronizarPersonagem();
}

// ===== INVENTÁRIO =====
function carregarInventario() {
  const itens = JSON.parse(sessionStorage.getItem('fragmentados_inventario') || '[]');
  if (!estado.grimorioInicializado) {
    if (estado.classe === 'Mago' && !itens.some(item => item.nome === 'Grimório Arcano')) {
      itens.push({ nome: 'Grimório Arcano', qtd: 1, peso: 1 });
      sessionStorage.setItem('fragmentados_inventario', JSON.stringify(itens));
    }
    estado.grimorioInicializado = true;
    salvarEstado();
  }
  const lista = document.getElementById('inventarioLista');
  if (!lista) return;
  lista.innerHTML = '';
  itens.forEach((item, i) => adicionarLinhaInventario(item.nome, item.qtd, item.peso, i));
  atualizarPeso();
  const pesoMax = sessionStorage.getItem('fragmentados_pesomax');
  if (pesoMax) { const el = document.getElementById('pesoMax'); if (el) el.value = pesoMax; }
}

function adicionarItem() {
  const itens = JSON.parse(sessionStorage.getItem('fragmentados_inventario') || '[]');
  itens.push({ nome: '', qtd: 1, peso: 0 });
  sessionStorage.setItem('fragmentados_inventario', JSON.stringify(itens));
  adicionarLinhaInventario('', 1, 0, itens.length - 1);
  atualizarPeso();
  agendarSync();
}

function adicionarLinhaInventario(nome, qtd, peso, idx) {
  const lista = document.getElementById('inventarioLista');
  const row   = document.createElement('div');
  row.id    = 'inv-row-' + idx;
  row.style = 'display:grid;grid-template-columns:1fr 44px 54px 28px;gap:6px;align-items:center;margin-bottom:6px;';
  row.innerHTML = `
    <input type="text" value="${nome}" placeholder="Nome do item" style="background:transparent;border:none;border-bottom:1px solid #2a2535;color:#e0d6c8;font-size:0.78rem;padding:2px 4px;width:100%;" oninput="salvarItemInventario(${idx},'nome',this.value)">
    <input type="number" value="${qtd}" min="1" style="width:100%;background:transparent;border:none;border-bottom:1px solid #2a2535;color:#aaa;font-size:0.78rem;text-align:center;" oninput="salvarItemInventario(${idx},'qtd',this.value);atualizarPeso()">
    <input type="number" value="${peso}" min="0" step="0.1" style="width:100%;background:transparent;border:none;border-bottom:1px solid #2a2535;color:#aaa;font-size:0.78rem;text-align:center;" oninput="salvarItemInventario(${idx},'peso',this.value);atualizarPeso()">
    <button class="c-btn" style="color:#ff4444;border-color:#ff444444;" onclick="removerItemInventario(${idx})">&#x2715;</button>`;
  lista.appendChild(row);
}

function salvarItemInventario(idx, campo, valor) {
  const itens = JSON.parse(sessionStorage.getItem('fragmentados_inventario') || '[]');
  if (!itens[idx]) return;
  itens[idx][campo] = campo === 'nome' ? valor : parseFloat(valor) || 0;
  sessionStorage.setItem('fragmentados_inventario', JSON.stringify(itens));
  agendarSync();
}

function removerItemInventario(idx) {
  const itens = JSON.parse(sessionStorage.getItem('fragmentados_inventario') || '[]');
  itens.splice(idx, 1);
  sessionStorage.setItem('fragmentados_inventario', JSON.stringify(itens));
  carregarInventario();
  agendarSync();
}

function atualizarPeso() {
  const itens = JSON.parse(sessionStorage.getItem('fragmentados_inventario') || '[]');
  const total = itens.reduce((s, i) => s + (parseFloat(i.peso) || 0) * (parseInt(i.qtd) || 1), 0);
  const el    = document.getElementById('pesoTotal');
  const maxEl = document.getElementById('pesoMax');
  if (!el) return;
  const max = parseFloat(maxEl?.value) || 0;
  el.textContent = total.toFixed(1);
  el.style.color = max && total > max ? '#ff4444' : '#c9a84c';
  if (maxEl?.value) { sessionStorage.setItem('fragmentados_pesomax', maxEl.value); agendarSync(); }
}

// ===== RENDER FICHA =====
function _deslocamentoRaca(raca) {
  const mapa = {
    'Humanos':     '9m',
    'Aarakocra':   '7,5m (terra) · 15m (voo)',
    'Elfos':       '9m',
    'Tabaxi':      '12m · 9m (escalada)',
    'Tiefling':    '9m',
    'Inseticídio': '9m (terra e escalada)',
    'Metamorfo':   '9m',
    'Gigante':     '10,5m',
    'Celestial':   '9m (terra) · 12m (voo)',
    'Draconato':   '9m',
    'Orcs':        '9m',
    'Ogros':       '9m',
    'Gnomos':      '7,5m',
    'Anões':       '7,5m',
    'Aquárions':   '9m (terra) · 18m (água)',
    'Lopinos':     '10,5m',
    'Fadas':       '9m (terra) · 12m (voo)',
    'Vampiros':    '9m (terra) · 15m (voo)',
    'Medusas':     '7,5m',
    'Anjos':       '9m (terra) · 9m (voo)',
  };
  return mapa[raca] || '9m';
}

function renderFicha() {
  _carregarCores();
  normalizarAcessoriosEquipados();
  const c = document.getElementById('fichaConteudo');
  c.innerHTML = '';
  const layout = _layoutAtual();
  _aplicarClasseLayout();

  // --- IDENTIDADE ---
  const fotoSalva = sessionStorage.getItem('fragmentados_foto') || '';
  const descSalva = sessionStorage.getItem('fragmentados_desc') || '';
  const info = CLASSES_PREVIEW[estado.classe];
  const bc   = bonusDeClasse();
  const fixas = info ? (info.constanciasFixas || []) : [];
  const esc   = estado.constanciasEscolhidas || [];
  const map   = {};
  Object.entries(CONSTANCIAS_MAP).forEach(([a, lista]) => lista.forEach(cn => map[cn] = a));

  const constChecks = JSON.parse(sessionStorage.getItem('fragmentados_const_checks') || '{}');
  const constHtml = [...fixas, ...esc].map(cn => {
    const fixa      = fixas.includes(cn);
    const atribPai  = map[cn];
    const base      = atribPai ? (estado.constancias[atribPai] || 0) : 0;
    const racaB     = atribPai ? totalBonusRaca(atribPai) + bonusAcessorioConstancia(atribPai) : 0;
    const bonusAtrib = calcBonus(base + racaB);
    const checks    = constChecks[cn] || 0;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1a1726;">
      <span style="font-size:0.78rem;color:#e0d6c8;">${cn}
        <span style="font-size:0.6rem;color:${fixa ? '#c9a84c88' : '#6688aa88'};">${fixa ? '(fixa)' : '(escolhida)'}</span>
        ${atribPai ? `<span style="font-size:0.6rem;color:#444;"> · ${atribPai}</span>` : ''}
      </span>
      <span id="ficha-const-${cn}" style="font-size:0.75rem;color:#c9a84c;font-weight:bold;">+${bonusAtrib + bc + checks}</span>
    </div>`;
  }).join('') || '<span style="font-size:0.75rem;color:#555;">Nenhuma</span>'

  const armasHtml = info ? (info.armas || []).map(a => `<span style="font-size:0.68rem;padding:2px 7px;border:1px solid #2a2535;border-radius:2px;color:#aaa;">${a}</span>`).join('') : '';
  const armHtml   = info ? (info.armaduras || []).map(a => `<span style="font-size:0.68rem;padding:2px 7px;border:1px solid #2a2535;border-radius:2px;color:#aaa;">${a}</span>`).join('') : '';

  const isL2 = layout === 2;
  c.innerHTML += `
    <div class="ficha-bloco l2-identidade">
      <h4>Identidade</h4>
      <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
        <!-- coluna foto -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">
          <div style="position:relative;width:100px;height:100px;border:2px dashed #3a3550;border-radius:4px;overflow:hidden;cursor:pointer;" onclick="document.getElementById('fotoInput').click()">
            ${fotoSalva
              ? `<img src="${fotoSalva}" style="width:100%;height:100%;object-fit:cover;display:block;">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;"><span style="font-size:1.4rem;color:#3a3550;">&#128247;</span><span style="font-size:0.65rem;color:#555;letter-spacing:1px;">FOTO</span></div>`}
            <input id="fotoInput" type="file" accept="image/*" style="display:none;" onchange="carregarFoto(this)">
          </div>
          ${fotoSalva ? `<button class="c-btn" style="width:auto;padding:0 8px;font-size:0.65rem;color:#ff4444;border-color:#ff444444;" onclick="removerFoto()">remover</button>` : ''}
        </div>
        <!-- coluna info básica -->
        <div style="flex:1;min-width:160px;">
          <div class="ficha-linha"><span>Nome</span><span><input value="${estado.nomePersonagem || ''}" maxlength="30" style="background:transparent;border:none;border-bottom:1px solid #3a3550;color:#e0d6c8;font-size:0.82rem;text-align:right;padding:0;outline:none;width:120px;font-family:'Georgia',serif;" oninput="estado.nomePersonagem=this.value.trim();salvarEstado();sincronizarPersonagem();"></span></div>
          <div class="ficha-linha"><span>Classe</span><span style="display:flex;align-items:center;gap:6px;">${estado.classe}<button onclick="abrirInfoClasse()" style="width:18px;height:18px;border-radius:50%;border:1px solid #3a3550;background:transparent;color:#666;font-family:'Georgia',serif;font-size:0.65rem;font-style:italic;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:border-color 0.2s,color 0.2s;flex-shrink:0;" onmouseover="this.style.borderColor='#c9a84c';this.style.color='#c9a84c'" onmouseout="this.style.borderColor='#3a3550';this.style.color='#666'">i</button></span></div>
          <div class="ficha-linha"><span>Raça</span><span>${estado.raca || '—'}</span></div>
          <div class="ficha-linha"><span>Deslocamento</span><span style="font-size:0.78rem;">${_deslocamentoRaca(estado.raca)}</span></div>
          <div class="ficha-linha" style="align-items:center;">
            <span>Nível</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <button class="c-btn" onclick="fichaAlterarNivel(-1)">−</button>
              <span id="fichaNivel" style="font-size:1rem;min-width:20px;text-align:center;">${estado.nivel}</span>
              <button class="c-btn" onclick="fichaAlterarNivel(1)">+</button>
            </span>
          </div>
          <div class="ficha-linha"><span>Caminho</span><span>${estado.caminho || '—'}</span></div>
          <div class="ficha-linha"><span>Bônus de Classe</span><span style="color:#c9a84c;">+${bc}</span></div>
        </div>
        <!-- coluna constâncias -->
        <div style="flex:1;min-width:160px;">
          <div style="font-size:0.65rem;letter-spacing:2px;color:#c9a84c;margin-bottom:6px;">CONSTÂNCIAS <span style="color:#555;font-size:0.6rem;">(BC: +${bc})</span></div>
          ${constHtml}
        </div>
        <!-- coluna proficiências + descrição -->
        <div style="flex:1;min-width:160px;">
          <div style="font-size:0.65rem;letter-spacing:2px;color:#c9a84c;margin-bottom:6px;">PROFICIÊNCIAS</div>
          <div style="font-size:0.65rem;color:#555;margin-bottom:4px;">ARMAS</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${armasHtml}</div>
          <div style="font-size:0.65rem;color:#555;margin-bottom:4px;">ARMADURAS</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">${armHtml}</div>
          <div style="font-size:0.65rem;letter-spacing:2px;color:#c9a84c;margin-bottom:6px;">DESCRIÇÃO</div>
          <textarea placeholder="Descreva seu personagem..." maxlength="400"
            style="width:100%;background:transparent;border:1px solid #2a2535;border-radius:3px;color:#aaa;font-family:'Georgia',serif;font-size:0.75rem;line-height:1.5;padding:6px 8px;resize:vertical;min-height:60px;outline:none;"
            oninput="sessionStorage.setItem('fragmentados_desc',this.value);sincronizarPersonagem()">${descSalva}</textarea>
        </div>
      </div>
    </div>`;

  // --- EXPERIÊNCIA ---
  const xpAtual     = parseInt(sessionStorage.getItem('fragmentados_xp') || '0');
  const xpNec       = XP_TABLE[estado.nivel] || 4000;
  const xpAnt       = XP_TABLE[estado.nivel - 1] || 0;
  const xpProgresso = estado.nivel >= 20 ? 100 : Math.min(100, Math.round((xpAtual - xpAnt) / (xpNec - xpAnt) * 100));
  c.innerHTML += `
    <div class="ficha-bloco l2-experiencia">
      <h4>Experiência</h4>
      <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">
        <!-- controles XP -->
        <div style="flex:1;min-width:180px;">
          <div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin-bottom:10px;">XP ATUAL</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <button class="c-btn" onclick="alterarXP(-10)">−</button>
            <span id="xpValor" style="font-size:1.4rem;color:#e0d6c8;min-width:50px;text-align:center;">${xpAtual}</span>
            <button class="c-btn" onclick="alterarXP(10)">+</button>
          </div>
          <div style="font-size:0.7rem;color:#555;margin-bottom:10px;">Ajustar: <input id="xpInput" type="number" value="${xpAtual}" min="0" style="width:60px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="setXP(parseInt(this.value)||0)"></div>
          <div style="height:6px;background:#1a1726;border-radius:3px;overflow:hidden;margin-bottom:4px;">
            <div id="xpBarra" style="height:100%;width:${xpProgresso}%;background:#c9a84c;transition:width 0.3s;"></div>
          </div>
          <div id="xpContador" style="font-size:0.68rem;color:#555;">${estado.nivel >= 20 ? 'Nível máximo' : xpAtual + ' / ' + xpNec + ' XP'}</div>
        </div>
        <!-- tabela de níveis -->
        <div style="flex:2;min-width:200px;display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:0 12px;">
          ${XP_TABLE.slice(1).map((xp, i) => {
            const lv = i + 1;
            const xpParaProximo = lv < 20 ? XP_TABLE[lv] : null;
            return `<div id="xp-row-${lv}" style="display:flex;justify-content:space-between;font-size:0.72rem;padding:2px 0;border-bottom:1px solid #1a1726;color:${lv === estado.nivel ? '#c9a84c' : lv < estado.nivel ? '#555' : '#666'};font-weight:${lv === estado.nivel ? 'bold' : 'normal'};">
              <span>Lv ${String(lv).padStart(2,'0')}</span><span>${xpParaProximo !== null ? xpParaProximo : '—'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  // --- ATRIBUTOS ---
  const ptTotal = pontosTotal();
  const ptGasto = Object.values(estado.constancias).reduce((a,b) => a+b, 0);
  const ptLivre = ptTotal - ptGasto;
  let aHtml = `<div class="ficha-bloco" id="fichaAtributosBloco"><h4>Atributos</h4>`;
  if (ptLivre > 0) aHtml += `<div id="fichaPontosAviso" style="background:#c9a84c22;border:1px solid #c9a84c55;border-radius:3px;padding:8px 12px;margin-bottom:12px;font-size:0.78rem;color:#c9a84c;text-align:center;">✨ Você tem <strong>${ptLivre}</strong> ponto${ptLivre > 1 ? 's' : ''} para distribuir!</div>`;
  Object.entries(estado.constancias).forEach(([k, v]) => {
    const racaBonus = totalBonusRaca(k) + bonusAcessorioConstancia(k);
    const vTotal   = v + racaBonus;
    const bonus    = calcBonus(vTotal);
    const bonusStr = bonus === 0 ? '—' : '+' + bonus;
    aHtml += `<div class="ficha-linha" style="align-items:center;margin-bottom:14px;">
      <span style="cursor:pointer;font-size:0.82rem;" onclick="abrirConstancias('${k}',${vTotal})">${k} <span style="font-size:0.6rem;color:#555;">VER ▸</span></span>
      <span style="display:flex;align-items:center;gap:6px;">
        <button class="c-btn" onclick="fichaAlterarAtributo('${k}',-1)">−</button>
        <span style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid #3a3550;border-radius:3px;background:#1a1726;">
          <span id="fb-${k}" style="font-size:1.3rem;font-weight:bold;color:${bonus===0?'#555':'#c9a84c'};text-shadow:${bonus===0?'none':'0 0 10px #c9a84c88'};">${bonusStr}</span>
          <span id="fa-${k}" style="position:absolute;top:2px;right:4px;font-size:0.6rem;color:#666;">${vTotal}</span>
          ${racaBonus > 0 ? `<span id="fr-${k}" style="position:absolute;bottom:2px;left:3px;font-size:0.55rem;color:#5599ff;line-height:1;">+${racaBonus}</span>` : ''}
        </span>
        <button class="c-btn" onclick="fichaAlterarAtributo('${k}',1)">+</button>
      </span>
    </div>`;
  });
  aHtml += `<div style="font-size:0.7rem;color:#555;text-align:right;margin-top:8px;border-top:1px solid #1a1726;padding-top:6px;">Pontos: <span id="fichaPtUsados">${ptGasto}</span> / ${ptTotal}</div></div>`;
  c.innerHTML += aHtml;

  // --- EQUIPAMENTOS ---
  const slotHtml = (label, slot, lista, val) => {
    const item = lista.find(x => x.nome === val);
    let h = `<div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin-bottom:4px;">${label}</div>`;
    h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">`;
    h += `<span style="font-size:0.85rem;color:#e0d6c8;">${val || '—'}</span>`;
    h += `<span style="display:flex;gap:4px;">`;
    h += `<button class="c-btn" style="width:auto;padding:0 8px;font-size:0.7rem;" onclick="abrirPopupEquip('${slot}')">trocar</button>`;
    if (val) h += `<button class="c-btn" style="width:auto;padding:0 8px;font-size:0.7rem;color:#ff4444;border-color:#ff444444;" onclick="limparEquip('${slot}')">&#x2715;</button>`;
    h += `</span></div>`;
    if (item) h += `<div style="font-size:0.72rem;color:#aaa;margin-bottom:10px;">${item.dano || ''}</div>`;
    if (item && slot === 'arma') h += `<button class="c-btn" style="width:100%;margin-bottom:10px;color:#c9a84c;border-color:#c9a84c66;" onclick="rolarAtaqueArma()">⚔ Atacar · rolar dano</button>`;
    else h += `<div style="margin-bottom:10px;"></div>`;
    return h;
  };
  c.innerHTML += `<div class="ficha-bloco l2-equipamentos"><h4>Equipamentos</h4>
    <div class="l2-equip-slots">
      <div class="l2-equip-slot">${slotHtml('ARMA','arma',ARMAS,estado.arma)}</div>
      <div class="l2-equip-slot" style="border-left:1px solid #2a2535;padding-left:20px;">${slotHtml('ARMADURA','armadura',ARMADURAS,estado.armadura)}</div>
    </div>
  </div>`;
  c.innerHTML += `<div class="ficha-bloco ficha-acessorios-equipados">
    <h4>Acessórios equipados</h4>
    <p class="acessorios-ajuda">Escolha um item em cada espaço. Os anéis ocupam um espaço de dedo cada.</p>
    <div class="acessorios-slots-grid">${SLOTS_ACESSORIOS.map(renderAcessorioSlot).join('')}</div>
  </div>`;

  // --- VITALIDADE ---
  const armaduraObj = ARMADURAS.find(x => x.nome === estado.armadura);
  const caArmadura  = armaduraObj ? parseInt(armaduraObj.dano.replace('CA +','')) || 0 : 0;
  const caBase      = 10 + calcBonus((estado.constancias['Destreza'] || 0) + totalBonusRaca('Destreza') + bonusAcessorioConstancia('Destreza')) + caArmadura;
  const pvMax  = parseInt(sessionStorage.getItem('fragmentados_pvmax')) || (() => { const v = calcularPV(); sessionStorage.setItem('fragmentados_pvmax', v); sessionStorage.setItem('fragmentados_pv', v); return v; })();
  const peMax  = parseInt(sessionStorage.getItem('fragmentados_pemax')) || (() => { const v = calcularPE(); sessionStorage.setItem('fragmentados_pemax', v); sessionStorage.setItem('fragmentados_pe', v); return v; })();
  const pvAtual = parseInt(sessionStorage.getItem('fragmentados_pv')) ?? pvMax;
  const peAtual = parseInt(sessionStorage.getItem('fragmentados_pe')) ?? peMax;
  const caAtual = parseInt(sessionStorage.getItem('fragmentados_ca')) || caBase;
  const anelEscamaAtivo = sessionStorage.getItem('fragmentados_anel_escama_ativo') === 'true';
  if (sessionStorage.getItem('fragmentados_ca') === null) sessionStorage.setItem('fragmentados_ca', caAtual);
  c.innerHTML += `
    <div class="ficha-bloco" style="min-width:220px;">
      <h4>Vitalidade</h4>
      <div style="margin-bottom:16px;">
        <div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin-bottom:10px;">CLASSE DE ARMADURA</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="c-btn" onclick="alterarCA(-1)">−</button>
          <span id="caValor" style="font-size:1.6rem;color:#e0d6c8;min-width:40px;text-align:center;">${caAtual + (anelEscamaAtivo ? 2 : 0)}</span>
          <button class="c-btn" onclick="alterarCA(1)">+</button>
        </div>
        <div style="font-size:0.7rem;color:#555;margin-top:6px;">Ajustar base: <input id="caAjuste" type="number" value="${caAtual}" min="1" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="definirCAFicha(this.value)"></div>
        <div id="anelEscamaCAInfo" style="font-size:0.7rem;color:#7ecfb3;margin-top:5px;${anelEscamaAtivo ? '' : 'display:none;'}">Anel ativo: +2 CA (total ${caAtual + 2})</div>
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin-bottom:10px;">PONTOS DE VIDA</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="c-btn" onclick="alterarPV(-1)">−</button>
          <span id="pvAtual" style="font-size:1.6rem;color:#e0d6c8;min-width:40px;text-align:center;">${pvAtual}</span>
          <button class="c-btn" onclick="alterarPV(1)">+</button>
        </div>
        <div style="font-size:0.7rem;color:#555;margin-top:6px;">Máx: <input id="pvMax" type="number" value="${pvMax}" min="1" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="document.getElementById('pvAtual').textContent=this.value;sessionStorage.setItem('fragmentados_pvmax',this.value);sessionStorage.setItem('fragmentados_pv',this.value);sincronizarPersonagem();"></div>
      </div>
      <div>
        <div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin-bottom:10px;">${estado.classe === 'Mago' ? 'MANA' : 'PONTOS DE ENERGIA'}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="c-btn" onclick="alterarPE(-1)">−</button>
          <span id="peAtual" style="font-size:1.6rem;color:#e0d6c8;min-width:40px;text-align:center;">${peAtual}</span>
          <button class="c-btn" onclick="alterarPE(1)">+</button>
        </div>
        <div style="font-size:0.7rem;color:#555;margin-top:6px;">Máx: <input id="peMax" type="number" value="${peMax}" min="1" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="document.getElementById('peAtual').textContent=this.value;sessionStorage.setItem('fragmentados_pemax',this.value);sessionStorage.setItem('fragmentados_pe',this.value);sincronizarPersonagem();"></div>
      </div>
      ${estado.classe === 'Espadachim' ? (() => { const pceMax = calcularPCEMax(); const pceAtual = Math.min(pceMax, parseInt(sessionStorage.getItem('fragmentados_pce') ?? pceMax)); sessionStorage.setItem('fragmentados_pce', pceAtual); return `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #2a2535;"><div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin-bottom:10px;">PONTOS DE CONHECIMENTO DE ESPADA</div><div style="display:flex;align-items:center;gap:10px;"><button class="c-btn" onclick="alterarPCE(-1)">−</button><span id="pceAtual" style="font-size:1.6rem;color:#e0d6c8;min-width:40px;text-align:center;">${pceAtual}</span><button class="c-btn" onclick="alterarPCE(1)">+</button></div><div style="font-size:0.7rem;color:#555;margin-top:6px;">Máx neste nível: <span style="color:#c9a84c;">${pceMax}</span></div></div>`; })() : ''}
    </div>`;

  // --- HABILIDADES ---
  const dados = HABILIDADES[estado.classe];
  if (dados) {
    const renderHabFicha = h => {
      // Habilidade especial: Caminho da Espada
      if (h._especial === 'caminho_espada') {
        const slots = [6,10,12,14,17,20].filter(n => estado.nivel >= n).length;
        const escolhidas = estado.caminhoEspada || [];
        const badge = escolhidas.length < slots
          ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupCaminhoEspada(event)">⚔ Escolher Técnica (${escolhidas.length}/${slots})</span>`
          : `<span class="hab-badge hab-badge-talento" onclick="abrirPopupCaminhoEspada(event)">⚔ Técnicas (${escolhidas.length}/${slots})</span>`;
        return `<div class="ficha-hab-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span class="ficha-hab-nome">${h.nome} <span style="font-size:0.65rem;color:#555;">[Nv ${h.nivel}]</span></span>
            <span>${badge}</span>
          </div>
          <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}</div>
          ${escolhidas.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${escolhidas.map(n => `<span style="font-size:0.68rem;padding:2px 8px;border:1px solid #c9a84c44;border-radius:2px;color:#c9a84c;">${n}</span>`).join('')}</div>` : ''}
        </div>`;
      }
      // Habilidade especial: Arte da Espada
      if (h._especial === 'arte_espada') {
        const niveis = [7,9,12,15,18].filter(n => estado.nivel >= n);
        const slots  = niveis.length;
        const escolhidas = estado.artesDaEspada || [];
        const badge = escolhidas.length < slots
          ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupArteEspada(event)">★ Escolher Arte (${escolhidas.length}/${slots})</span>`
          : `<span class="hab-badge hab-badge-talento" onclick="abrirPopupArteEspada(event)">★ Artes (${escolhidas.length}/${slots})</span>`;
        return `<div class="ficha-hab-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span class="ficha-hab-nome">${h.nome} <span style="font-size:0.65rem;color:#555;">[Nv ${h.nivel}]</span></span>
            <span>${badge}</span>
          </div>
          <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}</div>
          ${escolhidas.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${escolhidas.map(n => `<span style="font-size:0.68rem;padding:2px 8px;border:1px solid #c9a84c44;border-radius:2px;color:#c9a84c;">${n}</span>`).join('')}</div>` : ''}
        </div>`;
      }
      const evoMatch = h.evo ? h.evo.match(/Nível (\d+):/g) : null;
      let nivelEvo = null;
      if (evoMatch) {
        const niveis = evoMatch.map(m => parseInt(m.match(/\d+/)[0])).filter(n => estado.nivel >= n);
        if (niveis.length) nivelEvo = Math.max(...niveis);
      }
      const evoHtml = nivelEvo && h.evo
        ? `<span style="color:#c9a84c;font-style:italic;font-size:0.74rem;"> ✦ ${h.evo.split('|').find(p => { const m = p.match(/Nível (\d+)/); return m && parseInt(m[1]) === nivelEvo; }) || h.evo.split('|').pop()}</span>`
        : '';
      const pe     = custoPE(h.nivel);
      const peTag  = h.acao === 'Passiva' ? '' : `<span style="font-size:0.65rem;color:#c9a84c;border:1px solid #c9a84c44;padding:1px 6px;border-radius:2px;margin-right:4px;">${pe} PE</span>`;
      const acaTag = `<span style="font-size:0.65rem;color:#666;border:1px solid #2a2535;padding:1px 6px;border-radius:2px;">${h.acao}</span>`;
      const usarTag = h.acao === 'Passiva' ? '' : `<button class="c-btn" style="width:auto;padding:1px 7px;font-size:0.65rem;margin-left:4px;" onclick="gastarPE(${pe}, 'PE', this)" title="Gastar ${pe} PE ao usar esta habilidade">Usar</button>`;
      return `<div class="ficha-hab-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span class="ficha-hab-nome">${h.nome} <span style="font-size:0.65rem;color:#555;">[Nv ${h.nivel}]</span></span>
          <span>${peTag}${acaTag}${usarTag}</span>
        </div>
        <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}${evoHtml}</div>
      </div>`;
    };

    // Badge truques (entre caminho e talentos)
    const listaTruques = TRUQUES[estado.classe] || [];
    const truquesEscolhidos = estado.truques || [];
    const maxTruques = listaTruques.length > 0 ? (estado.nivel >= 5 ? 1 + Math.floor((Math.min(estado.nivel,17) - 5) / 4) : 0) : 0;
    const truqueBadge = listaTruques.length === 0 ? '' :
      truquesEscolhidos.length > 0
        ? `<span class="hab-badge hab-badge-talento" onclick="abrirPopupTruques()" title="Ver truques">◆ Truques (${truquesEscolhidos.length}/${maxTruques})</span>`
        : maxTruques > 0
          ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupTruques()">◆ Escolher Truque</span>`
          : `<span class="hab-badge hab-badge-bloqueado" title="Disponível no nível 5">◆ Nv 5</span>`;

    // Badge caminho (superior direito)
    const caminhos = Object.keys(dados.caminhos || {});
    const podeEscolherCaminho = estado.nivel >= 6 && !estado.caminho && caminhos.length > 0;
    const caminhoBadge = estado.caminho
      ? `<span class="hab-badge hab-badge-caminho" onclick="abrirPopupCaminho()" title="Caminho escolhido">⚔ ${estado.caminho}</span>`
      : podeEscolherCaminho
        ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupCaminho()">⚔ Escolher Caminho</span>`
        : `<span class="hab-badge hab-badge-bloqueado" title="Disponível no nível 6">⚔ Nv 6</span>`;

    // Badge talentos (superior esquerdo)
    const maxTalentos = slotsDisponiveis();
    const qtdTalentos = (estado.talentos || []).length;
    const talentoBadge = qtdTalentos > 0
      ? `<span class="hab-badge hab-badge-talento" onclick="abrirPopupTalentos()" title="Ver talentos">✦ Talentos (${qtdTalentos}/${maxTalentos})</span>`
      : maxTalentos > 0
        ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupTalentos()">✦ Escolher Talento</span>`
        : `<span class="hab-badge hab-badge-bloqueado" title="Disponível no nível 5">✦ Nv 5</span>`;

    let habHtml = `<div class="ficha-bloco" style="flex:2;min-width:300px;position:relative;padding-top:14px;">
      <h4 style="text-align:center;margin-bottom:28px;">Habilidades${truqueBadge ? `<span style="margin-left:10px;">${truqueBadge}</span>` : ''}</h4>
      <div style="position:absolute;top:36px;left:24px;">${talentoBadge}</div>
      <div style="position:absolute;top:36px;right:24px;">${caminhoBadge}</div>`;
    // Seção Raça
    if (estado.raca && RACAS[estado.raca] && RACAS[estado.raca].habilidades.length > 0) {
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:#7ecfb3;margin:12px 0 6px;">RAÇA: ${estado.raca.toUpperCase()}</div>`;
      RACAS[estado.raca].habilidades.forEach(h => {
        habHtml += `<div class="ficha-hab-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span class="ficha-hab-nome">${h.nome}</span>
            <span style="font-size:0.65rem;color:#7ecfb3;border:1px solid #7ecfb344;padding:1px 6px;border-radius:2px;background:#7ecfb322;">Raça</span>
          </div>
          <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}</div>
        </div>`;
      });
    }
    dados.base.filter(h => estado.nivel >= h.nivel).forEach(h => { habHtml += renderHabFicha(h); });
    if (estado.caminho && dados.caminhos[estado.caminho]) {
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin:12px 0 6px;">CAMINHO: ${estado.caminho.toUpperCase()}</div>`;
      dados.caminhos[estado.caminho].habs.filter(h => estado.nivel >= h.nivel).forEach(h => { habHtml += renderHabFicha(h); });
    }
    if (estado.classe === 'Mago') {
      const magiasGrimorio = estado.magiasGrimorio || [];
      const limiteGrimorio = capacidadeGrimorio();
      habHtml += `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:12px 0 6px;">
        <span style="font-size:0.7rem;letter-spacing:2px;color:#9d8bdb;">GRIMÓRIO (${magiasGrimorio.length}/${limiteGrimorio})</span>
        <button id="btnGerenciarGrimorio" class="c-btn" style="width:auto;padding:2px 8px;font-size:0.65rem;" onclick="abrirPopupGerenciarGrimorio(this)">+ Adicionar magia</button>
      </div>`;
      if (magiasGrimorio.length === 0) {
        habHtml += '<div class="ficha-hab-item" style="font-size:0.75rem;color:#666;">Nenhuma magia anotada.</div>';
      }
      magiasGrimorio.forEach((nome, indice) => {
        const magia = obterMagiaDoLivro(nome);
        if (!magia) {
          habHtml += `<div class="ficha-hab-item" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <span><span class="ficha-hab-nome" style="color:#c5b6f0;">${nome}</span><span style="font-size:0.68rem;color:#ff8888;"> · Magia não encontrada no livro</span></span>
            <button class="c-btn" style="width:auto;padding:1px 7px;font-size:0.65rem;color:#ff8888;" onclick="removerMagiaGrimorio(${indice})">Excluir</button>
          </div>`;
          return;
        }
        const custo = custoManaMagia(magia);
        const usaPV = /Usa PV em vez de PE/i.test(magia.texto);
        const recurso = usaPV ? 'PV' : 'Mana';
        habHtml += `<div class="ficha-hab-item">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
            <span class="ficha-hab-nome" style="color:#c5b6f0;">${nome} <span style="font-size:0.65rem;color:#777;">· Vol. ${magia.texto.match(/livro-tag-nivel">Vol\.\s*(\d+)/)?.[1] || '?'}</span></span>
            <span style="display:flex;gap:4px;flex-shrink:0;">
              <button class="c-btn" style="width:auto;padding:1px 7px;font-size:0.65rem;" onclick="conjurarMagiaDoGrimorio(${indice})" title="Gastar ${custo} ${recurso} ao conjurar">Conjurar · ${custo} ${recurso}</button>
              <button class="c-btn" style="width:auto;padding:1px 7px;font-size:0.65rem;color:#ff8888;" onclick="removerMagiaGrimorio(${indice})" title="Excluir magia do grimório">Excluir</button>
            </span>
          </div>
          <div style="font-size:0.75rem;color:#aaa;line-height:1.6;">${magia.texto}</div>
        </div>`;
      });
    }
    if (truquesEscolhidos.length > 0) {
      const listaTruquesRender = TRUQUES[estado.classe] || [];
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:#7ecfb3;margin:12px 0 6px;">TRUQUES</div>`;
      truquesEscolhidos.forEach(nome => {
        const t = listaTruquesRender.find(x => x.nome === nome);
        if (!t) return;
        const evoAtiva = t.evo && estado.nivel >= (t.evoNivel || 99);
        const evoHtml = evoAtiva ? `<span style="color:#7ecfb3;font-style:italic;font-size:0.74rem;"> ⇑ ${t.evo}</span>` : '';
        habHtml += `<div class="ficha-hab-item"><span class="ficha-hab-nome" style="color:#7ecfb3;">${t.nome}</span> — <span style="font-size:0.78rem;color:#aaa;">${t.desc}</span>${evoHtml}</div>`;
      });
    }
    if (estado.talentos && estado.talentos.length > 0) {
      const listaTalentos = [...(TALENTOS[estado.classe] || []), ...TALENTOS_GERAIS];
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:#c9a84c;margin:12px 0 6px;">TALENTOS</div>`;
      estado.talentos.forEach(nome => {
        const t = listaTalentos.find(x => x.nome === nome);
        if (!t) return;
        const evoAtiva = t.evo && estado.nivel >= (t.evoNivel || 10);
        habHtml += `<div class="ficha-hab-item"><span class="ficha-hab-nome">${t.nome}</span> — ${t.desc}${evoAtiva ? `<span style="color:#c9a84c;font-style:italic;font-size:0.74rem;"> ❆ ${t.evo}</span>` : ''}</div>`;
      });
    }
    habHtml += '</div>';
    c.innerHTML += habHtml;
  }

  // --- INVENTÁRIO ---
  c.innerHTML += `
    <div class="ficha-bloco" style="flex:2;min-width:300px;">
      <h4>Inventário</h4>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:0.75rem;color:#aaa;">Peso total: <span id="pesoTotal" style="color:#c9a84c;">0</span> / <input id="pesoMax" type="number" value="${7*(estado.constancias['Força']+5)}" min="0" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#c9a84c;font-size:0.75rem;text-align:center;" oninput="atualizarPeso()"> kg</div>
        <button class="c-btn" style="width:auto;padding:0 10px;font-size:0.75rem;" onclick="adicionarItem()">+ Item</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:0.68rem;color:#555;letter-spacing:1px;margin-bottom:6px;padding:0 4px;">
        <span>ITEM</span><span style="text-align:center;">QTD</span><span style="text-align:center;">PESO</span><span></span>
      </div>
      <div id="inventarioLista"></div>
    </div>`;

  carregarInventario();
  _wrapLayout(layout);
  atualizarAnelEscamaUI();
  atualizarPuxaCorteUI();
  atualizarColarCuraUI();
  atualizarPedraReflexaoUI();
  atualizarCargasAcessorios();
}

// posições default dos blocos no layout 3
const L3_POS_DEFAULT = [
  { left: 0,   top: 0   },  // identidade
  { left: 310, top: 0   },  // xp
  { left: 520, top: 0   },  // atributos
  { left: 310, top: 340 },  // equipamentos
  { left: 0,   top: 680 },  // acessórios
  { left: 520, top: 340 },  // vitalidade
  { left: 0,   top: 340 },  // habilidades
  { left: 0,   top: 1120 }, // inventário
];

function _wrapLayout(n) {
  const c = document.getElementById('fichaConteudo');
  if (!c) return;
  if (n !== 3) return;
  // Layout 3: posicionamento absoluto livre
  const blocos = Array.from(c.querySelectorAll(':scope > .ficha-bloco'));
  const saved  = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '[]');
  if (saved.length === blocos.length - 1) saved.splice(4, 0, null);
  blocos.forEach((bloco, i) => {
    const pos = saved[i]?.left !== undefined ? saved[i] : (L3_POS_DEFAULT[i] || { left: i * 20, top: i * 20 });
    bloco.style.left = pos.left + 'px';
    bloco.style.top  = pos.top  + 'px';
    if (saved[i]?.width)  bloco.style.width  = saved[i].width;
    if (saved[i]?.height) bloco.style.height = saved[i].height;
  });
}

// ===== POPUP CAMINHO / TALENTOS =====
function _posicionarPopupCT(anchorEl) {
  const popup = document.getElementById('popupCaminhoTalentos');
  const box   = popup.querySelector('.popup-box');
  const r     = anchorEl.getBoundingClientRect();
  const w     = window.innerWidth;
  const h     = window.innerHeight;
  // posição abaixo do badge, alinhado com ele
  let top  = r.bottom + 6;
  let left = r.left;
  popup.classList.add('aberto');
  // ajustar se sair da tela
  const bw = box.offsetWidth  || 280;
  const bh = box.offsetHeight || 300;
  if (left + bw > w - 8) left = w - bw - 8;
  if (top  + bh > h - 8) top  = r.top - bh - 6;
  popup.style.top  = top  + 'px';
  popup.style.left = left + 'px';
}

function abrirPopupCaminho() {
  const dados = HABILIDADES[estado.classe];
  if (!dados) return;
  const caminhos = Object.keys(dados.caminhos || {});
  const popup  = document.getElementById('popupCaminhoTalentos');
  const titulo = document.getElementById('popupCTTitulo');
  const lista  = document.getElementById('popupCTLista');
  titulo.textContent = 'Escolher Caminho';
  lista.innerHTML = caminhos.map(nome => {
    const ativo     = estado.caminho === nome;
    const bloqueado = estado.nivel < 6 && !ativo;
    return `<div class="item-linha${ativo ? ' ativo' : ''}" style="${bloqueado ? 'opacity:0.4;cursor:default;' : 'cursor:pointer;'}" onclick="${bloqueado ? '' : `escolherCaminho('${nome}')`}">
      <div style="font-size:0.85rem;">${nome} ${ativo ? '✔' : ''}</div>
      <div style="font-size:0.7rem;color:#666;margin-top:2px;">Prof: ${dados.caminhos[nome].proficiencias}</div>
    </div>`;
  }).join('');
  if (estado.caminho) {
    lista.innerHTML += `<button class="c-btn" style="margin-top:12px;width:100%;color:#ff4444;border-color:#ff444444;" onclick="escolherCaminho(null)">Remover caminho</button>`;
  }
  const badge = event.currentTarget || event.target;
  _posicionarPopupCT(badge);
}

function escolherCaminho(nome) {
  if (nome !== null && estado.nivel < 6) return;
  estado.caminho = nome;
  salvarEstado();
  fecharPopupCT();
  renderFicha();
  sincronizarPersonagem();
}

function abrirPopupTalentos() {
  const lista  = [...(TALENTOS[estado.classe] || []), ...TALENTOS_GERAIS];
  const max    = slotsDisponiveis();
  const popup  = document.getElementById('popupCaminhoTalentos');
  const titulo = document.getElementById('popupCTTitulo');
  const cont   = document.getElementById('popupCTLista');
  titulo.textContent = `Talentos (${(estado.talentos||[]).length}/${max})`;
  cont.innerHTML = max === 0
    ? '<div style="font-size:0.78rem;color:#555;padding:8px 0;">Talentos disponíveis a partir do nível 5.</div>'
    : lista.map((t, idx) => {
        const ativo   = (estado.talentos || []).includes(t.nome);
        const cheio   = (estado.talentos || []).length >= max && !ativo;
        const classeLen = (TALENTOS[estado.classe] || []).length;
        const sep = idx === classeLen ? '<div style="font-size:0.62rem;letter-spacing:2px;color:#c9a84c88;margin:10px 0 6px;padding-top:8px;border-top:1px solid #2a2535;">— TALENTOS GERAIS —</div>' : '';
        return sep + `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleTalento('${t.nome}')`}">
          <div style="font-size:0.85rem;">${t.nome} ${ativo ? '✔' : ''}</div>
          <div style="font-size:0.72rem;color:#666;margin-top:2px;line-height:1.5;">${t.desc}</div>
        </div>`;
      }).join('');
  const badge = event.currentTarget || event.target;
  _posicionarPopupCT(badge);
}

function toggleTalento(nome) {
  if (!estado.talentos) estado.talentos = [];
  const idx = estado.talentos.indexOf(nome);
  if (idx !== -1) estado.talentos.splice(idx, 1);
  else if (estado.talentos.length < slotsDisponiveis()) estado.talentos.push(nome);
  salvarEstado();
  // reposiciona o popup no mesmo badge de talentos após re-render
  const popup = document.getElementById('popupCaminhoTalentos');
  const savedTop  = popup.style.top;
  const savedLeft = popup.style.left;
  renderFicha();
  sincronizarPersonagem();
  // reabre no mesmo lugar
  const titulo = document.getElementById('popupCTTitulo');
  const cont   = document.getElementById('popupCTLista');
  const max    = slotsDisponiveis();
  const lista  = [...(TALENTOS[estado.classe] || []), ...TALENTOS_GERAIS];
  titulo.textContent = `Talentos (${(estado.talentos||[]).length}/${max})`;
  cont.innerHTML = max === 0
    ? '<div style="font-size:0.78rem;color:#555;padding:8px 0;">Talentos disponíveis a partir do nível 5.</div>'
    : lista.map((t, idx) => {
        const ativo = (estado.talentos || []).includes(t.nome);
        const cheio = (estado.talentos || []).length >= max && !ativo;
        const classeLen = (TALENTOS[estado.classe] || []).length;
        const sep = idx === classeLen ? '<div style="font-size:0.62rem;letter-spacing:2px;color:#c9a84c88;margin:10px 0 6px;padding-top:8px;border-top:1px solid #2a2535;">— TALENTOS GERAIS —</div>' : '';
        return sep + `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleTalento('${t.nome}')`}">
          <div style="font-size:0.85rem;">${t.nome} ${ativo ? '✔' : ''}</div>
          <div style="font-size:0.72rem;color:#666;margin-top:2px;line-height:1.5;">${t.desc}</div>
        </div>`;
      }).join('');
  popup.style.top  = savedTop;
  popup.style.left = savedLeft;
  popup.classList.add('aberto');
}

function abrirPopupTruques() {
  const lista  = TRUQUES[estado.classe] || [];
  const max    = estado.nivel >= 5 ? 1 + Math.floor((Math.min(estado.nivel,17) - 5) / 4) : 0;
  const escolhidos = estado.truques || [];
  const popup  = document.getElementById('popupCaminhoTalentos');
  const titulo = document.getElementById('popupCTTitulo');
  const cont   = document.getElementById('popupCTLista');
  titulo.textContent = `Truques (${escolhidos.length}/${max})`;
  cont.innerHTML = max === 0
    ? '<div style="font-size:0.78rem;color:#555;padding:8px 0;">Truques disponíveis a partir do nível 5.</div>'
    : lista.map(t => {
        const ativo = escolhidos.includes(t.nome);
        const cheio = escolhidos.length >= max && !ativo;
        const evoAtiva = t.evo && estado.nivel >= (t.evoNivel || 99);
        return `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleTruque('${t.nome}')`}">
          <div style="font-size:0.85rem;color:${ativo?'#7ecfb3':'#e0d6c8'}">${t.nome} ${ativo ? '✔' : ''}</div>
          <div style="font-size:0.72rem;color:#666;margin-top:2px;line-height:1.5;">${t.desc}</div>
          ${evoAtiva ? `<div style="font-size:0.7rem;color:#7ecfb388;font-style:italic;margin-top:4px;">⇑ ${t.evo}</div>` : ''}
        </div>`;
      }).join('');
  const badge = event.currentTarget || event.target;
  _posicionarPopupCT(badge);
}

function toggleTruque(nome) {
  if (!estado.truques) estado.truques = [];
  const max = estado.nivel >= 5 ? 1 + Math.floor((Math.min(estado.nivel,17) - 5) / 4) : 0;
  const idx = estado.truques.indexOf(nome);
  if (idx !== -1) estado.truques.splice(idx, 1);
  else if (estado.truques.length < max) estado.truques.push(nome);
  salvarEstado();
  const popup = document.getElementById('popupCaminhoTalentos');
  const savedTop = popup.style.top, savedLeft = popup.style.left;
  renderFicha();
  sincronizarPersonagem();
  const lista = TRUQUES[estado.classe] || [];
  const escolhidos = estado.truques || [];
  document.getElementById('popupCTTitulo').textContent = `Truques (${escolhidos.length}/${max})`;
  document.getElementById('popupCTLista').innerHTML = max === 0
    ? '<div style="font-size:0.78rem;color:#555;padding:8px 0;">Truques disponíveis a partir do nível 5.</div>'
    : lista.map(t => {
        const ativo = escolhidos.includes(t.nome);
        const cheio = escolhidos.length >= max && !ativo;
        const evoAtiva = t.evo && estado.nivel >= (t.evoNivel || 99);
        return `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleTruque('${t.nome}')`}">
          <div style="font-size:0.85rem;color:${ativo?'#7ecfb3':'#e0d6c8'}">${t.nome} ${ativo ? '✔' : ''}</div>
          <div style="font-size:0.72rem;color:#666;margin-top:2px;line-height:1.5;">${t.desc}</div>
          ${evoAtiva ? `<div style="font-size:0.7rem;color:#7ecfb388;font-style:italic;margin-top:4px;">⇑ ${t.evo}</div>` : ''}
        </div>`;
      }).join('');
  popup.style.top = savedTop; popup.style.left = savedLeft;
  popup.classList.add('aberto');
}

function fecharPopupCT() {
  document.getElementById('popupCaminhoTalentos').classList.remove('aberto');
}

function abrirPopupCaminhoEspada(e) {
  const lista  = typeof HABS_CAMINHO_ESPADA !== 'undefined' ? HABS_CAMINHO_ESPADA : [];
  const slots  = [6,10,12,14,17,20].filter(n => estado.nivel >= n).length;
  const escolhidas = estado.caminhoEspada || [];
  const popup  = document.getElementById('popupCaminhoTalentos');
  const titulo = document.getElementById('popupCTTitulo');
  const cont   = document.getElementById('popupCTLista');
  titulo.textContent = `Técnicas de Espada (${escolhidas.length}/${slots})`;
  cont.innerHTML = slots === 0
    ? '<div style="font-size:0.78rem;color:#555;padding:8px 0;">Disponível a partir do nível 6.</div>'
    : lista.map(h => {
        const ativo = escolhidas.includes(h.nome);
        const cheio = escolhidas.length >= slots && !ativo;
        return `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleCaminhoEspada('${h.nome.replace(/'/g,"\\'")}')`}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.85rem;">${h.nome} ${ativo ? '\u2714' : ''}</span>
            <span style="font-size:0.65rem;color:#c9a84c88;border:1px solid #c9a84c33;padding:1px 5px;border-radius:2px;">${h.pce} PCE</span>
          </div>
          <div style="font-size:0.72rem;color:#666;margin-top:3px;line-height:1.5;">${h.desc}</div>
          ${h.evo ? `<div style="font-size:0.7rem;color:#c9a84c66;font-style:italic;margin-top:3px;">→ ${h.evo}</div>` : ''}
        </div>`;
      }).join('');
  const badge = e.currentTarget || e.target;
  _posicionarPopupCT(badge);
}

function toggleCaminhoEspada(nome) {
  if (!estado.caminhoEspada) estado.caminhoEspada = [];
  const slots = [6,10,12,14,17,20].filter(n => estado.nivel >= n).length;
  const idx = estado.caminhoEspada.indexOf(nome);
  if (idx !== -1) estado.caminhoEspada.splice(idx, 1);
  else if (estado.caminhoEspada.length < slots) estado.caminhoEspada.push(nome);
  salvarEstado();
  const popup = document.getElementById('popupCaminhoTalentos');
  const savedTop = popup.style.top, savedLeft = popup.style.left;
  renderFicha();
  sincronizarPersonagem();
  const lista  = typeof HABS_CAMINHO_ESPADA !== 'undefined' ? HABS_CAMINHO_ESPADA : [];
  const escolhidas = estado.caminhoEspada || [];
  document.getElementById('popupCTTitulo').textContent = `Técnicas de Espada (${escolhidas.length}/${slots})`;
  document.getElementById('popupCTLista').innerHTML = lista.map(h => {
    const ativo = escolhidas.includes(h.nome);
    const cheio = escolhidas.length >= slots && !ativo;
    return `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleCaminhoEspada('${h.nome.replace(/'/g,"\\'")}')`}">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.85rem;">${h.nome} ${ativo ? '\u2714' : ''}</span>
        <span style="font-size:0.65rem;color:#c9a84c88;border:1px solid #c9a84c33;padding:1px 5px;border-radius:2px;">${h.pce} PCE</span>
      </div>
      <div style="font-size:0.72rem;color:#666;margin-top:3px;line-height:1.5;">${h.desc}</div>
      ${h.evo ? `<div style="font-size:0.7rem;color:#c9a84c66;font-style:italic;margin-top:3px;">→ ${h.evo}</div>` : ''}
    </div>`;
  }).join('');
  popup.style.top = savedTop; popup.style.left = savedLeft;
  popup.classList.add('aberto');
}

function abrirPopupArteEspada(e) {
  const lista  = typeof ARTES_DA_ESPADA !== 'undefined' ? ARTES_DA_ESPADA : [];
  const slots  = [7,9,12,15,18].filter(n => estado.nivel >= n).length;
  const escolhidas = estado.artesDaEspada || [];
  const popup  = document.getElementById('popupCaminhoTalentos');
  const titulo = document.getElementById('popupCTTitulo');
  const cont   = document.getElementById('popupCTLista');
  titulo.textContent = `Arte da Espada (${escolhidas.length}/${slots})`;
  cont.innerHTML = slots === 0
    ? '<div style="font-size:0.78rem;color:#555;padding:8px 0;">Disponível a partir do nível 7.</div>'
    : lista.map(h => {
        const ativo = escolhidas.includes(h.nome);
        const cheio = escolhidas.length >= slots && !ativo;
        return `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleArteEspada('${h.nome.replace(/'/g,"\\'")}')`}">
          <div style="font-size:0.85rem;">${h.nome} ${ativo ? '\u2714' : ''}</div>
          <div style="font-size:0.72rem;color:#666;margin-top:2px;line-height:1.5;">${h.desc}</div>
        </div>`;
      }).join('');
  const badge = e.currentTarget || e.target;
  _posicionarPopupCT(badge);
}

function toggleArteEspada(nome) {
  if (!estado.artesDaEspada) estado.artesDaEspada = [];
  const slots = [7,9,12,15,18].filter(n => estado.nivel >= n).length;
  const idx = estado.artesDaEspada.indexOf(nome);
  if (idx !== -1) estado.artesDaEspada.splice(idx, 1);
  else if (estado.artesDaEspada.length < slots) estado.artesDaEspada.push(nome);
  salvarEstado();
  const popup = document.getElementById('popupCaminhoTalentos');
  const savedTop = popup.style.top, savedLeft = popup.style.left;
  renderFicha();
  sincronizarPersonagem();
  const lista  = typeof ARTES_DA_ESPADA !== 'undefined' ? ARTES_DA_ESPADA : [];
  const escolhidas = estado.artesDaEspada || [];
  document.getElementById('popupCTTitulo').textContent = `Arte da Espada (${escolhidas.length}/${slots})`;
  document.getElementById('popupCTLista').innerHTML = lista.map(h => {
    const ativo = escolhidas.includes(h.nome);
    const cheio = escolhidas.length >= slots && !ativo;
    return `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleArteEspada('${h.nome.replace(/'/g,"\\'")}')`}">
      <div style="font-size:0.85rem;">${h.nome} ${ativo ? '\u2714' : ''}</div>
      <div style="font-size:0.72rem;color:#666;margin-top:2px;line-height:1.5;">${h.desc}</div>
    </div>`;
  }).join('');
  popup.style.top = savedTop; popup.style.left = savedLeft;
  popup.classList.add('aberto');
}

document.addEventListener('click', e => {
  const p = document.getElementById('popupCaminhoTalentos');
  if (!p || !p.classList.contains('aberto')) return;
  const abriuGrimorio = e.target instanceof Element && e.target.closest('#btnGerenciarGrimorio');
  if (!p.contains(e.target) && !e.composedPath().includes(p) && !abriuGrimorio && !e.target.classList.contains('hab-badge')) fecharPopupCT();
});

// ===== MODO EDIÇÃO =====
const LAYOUT_KEY = 'fragmentados_layout';
const CORES_KEY  = 'fragmentados_cores';
const LAYOUT_NUM_KEY = 'fragmentados_layout_num';

function trocarLayout(n) {
  localStorage.setItem(LAYOUT_NUM_KEY, n);
  localStorage.removeItem(LAYOUT_KEY); // limpa posições/tamanhos ao trocar layout
  [1,2,3].forEach(i => {
    const btn = document.getElementById('layoutBtn' + i);
    if (btn) btn.classList.toggle('ativo', i === n);
  });
  renderFicha();
}

function _layoutAtual() {
  return parseInt(localStorage.getItem(LAYOUT_NUM_KEY) || '1');
}

function _aplicarClasseLayout() {
  const c = document.getElementById('fichaConteudo');
  if (!c) return;
  c.classList.remove('layout-2', 'layout-3');
  const n = _layoutAtual();
  if (n === 2) c.classList.add('layout-2');
  if (n === 3) c.classList.add('layout-3');
  // atualiza botões se toolbar estiver visível
  [1,2,3].forEach(i => {
    const btn = document.getElementById('layoutBtn' + i);
    if (btn) btn.classList.toggle('ativo', i === n);
  });
}

const CORES_PADRAO = { principal: '#c9a84c', texto: '#e0d6c8' };
let _modoEdicao = false;

function _carregarCores() {
  const c = JSON.parse(localStorage.getItem(CORES_KEY) || 'null') || CORES_PADRAO;
  document.documentElement.style.setProperty('--cor-principal', c.principal);
  document.documentElement.style.setProperty('--cor-texto',     c.texto);
  _recolorirFicha(c.principal, c.texto);
  return c;
}

function aplicarCores() {
  const cp = document.getElementById('editCorPrincipal').value;
  const ct = document.getElementById('editCorTexto').value;
  document.documentElement.style.setProperty('--cor-principal', cp);
  document.documentElement.style.setProperty('--cor-texto',     ct);
  localStorage.setItem(CORES_KEY, JSON.stringify({ principal: cp, texto: ct }));
  // atualiza todos os elementos que usam a cor inline
  _recolorirFicha(cp, ct);
}

function _recolorirFicha(cp, ct) {
  let tag = document.getElementById('fichaEstilosDinamicos');
  if (!tag) { tag = document.createElement('style'); tag.id = 'fichaEstilosDinamicos'; document.head.appendChild(tag); }
  tag.textContent = `
    :root { --cor-principal: ${cp}; --cor-texto: ${ct}; }
    #fichaConteudo [style*="color:#c9a84c"],
    #fichaConteudo [style*="color: #c9a84c"] { color: ${cp} !important; }
    #fichaConteudo [style*="color:#e0d6c8"],
    #fichaConteudo [style*="color: #e0d6c8"] { color: ${ct} !important; }
    #fichaConteudo [style*="border-color:#c9a84c"],
    #fichaConteudo [style*="border: 1px solid #c9a84c"],
    #fichaConteudo [style*="border-bottom:1px solid #c9a84c"],
    #fichaConteudo [style*="border-bottom: 1px solid #c9a84c"] { border-color: ${cp} !important; }
    #fichaConteudo [style*="border:1px solid #c9a84c"] { border-color: ${cp} !important; }
    #fichaConteudo [style*="text-shadow"] { text-shadow: 0 0 10px ${cp}88 !important; }
    #fichaConteudo [style*="box-shadow"]  { box-shadow:  0 0 8px  ${cp}55 !important; }
    #fichaConteudo [style*="background:#c9a84c"]:not([style*="background:#c9a84c2"]):not([style*="background:#c9a84c1"]) { background: ${cp} !important; }
    .ficha-bloco h4,
    #fichaConteudo [style*="letter-spacing:2px"][style*="color:#c9a84c"],
    #fichaConteudo [style*="letter-spacing: 2px"][style*="color:#c9a84c"] { color: ${cp} !important; }
    #fichaConteudo span[style*="color:#c9a84c"] { color: ${cp} !important; }
    #fichaConteudo span[style*="color:#e0d6c8"] { color: ${ct} !important; }
    #fichaConteudo div[style*="color:#c9a84c"]  { color: ${cp} !important; }
    #fichaConteudo div[style*="color:#e0d6c8"]  { color: ${ct} !important; }
    #fichaConteudo input[style*="color:#c9a84c"] { color: ${cp} !important; }
    #fichaConteudo input[style*="color:#aaa"]    { color: ${ct}99 !important; }
    #xpBarra { background: ${cp} !important; }
    ._nivelToast { border-color: ${cp}55 !important; }
  `;
}

function toggleModoEdicao() {
  _modoEdicao = !_modoEdicao;
  const toolbar = document.getElementById('fichaEditToolbar');
  const btnEditar = document.getElementById('btnEditarFicha');
  toolbar.classList.toggle('ativo', _modoEdicao);
  if (btnEditar) btnEditar.style.display = _modoEdicao ? 'none' : '';

  if (_modoEdicao) {
    const cores = _carregarCores();
    document.getElementById('editCorPrincipal').value = cores.principal;
    document.getElementById('editCorTexto').value     = cores.texto;
    _ativarEdicaoBlocos();
  } else {
    _desativarEdicaoBlocos();
    _salvarOrdemBlocos();
  }
}

function _ativarEdicaoBlocos() {
  const layout3 = _layoutAtual() === 3;
  const blocos = document.querySelectorAll('#fichaConteudo .ficha-bloco');
  blocos.forEach((bloco, i) => {
    bloco.classList.add('editavel');
    bloco.dataset.idx = i;

    if (!bloco.querySelector('.bloco-edit-handle')) {
      const h = document.createElement('span');
      h.className = 'bloco-edit-handle';
      h.textContent = '✥ mover';
      bloco.insertBefore(h, bloco.firstChild);
    }

    if (layout3) _adicionarResizeHandles(bloco);

    if (layout3) {
      bloco.addEventListener('mousedown', _onDragMouseDown);
    } else {
      bloco.setAttribute('draggable', 'true');
      bloco.addEventListener('dragstart', _onDragStart);
      bloco.addEventListener('dragover',  _onDragOver);
      bloco.addEventListener('drop',      _onDrop);
      bloco.addEventListener('dragend',   _onDragEnd);
    }
  });

  const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '[]');
  blocos.forEach((bloco, i) => {
    if (saved[i]?.width)  bloco.style.width  = saved[i].width;
    if (saved[i]?.height) bloco.style.height = saved[i].height;
  });
}

function _adicionarResizeHandles(bloco) {
  ['nw','ne','sw','se','n','s','w','e'].forEach(dir => {
    const h = document.createElement('div');
    h.className = 'resize-handle rh-' + dir;
    h.addEventListener('mousedown', e => _onResizeMouseDown(e, bloco, dir));
    bloco.appendChild(h);
  });
}

function _desativarEdicaoBlocos() {
  document.querySelectorAll('#fichaConteudo .ficha-bloco').forEach(bloco => {
    bloco.classList.remove('editavel', 'dragging', 'drag-over');
    bloco.removeAttribute('draggable');
    bloco.querySelector('.bloco-edit-handle')?.remove();
    bloco.querySelectorAll('.resize-handle').forEach(h => h.remove());
    bloco.removeEventListener('mousedown',  _onDragMouseDown);
    bloco.removeEventListener('dragstart',  _onDragStart);
    bloco.removeEventListener('dragover',   _onDragOver);
    bloco.removeEventListener('drop',       _onDrop);
    bloco.removeEventListener('dragend',    _onDragEnd);
  });
}

function _salvarOrdemBlocos() {
  const blocos = document.querySelectorAll('#fichaConteudo .ficha-bloco');
  const layout3 = _layoutAtual() === 3;
  const data = Array.from(blocos).map(b => ({
    width:  b.style.width  || '',
    height: b.style.height || '',
    left:   layout3 ? (parseInt(b.style.left) || 0) : undefined,
    top:    layout3 ? (parseInt(b.style.top)  || 0) : undefined,
  }));
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(data));
}

let _dragSrc = null;

// --- drag & drop por troca (layouts 1 e 2) ---
function _onDragStart(e) {
  _dragSrc = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function _onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('#fichaConteudo .ficha-bloco').forEach(b => b.classList.remove('drag-over'));
  if (this !== _dragSrc) this.classList.add('drag-over');
}
function _onDrop(e) {
  e.preventDefault();
  if (!_dragSrc || _dragSrc === this) return;
  const cont = document.getElementById('fichaConteudo');
  const blocos = [...cont.children];
  const srcIdx  = blocos.indexOf(_dragSrc);
  const destIdx = blocos.indexOf(this);
  if (srcIdx < destIdx) cont.insertBefore(_dragSrc, this.nextSibling);
  else                  cont.insertBefore(_dragSrc, this);
  this.classList.remove('drag-over');
  _salvarOrdemBlocos();
}
function _onDragEnd() {
  document.querySelectorAll('#fichaConteudo .ficha-bloco').forEach(b => b.classList.remove('dragging', 'drag-over'));
  _dragSrc = null;
}

// --- arrastar livre por mouse (layout 3) ---
let _mouseDragBloco = null, _mouseDragOffX = 0, _mouseDragOffY = 0;
function _onDragMouseDown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
  e.preventDefault();
  _mouseDragBloco = this;
  const r = this.getBoundingClientRect();
  _mouseDragOffX = e.clientX - r.left;
  _mouseDragOffY = e.clientY - r.top;
  document.addEventListener('mousemove', _onDragMouseMove);
  document.addEventListener('mouseup',   _onDragMouseUp);
}
function _onDragMouseMove(e) {
  if (!_mouseDragBloco) return;
  const cont = document.getElementById('fichaConteudo');
  const cr   = cont.getBoundingClientRect();
  const x = Math.max(0, e.clientX - cr.left - _mouseDragOffX);
  const y = Math.max(0, e.clientY - cr.top  - _mouseDragOffY);
  _mouseDragBloco.style.left = x + 'px';
  _mouseDragBloco.style.top  = y + 'px';
}
function _onDragMouseUp() {
  document.removeEventListener('mousemove', _onDragMouseMove);
  document.removeEventListener('mouseup',   _onDragMouseUp);
  if (_mouseDragBloco) { _salvarOrdemBlocos(); _mouseDragBloco = null; }
}

// resize livre por handle
let _resizeState = null;
function _onResizeMouseDown(e, bloco, dir) {
  e.preventDefault();
  e.stopPropagation();
  const r = bloco.getBoundingClientRect();
  _resizeState = {
    bloco, dir,
    startX: e.clientX, startY: e.clientY,
    startW: r.width,   startH: r.height,
    startLeft: parseInt(bloco.style.left) || 0,
    startTop:  parseInt(bloco.style.top)  || 0,
  };
  document.addEventListener('mousemove', _onResizeMouseMove);
  document.addEventListener('mouseup',   _onResizeMouseUp);
}
function _onResizeMouseMove(e) {
  if (!_resizeState) return;
  const { bloco, dir, startX, startY, startW, startH, startLeft, startTop } = _resizeState;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const MIN_W = 180, MIN_H = 60;
  if (dir.includes('e')) bloco.style.width  = Math.max(MIN_W, startW + dx) + 'px';
  if (dir.includes('s')) bloco.style.height = Math.max(MIN_H, startH + dy) + 'px';
  if (dir.includes('w')) {
    const nw = Math.max(MIN_W, startW - dx);
    bloco.style.width = nw + 'px';
    bloco.style.left  = (startLeft + startW - nw) + 'px';
  }
  if (dir.includes('n')) {
    const nh = Math.max(MIN_H, startH - dy);
    bloco.style.height = nh + 'px';
    bloco.style.top    = (startTop + startH - nh) + 'px';
  }
}
function _onResizeMouseUp() {
  document.removeEventListener('mousemove', _onResizeMouseMove);
  document.removeEventListener('mouseup',   _onResizeMouseUp);
  if (_resizeState) { _salvarOrdemBlocos(); _resizeState = null; }
}

function resetarLayoutFicha() {
  localStorage.removeItem(LAYOUT_KEY);
  localStorage.removeItem(CORES_KEY);
  document.documentElement.style.setProperty('--cor-principal', CORES_PADRAO.principal);
  document.documentElement.style.setProperty('--cor-texto',     CORES_PADRAO.texto);
  document.getElementById('editCorPrincipal').value = CORES_PADRAO.principal;
  document.getElementById('editCorTexto').value     = CORES_PADRAO.texto;
  _recolorirFicha(CORES_PADRAO.principal, CORES_PADRAO.texto);
  document.querySelectorAll('#fichaConteudo .ficha-bloco').forEach(b => { b.style.width = ''; b.style.height = ''; });
}
