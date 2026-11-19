// Preferências visuais, layouts e edição dos blocos da ficha.


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

function _wrapLayout(n){
  const c=document.getElementById('fichaConteudo');if(!c)return;
  const data=lerJSON(localStorage,LAYOUT_KEY,[]),saved=Array.isArray(data)?data:[];
  const blocks=[...c.querySelectorAll(':scope>.ficha-bloco')];
  if(saved.some(item=>item?.bloco))for(const item of saved){const block=blocks.find(b=>b.dataset.bloco===item?.bloco);if(block)c.append(block);}
  const grimorio=blocks.find(b=>b.dataset.bloco==='grimorio');if(grimorio&&!saved.some(item=>item?.bloco==='grimorio')){const accessories=c.querySelector('[data-bloco=acessorios]');accessories?.after(grimorio);}
  if(saved.length&&!saved.some(item=>item?.bloco)){const antigos=blocks.length-(grimorio?1:0);if(saved.length===antigos-1)saved.splice(4,0,null);if(grimorio&&saved.length===antigos)saved.splice(5,0,null);}
  [...c.children].forEach((block,i)=>{
    const stored=saved.find(item=>item?.bloco===block.dataset.bloco)||(!saved.some(item=>item?.bloco)?saved[i]:null);
    if(stored?.width)block.style.width=stored.width;if(stored?.height)block.style.height=stored.height;
    if(n===3){const pos=stored?.left!==undefined?stored:(block.dataset.bloco==='grimorio'?{left:0,top:1560}:(L3_POS_DEFAULT[['identidade','progresso','atributos','equipamentos','acessorios','vitalidade','habilidades','inventario'].indexOf(block.dataset.bloco)]||{left:0,top:i*100}));block.style.left=pos.left+'px';block.style.top=pos.top+'px';}
  });
  c.closest('.ficha-viewport')?.classList.toggle('layout-livre',n===3);
  _ajustarAreaLayoutLivre();
  if(_modoEdicao)_ativarEdicaoBlocos();
}
function _ajustarAreaLayoutLivre(crescer=false){
  const c=document.getElementById('fichaConteudo');if(!c)return;
  if(_layoutAtual()!==3){c.style.minWidth='';c.style.minHeight='';return;}
  let width=c.parentElement.clientWidth,height=400;
  for(const block of c.children){width=Math.max(width,block.offsetLeft+block.offsetWidth+20);height=Math.max(height,block.offsetTop+block.offsetHeight+20);}
  if(crescer){width=Math.max(width,parseFloat(c.style.minWidth)||0);height=Math.max(height,parseFloat(c.style.minHeight)||0);}
  c.style.minWidth=width+'px';c.style.minHeight=height+'px';
}

// ===== MODO EDIÇÃO =====
const LAYOUT_KEY = 'fragmentados_layout';
const CORES_KEY  = 'fragmentados_cores';
const LAYOUT_NUM_KEY = 'fragmentados_layout_num';

function trocarLayout(n) {
  _terminarGestoBloco(true);
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
  const c = lerJSON(localStorage, CORES_KEY, null) || CORES_PADRAO;
  _recolorirFicha(c.principal, c.texto);
  return c;
}

function aplicarCores() {
  const cp = document.getElementById('editCorPrincipal').value;
  const ct = document.getElementById('editCorTexto').value;
  localStorage.setItem(CORES_KEY, JSON.stringify({ principal: cp, texto: ct }));
  // As variáveis atualizam os blocos sem reconstruir a ficha.
  _recolorirFicha(cp, ct);
}

