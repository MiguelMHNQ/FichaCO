// PV, PE, CA, XP e progressão reversível de nível.


const XP_TABLE = [0,300,500,700,900,1100,1300,1500,1700,1900,2100,2300,2500,2700,2900,3100,3300,3500,3700,4000,0];

// O mesmo modificador exibido na ficha: atributo base + raça + acessórios.
function bonusAtributoVitalidade(nome) {
  return calcBonus((Number(estado.constancias[nome])||0)+totalBonusRaca(nome)+bonusAcessorioConstancia(nome));
}
function bonusConstanciaVitalidade(nome,nivel=estado.nivel) {
  const atributo=Object.entries(CONSTANCIAS_MAP).find(([,lista])=>lista.includes(nome))?.[0];
  const checks=lerJSON(sessionStorage,'fragmentados_const_checks',{});
  return (atributo?bonusAtributoVitalidade(atributo):0)+bonusDeClasse(nivel)+Math.min(3,Math.max(0,Number(checks[nome])||0));
}
function recursosIniciaisClasse() {
  const info=CLASSES_PREVIEW[estado.classe];
  return {pv:Math.max(1,(info?.vidaBase||8)+bonusAtributoVitalidade(info?.vidaAtributo||'Vigor')),
    pe:Math.max(1,(info?.energiaAtributos||['Sabedoria','Vigor']).reduce((s,a)=>s+bonusAtributoVitalidade(a),0))};
}
function energiaGanhaNoNivel(nivel) {
  const info=CLASSES_PREVIEW[estado.classe];
  const adicional=info?.energiaNivelConstancia?bonusConstanciaVitalidade(info.energiaNivelConstancia,nivel):bonusAtributoVitalidade(info?.energiaNivelAtributo||'Sabedoria');
  return Math.max(0,bonusDeClasse(nivel)+adicional);
}
function ganhoPVNoNivel(nivel,atualizar=false) {
  estado.ganhosNivel ||= {};
  const antigo=estado.ganhosNivel[nivel]||{},info=CLASSES_PREVIEW[estado.classe],dado=info?.dadoVidaNum||8;
  if(!atualizar&&Number.isFinite(antigo.pv))return antigo.pv;
  const vigor=bonusAtributoVitalidade(info?.vidaAtributo||'Vigor');
  const temRolagem=Number.isInteger(antigo.rolado)&&antigo.rolado>=1&&antigo.rolado<=dado&&(!antigo.dado||antigo.dado===dado);
  // Históricos estimados não têm uma rolagem conhecida: nunca inventar outra ao restaurá-los.
  if(!temRolagem&&Number.isFinite(antigo.pv))return antigo.pv;
  const rolado=temRolagem?antigo.rolado:Math.floor(Math.random()*dado)+1;
  const pv=Math.max(1,rolado+vigor);
  estado.ganhosNivel[nivel]={...antigo,pv,rolado,vigor,dado};return pv;
}
function ganhoPENoNivel(nivel,atualizar=false) {
  estado.ganhosNivel ||= {};
  const antigo=estado.ganhosNivel[nivel]||{};
  if((!atualizar||antigo.estimado)&&Number.isFinite(antigo.pe))return antigo.pe;
  const pe=energiaGanhaNoNivel(nivel);estado.ganhosNivel[nivel]={...antigo,pe};return pe;
}
function calcularPV() {
  let total=recursosIniciaisClasse().pv;
  for(let nivel=2;nivel<=estado.nivel;nivel++)total+=ganhoPVNoNivel(nivel);
  return total;
}
function calcularPE() {
  let total=recursosIniciaisClasse().pe;
  for(let nivel=2;nivel<=estado.nivel;nivel++)total+=ganhoPENoNivel(nivel);
  return total;
}

function calcularCAAutomatica() {
  const armadura = ARMADURAS.find(a => a.nome === estado.armadura);
  const bonus = Number.parseInt(armadura?.dano.replace('CA +', ''), 10) || 0;
  return 10 + calcBonus((estado.constancias.Destreza || 0) + totalBonusRaca('Destreza') + bonusAcessorioConstancia('Destreza')) + bonus;
}

