const DADOS = [2,4,6,8,10,12,20,100];
let _diceOpen=false,_diceQueue=[],_diceBusy=false,_diceTray=null,_diceSequence=Promise.resolve(),_diceLeaving=false;
const _diceRequests=new Set();
const diceTexto=(key,params={})=>window.PrimordiosI18n?.t(key,params)||key;
function toggleDice(){
  _diceOpen=!_diceOpen;document.getElementById('dicePanel').hidden=!_diceOpen;
  document.getElementById('diceBtn').setAttribute('aria-expanded',String(_diceOpen));
  if(_diceOpen){if(!_diceTray)_diceTray=new BandejaDados3D(document.getElementById('diceCanvas'));_diceTray.draw();}
}
function adicionarDado(d){if(_diceBusy||!DADOS.includes(d))return;_diceQueue.push(d);renderQueue();}
function removerDado(i){if(_diceBusy)return;_diceQueue.splice(i,1);renderQueue();}
function limparDados(){if(_diceBusy)return;document.getElementById('diceBonus').value='0';_diceQueue=[];renderQueue();document.getElementById('diceResult').hidden=true;_diceTray?.roll([]);}
function renderQueue(){
  const el=document.getElementById('diceQueue');el.replaceChildren();
  _diceQueue.forEach((d,i)=>{const b=document.createElement('button');b.type='button';b.textContent='d'+d;b.title='Clique para remover';b.disabled=_diceBusy;b.onclick=()=>removerDado(i);el.append(b);});
  const roll=document.getElementById('diceBtnRolar');roll.disabled=_diceBusy||!_diceQueue.length;roll.setAttribute('aria-busy',String(_diceBusy));
  document.getElementById('diceClear').disabled=_diceBusy;
  document.getElementById('diceBonus').disabled=_diceBusy;
  document.querySelectorAll('#dicePicker button').forEach(b=>b.disabled=_diceBusy);
}
function rolarDadosManuais(){
  const input=document.getElementById('diceBonus');if(_diceBusy||!_diceQueue.length)return Promise.resolve();
  if(!input.reportValidity())return Promise.resolve();const bonus=input.value.trim()===''?0:Number(input.value);
  if(!Number.isInteger(bonus)||Math.abs(bonus)>10000)return Promise.resolve();return rolarDados(bonus);
}
document.getElementById('diceBonus').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();rolarDadosManuais();}});
function rolarDados(bonus=0,descricao='',aoConcluir=null){
  if(!_diceQueue.length&&!bonus)return Promise.resolve();
  if(_diceBusy&&!descricao&&!aoConcluir)return Promise.resolve();
  // O sorteio e o total ficam fixados antes da animação. A apresentação não sorteia novamente.
  const resultados=_diceQueue.map(d=>({d,v:Math.floor(Math.random()*d)+1}));
  const soma=resultados.reduce((s,r)=>s+r.v,0)+bonus;
  const pedido={resultados,bonus,descricao,soma,concluido:false};
  pedido.finalizar=()=>{if(pedido.concluido)return;pedido.concluido=true;_diceRequests.delete(pedido);aoConcluir?.(soma);};
  _diceRequests.add(pedido);_diceBusy=true;renderQueue();
  const executar=async()=>{
    if(_diceLeaving){pedido.finalizar();return;}
    if(!_diceOpen)toggleDice();
    _diceQueue=resultados.map(r=>r.d);renderQueue();
    document.getElementById('diceResult').hidden=true;
    const nota=document.getElementById('diceTrayNote');nota.hidden=false;nota.textContent=diceTexto('Rolando…');
    try{await _diceTray.roll(resultados);}catch(error){console.error('Falha na apresentação dos dados',error);}
    if(_diceLeaving){pedido.finalizar();return;}
    nota.hidden=true;
    const rolls=document.getElementById('diceRolls');rolls.replaceChildren();
    if(descricao){const titulo=document.createElement('p');titulo.className='dice-result-title';titulo.textContent=descricao;rolls.append(titulo);}
    for(const r of resultados){const span=document.createElement('span');span.className='dice-value'+(r.v===r.d?' critico':r.v===1?' falha':'');span.textContent='d'+r.d+' · '+r.v;rolls.append(span);}
    if(bonus){const span=document.createElement('span');span.className='dice-modifier';span.textContent=diceTexto('Bônus: {value}',{value:(bonus>0?'+':'')+bonus});rolls.append(span);}
    if(!resultados.length){const span=document.createElement('span');span.textContent=diceTexto('Dano fixo');rolls.append(span);}
    document.getElementById('diceSum').textContent='= '+soma;
    document.getElementById('diceResult').hidden=false;
    pedido.finalizar();
  };
  const tarefa=_diceSequence.then(executar);
  _diceSequence=tarefa.catch(error=>{console.error('Falha na rolagem',error);pedido.finalizar();}).finally(()=>{if(!_diceRequests.size){_diceBusy=false;renderQueue();}});
  return _diceSequence;
}
function rolagemRapida(dados,bonus,descricao,aoConcluir=null){_diceQueue=[...dados];renderQueue();return rolarDados(bonus,descricao,aoConcluir);}
// Efeitos já comprometidos (cura/previsão etc.) não se perdem ao sair durante a animação.
window.addEventListener('pagehide',()=>{_diceLeaving=true;_diceTray?.finish();for(const pedido of [..._diceRequests])pedido.finalizar();});
window.addEventListener('pageshow',()=>{_diceLeaving=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&_diceOpen)toggleDice();});
for(const d of DADOS){const b=document.createElement('button');b.type='button';b.textContent='d'+d;b.onclick=()=>adicionarDado(d);document.getElementById('dicePicker').append(b);}
renderQueue();

// O acabamento muda todos os dados sem refazer o sorteio.
let estiloDados;try{estiloDados=localStorage.getItem('primordios_estilo_dados');}catch{}
if(!BandejaDados3D.styles.some(s=>s.id===estiloDados))estiloDados=BandejaDados3D.styles[0].id;
for(const skin of BandejaDados3D.styles){
  const b=document.createElement('button');b.type='button';b.dataset.diceStyle=skin.id;b.title=skin.name;b.setAttribute('aria-label',skin.name);b.setAttribute('aria-pressed',skin.id===estiloDados);
  b.style.setProperty('--dice-swatch',`hsl(${skin.h} ${skin.s}% ${skin.base+skin.spread*.8}%)`);b.style.setProperty('--dice-swatch-ink',skin.edge);
  b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="${skin.icon}"/></svg>`;
  b.onclick=()=>{estiloDados=skin.id;try{localStorage.setItem('primordios_estilo_dados',skin.id);}catch{}for(const button of document.querySelectorAll('[data-dice-style]'))button.setAttribute('aria-pressed',button===b);_diceTray?.setStyle(skin.id);};document.getElementById('diceStyles').append(b);
}