function _recolorirFicha(cp,ct){
  const root=document.documentElement;
  for(const [key,value,padrao] of [['--cor-principal',cp,CORES_PADRAO.principal],['--cor-texto',ct,CORES_PADRAO.texto]]){
    if(/^#[0-9a-f]{6}$/i.test(value)&&value.toLowerCase()!==padrao)root.style.setProperty(key,value);
    else root.style.removeProperty(key);
  }
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
      h.setAttribute('role',layout3?'button':'group');h.tabIndex=0;h.setAttribute('aria-label','Mover bloco');h.onkeydown=event=>_teclaMoverBloco(event,bloco);bloco.insertBefore(h, bloco.firstChild);
      if(!layout3)for(const [delta,label]of [[-1,'Subir bloco'],[1,'Descer bloco']]){const button=document.createElement('button');button.className='bloco-ordem';button.type='button';button.setAttribute('aria-label',label);button.textContent=delta<0?'↑':'↓';button.onclick=()=>_moverBlocoPasso(bloco,delta);h.append(button);}
    }

    if (layout3) _adicionarResizeHandles(bloco);

    bloco.addEventListener('pointerdown',_onDragPointerDown);
    if (!layout3 && !matchMedia('(pointer:coarse)').matches) {
      bloco.setAttribute('draggable', 'true');
      bloco.addEventListener('dragstart', _onDragStart);
      bloco.addEventListener('dragover',  _onDragOver);
      bloco.addEventListener('drop',      _onDrop);
      bloco.addEventListener('dragend',   _onDragEnd);
    }
  });

  const data=lerJSON(localStorage,LAYOUT_KEY,[]),saved=Array.isArray(data)?data:[];
  blocos.forEach((bloco, i) => {
    const item=saved.find(s=>s?.bloco===bloco.dataset.bloco)||(!saved.some(s=>s?.bloco)?saved[i]:null);
    if(item?.width)bloco.style.width=item.width;if(item?.height)bloco.style.height=item.height;
  });
  _ajustarAreaLayoutLivre();
}

function _adicionarResizeHandles(bloco) {
  if(bloco.querySelector('.resize-handle'))return;
  ['nw','ne','sw','se','n','s','w','e'].forEach(dir => {
    const h = document.createElement('div');
    h.className = 'resize-handle rh-' + dir;
    h.addEventListener('pointerdown',e=>_onResizePointerDown(e,bloco,dir));
    bloco.appendChild(h);
  });
}

