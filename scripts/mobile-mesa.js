// Controles locais da mesa; não modifica documentos ou permissões da sessão.
function iniciarInterfaceMovelMesa({fecharPaineis}){
  const $=id=>document.getElementById(id),header=document.querySelector('.ferramentas');
  const mobile=matchMedia('(max-width:720px), (pointer:coarse) and (max-height:500px)');
  const options=$('opcoesFerramentas'),selection=$('alternarPropriedades');
  options.onclick=()=>{const open=header.classList.toggle('opcoes-abertas');options.setAttribute('aria-expanded',open);};
  selection.onclick=()=>{const panel=$('selecao'),open=!panel.classList.contains('propriedades-abertas');if(open)fecharPaineis();panel.classList.toggle('propriedades-abertas',open);selection.setAttribute('aria-expanded',open);};
  const update=()=>{
    const viewport=window.visualViewport,root=document.documentElement;
    root.style.setProperty('--mesa-altura',(viewport?.height||innerHeight)+'px');
    root.style.setProperty('--mesa-topo',(viewport?.offsetTop||0)+'px');
    root.style.setProperty('--mesa-teclado',Math.max(0,innerHeight-(viewport?.height||innerHeight)-(viewport?.offsetTop||0))+'px');
    root.style.setProperty('--ferramentas-base',header.getBoundingClientRect().bottom+'px');
    selection.hidden=!mobile.matches;options.hidden=!mobile.matches||$('opcoesDesenho').hidden;
  };
  const observer=new ResizeObserver(update);observer.observe(header);
  window.addEventListener('resize',update);mobile.addEventListener('change',update);
  window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);
  document.addEventListener('click',e=>{if(!mobile.matches)return;if(e.target.closest('[data-category]'))$('livro').parentElement.classList.remove('aberto');});
  update();
}
