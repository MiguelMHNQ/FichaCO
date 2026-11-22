/* Ponte restrita ao iframe da ficha na sessão. Fora da mesa, mantém o fluxo normal. */
(() => {
  if(window.parent===window||new URLSearchParams(location.search).get('mesa')!=='1')return;
  let pending=null;
  function request(action,finish,local=null){
    if(pending)return;
    const requestId=crypto.randomUUID();pending={requestId,finish,local};
    parent.postMessage({type:'primordios:acao',requestId,action:{...action,characterId:estado.id}},location.origin);
  }
  window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='primordios:acao-concluida'||e.data.requestId!==pending?.requestId)return;const p=pending;pending=null;if(e.data.ok===true)p.finish?.();else if(e.data.local===true)p.local?.();});
  const attack=rolarAtaqueArma;
  window.rolarAtaqueArma=()=>{
    const item=ARMAS.find(i=>i.nome===estado.arma);if(!item||item.dano.startsWith('—'))return attack();
    const formula=analisarDanoArma(item.dadosLivro.dano);
    const bonus=formula.atributos.reduce((total,key)=>total+calcBonus((estado.constancias[key]||0)+totalBonusRaca(key)+bonusAcessorioConstancia(key)),0);
    request({title:item.nome,description:item.dano,range:Number.parseFloat(item.alcance?.replace(',','.'))||null,maxTargets:1,dice:formula.dados,bonus:bonus+formula.fixo},()=>{});
  };
  const spend=gastarPE;
  window.gastarPE=(cost,resource=nomeEnergiaClasse(),button=null)=>{
    const item=button?.closest('.ficha-hab-item'),name=button?.dataset.acaoNome,description=button?.dataset.acaoDescricao;
    if(!item||!name)return spend(cost,resource,button);
    const current=Number(sessionStorage.getItem('fragmentados_pe')??document.getElementById('peAtual')?.textContent);if(current<cost)return spend(cost,resource,button);
    request({...RegrasAcoes.analyze(name,description,{level:estado.nivel}),allowLocal:true,title:name,description},()=>spend(cost,resource,button),()=>spend(cost,resource,button));return false;
  };
  const use=usarAcessorio;
  window.usarAcessorio=(name=estado.acessorio)=>{
    const item=ACESSORIOS.find(i=>i.nome===name);if(!item||!['Laço da Verdade','Colar de Aura Tortuosa','Troca-Troca','Dedo Falso de Confete'].includes(name))return use(name);
    if(item.carga!=null&&obterCargasAcessorio(item)<=0)return use(name);
    request({...RegrasAcoes.analyze(item.nome,item.desc),allowLocal:true,title:item.nome,description:item.desc,dice:[],bonus:0},()=>{if(item.carga!=null)consumirCargaAcessorio(item);retornoVisualAcessorio(item.nome,'usar',item.desc);},()=>use(name));
  };
  const cast=conjurarMagiaDoGrimorio;
  window.conjurarMagiaDoGrimorio=index=>{
    const spell=obterMagiaDoLivro(estado.magiasGrimorio?.[index]);if(!spell)return cast(index);
    const el=document.createElement('div');el.innerHTML=spell.texto;const description=el.textContent;
    const cost=custoManaMagia(spell),pv=/Usa PV em vez de PE/i.test(spell.texto),resource=pv?'pv':'pe';if(cost===null)return cast(index);
    const available=Number(sessionStorage.getItem('fragmentados_'+resource)??document.getElementById(resource+'Atual')?.textContent);if(available<cost)return cast(index);
    request({...RegrasAcoes.analyze(spell.titulo,spell.texto,{spell:true}),allowLocal:true,title:spell.titulo,description},()=>{if(cost>0){if(pv)gastarPV(cost);else spend(cost,'Mana');}},()=>cast(index));
  };
})();