function _desativarEdicaoBlocos() {
  _terminarGestoBloco(true);
  document.querySelectorAll('#fichaConteudo .ficha-bloco').forEach(bloco => {
    bloco.classList.remove('editavel', 'dragging', 'drag-over');
    bloco.removeAttribute('draggable');
    bloco.querySelector('.bloco-edit-handle')?.remove();
    bloco.querySelectorAll('.resize-handle').forEach(h => h.remove());
    bloco.removeEventListener('pointerdown',_onDragPointerDown);
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
    bloco:b.dataset.bloco,
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

// Pointer Events atende mouse, caneta e toque sem capturar a rolagem do conteúdo.
let _gestoBloco=null;
function _moverBlocoPasso(bloco,delta){
  const parent=bloco.parentElement,blocks=[...parent.children],i=blocks.indexOf(bloco),next=blocks[i+delta];if(!next)return;
  parent.insertBefore(bloco,delta<0?next:next.nextSibling);_salvarOrdemBlocos();
}
function _teclaMoverBloco(e,bloco){
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();
  if(_layoutAtual()!==3){_moverBlocoPasso(bloco,['ArrowUp','ArrowLeft'].includes(e.key)?-1:1);return;}
  const step=e.shiftKey?50:10;bloco.style.left=Math.max(0,(parseFloat(bloco.style.left)||0)+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0))+'px';bloco.style.top=Math.max(0,(parseFloat(bloco.style.top)||0)+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0))+'px';_ajustarAreaLayoutLivre();_salvarOrdemBlocos();
}
function _iniciarGestoBloco(e,bloco,tipo,dir){
  if(_gestoBloco||e.button!==0)return;e.preventDefault();e.stopPropagation();
  const r=bloco.getBoundingClientRect();_gestoBloco={id:e.pointerId,bloco,tipo,dir,x:e.clientX,y:e.clientY,width:r.width,height:r.height,left:parseFloat(bloco.style.left)||0,top:parseFloat(bloco.style.top)||0,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,before:{left:bloco.style.left,top:bloco.style.top,width:bloco.style.width,height:bloco.style.height}};
  bloco.classList.add('dragging');bloco.setPointerCapture(e.pointerId);
  document.addEventListener('pointermove',_moverGestoBloco);document.addEventListener('pointerup',_soltarGestoBloco);document.addEventListener('pointercancel',_cancelarGestoBloco);
}
function _onDragPointerDown(e){
  if(e.target.closest('input,textarea,button,select,.resize-handle'))return;
  const livre=_layoutAtual()===3;if(!livre&&e.pointerType==='mouse')return;
  if(e.pointerType!=='mouse'&&!e.target.closest('.bloco-edit-handle'))return;
  _iniciarGestoBloco(e,this,livre?'move':'sort');
}
function _onResizePointerDown(e,bloco,dir){_iniciarGestoBloco(e,bloco,'resize',dir);}
function _moverGestoBloco(e){
  const g=_gestoBloco;if(!g||g.id!==e.pointerId)return;if(!g.bloco.isConnected){_terminarGestoBloco(true);return;}
  if(g.tipo==='sort'){
    document.querySelectorAll('.ficha-bloco.drag-over').forEach(b=>b.classList.remove('drag-over'));
    g.destino=document.elementsFromPoint(e.clientX,e.clientY).map(el=>el.closest('.ficha-bloco')).find(b=>b&&b!==g.bloco&&b.parentElement===g.bloco.parentElement);
    g.destino?.classList.add('drag-over');return;
  }
  if(g.tipo==='move'){const r=g.bloco.parentElement.getBoundingClientRect();g.bloco.style.left=Math.max(0,e.clientX-r.left-g.offsetX)+'px';g.bloco.style.top=Math.max(0,e.clientY-r.top-g.offsetY)+'px';}
  else{
    let dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(g.dir.includes('e'))g.bloco.style.width=Math.max(220,g.width+dx)+'px';
    if(g.dir.includes('s'))g.bloco.style.height=Math.max(60,g.height+dy)+'px';
    if(g.dir.includes('w')){const width=Math.max(220,Math.min(g.width+g.left,g.width-dx));g.bloco.style.width=width+'px';g.bloco.style.left=(g.left+g.width-width)+'px';}
    if(g.dir.includes('n')){const height=Math.max(60,Math.min(g.height+g.top,g.height-dy));g.bloco.style.height=height+'px';g.bloco.style.top=(g.top+g.height-height)+'px';}
  }
  _ajustarAreaLayoutLivre(true);
}
function _terminarGestoBloco(cancelar=false){
  const g=_gestoBloco;if(!g)return;_gestoBloco=null;
  document.removeEventListener('pointermove',_moverGestoBloco);document.removeEventListener('pointerup',_soltarGestoBloco);document.removeEventListener('pointercancel',_cancelarGestoBloco);
  if(cancelar)Object.assign(g.bloco.style,g.before);
  else if(g.tipo==='sort'&&g.destino?.isConnected){const parent=g.bloco.parentElement,blocks=[...parent.children];parent.insertBefore(g.bloco,blocks.indexOf(g.bloco)<blocks.indexOf(g.destino)?g.destino.nextSibling:g.destino);}
  if(g.bloco.hasPointerCapture(g.id))g.bloco.releasePointerCapture(g.id);
  document.querySelectorAll('.ficha-bloco').forEach(b=>b.classList.remove('dragging','drag-over'));
  _ajustarAreaLayoutLivre();if(!cancelar)_salvarOrdemBlocos();
}
function _soltarGestoBloco(e){if(e.pointerId===_gestoBloco?.id)_terminarGestoBloco();}
function _cancelarGestoBloco(e){if(!e||e.pointerId===_gestoBloco?.id)_terminarGestoBloco(true);}
window.addEventListener('blur',()=>_cancelarGestoBloco());
document.addEventListener('visibilitychange',()=>{if(document.hidden)_cancelarGestoBloco();});
window.addEventListener('resize',()=>_ajustarAreaLayoutLivre());

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