function atualizarCAFicha() {
  const automatica = calcularCAAutomatica();
  if (sessionStorage.getItem('fragmentados_ca_ajuste') === null) {
    const antiga = Number.parseInt(sessionStorage.getItem('fragmentados_ca'), 10);
    sessionStorage.setItem('fragmentados_ca_ajuste', Number.isFinite(antiga) ? antiga - automatica : 0);
  }
  const ajuste = Number.parseInt(sessionStorage.getItem('fragmentados_ca_ajuste'), 10) || 0;
  const base = Math.max(0, automatica + ajuste);
  sessionStorage.setItem('fragmentados_ca', base);
  const anel = sessionStorage.getItem('fragmentados_anel_escama_ativo') === 'true' ? 2 : 0;
  const el = document.getElementById('caValor');
  if (el) {
    el.textContent = base + anel;
    const armadura = ARMADURAS.find(a => a.nome === estado.armadura);
    const temBonus = (Number.parseInt(armadura?.dano.replace('CA +', ''), 10) || 0) > 0;
    el.classList.toggle('ca-com-armadura', temBonus);
    el.title = temBonus ? `Inclui ${armadura.dano} de ${armadura.nome}` : 'Classe de armadura';
  }
  const input = document.getElementById('caAjuste'); if (input) input.value = base;
  return base;
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
  sessionStorage.setItem('fragmentados_ca_ajuste', caBase - calcularCAAutomatica());
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

function atualizarPVFicha() {
  const el = document.getElementById('pvAtual');
  const maxEl = document.getElementById('pvMax');
  if (!el || !maxEl) return;
  const max = Math.max(1, parseInt(maxEl.value, 10) || 1);
  const salvo = parseInt(sessionStorage.getItem('fragmentados_pv'), 10);
  const total = Number.isFinite(salvo) ? Math.max(0, salvo) : max;
  const normal = Math.min(total, max), temporario = Math.max(0, total - max);
  el.textContent = normal;
  el.classList.toggle('pv-com-temporarios', temporario > 0);
  el.style.color = normal <= 0 ? '#ff4444' : normal <= max * 0.3 ? '#ff9944' : '#e0d6c8';
  const bonus = document.getElementById('pvTemporarios');
  if (bonus) { bonus.textContent = `+${temporario}`; bonus.hidden = temporario === 0; }
}

function definirPVMaxFicha(valor) {
  const max = Math.max(1, parseInt(valor, 10) || 1);
  document.getElementById('pvMax').value = max;
  sessionStorage.setItem('fragmentados_pvmax', max);
  sessionStorage.setItem('fragmentados_pv', max);
  atualizarPVFicha();
  sincronizarPersonagem();
}

function alterarPV(delta) {
  const el = document.getElementById('pvAtual');
  if (!el || !Number.isFinite(delta)) return;
  // O total salvo inclui o excedente; o visor separa PV normais e temporários.
  const atual = parseInt(sessionStorage.getItem('fragmentados_pv') ?? el.textContent, 10);
  if (!Number.isFinite(atual)) return;
  const val = Math.max(0, atual + delta);
  sessionStorage.setItem('fragmentados_pv', val);
  atualizarPVFicha();
  sincronizarPersonagem();
}

function atualizarPEFicha() {
  const el = document.getElementById('peAtual');
  const maxEl = document.getElementById('peMax');
  if (!el || !maxEl) return;
  const max = Math.max(1, parseInt(maxEl.value, 10) || 1);
  const salvo = parseInt(sessionStorage.getItem('fragmentados_pe'), 10);
  const total = Number.isFinite(salvo) ? Math.max(0, salvo) : max;
  const normal = Math.min(total, max), temporario = Math.max(0, total - max);
  el.textContent = normal;
  el.classList.toggle('pe-com-temporarios', temporario > 0);
  el.style.color = normal <= 0 ? '#ff4444' : normal <= max * .3 ? '#ff9944' : 'var(--cor-texto)';
  const bonus = document.getElementById('peTemporarios');
  if (bonus) { bonus.textContent = `+${temporario}`; bonus.hidden = temporario === 0; }
}

function definirPEMaxFicha(valor) {
  const max = Math.max(1, parseInt(valor, 10) || 1);
  document.getElementById('peMax').value = max;
  sessionStorage.setItem('fragmentados_pemax', max);
  sessionStorage.setItem('fragmentados_pe', max);
  atualizarPEFicha();
  sincronizarPersonagem();
}

function alterarPE(delta) {
  const el = document.getElementById('peAtual');
  if (!el || !Number.isFinite(delta)) return;
  const atual = parseInt(sessionStorage.getItem('fragmentados_pe') ?? el.textContent, 10);
  if (!Number.isFinite(atual)) return;
  const val = Math.max(0, atual + delta);
  sessionStorage.setItem('fragmentados_pe', val);
  atualizarPEFicha();
  sincronizarPersonagem();
}

const _timersFeedbackPE = new WeakMap();
const _avisosPE = new WeakMap();

function limparAvisoPE(alvo) {
  const aviso = _avisosPE.get(alvo);
  if (!aviso) return;
  clearTimeout(aviso.timer);
  aviso.el.remove();
  alvo.classList.remove('tem-aviso-pe');
  _avisosPE.delete(alvo);
}

function mostrarAvisoPE(alvo, texto) {
  limparAvisoPE(alvo);
  const aviso = document.createElement('span');
  aviso.className = 'aviso-pe';
  aviso.setAttribute('role', 'status');
  aviso.textContent = texto;
  alvo.classList.add('tem-aviso-pe');
  alvo.appendChild(aviso);
  const timer = setTimeout(() => limparAvisoPE(alvo), 2800);
  _avisosPE.set(alvo, { el: aviso, timer });
}

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

function gastarPE(custo, recurso = nomeEnergiaClasse(), botao = null) {
  const el = document.getElementById('peAtual');
  if (!el || !Number.isFinite(custo) || custo <= 0) return false;
  const peAtual = parseInt(sessionStorage.getItem('fragmentados_pe') ?? el.textContent, 10);
  if (!Number.isFinite(peAtual)) {
    alert(`Não foi possível identificar seus ${recurso} atuais.`);
    return false;
  }
  if (peAtual < custo) {
    mostrarAvisoPE(botao || el, `${recurso} insuficiente`);
    return false;
  }
  limparAvisoPE(botao || el);
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

function progressoXP(xp, nivel = estado.nivel) {
  return nivel >= 20 ? 100 : Math.max(0, Math.min(100, xp / XP_TABLE[nivel] * 100));
}

function setXP(val) {
  val = Number.isFinite(Number(val)) ? Math.max(0, Math.floor(Number(val))) : 0;
  const nivelAntes = estado.nivel;
  while (estado.nivel < 20 && val >= XP_TABLE[estado.nivel]) {
    val -= XP_TABLE[estado.nivel];
    garantirHistoricoNiveis();
    estado.nivel++;
    _ganhoNivel();
  }
  sessionStorage.setItem('fragmentados_xp', val);
  salvarEstado();
  if (estado.nivel !== nivelAntes) { renderFicha(); sincronizarPersonagem(); return; }
  const xpEl = document.getElementById('xpValor'); if (xpEl) xpEl.textContent = val;
  const xpIn = document.getElementById('xpInput'); if (xpIn) xpIn.value = val;
  const barra = document.getElementById('xpBarra'); if (barra) barra.style.width = progressoXP(val) + '%';
  const contador = document.getElementById('xpContador');
  if (contador) contador.textContent = estado.nivel >= 20 ? 'Nível máximo' : `${val} / ${XP_TABLE[estado.nivel]} XP`;
  sincronizarPersonagem();
}

// Reconstrói apenas lacunas antigas: o total atual não muda e os ganhos estimados ficam identificados.
function garantirHistoricoNiveis() {
  estado.ganhosNivel ||= {};
  const info = CLASSES_PREVIEW[estado.classe]; if (!info || estado.nivel <= 1) return;
  const {pv:pvInicial,pe:peInicial}=recursosIniciaisClasse();
  for (const [campo, chave, inicial] of [['pv','fragmentados_pvmax',pvInicial],['pe','fragmentados_pemax',peInicial]]) {
    const faltantes = []; let conhecidos = 0;
    for (let n = 2; n <= estado.nivel; n++) {
      const ganho = estado.ganhosNivel[n]?.[campo];
      if (Number.isFinite(ganho)) conhecidos += ganho; else faltantes.push(n);
    }
    let restante = Math.max(0, (parseInt(sessionStorage.getItem(chave),10) || inicial) - inicial - conhecidos);
    faltantes.forEach((n,i) => {
      const valor = Math.floor(restante / (faltantes.length-i)); restante -= valor;
      estado.ganhosNivel[n] = {...estado.ganhosNivel[n], [campo]:valor, estimado:true};
    });
  }
}

function aplicarGanhoNivel(ganho, sinal) {
  for (const [campo, chave] of [['pv','fragmentados_pv'],['pe','fragmentados_pe']]) {
    const maxAntigo = Number.parseInt(sessionStorage.getItem(chave+'max'),10) || 1;
    const atualLido = Number.parseInt(sessionStorage.getItem(chave),10);
    const atual = Number.isFinite(atualLido) ? atualLido : maxAntigo;
    const novoMax = Math.max(1, maxAntigo + sinal * ganho[campo]);
    sessionStorage.setItem(chave+'max', novoMax);
    sessionStorage.setItem(chave, Math.max(0, atual + (novoMax-maxAntigo)));
  }
}

function mostrarEvolucao(ganho, sinal) {
  let toast = document.getElementById('_nivelToast');
  if (!toast) { toast = document.createElement('div'); toast.id = '_nivelToast'; toast.className = 'nivel-toast'; toast.setAttribute('role','status'); document.body.appendChild(toast); }
  const seta = sinal > 0 ? 'M12 19V5m-5 5 5-5 5 5' : 'M12 5v14m-5-5 5 5 5-5';
  const icone = caminho => `<svg class="icone-linha" viewBox="0 0 24 24" aria-hidden="true"><path d="${caminho}"/></svg>`;
  toast.innerHTML = `<div class="nivel-toast-titulo">${icone(seta)} ${sinal > 0 ? 'SUBIU DE NÍVEL' : 'NÍVEL REDUZIDO'}</div>
    ${ganho.rolado && sinal > 0 ? `<div>Rolagem: 1d${escaparHTML(ganho.dado)} → ${escaparHTML(ganho.rolado)}${ganho.vigor ? ` (${ganho.vigor > 0 ? '+' : ''}${escaparHTML(ganho.vigor)})` : ''}</div>` : ''}
    <div>${icone('M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8')} PV ${sinal > 0 ? '+' : '−'}${escaparHTML(ganho.pv)}</div>
    <div>${icone('m13 2-9 12h7l-1 8 10-12h-7z')} ${nomeEnergiaClasse()} ${sinal > 0 ? '+' : '−'}${escaparHTML(ganho.pe)}</div>
    ${ganho.estimado ? '<small>Histórico antigo: valores estimados.</small>' : ''}`;
  toast.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => { toast.hidden = true; }, 5000);
}

function _ganhoNivel() {
  const info = CLASSES_PREVIEW[estado.classe]; if (!info) return;
  estado.ganhosNivel ||= {};
  ganhoPVNoNivel(estado.nivel,true);ganhoPENoNivel(estado.nivel,true);
  const ganho=estado.ganhosNivel[estado.nivel];
  aplicarGanhoNivel(ganho, 1); mostrarEvolucao(ganho, 1); salvarEstado();
}

function fichaAlterarNivel(delta) {
  garantirHistoricoNiveis();
  const alvo = Math.min(20, Math.max(1, estado.nivel + Math.trunc(delta)));
  while (estado.nivel < alvo) { estado.nivel++; _ganhoNivel(); }
  while (estado.nivel > alvo) {
    const ganho = estado.ganhosNivel[estado.nivel];
    aplicarGanhoNivel(ganho, -1); mostrarEvolucao(ganho, -1); estado.nivel--;
  }
  salvarEstado(); renderFicha(); sincronizarPersonagem();
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
  atualizarCAFicha();
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
  const esc   = (estado.constanciasEscolhidas || []).filter(cn=>Object.values(CONSTANCIAS_MAP).some(list=>list.includes(cn)));
  const map   = {};
  Object.entries(CONSTANCIAS_MAP).forEach(([a, lista]) => lista.forEach(c => map[c] = a));
  const checks = lerJSON(sessionStorage, 'fragmentados_const_checks', {});
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
  const checks = lerJSON(sessionStorage, 'fragmentados_const_checks', {});
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
