(() => {
  let dialog,mode='home',found=null,busy=false,created=null;
  const $=id=>document.getElementById(id);
  function error(e){$('sessaoErro').textContent=e.message||String(e);}
  function montar(){
    dialog=document.createElement('dialog');dialog.id='sessoesModal';dialog.className='sessao-dialog';dialog.setAttribute('aria-labelledby','sessoesTitulo');
    dialog.innerHTML=`<button type="button" class="sessao-fechar" aria-label="Fechar">✕</button><small>TABLETOP</small><h2 id="sessoesTitulo">Sessões</h2>
      <div id="sessaoHome" class="sessao-escolhas"><button id="sessaoEscolherCriar">Criar sessão</button><button id="sessaoEscolherEntrar">Entrar em sessão</button></div>
      <form id="sessaoForm" hidden>
        <label>Seu nome <input id="sessaoNome" maxlength="40" required data-i18n-skip></label>
        <label id="sessaoPersonagemLabel">Personagem <select id="sessaoPersonagem"><option value="">Sem personagem</option></select></label>
        <label>Sua cor <input id="sessaoCor" type="color" value="#c9a84c"></label>
        <div id="sessaoCriarCampos"><label>Visibilidade <select id="sessaoVisibilidade"><option value="public">Pública</option><option value="private">Privada</option></select></label><label>Máximo de pessoas <input id="sessaoLimite" type="number" min="1" max="50" value="6" required></label><label id="sessaoSenhaCriarLabel" hidden>Senha <input id="sessaoSenhaCriar" type="password" maxlength="10" autocomplete="new-password"></label><small>A sala privada exige senha de até 10 caracteres.</small><label>Mapa inicial <select id="sessaoMapa"><option value="">Mapa vazio</option></select></label></div>
        <div id="sessaoEntrarCampos" hidden><label>Código da sessão <input id="sessaoCodigo" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" placeholder="000000"></label><button type="button" id="sessaoLocalizar">Buscar sessão</button><p id="sessaoEncontrada" data-i18n-skip></p><label id="sessaoSenhaEntrarLabel" hidden>Senha <input id="sessaoSenhaEntrar" type="password" maxlength="10" autocomplete="off"></label><h3>Sessões disponíveis</h3><small>Salas públicas neste servidor. Para salas privadas, use o código.</small><div id="sessaoLista"></div><button type="button" id="sessaoAtualizar">Atualizar lista</button></div>
        <div class="sessao-acoes"><button type="button" id="sessaoVoltar">Voltar</button><button type="submit" id="sessaoConfirmar">Criar sessão</button></div>
      </form><p id="sessaoErro" role="alert"></p>`;
    document.body.append(dialog);dialog.querySelector('.sessao-fechar').onclick=()=>{if(!busy)dialog.close();};
    dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
    $('sessaoEscolherCriar').onclick=()=>mostrar('create');$('sessaoEscolherEntrar').onclick=()=>mostrar('join');$('sessaoVoltar').onclick=()=>mostrar('home');
    $('sessaoVisibilidade').onchange=()=>{$('sessaoSenhaCriarLabel').hidden=$('sessaoVisibilidade').value!=='private';$('sessaoSenhaCriar').required=!$('sessaoSenhaCriarLabel').hidden;};
    $('sessaoLocalizar').onclick=localizar;$('sessaoAtualizar').onclick=listar;
    $('sessaoCodigo').oninput=()=>{found=null;$('sessaoEncontrada').textContent='';$('sessaoSenhaEntrarLabel').hidden=true;};
    $('sessaoForm').onsubmit=confirmar;
  }
  async function preencher(){
    const status=await PrimordiosAuth.status();$('sessaoNome').value=status.user?.user_metadata?.display_name||JSON.parse(localStorage.getItem('primordios_logado')||'{}').nome||'';
    $('sessaoPersonagem').replaceChildren(new Option(PrimordiosI18n.t('Sem personagem'),''));
    try{await CloudFichas.init();for(const p of await CloudFichas.list()){const option=new Option(p.nomePersonagem+' · '+PrimordiosI18n.content(p.classe),p.id);option.dataset.i18nSkip='';$('sessaoPersonagem').append(option);}}catch{}
    $('sessaoMapa').replaceChildren(new Option(PrimordiosI18n.t('Mapa vazio'),''));
    const user=JSON.parse(localStorage.getItem('primordios_logado')||'{}');
    for(const mapa of JSON.parse(localStorage.getItem('primordios_mapas_'+user.usuario)||'[]')){const option=new Option(mapa.nome,mapa.id);option.dataset.i18nSkip='';$('sessaoMapa').append(option);}
  }
  function mostrar(next){mode=next;$('sessaoErro').textContent='';$('sessaoHome').hidden=mode!=='home';$('sessaoForm').hidden=mode==='home';$('sessaoCriarCampos').hidden=mode!=='create';$('sessaoEntrarCampos').hidden=mode!=='join';
    $('sessaoPersonagemLabel').hidden=mode!=='join';$('sessaoPersonagem').disabled=mode!=='join';
    $('sessaoLimite').disabled=mode!=='create';$('sessaoSenhaCriar').disabled=mode!=='create';
    PrimordiosI18n.set($('sessaoConfirmar'),mode==='create'?'Criar sessão':'Entrar em sessão');if(mode==='join')listar();
  }
  async function listar(){try{const rooms=await SessaoTableTop.request('/api/rooms');const list=$('sessaoLista');list.replaceChildren();if(!rooms.length){const p=document.createElement('p');p.textContent='Nenhuma sessão pública disponível.';list.append(p);}
    for(const room of rooms){const row=document.createElement('div');row.className='sessao-sala';const text=document.createElement('span');text.dataset.i18nSkip='';text.textContent=room.ownerName+' · '+room.code+' · '+room.players+'/'+room.maxPlayers;const enter=document.createElement('button');enter.type='button';enter.textContent='Entrar';enter.onclick=()=>{found=room;$('sessaoCodigo').value=room.code;$('sessaoEncontrada').textContent=room.ownerName+' · '+room.code;$('sessaoSenhaEntrarLabel').hidden=room.visibility!=='private';confirmar();};row.append(text,enter);list.append(row);}
  }catch(e){error(e);}}
  async function localizar(){try{const code=$('sessaoCodigo').value.trim();if(!/^\d{6}$/.test(code))throw new Error('Informe os seis dígitos do código.');found=await SessaoTableTop.request('/api/rooms/'+code+'/lookup');$('sessaoEncontrada').textContent=found.ownerName+' · '+found.code+' · '+found.players+'/'+found.maxPlayers;$('sessaoSenhaEntrarLabel').hidden=found.visibility!=='private';if(found.visibility==='private')$('sessaoSenhaEntrar').focus();return found;}catch(e){error(e);return null;}}
  async function confirmar(event){event?.preventDefault();if(busy)return;
    if(!$('sessaoForm').reportValidity())return;
    if(mode==='join'&&(!found||found.code!==$('sessaoCodigo').value.trim())){if(!await localizar())return;if(found.visibility==='private'&&!$('sessaoSenhaEntrar').value)return;}
    busy=true;$('sessaoConfirmar').disabled=true;$('sessaoErro').textContent='';
    try{
      const common={name:$('sessaoNome').value.trim(),color:$('sessaoCor').value,...(mode==='join'&&$('sessaoPersonagem').value?{characterId:$('sessaoPersonagem').value}:{})};
      let room;
      if(mode==='create'){
        if(created)room=created;else {const visibility=$('sessaoVisibilidade').value;room=await SessaoTableTop.request('/api/rooms','POST',{...common,visibility,maxPlayers:+$('sessaoLimite').value,...(visibility==='private'?{password:$('sessaoSenhaCriar').value}:{})});created=room;}
        if($('sessaoMapa').value)sessionStorage.setItem('primordios_sessao_inicial_'+room.code,$('sessaoMapa').value);
      }else room=await SessaoTableTop.request('/api/rooms/'+found.code+'/join','POST',{...common,...(found.visibility==='private'?{password:$('sessaoSenhaEntrar').value}:{})});
      location.href='editor-mapa.html?sessao='+room.code;
    }catch(e){error(e);}finally{busy=false;$('sessaoConfirmar').disabled=false;}
  }
  window.abrirSessoes=async()=>{if(!await PrimordiosAuth.ready)return;if(!dialog)montar();created=null;mostrar('home');dialog.showModal();await preencher();};
})();
