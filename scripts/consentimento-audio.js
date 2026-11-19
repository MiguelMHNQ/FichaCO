// Consentimento do site, com ativação por clique; o navegador mantém suas próprias políticas.
(() => {
  const ler=()=>{try{return JSON.parse(localStorage.getItem('primordios_config')||'{}')||{};}catch{return {};}};
  let modal,pendente=null,resolver;
  function escolher(permitido){
    const cfg=ler();cfg.audioPermitido=permitido;cfg.musicaAtiva=permitido;
    try{localStorage.setItem('primordios_config',JSON.stringify(cfg));}catch{modal.querySelector('[role=status]').textContent='Não foi possível guardar sua escolha. Verifique o armazenamento do navegador.';return;}
    // Dispara no próprio clique para permitir que o player tente iniciar o áudio.
    window.dispatchEvent(new Event('primordios:config'));
    modal.close();const concluir=resolver;pendente=null;resolver=null;concluir?.(permitido);
  }
  function pedir(){
    if(pendente)return pendente;
    if(!modal){
      modal=document.createElement('dialog');modal.id='consentimentoAudio';modal.setAttribute('aria-labelledby','consentimentoAudioTitulo');
      modal.innerHTML='<svg class="icone-linha" viewBox="0 0 24 24" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg><h2 id="consentimentoAudioTitulo">Uma trilha para sua jornada</h2><p>O Primórdios usa músicas de fundo e efeitos sonoros. Você quer ativar o áudio?</p><small>Você pode mudar essa escolha nas configurações quando quiser.</small><p role="status"></p><div><button type="button" id="audioSemSom">Continuar sem som</button><button type="button" id="audioPermitir">Ativar áudio</button></div>';
      document.body.appendChild(modal);modal.querySelector('#audioSemSom').onclick=()=>escolher(false);modal.querySelector('#audioPermitir').onclick=()=>escolher(true);
      modal.addEventListener('cancel',e=>{e.preventDefault();escolher(false);});
    }
    pendente=new Promise(resolve=>resolver=resolve);modal.showModal();return pendente;
  }
  window.ConsentimentoAudio={permitido:()=>ler().audioPermitido===true,pedir};
  const iniciar=()=>{if(!location.pathname.endsWith('/tela0.html')&&typeof ler().audioPermitido!=='boolean')pedir();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
