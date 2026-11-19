// As escolhas usam identificadores estáveis; somente os rótulos são traduzidos.
(() => {
  const guerreiro=[
    {id:'espadas-leves',nome:'Espadas Leves',familiar:'Espadas Pesadas'},
    {id:'machados-pesados',nome:'Machados Pesados',familiar:'Machados Leves'},
    {id:'martelos-pesados',nome:'Martelos Pesados',familiar:'Martelos Leves'},
    {id:'lancas-leves',nome:'Lanças Leves',familiar:'Lanças Pesadas'},
    {id:'macas-leves',nome:'Maças Leves',familiar:'Maças Pesadas'}
  ];
  function escolhas(valor=estado.proficienciasGuerreiro){
    const conhecimentos=[...new Set(Array.isArray(valor?.conhecimentos)?valor.conhecimentos:[])].filter(id=>guerreiro.some(c=>c.id===id)).slice(0,2);
    const permitidas=conhecimentos.length===2?guerreiro.filter(c=>conhecimentos.includes(c.id)).map(c=>c.familiar):[];
    return {conhecimentos,familiaridade:permitidas.includes(valor?.familiaridade)?valor.familiaridade:null};
  }
  function categorias(){
    const groups=new Map();
    for(const arma of typeof ARMAS==='undefined'?[]:ARMAS){const nome=arma.categoriaLivro;if(!nome)continue;if(!groups.has(nome))groups.set(nome,new Set());groups.get(nome).add(/^pesad/i.test(arma.dadosLivro.peso)?'Pesada':'Leve');}
    return [...groups].map(([nome,pesos])=>({nome,opcoes:[nome,...[...pesos].sort().map(p=>nome+' ('+p+')')]}));
  }
  function completas(){const e=escolhas();return e.conhecimentos.length===2&&!!e.familiaridade;}
  function montar(container,classe,{especializacao=true,onChange=()=>{}}={}){
    const dados=CLASSES_PREVIEW[classe];if(!container||!dados)return;
    container.classList.add('proficiencias-painel');container.replaceChildren();
    const titulo=label=>{const h=document.createElement('h5');h.textContent=label;container.append(h);};
    const tags=values=>{const row=document.createElement('div');row.className='proficiencias-tags';for(const value of values){const span=document.createElement('span');span.textContent=value;row.append(span);}container.append(row);};
    const option=(label,value)=>new Option(label,value);
    const refresh=()=>{onChange();montar(container,classe,{especializacao,onChange});};
    titulo('Conhecimento');
    if(classe==='Guerreiro'){
      const atuais=escolhas();
      const hint=document.createElement('small');hint.textContent=dados.conhecimento[0];container.append(hint);
      for(let i=0;i<2;i++){
        const label=document.createElement('label');label.textContent=i===0?'Primeira categoria':'Segunda categoria';
        const select=document.createElement('select');select.dataset.conhecimento=String(i);select.append(option('Escolha uma categoria',''));
        for(const c of guerreiro){const o=option(c.nome,c.id);o.disabled=atuais.conhecimentos[1-i]===c.id;select.append(o);}select.value=atuais.conhecimentos[i]||'';
        select.onchange=()=>{const ids=[...container.querySelectorAll('[data-conhecimento]')].map(s=>s.value).filter(Boolean);estado.proficienciasGuerreiro=escolhas({...atuais,conhecimentos:ids});refresh();};label.append(select);container.append(label);
      }
      tags(['Arco Curto (Arma Específica)']);
      titulo('Familiaridade');
      const label=document.createElement('label');label.textContent='Categoria de outro peso';const select=document.createElement('select');select.dataset.familiaridade='';select.append(option('Escolha uma categoria',''));
      if(atuais.conhecimentos.length===2)for(const c of guerreiro.filter(c=>atuais.conhecimentos.includes(c.id)))select.append(option(c.familiar,c.familiar));
      select.disabled=atuais.conhecimentos.length!==2;select.value=atuais.familiaridade||'';
      select.onchange=()=>{estado.proficienciasGuerreiro=escolhas({...atuais,familiaridade:select.value});onChange();};label.append(select);container.append(label);
      const hintF=document.createElement('small');hintF.textContent=dados.familiaridade[0];container.append(hintF);
    }else{tags(dados.conhecimento);titulo('Familiaridade');tags(dados.familiaridade);}
    titulo('Armaduras');tags(dados.armaduras);
    if(especializacao){
      titulo('Especialização');const label=document.createElement('label');label.textContent='Categoria de arma (opcional)';const select=document.createElement('select');select.dataset.especializacao='';select.append(option('Sem especialização',''));
      for(const category of categorias()){const group=document.createElement('optgroup');group.label=category.nome;for(const value of category.opcoes)group.append(option(value,value));select.append(group);}
      select.value=categorias().some(c=>c.opcoes.includes(estado.especializacaoArma))?estado.especializacaoArma:'';
      select.onchange=()=>{estado.especializacaoArma=select.value||null;onChange();};label.append(select);container.append(label);
    }
  }
  window.Proficiencias={montar,escolhas,categorias,completas};
})();
