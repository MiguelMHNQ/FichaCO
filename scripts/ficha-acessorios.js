// Equipamentos, espaços de acessórios, cargas e retorno visual.


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
  { id: 'cabeca', nome: 'Cabeça', aceitos: ['coroa', 'tiara', 'óculos', 'monóculo', 'máscara', 'brincos', 'espelho'] },
  { id: 'pescoco', nome: 'Pescoço', aceitos: ['colar', 'amuleto', 'pingente'] },
  { id: 'costas', nome: 'Costas', aceitos: ['capa', 'manto', 'aljava', 'asas'] },
  { id: 'maos', nome: 'Mãos · 1 par', aceitos: ['luvas', 'manoplas', 'dados', 'laço'] },
  { id: 'dedo1', nome: 'Dedo · mão esquerda', aceitos: ['anel', 'anéis', 'dedo falso'] },
  { id: 'dedo2', nome: 'Dedo · mão direita', aceitos: ['anel', 'anéis', 'dedo falso'] },
  { id: 'cintura', nome: 'Cintura', aceitos: ['bolsa', 'bússola', 'cinto', 'cinturão'] },
  { id: 'pes', nome: 'Pés · 1 par', aceitos: ['botas', 'sapatilhas'] },
  { id: 'pulsos', nome: 'Pulsos · opcional', aceitos: ['bracelete', 'braçal', 'pulseira', 'relógio'] }
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
    retornoVisualAcessorio(item.nome,'usar',`${item.nome} está sem cargas. Recarregue conforme a condição indicada no acessório.`);
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

let slotAcessorioAtivo = null;
let rotacaoAcessorios = 0;
let quadroRodaAcessorios = null;

function animarRodaAcessorios(roda, destino) {
  if (quadroRodaAcessorios !== null) cancelAnimationFrame(quadroRodaAcessorios);
  const inicio = Number(roda.dataset.giroAtual || '0');
  // Um novo clique retoma a posição que realmente está na tela.
  while (destino - inicio > 180) destino -= 360;
  while (destino - inicio < -180) destino += 360;
  rotacaoAcessorios = destino;
  const botoes = [...roda.querySelectorAll('[data-acessorio-roda]')];
  const escalas = botoes.map(botao => Number(botao.dataset.escalaAtual || '1'));
  const duracao = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 800;
  const comeco = performance.now();
  function quadro(agora) {
    if (!roda.isConnected) { quadroRodaAcessorios = null; return; }
    const progresso = Math.min(1, (agora - comeco) / duracao);
    const suavizado = 1 - Math.pow(1 - progresso, 3);
    const giro = inicio + (destino - inicio) * suavizado;
    roda.dataset.giroAtual = String(giro);
    roda.style.setProperty('--giro-acessorios', giro + 'deg');
    botoes.forEach((botao, indice) => {
      const angulo = indice * 360 / botoes.length + giro;
      const alvo = botao.classList.contains('ativo') ? 1.22 : 1;
      const escala = escalas[indice] + (alvo - escalas[indice]) * suavizado;
      botao.dataset.escalaAtual = String(escala);
      botao.style.transform = `translate(-50%,-50%) rotate(${angulo}deg) translateX(var(--raio-roda)) rotate(${-angulo}deg) scale(${escala})`;
    });
    quadroRodaAcessorios = progresso < 1 ? requestAnimationFrame(quadro) : null;
  }
  quadroRodaAcessorios = requestAnimationFrame(quadro);
}

