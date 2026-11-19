// Itens, quantidades, peso e persistência do inventário.


// ===== INVENTÁRIO =====
function carregarInventario() {
  const itens = lerJSON(sessionStorage, 'fragmentados_inventario', []);
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
  const itens = lerJSON(sessionStorage, 'fragmentados_inventario', []);
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
    <input type="text" value="${escaparHTML(nome)}" placeholder="Nome do item" style="background:transparent;border:none;border-bottom:1px solid #2a2535;color:var(--cor-texto);font-size:0.78rem;padding:2px 4px;width:100%;" oninput="salvarItemInventario(${idx},'nome',this.value)">
    <input type="number" value="${Number.isFinite(Number(qtd))?Number(qtd):0}" min="1" style="width:100%;background:transparent;border:none;border-bottom:1px solid #2a2535;color:#aaa;font-size:0.78rem;text-align:center;" oninput="salvarItemInventario(${idx},'qtd',this.value);atualizarPeso()">
    <input type="number" value="${Number.isFinite(Number(peso))?Number(peso):0}" min="0" step="0.1" style="width:100%;background:transparent;border:none;border-bottom:1px solid #2a2535;color:#aaa;font-size:0.78rem;text-align:center;" oninput="salvarItemInventario(${idx},'peso',this.value);atualizarPeso()">
    <button class="c-btn" style="color:#ff4444;border-color:#ff444444;" onclick="removerItemInventario(${idx})">&#x2715;</button>`;
  lista.appendChild(row);
}

function salvarItemInventario(idx, campo, valor) {
  const itens = lerJSON(sessionStorage, 'fragmentados_inventario', []);
  if (!itens[idx]) return;
  itens[idx][campo] = campo === 'nome' ? valor : parseFloat(valor) || 0;
  sessionStorage.setItem('fragmentados_inventario', JSON.stringify(itens));
  agendarSync();
}

function removerItemInventario(idx) {
  const itens = lerJSON(sessionStorage, 'fragmentados_inventario', []);
  itens.splice(idx, 1);
  sessionStorage.setItem('fragmentados_inventario', JSON.stringify(itens));
  carregarInventario();
  agendarSync();
}

function atualizarPeso() {
  const itens = lerJSON(sessionStorage, 'fragmentados_inventario', []);
  const total = itens.reduce((s, i) => s + (parseFloat(i.peso) || 0) * (parseInt(i.qtd) || 1), 0);
  const el    = document.getElementById('pesoTotal');
  const maxEl = document.getElementById('pesoMax');
  if (!el) return;
  const max = parseFloat(maxEl?.value) || 0;
  el.textContent = total.toFixed(1);
  el.style.color = max && total > max ? '#ff4444' : '#c9a84c';
  if (maxEl?.value) { sessionStorage.setItem('fragmentados_pesomax', maxEl.value); agendarSync(); }
}
