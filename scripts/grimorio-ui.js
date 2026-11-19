// Atlas do grimório: catálogo do livro, seleção por elemento e prévia antes de aprender.
const ELEMENTOS_GRIMORIO=[
  ['Fogo','#d58d64','M12 2c3 7-4 6-1 11 3-2 4-4 4-6 6 8 2 14-4 14S2 15 7 9c-1 4 1 5 2 5-2-6 3-8 3-12z'],
  ['Água','#79b2cf','M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14zM8 16c0 3 2 4 4 4'],
  ['Terra','#b4a07b','m3 17 5-12 9-2 4 13-8 5zM8 5l5 16M3 17l14-14'],
  ['Ar','#a2c4bc','M3 8h12c5 0 5-6 1-6M3 12h16c4 0 4 6 0 6M3 16h8c4 0 4 6 0 6'],
  ['Gelo','#9cbfda','M12 2v20M3 7l18 10M3 17 21 7M8 4l4 3 4-3M8 20l4-3 4 3'],
  ['Magma','#bc765d','M3 21 9 5h6l6 16M7 15l4 2 3-4 3 2M9 5l3 3 3-3M12 1v2'],
  ['Eletricidade','#d5bf79','m14 2-10 12h7l-1 8L20 9h-7z'],
  ['Sangue','#c18794','M12 3S6 10 6 15a6 6 0 0 0 12 0c0-5-6-12-6-12zM9 15h6m-3-3v6'],
  ['Flora','#91b496','M4 21C4 10 10 3 21 3c0 11-6 17-15 16M6 19 17 8M10 15v-5m0 5h5'],
  ['Espaço','#aaa1cd','M20 7c4 5-12 13-16 9S16 2 20 7zM12 3v3m0 12v3M9 12h6m-3-3v6'],
  ['Luz','#d5c994','M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
  ['Psíquico','#ba9fc3','M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  ['Outras','#afa89b','M4 4h6l2 2 2-2h6v16h-6l-2 2-2-2H4zM12 6v16']
];
const grimorioUI={elemento:null,magia:null,catalogo:null,refs:null};
const grimorioTexto=(s,p)=>window.PrimordiosI18n?.t(s,p)||s;
const simboloGrimorio=elemento=>{const e=ELEMENTOS_GRIMORIO.find(e=>e[0]===elemento)||ELEMENTOS_GRIMORIO.at(-1);return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${e[2]}"/></svg>`;};
function blocoGrimorioFicha(){
  return estado.classe==='Mago'?`<section class="ficha-bloco ficha-grimorio" id="grimorioFicha" aria-label="Grimório arcano"></section>`:'';
}
function elementosDoGrimorio(){return ELEMENTOS_GRIMORIO.filter(([name])=>name!=='Outras'||(estado.magiasGrimorio||[]).some(n=>!obterMagiaDoLivro(n)));}
function elementoDaMagia(nome){return obterMagiaDoLivro(nome)?.elemento||'Outras';}
function selecionarElementoGrimorio(elemento){grimorioUI.elemento=elemento;grimorioUI.magia=null;montarGrimorioFicha();}
function selecionarMagiaDoGrimorio(nome){grimorioUI.magia=nome;grimorioUI.elemento=elementoDaMagia(nome);montarGrimorioFicha();}
function elementoGrimorioAtual(){
  if(!grimorioUI.elemento)grimorioUI.elemento=elementoDaMagia(estado.magiasGrimorio?.[0])==='Outras'?'Fogo':elementoDaMagia(estado.magiasGrimorio?.[0]);
  return grimorioUI.elemento;
}
function botaoElementoGrimorio(elemento,selecionado,aoClicar,quantidade){
  const b=document.createElement('button');b.type='button';b.className='grimorio-elemento';b.dataset.elemento=elemento;b.setAttribute('aria-pressed',selecionado);b.style.setProperty('--elemento-cor',ELEMENTOS_GRIMORIO.find(e=>e[0]===elemento)?.[1]||'#afa89b');
  if(elemento!=='Outras'){
    const arquivo=({'Água':'Agua-removebg-preview.png','Psíquico':'Psiquico-removebg-preview.png'})[elemento]||(elemento+'-removebg-preview.png');
    const img=document.createElement('img');img.src='../assets/images/Simbolos/'+encodeURIComponent(arquivo);img.alt='';img.setAttribute('aria-hidden','true');img.width=img.height=32;img.decoding='async';
    img.onerror=()=>{img.remove();b.insertAdjacentHTML('afterbegin',simboloGrimorio(elemento));};b.append(img);
  }else b.innerHTML=simboloGrimorio(elemento);
  const text=document.createElement('span');text.textContent=elemento;b.append(text);if(quantidade!==undefined){const count=document.createElement('small');count.textContent=quantidade;b.append(count);}b.onclick=aoClicar;return b;
}
function aplicarCorGrimorio(root,elemento){root.style.setProperty('--grimorio-cor',ELEMENTOS_GRIMORIO.find(e=>e[0]===elemento)?.[1]||'#afa89b');}
function previaMagiaGrimorio(container,magia,{catalogo=false}={}){
  container.replaceChildren();container.className='grimorio-pagina';
  if(!magia){const text=document.createElement('p');text.className='grimorio-vazio';text.textContent=grimorioTexto('Escolha uma magia para ler sua página.');container.append(text);return;}
  const elemento=magia.elemento||'Outras',seal=document.createElement('div');seal.className='grimorio-selo';seal.innerHTML=simboloGrimorio(elemento);container.append(seal);
  const eyebrow=document.createElement('small');eyebrow.className='grimorio-sobretitulo';eyebrow.textContent=elemento;const name=document.createElement('h3');name.textContent=magia.titulo;
  const cost=custoManaMagia(magia),pv=/Usa PV em vez de PE/i.test(magia.texto),resource=pv?'PV':'Mana',mana=document.createElement('span');mana.className='grimorio-custo';mana.textContent=(cost??'—')+' '+resource;
  const header=document.createElement('div');header.className='grimorio-magia-titulo';header.append(eyebrow,name,mana);const metrics=RegrasAcoes.analyze(magia.titulo,magia.texto,{spell:true}),kind=document.createElement('span');kind.className='grimorio-tipo grimorio-tipo-'+metrics.category;kind.textContent=metrics.effects.map(e=>grimorioTexto(e==='heal'?'Cura':e==='support'?'Suporte':'Ataque')).join(' · ');header.append(kind);container.append(header);
  const body=document.createElement('div');body.className='grimorio-regras';body.innerHTML=magia.texto;container.append(body);
  if(!catalogo){const actions=document.createElement('div');actions.className='grimorio-acoes';const cast=document.createElement('button');cast.type='button';cast.className='grimorio-conjurar';cast.textContent=grimorioTexto('Conjurar · {cost} {resource}',{cost:cost??'—',resource});cast.onclick=()=>conjurarMagiaDoGrimorio((estado.magiasGrimorio||[]).indexOf(magia.titulo));const remove=document.createElement('button');remove.type='button';remove.className='grimorio-remover';remove.textContent=grimorioTexto('Excluir');remove.title=grimorioTexto('Excluir magia do grimório');remove.onclick=()=>removerMagiaGrimorio((estado.magiasGrimorio||[]).indexOf(magia.titulo));actions.append(cast,remove);container.append(actions);}
}
function montarGrimorioFicha(){
  const root=document.getElementById('grimorioFicha');if(!root||estado.classe!=='Mago')return;
  // O bloco mantém sua identidade, alças e geometria quando a ficha está sendo editada.
  const navLeft=root.querySelector('.grimorio-elementos')?.scrollLeft||0;
  let content=root.querySelector('.grimorio-conteudo');if(!content){content=document.createElement('div');content.className='grimorio-conteudo';root.append(content);}content.replaceChildren();
  const elemento=elementoGrimorioAtual(),owned=estado.magiasGrimorio||[];aplicarCorGrimorio(root,elemento);
  const head=document.createElement('header');head.className='grimorio-cabecalho';const labels=document.createElement('div'),small=document.createElement('small'),title=document.createElement('h4'),count=document.createElement('span');small.textContent=grimorioTexto('SEU ATLAS ARCANO');title.textContent=grimorioTexto('Grimório');count.className='grimorio-capacidade';count.textContent=owned.length+' / '+capacidadeGrimorio();labels.append(small,title);head.append(labels,count);
  const plus=document.createElement('button');plus.id='btnGerenciarGrimorio';plus.type='button';plus.className='grimorio-adicionar';plus.textContent='+';plus.title=grimorioTexto('Adicionar magia');plus.setAttribute('aria-label',grimorioTexto('Adicionar magia'));plus.onclick=()=>abrirPopupGerenciarGrimorio(plus);head.append(plus);content.append(head);
  const nav=document.createElement('nav');nav.className='grimorio-elementos';nav.setAttribute('aria-label','Elementos mágicos');for(const [e]of elementosDoGrimorio())nav.append(botaoElementoGrimorio(e,e===elemento,()=>selecionarElementoGrimorio(e),owned.filter(n=>elementoDaMagia(n)===e).length));content.append(nav);enquadrarElementoGrimorio(nav,navLeft);
  const stage=document.createElement('div');stage.className='grimorio-palco';const list=document.createElement('div');list.className='grimorio-conhecidas';const subtitle=document.createElement('p');subtitle.className='grimorio-sobretitulo';subtitle.textContent=grimorioTexto('MAGIAS ANOTADAS');list.append(subtitle);
  const names=owned.filter(n=>elementoDaMagia(n)===elemento);if(!names.includes(grimorioUI.magia))grimorioUI.magia=names[0]||null;
  for(const nome of names){const magia=obterMagiaDoLivro(nome),b=document.createElement('button');b.type='button';b.className='grimorio-magia';b.dataset.magia=nome;b.setAttribute('aria-pressed',nome===grimorioUI.magia);const name=document.createElement('span');name.textContent=nome;const volume=document.createElement('small');volume.textContent=magia?'Vol. '+(magia.texto.match(/Vol\.\s*(\d+)/)?.[1]||'?'):'—';b.append(name,volume);b.onclick=()=>selecionarMagiaDoGrimorio(nome);list.append(b);}
  const preview=document.createElement('article');
  if(!names.length){list.append(document.createTextNode(grimorioTexto('Nenhuma magia deste elemento no grimório.')));preview.className='grimorio-pagina grimorio-vazio-pagina';const seal=document.createElement('div');seal.className='grimorio-selo-vazio';seal.innerHTML=simboloGrimorio(elemento);const text=document.createElement('p');text.textContent=grimorioTexto('Uma nova página espera por você.');const add=document.createElement('button');add.type='button';add.className='grimorio-conjurar';add.textContent=grimorioTexto('Explorar magias');add.onclick=()=>abrirPopupGerenciarGrimorio(plus);preview.append(seal,text,add);}
  else if(!obterMagiaDoLivro(grimorioUI.magia)){preview.className='grimorio-pagina';const text=document.createElement('p');text.textContent=grimorioTexto('Magia não encontrada no livro');const remove=document.createElement('button');remove.type='button';remove.textContent=grimorioTexto('Excluir');remove.onclick=()=>removerMagiaGrimorio(owned.indexOf(grimorioUI.magia));preview.append(text,remove);}
  else previaMagiaGrimorio(preview,obterMagiaDoLivro(grimorioUI.magia));
  stage.append(list,preview);content.append(stage);
  const meter=document.createElement('div');meter.className='grimorio-medidor';const fill=document.createElement('span');fill.style.width=Math.min(100,owned.length/Math.max(1,capacidadeGrimorio())*100)+'%';meter.append(fill);content.append(meter);
}
function abrirPopupGerenciarGrimorio(){
  if(estado.classe!=='Mago')return;
  const existing=document.getElementById('grimorioCatalogo');if(existing){existing.showModal();return;}
  const dialog=document.createElement('dialog');dialog.id='grimorioCatalogo';dialog.className='grimorio-catalogo';
  const head=document.createElement('header');head.className='grimorio-cabecalho';const heading=document.createElement('h2');heading.textContent=grimorioTexto('Adicionar magia');const close=document.createElement('button');close.type='button';close.className='grimorio-fechar';close.textContent='×';close.setAttribute('aria-label',grimorioTexto('Fechar'));close.onclick=()=>dialog.close();head.append(heading,close);
  const tabs=document.createElement('nav');tabs.className='grimorio-elementos';const search=document.createElement('input');search.id='grimorioBusca';search.type='search';search.placeholder=grimorioTexto('Buscar magia pelo nome...');search.setAttribute('aria-label',grimorioTexto('Buscar magia pelo nome...'));
  const stage=document.createElement('div');stage.className='grimorio-catalogo-palco';const list=document.createElement('div');list.id='grimorioResultados';list.className='grimorio-catalogo-lista';const preview=document.createElement('article');stage.append(list,preview);
  const footer=document.createElement('footer');footer.className='grimorio-catalogo-rodape';const status=document.createElement('p');status.setAttribute('role','status');const add=document.createElement('button');add.type='button';add.className='grimorio-conjurar';add.textContent=grimorioTexto('Adicionar ao grimório');add.onclick=()=>{if(grimorioUI.catalogo)adicionarMagiaGrimorio(grimorioUI.catalogo);};footer.append(status,add);
  dialog.append(head,tabs,search,stage,footer);dialog.setAttribute('aria-label',grimorioTexto('Adicionar magia'));document.body.append(dialog);
  grimorioUI.refs={dialog,tabs,search,list,preview,status,add,elemento:elementoGrimorioAtual()};grimorioUI.catalogo=null;search.oninput=()=>atualizarCatalogoGrimorio();
  dialog.addEventListener('close',()=>{grimorioUI.refs=null;dialog.remove();document.getElementById('btnGerenciarGrimorio')?.focus({preventScroll:true});},{once:true});atualizarCatalogoGrimorio();dialog.showModal();search.focus();
}
function atualizarCatalogoGrimorio(){
  const r=grimorioUI.refs;if(!r)return;const owned=estado.magiasGrimorio||[],limite=capacidadeGrimorio();aplicarCorGrimorio(r.dialog,r.elemento);
  const navLeft=r.tabs.scrollLeft;
  r.tabs.replaceChildren();for(const [elemento]of ELEMENTOS_GRIMORIO.filter(e=>e[0]!=='Outras'))r.tabs.append(botaoElementoGrimorio(elemento,r.elemento===elemento,()=>{r.elemento=elemento;grimorioUI.catalogo=null;r.search.value='';atualizarCatalogoGrimorio();}));
  enquadrarElementoGrimorio(r.tabs,navLeft);
  const term=r.search.value.trim(),available=obterListaMagiasDoLivro().filter(m=>m.elemento===r.elemento&&!owned.includes(m.titulo)&&(window.PrimordiosI18n?.match(m.titulo,term)??m.titulo.toLowerCase().includes(term.toLowerCase())));
  if(!available.some(m=>m.titulo===grimorioUI.catalogo))grimorioUI.catalogo=available[0]?.titulo||null;
  r.list.replaceChildren();for(const m of available){const b=document.createElement('button');b.type='button';b.className='grimorio-magia';b.dataset.magia=m.titulo;b.setAttribute('aria-pressed',m.titulo===grimorioUI.catalogo);const title=document.createElement('span');title.textContent=m.titulo;const cost=document.createElement('small');cost.textContent='Vol. '+m.texto.match(/Vol\.\s*(\d+)/)?.[1]+' · '+custoManaMagia(m)+(/Usa PV em vez de PE/i.test(m.texto)?' PV':' Mana');b.append(title,cost);b.onclick=()=>{grimorioUI.catalogo=m.titulo;atualizarCatalogoGrimorio();};r.list.append(b);}
  if(!available.length){const text=document.createElement('p');text.className='grimorio-vazio';text.textContent=grimorioTexto('Nenhuma magia disponível com esse nome.');r.list.append(text);}
  previaMagiaGrimorio(r.preview,obterMagiaDoLivro(grimorioUI.catalogo),{catalogo:true});r.add.disabled=!grimorioUI.catalogo||owned.length>=limite;
  r.status.textContent=owned.length>=limite?grimorioTexto('Limite do grimório atingido. Exclua uma magia antes de adicionar outra.'):grimorioTexto('Magias anotadas: {count} / {max}',{count:owned.length,max:limite});
}

function enquadrarElementoGrimorio(nav,left){nav.scrollLeft=left;const active=nav.querySelector('[aria-pressed=true]');if(!active||!nav.clientWidth)return;const x=active.offsetLeft-nav.offsetLeft;if(x<nav.scrollLeft)nav.scrollLeft=x;else if(x+active.offsetWidth>nav.scrollLeft+nav.clientWidth)nav.scrollLeft=x+active.offsetWidth-nav.clientWidth;}
function mostrarConjuracaoGrimorio(cost,resource){
  const page=document.querySelector('#grimorioFicha .grimorio-pagina');if(!page)return;
  let feedback=page.querySelector('.grimorio-feedback');if(!feedback){feedback=document.createElement('p');feedback.className='grimorio-feedback';feedback.setAttribute('role','status');page.append(feedback);}feedback.textContent=grimorioTexto('Conjuração realizada · {cost} {resource}',{cost,resource});
  page.classList.remove('grimorio-conjurada');void page.offsetWidth;page.classList.add('grimorio-conjurada');page.onanimationend=()=>page.classList.remove('grimorio-conjurada');
}