function iconeAcessorio(slot) {
  const desenhos = {
    cabeca:'M4 17h16M5 17 3 7l5 4 4-7 4 7 5-4-2 10',
    pescoco:'M5 4c0 8 3 12 7 14 4-2 7-6 7-14M9 18l3 4 3-4-3-4z',
    costas:'M8 3h8l5 18-9-3-9 3zM8 3l4 6 4-6',
    maos:'M7 12V5a1 1 0 0 1 2 0v6-8a1 1 0 0 1 2 0v8-9a1 1 0 0 1 2 0v9-7a1 1 0 0 1 2 0v9l2-3c2-2 4 0 2 2l-4 6H9l-5-7c-1-2 1-3 3 0',
    dedo1:'M9 6l3-4 3 4-3 4zM8 9a7 7 0 1 0 8 0',
    dedo2:'M9 6l3-4 3 4-3 4zM8 9a7 7 0 1 0 8 0',
    cintura:'M3 8h18v8H3zM9 6h6v12H9z',
    pes:'M7 3h7v10l6 3v5H4v-6l3-3zM4 18h16',
    pulsos:'M6 4c-5 4-5 12 0 16M18 4c5 4 5 12 0 16M6 4h12M6 20h12M9 10l3-3 3 3-3 3z'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${desenhos[slot.id]}"/></svg>`;
}

function arteAcessorio(item, slot) {
  // Caminhos locais opcionais; sem dependência de imagens para equipar ou usar itens.
  const imagem = item?.imagem;
  if (typeof imagem === 'string' && /^assets\/[\w/.-]+\.(png|jpe?g|webp|gif|svg)$/i.test(imagem) && !imagem.includes('..')) {
    return `<img src="../${escaparHTML(imagem)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>${iconeAcessorio(slot)}</span>`;
  }
  return iconeAcessorio(slot);
}

function selecionarAcessorioRoda(slotId, focar = false) {
  const indice=SLOTS_ACESSORIOS.findIndex(slot=>slot.id===slotId);
  if(indice<0)return;
  const atual=SLOTS_ACESSORIOS.findIndex(slot=>slot.id===slotAcessorioAtivo);
  let delta=indice-atual;
  if(delta>4)delta-=SLOTS_ACESSORIOS.length;
  if(delta< -4)delta+=SLOTS_ACESSORIOS.length;
  rotacaoAcessorios-=delta*360/SLOTS_ACESSORIOS.length;
  slotAcessorioAtivo=slotId;
  document.querySelectorAll('[data-acessorio-roda]').forEach(botao=>{
    const ativo=botao.dataset.acessorioRoda===slotId;
    botao.classList.toggle('ativo',ativo);botao.setAttribute('aria-selected',String(ativo));botao.tabIndex=ativo?0:-1;
    if(ativo&&focar)botao.focus({preventScroll:true});
  });
  document.querySelectorAll('[data-acessorio-painel]').forEach(painel=>painel.hidden=painel.dataset.acessorioPainel!==slotId);
  const roda=document.querySelector('.acessorios-roda');
  if(roda)animarRodaAcessorios(roda,rotacaoAcessorios);
}

function navegarAcessoriosRoda(event,slotId) {
  const teclas={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
  if(!(event.key in teclas)&&event.key!=='Home'&&event.key!=='End')return;
  event.preventDefault();
  const i=SLOTS_ACESSORIOS.findIndex(slot=>slot.id===slotId);
  const indice=event.key==='Home'?0:event.key==='End'?SLOTS_ACESSORIOS.length-1:(i+teclas[event.key]+SLOTS_ACESSORIOS.length)%SLOTS_ACESSORIOS.length;
  selecionarAcessorioRoda(SLOTS_ACESSORIOS[indice].id,true);
}

function renderRodaAcessorios() {
  if (!slotAcessorioAtivo) {
    const indice=Math.max(0,SLOTS_ACESSORIOS.findIndex(slot=>estado.acessoriosEquipados[slot.id]));
    slotAcessorioAtivo=SLOTS_ACESSORIOS[indice].id;rotacaoAcessorios=-indice*360/SLOTS_ACESSORIOS.length;
  }
  return `<div class="acessorios-orbita-layout"><div class="acessorios-roda" data-giro-atual="${rotacaoAcessorios}" style="--giro-acessorios:${rotacaoAcessorios}deg" role="tablist" aria-label="Acessórios equipados">
    <div class="acessorios-roda-centro" aria-hidden="true"><span>✧</span><small>Acessórios</small></div>
    ${SLOTS_ACESSORIOS.map((slot,i)=>{
      const item=ACESSORIOS.find(a=>a.nome===estado.acessoriosEquipados[slot.id]),ativo=slot.id===slotAcessorioAtivo,angulo=i*360/SLOTS_ACESSORIOS.length+rotacaoAcessorios;
      return `<button type="button" role="tab" id="roda-${slot.id}" class="acessorio-roda-item${ativo?' ativo':''}${item?' equipado':''}" data-acessorio-roda="${slot.id}" data-escala-atual="${ativo?1.22:1}" aria-controls="acessorio-painel-${slot.id}" aria-selected="${ativo}" tabindex="${ativo?0:-1}" title="${escaparHTML(slot.nome+' · '+(item?.nome||'Vazio'))}" style="transform:translate(-50%,-50%) rotate(${angulo}deg) translateX(var(--raio-roda)) rotate(${-angulo}deg) scale(${ativo?1.22:1})" onclick="selecionarAcessorioRoda(this.dataset.acessorioRoda)" onkeydown="navegarAcessoriosRoda(event,this.dataset.acessorioRoda)">${arteAcessorio(item,slot)}<span>${slot.nome.split(' · ')[0]}</span></button>`;
    }).join('')}</div><div class="acessorios-roda-detalhes">${SLOTS_ACESSORIOS.map(slot=>{
      const item=ACESSORIOS.find(a=>a.nome===estado.acessoriosEquipados[slot.id]);
      return `<div role="tabpanel" id="acessorio-painel-${slot.id}" aria-labelledby="roda-${slot.id}" data-acessorio-painel="${slot.id}" ${slot.id!==slotAcessorioAtivo?'hidden':''}><div class="acessorio-destaque"><div class="acessorio-destaque-arte">${arteAcessorio(item,slot)}</div><div><small>${slot.nome}</small><h5>${item?item.nome:'Vazio'}</h5></div></div>${renderAcessorioSlot(slot)}</div>`;
    }).join('')}</div></div>`;
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

  const seletor = `<input type="search" class="equipamento-busca" data-busca-acessorio="${slot.id}" placeholder="Buscar acessório" aria-label="Buscar acessório" autocomplete="off" oninput="filtrarAcessoriosSlot(this.dataset.buscaAcessorio,this.value)"><select class="acessorio-slot-select" data-slot="${slot.id}" autocomplete="off" onchange="equiparAcessorioSlot(this.dataset.slot, this.value)" aria-label="Equipar acessório em ${slot.nome}">
    <option value="">Vazio</option>
    ${opcoes.map(opcao => `<option value="${opcao.nome}" ${opcao.nome === nome ? 'selected' : ''}>${opcao.nome}</option>`).join('')}
  </select><small data-busca-status="${slot.id}" role="status" hidden>Nenhum resultado encontrado.</small>`;
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
  return conteudo + '<div class="acessorio-feedback" role="status" aria-live="polite"></div></div>';
}

const brilhosAcessorios = new WeakMap();
const fantasmasAcessorios = new WeakMap();
function fantasmaAcessorio(botao, destaque, reduzido) {
  if (!botao || !botao.getClientRects().length) return;
  fantasmasAcessorios.get(botao)?.cancel();
  const caixa = botao.getBoundingClientRect(), estilo = getComputedStyle(botao);
  const fantasma = document.createElement('div');
  fantasma.className = 'acessorio-ghost';
  fantasma.setAttribute('aria-hidden','true');
  fantasma.dataset.i18nSkip = '';
  fantasma.textContent = botao.textContent;
  Object.assign(fantasma.style,{left:caixa.left+'px',top:caixa.top+'px',width:caixa.width+'px',height:caixa.height+'px',fontFamily:estilo.fontFamily,fontSize:estilo.fontSize,color:destaque,borderColor:destaque});
  document.body.append(fantasma);
  const animacao = fantasma.animate([
    {opacity:.55,transform:'translateY(0) scale(1)'},
    {opacity:0,transform:`translateY(${reduzido?-8:-56}px) scale(1.035)`}
  ],{duration:reduzido?200:850,easing:'ease-out'});
  fantasmasAcessorios.set(botao,animacao);
  animacao.finished.catch(()=>{}).finally(()=>{fantasma.remove();if(fantasmasAcessorios.get(botao)===animacao)fantasmasAcessorios.delete(botao);});
}
function retornoVisualAcessorio(nome, acao = 'usar', mensagem = '') {
  const slot = SLOTS_ACESSORIOS.find(s => estado.acessoriosEquipados[s.id] === nome);
  const painel = slot && document.getElementById(`acessorio-painel-${slot.id}`);
  if (!painel) return;
  const status = painel.querySelector('.acessorio-feedback');
  if (status) status.textContent = mensagem;
  const botao = painel.querySelector('.acessorio-acao-btn:not([id*="Recarregar"])');
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const destaque = getComputedStyle(painel).getPropertyValue('--cor-principal').trim() || '#c9a84c';
  const alvos = acao === 'recarregar' ? [painel] : [botao,painel.querySelector('.acessorio-destaque h5')];
  for (const alvo of alvos) {
  if (!alvo?.animate) continue;
  brilhosAcessorios.get(alvo)?.cancel();
  const cor = getComputedStyle(alvo).color;
  const animacao = alvo.animate([
    { color:cor, filter:'brightness(1)', backgroundColor:'transparent', boxShadow:'0 0 0 0 #c9a84c00', textShadow:'0 0 0 #c9a84c00' },
    { color:destaque, filter:'brightness(1.2)', backgroundColor:'#c9a84c18', boxShadow:'0 0 0 3px #c9a84c18, 0 0 22px #c9a84c40', textShadow:'0 0 8px #c9a84c70', offset:.4 },
    { color:cor, filter:'brightness(1)', backgroundColor:'transparent', boxShadow:'0 0 0 0 #c9a84c00', textShadow:'0 0 0 #c9a84c00' }
  ], {duration:reduzido ? 220 : 750,easing:'ease-out'});
  brilhosAcessorios.set(alvo,animacao);
  animacao.finished.catch(()=>{}).finally(()=>{if(brilhosAcessorios.get(alvo)===animacao)brilhosAcessorios.delete(alvo);});
  }
  if (acao === 'usar') fantasmaAcessorio(botao,destaque,reduzido);
}

function equipamentoCorresponde(item, termo) {
  if(!termo)return true;
  const texto = [item.nome,item.tipo,item.categoria,item.tipo?.startsWith('Acessório')?categoriaAcessorio(item):'',item.desc,item.descricaoVisual,item.habilidade].filter(Boolean).join('<br>');
  if(window.PrimordiosI18n)return PrimordiosI18n.match(texto,termo);
  const normalizar=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  return normalizar(texto).includes(normalizar(termo));
}

function filtrarAcessoriosSlot(slotId, termo) {
  const slot=SLOTS_ACESSORIOS.find(s=>s.id===slotId);
  const select=document.querySelector(`.acessorio-slot-select[data-slot="${slotId}"]`);
  if(!slot||!select)return;
  const equipado=estado.acessoriosEquipados[slotId]||'';
  const encontrados=ACESSORIOS.filter(item=>slotCompativelAcessorio(item,slot)&&equipamentoCorresponde(item,termo.trim()));
  const opcoes=ACESSORIOS.filter(item=>slotCompativelAcessorio(item,slot)&&(item.nome===equipado||encontrados.includes(item)));
  select.replaceChildren();
  const vazio=document.createElement('option');vazio.value='';vazio.textContent='Vazio';select.append(vazio);
  for(const item of opcoes){const option=document.createElement('option');option.value=item.nome;option.textContent=item.nome;select.append(option);}
  select.value=equipado;
  const status=document.querySelector(`[data-busca-status="${slotId}"]`);if(status)status.hidden=encontrados.length>0;
}

function abrirPopupEquip(slot) {
  document.getElementById('popupEquip').dataset.slot=slot;
  document.getElementById('popupEquipBusca').value='';
  renderListaEquipamentos();
  document.getElementById('popupEquip').classList.add('aberto');
  document.getElementById('popupEquipBusca').focus();
}

function renderListaEquipamentos() {
  const slot=document.getElementById('popupEquip').dataset.slot;
  const termo=document.getElementById('popupEquipBusca').value.trim();
  const lista  = slot === 'arma' ? ARMAS : slot === 'armadura' ? ARMADURAS : ACESSORIOS;
  const titulo = document.getElementById('popupEquipTitulo');
  const cont   = document.getElementById('popupEquipLista');
  titulo.textContent = slot === 'arma' ? 'Arma' : slot === 'armadura' ? 'Armadura' : 'Acessório';
  cont.innerHTML = '';
  lista.filter(item=>equipamentoCorresponde(item,termo)).forEach(item => {
    const ativo = estado[slot] === item.nome;
    const div   = document.createElement('div');
    div.className = 'item-linha' + (ativo ? ' ativo' : '');
    div.innerHTML = `<div style="font-size:0.85rem;">${item.nome}</div><div style="font-size:0.72rem;color:#666;margin-top:2px;">${item.dano || item.tipo || ''}</div>`;
    div.onclick = () => { estado[slot] = item.nome; salvarEstado(); fecharPopupEquip(); renderFicha(); sincronizarPersonagem(); };
    cont.appendChild(div);
  });
  if(!cont.children.length){const aviso=document.createElement('p');aviso.textContent='Nenhum resultado encontrado.';aviso.setAttribute('role','status');cont.append(aviso);}
}

function fecharPopupEquip() {
  document.getElementById('popupEquip').classList.remove('aberto');
}

function rolarAtaqueArma() {
  const arma = ARMAS.find(item => item.nome === estado.arma);
  if (!arma) return;
  if (arma.dano.startsWith('—')) {
    alert(`${arma.nome}\n\n${arma.habilidade || 'Este item não possui dano definido.'}`);
    return;
  }

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

  const atual = Number.parseInt(sessionStorage.getItem('fragmentados_'+recurso) ?? atualEl.textContent, 10);
  const maximo = Number.parseInt(maxEl.value, 10);
  if (!Number.isFinite(atual) || !Number.isFinite(maximo)) return 0;

  const novo = quantidade >= 0 ? Math.max(atual, Math.min(maximo, atual + quantidade)) : Math.max(0, atual + quantidade);
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

  if (acessorio.nome === 'Cura Aprimorada') {
    if (!consumirCargaAcessorio(acessorio)) return;
    retornoVisualAcessorio(acessorio.nome,"usar",'Cura Aprimorada: aplique +1d do tipo da cura usada. A carga foi consumida e o colar precisa de um descanso curto para recarregar.');
    return;
  }

  if (acessorio.nome === 'Membrana Pendente') {
    if (!consumirCargaAcessorio(acessorio)) return;
    const aplicado = ajustarRecursoFicha('pv', 18);
    retornoVisualAcessorio(acessorio.nome,"usar",`Membrana Pendente: gastou 1 carga e ${aplicado > 0 ? `recuperou ${aplicado} PV` : 'PV já está no máximo'}. Remova manualmente uma condição menor, se houver.`);
    return;
  }

  if (acessorio.nome === 'Anel de Energia') {
    if (!consumirCargaAcessorio(acessorio)) return;
    const aplicado = ajustarRecursoFicha('pe', 16);
    retornoVisualAcessorio(acessorio.nome,"usar",`Anel de Energia: gastou 1 carga e ${aplicado > 0 ? `recuperou ${aplicado} ${nomeEnergiaClasse()}` : `${nomeEnergiaClasse()} já está no máximo`}.`);
    return;
  }

  if (acessorio.nome === 'Óculos da Segunda Vida') {
    const pvAtual = Number.parseInt(sessionStorage.getItem('fragmentados_pv') || '0', 10);
    if (pvAtual > 0) {
      retornoVisualAcessorio(acessorio.nome,"usar",'Os Óculos da Segunda Vida só podem ser usados quando você chega a 0 PV.');
      return;
    }
    if (!consumirCargaAcessorio(acessorio)) return;

    const mapa = {};
    Object.entries(CONSTANCIAS_MAP).forEach(([atributo, lista]) => lista.forEach(nome => { mapa[nome] = atributo; }));
    const atributoVontade = mapa.Vontade;
    const checks = lerJSON(sessionStorage, 'fragmentados_const_checks', {});
    const bonusVontade = calcBonus((estado.constancias[atributoVontade] || 0) + totalBonusRaca(atributoVontade))
      + bonusDeClasse() + (checks.Vontade || 0);
    retornoVisualAcessorio(acessorio.nome);
    rolagemRapida([10], bonusVontade, 'Óculos da Segunda Vida: recuperação de PV', resultado => {
      const recuperado = ajustarRecursoFicha('pv', resultado);
      retornoVisualAcessorio(acessorio.nome,"usar",`Óculos da Segunda Vida: você recuperou ${recuperado} PV.`);
    });
    return;
  }

  if (acessorio.acao === 'Passiva') {
    retornoVisualAcessorio(acessorio.nome);
    return;
  }

  if (acessorio.carga !== null && !consumirCargaAcessorio(acessorio)) return;
  retornoVisualAcessorio(acessorio.nome);
}

function recarregarAcessorio(nome) {
  const acessorio = ACESSORIOS.find(item => item.nome === nome);
  if (!acessorio || acessorio.carga === null || !acessorioEstaEquipado(nome)) return;
  const cargas = obterCargasAcessorio(acessorio);
  if (cargas >= acessorio.carga) {
    retornoVisualAcessorio(nome,"recarregar",`${nome} já está com todas as cargas.`);
    return;
  }
  definirCargasAcessorio(acessorio, acessorio.carga);
  retornoVisualAcessorio(nome,'recarregar');
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
  retornoVisualAcessorio('Colar de Cura');
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
  retornoVisualAcessorio('Colar de Cura','recarregar');
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
  retornoVisualAcessorio('Pedra da Reflexão');
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
  retornoVisualAcessorio('Pedra da Reflexão','recarregar');
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
    retornoVisualAcessorio("Anel de Escama Endurecida","usar",'O escudo do Anel de Escama Endurecida já está ativo.');
    return;
  }
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_anel_escama_cargas') || '2', 10);
  if (cargas <= 0) {
    retornoVisualAcessorio("Anel de Escama Endurecida","usar",'O Anel de Escama Endurecida está sem cargas. Fique submerso embaixo da água por 1 turno para recarregá-lo.');
    return;
  }
  sessionStorage.setItem('fragmentados_anel_escama_cargas', cargas - 1);
  sessionStorage.setItem('fragmentados_anel_escama_ativo', 'true');
  atualizarAnelEscamaUI();
  retornoVisualAcessorio('Anel de Escama Endurecida');
  sincronizarPersonagem();
}

function encerrarEscudoAnelEscama() {
  if (sessionStorage.getItem('fragmentados_anel_escama_ativo') !== 'true') return;
  sessionStorage.setItem('fragmentados_anel_escama_ativo', 'false');
  atualizarAnelEscamaUI();
  retornoVisualAcessorio('Anel de Escama Endurecida');
  sincronizarPersonagem();
}

function recarregarAnelEscama() {
  if (!acessorioEstaEquipado('Anel de Escama Endurecida')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_anel_escama_cargas') || '2', 10);
  if (cargas >= 2) {
    retornoVisualAcessorio("Anel de Escama Endurecida","recarregar",'O Anel de Escama Endurecida já está com as 2 cargas.');
    return;
  }
  sessionStorage.setItem('fragmentados_anel_escama_cargas', '2');
  atualizarAnelEscamaUI();
  sincronizarPersonagem();
  retornoVisualAcessorio('Anel de Escama Endurecida','recarregar');
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
    retornoVisualAcessorio("Puxa Corte","usar",'O anel Puxa Corte está sem cargas. Recarregue-o após um descanso longo ou meditação longa.');
    return;
  }
  sessionStorage.setItem('fragmentados_puxa_corte_cargas', cargas - 1);
  atualizarPuxaCorteUI();
  sincronizarPersonagem();
  retornoVisualAcessorio('Puxa Corte');
}

function recarregarPuxaCorte() {
  if (!acessorioEstaEquipado('Puxa Corte')) return;
  const cargas = Number.parseInt(sessionStorage.getItem('fragmentados_puxa_corte_cargas') || '5', 10);
  if (cargas >= 5) {
    retornoVisualAcessorio("Puxa Corte","recarregar",'O anel Puxa Corte já está com as 5 cargas.');
    return;
  }
  sessionStorage.setItem('fragmentados_puxa_corte_cargas', '5');
  atualizarPuxaCorteUI();
  sincronizarPersonagem();
  retornoVisualAcessorio('Puxa Corte','recarregar');
}
