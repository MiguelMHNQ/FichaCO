// Reutiliza a ficha completa em um painel independente, sem interromper a mesa.
(() => {
  window.criarFichaDaSessao=(client,notice)=>{
    const button=document.createElement('button');button.id='sessaoFicha';button.title='Ficha do personagem';button.setAttribute('aria-label','Ficha do personagem');button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 2h10l4 4v16H5zM14 2v5h5M8 15h8M8 18h6"/><circle cx="11" cy="11" r="2"/></svg>';
    document.querySelector('.ferramentas .linha').append(button);
    const panel=document.createElement('aside');panel.className='sessao-ficha painel';panel.hidden=true;panel.setAttribute('aria-label','Ficha do personagem');
    const header=document.createElement('header'),title=document.createElement('strong'),select=document.createElement('select'),close=document.createElement('button'),empty=document.createElement('p');title.textContent='Ficha do personagem';close.textContent='✕';close.setAttribute('aria-label','Fechar');empty.textContent='Nenhum personagem selecionado.';header.append(title,select,close);panel.append(header,empty);document.body.append(panel);
    let frame=null,current=null;
    async function load(id){if(id===current&&frame)return;try{if(frame?.contentWindow?.CloudFichas&&current)await frame.contentWindow.CloudFichas.flush(current);frame?.remove();frame=null;current=id;empty.hidden=!!id;if(id){frame=document.createElement('iframe');frame.title='Ficha do personagem';frame.src='tela5.html?mesa=1&personagem='+encodeURIComponent(id);panel.append(frame);}}catch(e){notice(e.message);}}
    async function open(){panel.hidden=!panel.hidden;if(panel.hidden)return;select.hidden=!client.manager;
      if(client.manager){try{await CloudFichas.init();const characters=await CloudFichas.list();select.replaceChildren(new Option(PrimordiosI18n.t('Sem personagem'),''));for(const c of characters){const option=new Option(c.nomePersonagem,c.id);option.dataset.i18nSkip='';select.append(option);}select.value=current||client.me?.character?.id||'';await load(select.value);}catch(e){notice(e.message);}}
      else await load(current||client.me?.character?.id||'');
    }
    button.onclick=open;close.onclick=()=>{panel.hidden=true;};select.onchange=()=>load(select.value);
    client.openCharacter=async id=>{try{await CloudFichas.init();const owned=await CloudFichas.list();if(!owned.some(c=>c.id===id))throw new Error('Escolha uma ficha da sua conta.');panel.hidden=false;select.hidden=!client.manager;if(client.manager){select.replaceChildren(new Option(PrimordiosI18n.t('Sem personagem'),''));for(const c of owned)select.append(new Option(c.nomePersonagem,c.id));select.value=id;}await load(id);}catch(e){notice(e.message);}};
    return {update(){select.hidden=!client.manager;},destroy(){button.remove();panel.remove();}};
  };
})();
