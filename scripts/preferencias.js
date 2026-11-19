/* Tradução de apresentação; identificadores das regras e fichas continuam estáveis. */
(() => {
  const originais = new WeakMap();
  const atributosOriginais = new WeakMap();
  const normalizar = s => String(s).normalize('NFC').replace(/\s+/g,' ').trim();
  let dicionario = new Map(),modelos=[],regexTermos=null;
  const escaparRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function prepararCatalogo(catalogo){
    dicionario = new Map(catalogo.entries.map(t => [normalizar(t[0]),t]));
    modelos = catalogo.templates.filter(s => dicionario.has(s) && !/[;=]|\}\s*\{/.test(s)).map(s => {
    const partes = s.split(/(\{v\d+\})/g), variaveis = partes.filter(p => /^\{v\d+\}$/.test(p));
    return {chave:s, variaveis, regex:new RegExp('^'+partes.map(p => /^\{v\d+\}$/.test(p) ? '(.+?)' : escaparRegex(p)).join('')+'$')};
  }).sort((a,b) => b.chave.replace(/\{v\d+\}/g,'').length-a.chave.replace(/\{v\d+\}/g,'').length);
  // Fragmentos compostos (ex.: "Guerreiro · Nível 3") usam o mesmo catálogo.
    const termos = [...dicionario.keys()].filter(k => k.length>1 && k.length<90 && !/[{}<>\n]/.test(k)).sort((a,b)=>b.length-a.length);
    regexTermos = termos.length?new RegExp('(?<![\\p{L}\\p{N}_])('+termos.map(escaparRegex).join('|')+')(?![\\p{L}\\p{N}_])','gu'):null;
  }
  const ignorar = 'script,style,textarea,input,[contenteditable],[data-i18n-skip],[data-i18n-key],#nomeMapa,#cfgUsuario,.inv-card-nome,.tt-mapa-nome,.tt-mapa-data,.recurso span,.fichas-pendente>strong';
  let idioma = 'pt-BR';
  function texto(chave, params = {}) {
    const item = dicionario.get(normalizar(chave)), indice = idioma === 'pt-BR' ? 0 : 1;
    return (item?.[indice] || chave).replace(/\{(\w+)\}/g, (match,key) => Object.hasOwn(params,key) ? (key==='class' ? conteudo(String(params[key])) : String(params[key])) : match);
  }
  function conteudo(value, profundidade = 0) {
    if (idioma === 'pt-BR') return value;
    const chave = normalizar(value), direto = dicionario.get(chave), indice = 1;
    if (direto) return value.replace(value.trim(),()=>direto[indice] || direto[0]);
    if (profundidade < 1) for (const modelo of modelos) {
      const match = chave.match(modelo.regex);
      if (match) { const params={}; modelo.variaveis.forEach((v,i)=>params[v.slice(1,-1)]=conteudo(match[i+1],profundidade+1)); return texto(modelo.chave,params); }
    }
    return regexTermos?value.replace(regexTermos,match=>texto(match)):value;
  }
  function html(value) {
    const template = document.createElement('template'); template.innerHTML = value;
    const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())) if(!node.parentElement?.closest(ignorar)) node.nodeValue=conteudo(node.nodeValue);
    return template.innerHTML;
  }
  const semAcentos = s => s.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase();
  function corresponde(value,query) {
    const original=String(value).replace(/<[^>]*>/g,' '), traduzido=html(String(value)).replace(/<[^>]*>/g,' ');
    return semAcentos(original+' '+traduzido).includes(semAcentos(query));
  }
  function definir(el, chave, params = {}) {
    el.dataset.i18nKey = chave; el.dataset.i18nParams = JSON.stringify(params);
    const value = texto(chave,params); if (el.textContent !== value) el.textContent = value;
  }
  window.PrimordiosI18n = { t:texto, set:definir, content:conteudo, html, match:corresponde, original:el=>[...el.childNodes].map(n=>originais.get(n)?.original||n.textContent).join('') };
  for (const nome of ['alert','confirm','prompt']) {
    const original=window[nome].bind(window);
    window[nome]=(mensagem,...args)=>original(conteudo(String(mensagem)),...args);
  }
  function traduzir(raiz = document.body) {
    const elementos = seletor => [...(raiz.matches?.(seletor) ? [raiz] : []), ...raiz.querySelectorAll(seletor)];
    // Opções sem value explícito não podem mudar seu identificador ao traduzir.
    for (const el of elementos('option:not([value])')) el.setAttribute('value',el.value);
    for (const attribute of ['placeholder','title','aria-label','alt','label']) for (const el of elementos('['+attribute+']')) {
      if (el.closest('[data-i18n-skip],.recurso img')) continue;
      let registros=atributosOriginais.get(el);if(!registros){registros=new Map();atributosOriginais.set(el,registros);}
      const atual=el.getAttribute(attribute);let registro=registros.get(attribute);
      if(!registro||registro.ultimo!==atual)registro={original:atual};
      const value=conteudo(registro.original);if(atual!==value)el.setAttribute(attribute,value);
      registro.ultimo=value;registros.set(attribute,registro);
    }
    for (const el of elementos('[data-i18n-key]')) { let params={};try{params=JSON.parse(el.dataset.i18nParams||'{}');}catch{} const value=texto(el.dataset.i18nKey,params);if(el.textContent!==value)el.textContent=value; }
    for (const el of elementos('[data-i18n-placeholder]')) { const key=el.dataset.i18nPlaceholder||el.getAttribute('placeholder');if(key){el.dataset.i18nPlaceholder=key;const value=texto(key);if(el.getAttribute('placeholder')!==value)el.setAttribute('placeholder',value);} }
    for (const [data,attribute] of [['data-i18n-title','title'],['data-i18n-aria-label','aria-label']]) for (const el of elementos('['+data+']')) {const value=texto(el.getAttribute(data));if(el.getAttribute(attribute)!==value)el.setAttribute(attribute,value);}
    const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest(ignorar)) continue;
      const atual = node.nodeValue;
      let registro = originais.get(node);
      if (!registro || registro.ultimo !== atual) registro = { original: atual };
      const novo = conteudo(registro.original);
      if (atual !== novo) node.nodeValue = novo;
      registro.ultimo = novo; originais.set(node, registro);
    }
  }
  let observador=null,revisaoIdioma=0;
  const opcoesObservador={childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt','label']};
  function observar(){if(idioma!=='pt-BR'&&document.body)observador?.observe(document.body,opcoesObservador);}
  async function aplicar() {
    const revisao=++revisaoIdioma;
    let cfg = {}; try { cfg = JSON.parse(localStorage.getItem('primordios_config') || '{}'); } catch {}
    const escolhido=['en','es'].includes(cfg.idioma)?cfg.idioma:'pt-BR';
    const mudou=escolhido!==idioma;
    document.documentElement.style.fontSize = (cfg.fonte || 100) + '%';
    document.documentElement.classList.toggle('tema-claro', cfg.tema === 'claro');
    document.body.classList.toggle('tema-claro', cfg.tema === 'claro');
    if(mudou){
      let catalogo;try{catalogo=await window.PrimordiosContentLocales.load(escolhido);}catch{window.dispatchEvent(new Event('primordios:idioma-erro'));return false;}
      if(revisao!==revisaoIdioma)return false;
      observador?.disconnect();idioma=escolhido;prepararCatalogo(catalogo);
    }
    document.documentElement.lang = idioma;
    document.documentElement.dataset.tituloOriginal ||= document.title;
    document.title=conteudo(document.documentElement.dataset.tituloOriginal);
    if(mudou){observador?.disconnect();traduzir();observar();}
    window.dispatchEvent(new Event('primordios:preferencias'));
    return true;
  }
  window.aplicarPreferencias = ()=>{const task=aplicar();window.PrimordiosI18n.ready=task;return task;};
  document.addEventListener('DOMContentLoaded', () => {
    observador=new MutationObserver(mudancas => {
      const raizes = new Set();
      for (const m of mudancas) {
        if (m.type === 'characterData') raizes.add(m.target.parentElement);
        else raizes.add(m.target);
      }
      observador.disconnect();
      try{for (const raiz of raizes) if (raiz?.isConnected&&![...raizes].some(outra=>outra!==raiz&&outra?.contains(raiz))) traduzir(raiz);}finally{observar();}
    });
    window.aplicarPreferencias();
  });
  window.addEventListener('storage', e => { if (e.key === 'primordios_config') aplicar(); });
})();
