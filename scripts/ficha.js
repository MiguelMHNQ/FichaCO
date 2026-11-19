// Coordenação, informações e seleção de caminhos, talentos e habilidades.
﻿// ===== FICHA.JS =====

function sincronizarPersonagem() { return salvarFichaAtual(); }

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

function abrirConstancias(atributo, vTotal) {
  const bonusBase = calcBonus(vTotal);
  const checks    = lerJSON(sessionStorage, 'fragmentados_const_checks', {});
  const lista     = CONSTANCIAS_MAP[atributo] || [];
  document.getElementById('popupAtributoTitulo').textContent = atributo + ' (bônus: +' + bonusBase + ')';
  document.getElementById('popupAtributoLista').innerHTML = lista.map(c => {
    const ch  = checks[c] || 0;
    const val = bonusBase + ch;
    const boxes = [0,1,2].map(i => `<span id="ccb-${c}-${i}" onclick="toggleConstCheck('${c}',${i})" style="cursor:pointer;font-size:0.75rem;display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;border:1px solid #3a3550;border-radius:2px;margin-right:2px;color:var(--cor-principal);">${i < ch ? '*' : ''}</span>`).join('');
    return `<div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-size:0.82rem;color:var(--cor-texto);">${c}</span>
        <span id="cpop-${c}" style="font-size:1rem;color:var(--cor-principal);font-weight:bold;min-width:32px;text-align:right;">+${val}</span>
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

  const sec = (t) => `<div style="font-size:0.62rem;letter-spacing:2px;color:var(--cor-principal);margin:14px 0 8px;padding-top:10px;border-top:1px solid #1a1726;">${t}</div>`;
  const row = (l,v) => `<div style="font-size:0.78rem;color:#aaa;margin-bottom:5px;">${l}: <span style="color:var(--cor-texto);">${v}</span></div>`;
  const tbl = (rows) => `<table style="width:100%;border-collapse:collapse;font-size:0.72rem;margin-bottom:4px;">${rows.map((r,i)=>`<tr>${r.map(c=>`<td style="padding:3px 6px 3px 0;border-bottom:1px solid #1a1726;color:${i===0?'var(--cor-principal)':r[0]==='—'?'#444':'#aaa'}">${c}</td>`).join('')}</tr>`).join('')}</table>`;

  // monta abas
  const abas = [{ id:'base', label:'Geral' }];
  if (extra) extra.secoes.forEach((s,i) => abas.push({ id:'s'+i, label: s.titulo.split(' ')[0] }));

  // conteúdo de cada aba
  const conteudos = {};

  // aba base
  let base = `<div style="font-size:0.75rem;color:#888;line-height:1.7;margin-bottom:12px;font-style:italic;">${d.desc}</div>`;
  base += sec(estado.classe==='Mago'?'VIDA & MANA':'VIDA & ENERGIA');
  base += row('Dado de vida', d.dadoVida) + row('Vida inicial', d.vidaInicial) + row('Vida por nível', d.vidaNivel);
  base += row(estado.classe==='Mago'?'Mana inicial':'Energia inicial', d.energiaInicial) + row(estado.classe==='Mago'?'Mana por nível':'Energia por nível', d.energiaNivel);
  if (d.especificacoes && d.especificacoes !== 'Nenhuma') { base += sec('ESPECIFICAÇÕES'); base += `<div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${d.especificacoes}</div>`; }
  base += sec('CONSTÂNCIAS FIXAS') + `<div style="font-size:0.78rem;color:var(--cor-texto);margin-bottom:4px;">${d.constanciasFixas.join(', ')}</div>`;
  base += sec('PROFICIÊNCIAS') + row('Conhecimento',d.conhecimento.join('; ')) + row('Familiaridade',d.familiaridade.join('; ')) + row('Armaduras',d.armaduras.join(', '));
  conteudos['base'] = base;

  if (extra) {
    extra.secoes.forEach((s,i) => {
      let html = `<div style="font-size:0.62rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:10px;">${s.titulo}</div>`;
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

function removerFoto() {
  sessionStorage.removeItem('fragmentados_foto');
  renderFicha();
  sincronizarPersonagem();
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
      <div style="font-size:0.7rem;color:#666;margin-top:2px;">Benefícios: ${dados.caminhos[nome].proficiencias}</div>
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

function idTalentoClasse(classe, nome) {
  return `classe:${classe}:${nome}`;
}

function temVersatilidadeBardo() {
  return estado.classe === 'Bardo' && (estado.talentos || []).includes('Versatilidade');
}

function obterListaTalentos() {
  const lista = [...(TALENTOS[estado.classe] || []), ...TALENTOS_GERAIS];
  if (!temVersatilidadeBardo()) return lista;
  const proibidas = new Set(['Bardo', 'Obscuro', 'Feitiçeiro', 'Sonoriante', 'Aspectomante', 'Mago']);
  Object.entries(TALENTOS).forEach(([classe, talentos]) => {
    if (proibidas.has(classe)) return;
    talentos.forEach(t => lista.push({
      ...t,
      nome: `${classe} — ${t.nome}`,
      id: idTalentoClasse(classe, t.nome),
      origem: classe
    }));
  });
  return lista;
}

function limiteTalentos() {
  return slotsDisponiveis() + (temVersatilidadeBardo() ? 1 : 0);
}

function resolverTalento(idOuNome) {
  const encontrado = obterListaTalentos().find(t => (t.id || t.nome) === idOuNome);
  if (encontrado) return encontrado;
  for (const [classe, talentos] of Object.entries(TALENTOS)) {
    const talento = talentos.find(t => idTalentoClasse(classe, t.nome) === idOuNome);
    if (talento) return { ...talento, nome: `${classe} — ${talento.nome}`, id: idOuNome, origem: classe };
  }
  return [...TALENTOS_GERAIS, ...(TALENTOS[estado.classe] || [])].find(t => t.nome === idOuNome);
}

function renderizarPopupTalentos() {
  const lista = obterListaTalentos();
  const max = limiteTalentos();
  const titulo = document.getElementById('popupCTTitulo');
  const cont = document.getElementById('popupCTLista');
  titulo.textContent = `Talentos (${(estado.talentos || []).length}/${max})`;
  if (max === 0) {
    cont.innerHTML = '<div style="font-size:0.78rem;color:#555;padding:8px 0;">Talentos disponíveis a partir do nível 5.</div>';
    return;
  }
  const classeLen = (TALENTOS[estado.classe] || []).length;
  const geraisInicio = classeLen;
  let crossInicio = classeLen + TALENTOS_GERAIS.length;
  cont.innerHTML = lista.map((t, idx) => {
    const id = t.id || t.nome;
    const ativo = (estado.talentos || []).includes(id);
    const cheio = (estado.talentos || []).length >= max && !ativo;
    let sep = idx === geraisInicio
      ? '<div style="font-size:0.62rem;letter-spacing:2px;color:color-mix(in srgb,var(--cor-principal) 53.33%,transparent);margin:10px 0 6px;padding-top:8px;border-top:1px solid #2a2535;">— TALENTOS GERAIS —</div>'
      : '';
    if (t.origem && (idx === crossInicio || lista[idx - 1]?.origem !== t.origem)) {
      sep += `<div style="font-size:0.62rem;letter-spacing:2px;color:#7ecfb3;margin:10px 0 6px;padding-top:8px;border-top:1px solid #2a2535;">— TALENTOS DE ${t.origem.toUpperCase()} —</div>`;
    }
    return sep + `<div class="item-linha${ativo ? ' ativo' : ''}" style="${cheio ? 'opacity:0.45;cursor:default;' : 'cursor:pointer;'}" onclick="${cheio ? '' : `toggleTalento('${encodeURIComponent(id)}')`}">
      <div style="font-size:0.85rem;">${t.nome} ${ativo ? '✔' : ''}</div>
      <div style="font-size:0.72rem;color:#666;margin-top:2px;line-height:1.5;">${t.desc}</div>
    </div>`;
  }).join('');
}

function abrirPopupTalentos() {
  renderizarPopupTalentos();
  const badge = event.currentTarget || event.target;
  _posicionarPopupCT(badge);
}

function toggleTalento(idCodificado) {
  const id = decodeURIComponent(idCodificado);
  if (!estado.talentos) estado.talentos = [];
  const idx = estado.talentos.indexOf(id);
  if (idx !== -1) {
    estado.talentos.splice(idx, 1);
    if (id === 'Versatilidade' && estado.classe === 'Bardo') {
      estado.talentos = estado.talentos.filter(x => !String(x).startsWith('classe:'));
    }
  } else if (estado.talentos.length < limiteTalentos()) {
    estado.talentos.push(id);
  }
  salvarEstado();
  const popup = document.getElementById('popupCaminhoTalentos');
  const savedTop = popup.style.top;
  const savedLeft = popup.style.left;
  renderFicha();
  sincronizarPersonagem();
  renderizarPopupTalentos();
  popup.style.top = savedTop;
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
          <div style="font-size:0.85rem;color:${ativo?'#7ecfb3':'var(--cor-texto)'}">${t.nome} ${ativo ? '✔' : ''}</div>
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
          <div style="font-size:0.85rem;color:${ativo?'#7ecfb3':'var(--cor-texto)'}">${t.nome} ${ativo ? '✔' : ''}</div>
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
            <span style="font-size:0.65rem;color:color-mix(in srgb,var(--cor-principal) 53.33%,transparent);border:1px solid color-mix(in srgb,var(--cor-principal) 20.00%,transparent);padding:1px 5px;border-radius:2px;">${h.pce} PCE</span>
          </div>
          <div style="font-size:0.72rem;color:#666;margin-top:3px;line-height:1.5;">${h.desc}</div>
          ${h.evo ? `<div style="font-size:0.7rem;color:color-mix(in srgb,var(--cor-principal) 40.00%,transparent);font-style:italic;margin-top:3px;">→ ${h.evo}</div>` : ''}
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
        <span style="font-size:0.65rem;color:color-mix(in srgb,var(--cor-principal) 53.33%,transparent);border:1px solid color-mix(in srgb,var(--cor-principal) 20.00%,transparent);padding:1px 5px;border-radius:2px;">${h.pce} PCE</span>
      </div>
      <div style="font-size:0.72rem;color:#666;margin-top:3px;line-height:1.5;">${h.desc}</div>
      ${h.evo ? `<div style="font-size:0.7rem;color:color-mix(in srgb,var(--cor-principal) 40.00%,transparent);font-style:italic;margin-top:3px;">→ ${h.evo}</div>` : ''}
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
