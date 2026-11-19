// Carrega somente o idioma escolhido e os textos usados nesta página.
(() => {
  const base=document.currentScript.src;
  const manifest=window.PrimordiosLocaleManifest;
  delete window.PrimordiosLocaleManifest;
  const page=location.pathname.split('/').pop()||'index.html';
  const catalogs=window.PrimordiosLanguageCatalogs={};
  const requests=new Map();
  function load(lang){
    if(!['en','es'].includes(lang))return Promise.resolve({entries:[],templates:[]});
    if(requests.has(lang))return requests.get(lang);
    const paths=manifest[lang][page]||manifest[lang]['index.html'];
    const task=Promise.all(paths.map(path=>new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=new URL(path,base).href;
      script.onload=()=>{script.remove();resolve();};script.onerror=()=>{script.remove();reject(new Error('Idioma indisponível. Tente novamente.'));};document.head.append(script);
    }))).then(()=>{
      const parts=paths.map(path=>catalogs[path.split('?')[0]]);
      return {entries:parts.flatMap(part=>part.entries),templates:[...new Set(parts.flatMap(part=>part.templates))]};
    }).catch(error=>{requests.delete(lang);throw error;});
    requests.set(lang,task);return task;
  }
  let selected='pt-BR';try{selected=JSON.parse(localStorage.getItem('primordios_config')||'{}')?.idioma||selected;}catch{}
  window.PrimordiosContentLocales={load};
  // Inicia cedo; a aplicação do idioma continua aguardando este mesmo carregamento.
  load(selected).catch(()=>{});
})();
