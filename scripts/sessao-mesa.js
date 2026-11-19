(() => {
  const clone=v=>JSON.parse(JSON.stringify(v)),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const $=id=>document.getElementById(id);
  function capture(adapter){const {doc,nome}=adapter.capture();return {...(doc.visao?{visao:clone(doc.visao)}:{}),nome,imagens:clone(doc.imagens||[]),tracos:clone(doc.tracos||[]),camadas:(doc.camadas||[]).map(c=>({id:c.id,nome:c.nome,visivel:c.visivel!==false,travada:!!c.travada})),grade:clone(doc.grade),escalaMetros:doc.escalaMetros||1.5};}
  function diff(before,after){
    const ops=[];
    for(const kind of ['camadas','imagens','tracos']){
      for(const old of before[kind])if(!after[kind].some(e=>e.id===old.id))ops.push({type:'remove',kind,id:old.id});
      for(const next of after[kind]){const old=before[kind].find(e=>e.id===next.id),patch={};for(const [key,value]of Object.entries(next))if(!old||!equal(old[key],value))patch[key]=value;if(Object.keys(patch).length)ops.push({type:'put',kind,id:next.id,value:patch});}
      if(!equal(before[kind].map(e=>e.id),after[kind].map(e=>e.id)))ops.push({type:'order',kind,value:after[kind].map(e=>e.id)});
    }
    const settings={};for(const key of ['nome','grade','escalaMetros'])if(!equal(before[key],after[key]))settings[key]=after[key];if(Object.keys(settings).length)ops.push({type:'settings',value:settings});return ops;
  }
  function applyLocal(scene,ops){const result=clone(scene);for(const op of ops){if(op.type==='settings'){Object.assign(result,op.value);continue;}const list=result[op.kind];if(op.type==='remove')result[op.kind]=list.filter(e=>e.id!==op.id);if(op.type==='put'){const item=list.find(e=>e.id===op.id);if(item)Object.assign(item,op.value);else list.push({...op.value,id:op.id});}if(op.type==='order')result[op.kind]=[...op.value.map(id=>list.find(e=>e.id===id)).filter(Boolean),...list.filter(e=>!op.value.includes(e.id))];}return result;}
  window.iniciarSessaoMesa=async(code,adapter)=>{
    let base=null,dirty=false,sending=false,generation=0,timer=null,flushPromise=null;const paths=new Map();
    const client=new SessaoTableTop(code,{
      state(state){window.dispatchEvent(new Event('primordios:sessao-estado'));adapter.role(client);ui?.update(state);media?.update(state);if(!dirty&&!sending&&!adapter.busy()){base=clone(state.scene);adapter.apply(state);adapter.clean();adapter.status('Sincronizado');}},
      laser:adapter.remoteLaser,preview:adapter.preview,measurement:adapter.measurement,
      presence:()=>ui?.updateOnline(),
      connection:ok=>{if(!dirty)adapter.status(ok?'Conectado':'Reconectando…');},
      error:error=>{adapter.status('Reconectando…');adapter.notice(error.message);},
      removed:error=>{media?.destroy();adapter.notice(error.message);setTimeout(()=>location.replace('tabletop.html'),1600);}
    });
    let ui=null,media=null;
    client.recordMovement=(id,route)=>{const next=route.map(p=>({x:p.x,y:p.y})),old=paths.get(id);if(old&&Math.hypot(old.at(-1).x-next[0].x,old.at(-1).y-next[0].y)<.01)paths.set(id,[...old,...next.slice(1)]);else paths.set(id,next);};
    client.edit=()=>{
      if(!base)return;const now=capture(adapter);if(equal(now,base)&&!sending){dirty=false;adapter.clean();return;}
      dirty=true;generation++;clearTimeout(timer);timer=setTimeout(()=>client.flush().catch(()=>{}),350);
    };
    client.flush=()=>{
      clearTimeout(timer);if(flushPromise)return flushPromise;
      if(!dirty||!base)return Promise.resolve();
      if(adapter.busy()){timer=setTimeout(()=>client.flush().catch(()=>{}),100);return Promise.resolve();}
      flushPromise=(async()=>{
        sending=true;const current=capture(adapter),version=generation,routes=new Map([...paths].map(([id,points])=>[id,clone(points)]));
        try{
          const prepared=await client.prepareScene(current,current.nome);let operations=diff(base,prepared);
          if(!client.manager)operations=operations.filter(op=>(op.kind==='tracos'&&op.type!=='order'&&(op.type!=='remove'||base.tracos.find(t=>t.id===op.id)?.authorId===client.me?.userId))||(op.kind==='imagens'&&op.type==='put'&&base.imagens.find(i=>i.id===op.id)?.token===true));
          if(!operations.length){paths.clear();dirty=false;adapter.clean();if(client.state){base=clone(client.state.scene);adapter.apply(client.state);}return;}
          operations=operations.map(op=>{const route=routes.get(op.id);return op.kind==='imagens'&&op.type==='put'&&route?.length>1&&(op.value.x!==undefined||op.value.y!==undefined)?{...op,value:{...op.value,trajeto:route}}:op;});
          adapter.status('Enviando alterações…');
          const state=await client.mutate(operations);
          for(const [id,route]of routes){const live=paths.get(id);if(live&&live.length>=route.length&&JSON.stringify(live.slice(0,route.length))===JSON.stringify(route)){const rest=live.slice(route.length-1);if(rest.length>1)paths.set(id,rest);else paths.delete(id);}}
          const later=version!==generation?diff(current,capture(adapter)):[];
          base=clone(state.scene);dirty=later.length>0;
          adapter.apply({...state,scene:later.length?applyLocal(state.scene,later):state.scene});
          if(!dirty){adapter.clean();adapter.status('Sincronizado');}else timer=setTimeout(()=>client.flush().catch(()=>{}),400);
        }catch(error){if(['WALL_COLLISION','SCENE_CONFLICT'].includes(error.code)&&paths.size){try{await client.refresh();const keep=diff(base,capture(adapter)).filter(op=>!(op.kind==='imagens'&&paths.has(op.id)));paths.clear();base=clone(client.state.scene);dirty=keep.length>0;adapter.apply({...client.state,scene:applyLocal(base,keep)});if(!dirty)adapter.clean();else timer=setTimeout(()=>client.flush().catch(()=>{}),500);}catch{}}
          adapter.status(dirty?'Alterações pendentes':'Sincronizado');adapter.notice(error.message);if(!error.status||error.status>=500||error.status===429)timer=setTimeout(()=>client.flush().catch(()=>{}),5000);throw error;}
        finally{sending=false;flushPromise=null;}
      })();return flushPromise;
    };
    await client.start();base=clone(client.state.scene);
    ui=new SessionUI(client,adapter);media=new SessaoMidia(client,adapter.notice);ui.update(client.state);media.update(client.state);
    const originalClose=client.close.bind(client);client.close=async()=>{clearTimeout(timer);ui?.destroy();media?.destroy();await originalClose();};
    window.addEventListener('pagehide',()=>{clearTimeout(timer);client.laser(null);client.close();});
    const mapId=sessionStorage.getItem('primordios_sessao_inicial_'+code);
    if(mapId&&client.manager){try{await ui.publishMap(mapId);sessionStorage.removeItem('primordios_sessao_inicial_'+code);}catch(error){adapter.notice(error.message);}}
    window.PrimordiosSessao=client;return client;
  };
  class SessionUI {
    constructor(client,adapter){
      this.client=client;this.adapter=adapter;this.signature='';this.sheet=criarFichaDaSessao(client,adapter.notice);
      this.button=document.createElement('button');this.button.type='button';this.button.id='sessaoParticipantes';this.button.className='painel sessao-participantes';this.button.title='Participantes';this.button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M2 21v-4a7 7 0 0 1 14 0v4M16 4a3 3 0 0 1 0 6m3 11v-4a7 7 0 0 0-2-5"/></svg> <span></span>';const code=document.createElement('small');code.dataset.i18nSkip='';code.textContent=client.code;this.button.append(code);this.button.onclick=()=>this.membersDialog();document.body.append(this.button);
      this.settingsButton=document.createElement('button');this.settingsButton.id='sessaoConfiguracoes';this.settingsButton.textContent='Configurações da sessão';this.settingsButton.onclick=()=>this.settingsDialog();$('menuArquivo').append(this.settingsButton);
      $('salvar').textContent='Sincronizar';$('salvar').onclick=()=>client.flush().catch(e=>adapter.notice(e.message));$('salvarSair').textContent='Sair da sessão';$('salvarSair').onclick=()=>this.leave();$('sair').onclick=()=>this.leave();
      this.mediaButtons=document.createElement('div');this.mediaButtons.className='sessao-controls';
      for(const [kind,title,icon]of [['audio','Música','<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>'],['video','Vídeo','<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-4v12l-5-4"/>']]){const b=document.createElement('button');b.type='button';b.title=title;b.dataset.sessionMedia=kind;b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">'+icon+'</svg>';b.onclick=()=>window.PrimordiosSessao.media.libraryDialog(kind);this.mediaButtons.append(b);}
      document.querySelector('.ferramentas .linha').insertBefore(this.mediaButtons,$('ocultarLayout'));
      this.positionMembers=()=>{const file=document.querySelector('.arquivo'),menu=$('menuArquivo'),anchor=file.getBoundingClientRect(),open=menu.getClientRects().length>0;const mobile=matchMedia('(max-width:720px), (pointer:coarse) and (max-height:500px)').matches;this.button.style.top=(mobile&&!open?anchor.top:Math.max(anchor.bottom,open?menu.getBoundingClientRect().bottom:0)+12)+'px';this.button.style.bottom='auto';this.button.style.left=(mobile?anchor.right+8:anchor.left)+'px';};
      this.layoutObserver=new ResizeObserver(this.positionMembers);this.layoutObserver.observe(document.querySelector('.arquivo'));this.layoutObserver.observe($('menuArquivo'));window.addEventListener('resize',this.positionMembers);window.visualViewport?.addEventListener('resize',this.positionMembers);window.visualViewport?.addEventListener('scroll',this.positionMembers);this.positionMembers();
    }
    destroy(){this.layoutObserver.disconnect();window.removeEventListener('resize',this.positionMembers);window.visualViewport?.removeEventListener('resize',this.positionMembers);window.visualViewport?.removeEventListener('scroll',this.positionMembers);this.sheet.destroy();this.button.remove();this.settingsButton.remove();this.mediaButtons.remove();this.dialogElement?.remove();}
    dialog(title){this.dialogElement?.remove();const dialog=document.createElement('dialog');dialog.className='sessao-dialog';const close=document.createElement('button');close.className='sessao-fechar';close.textContent='✕';close.setAttribute('aria-label','Fechar');close.onclick=()=>dialog.close();const h=document.createElement('h2');h.textContent=title;dialog.append(close,h);document.body.append(dialog);this.dialogElement=dialog;return dialog;}
    update(state){this.sheet.update();this.button.querySelector('span').textContent=String(state.room.members.length);this.mediaButtons.hidden=!this.client.manager;this.mediaButtons.querySelector('[data-session-media=video]').hidden=!this.client.owner;
      const signature=JSON.stringify(state.room.members);if(this.signature!==signature){this.signature=signature;if(this.dialogElement?.open&&this.dialogType==='members')this.renderMembers();}
    }
    membersDialog(){this.dialogType='members';const dialog=this.dialog('Participantes');this.membersList=document.createElement('div');dialog.append(this.membersList);this.renderMembers();dialog.showModal();}
    updateOnline(){if(!this.membersList?.isConnected)return;for(const row of this.membersList.children){const el=row.querySelector('.sessao-presenca');if(el)el.textContent=PrimordiosI18n.t(row.dataset.userId===this.client.me?.userId||Date.now()-(this.client.online.get(row.dataset.userId)||0)<25000?'Conectado':'Desconectado');}}
    renderMembers(){this.membersList.replaceChildren();const members=[...this.client.state.room.members].sort((a,b)=>(a.role==='owner'?-1:b.role==='owner'?1:0));
      for(const member of members){const row=document.createElement('section');row.className='sessao-membro';row.dataset.userId=member.userId;const header=document.createElement('div');header.className='sessao-membro-cabecalho';header.style.setProperty('--membro-cor',member.color);
        if(member.role==='owner'){const crown=document.createElement('span');crown.innerHTML='<svg viewBox="0 0 24 24" aria-label="Dono"><path d="M4 19h16M5 16 3 6l5 4 4-7 4 7 5-4-2 10z"/></svg>';header.append(crown);}
        const name=document.createElement('strong');name.dataset.i18nSkip='';name.textContent=member.name;name.style.color=member.color;const role=document.createElement('small');role.textContent=member.role==='owner'?'Dono':member.role==='moderator'?'Moderador':'Jogador';const connection=document.createElement('small');connection.className='sessao-presenca';header.append(name,role,connection);row.append(header);
        if(member.character){const character=document.createElement('small');character.dataset.i18nSkip='';character.textContent=member.character.name+' · '+PrimordiosI18n.content(member.character.class)+' · '+member.character.level;row.append(character);if(member.userId===this.client.me?.userId){const link=document.createElement('a');link.href='tela5.html?personagem='+encodeURIComponent(member.character.id);link.target='_blank';link.rel='noopener';link.textContent='Abrir minha ficha';row.append(link);}}
        const self=member.userId===this.client.me?.userId,editable=self||(this.client.manager&&member.role!=='owner');
        if(editable){const form=document.createElement('form');const input=document.createElement('input');input.value=member.name;input.maxLength=40;input.required=true;input.setAttribute('aria-label','Nome');input.dataset.i18nSkip='';const color=document.createElement('input');color.type='color';color.value=member.color;color.setAttribute('aria-label','Cor');const save=document.createElement('button');save.textContent='Salvar';form.append(input,color,save);form.className='sessao-membro-acoes';form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await SessaoTableTop.request('/api/rooms/'+this.client.code+'/members/'+member.userId,'PATCH',{name:input.value,color:color.value});await this.client.refresh();}catch(error){this.adapter.notice(error.message);save.disabled=false;}};row.append(form);}
        if(!self&&member.role!=='owner'&&this.client.manager){const actions=document.createElement('div');actions.className='sessao-membro-acoes';
          const action=(label,run)=>{const b=document.createElement('button');b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await run();await this.client.refresh();}catch(error){this.adapter.notice(error.message);b.disabled=false;}};actions.append(b);};
          if(this.client.owner)action(member.role==='moderator'?'Remover moderação':'Tornar moderador',()=>SessaoTableTop.request('/api/rooms/'+this.client.code+'/members/'+member.userId,'PATCH',{role:member.role==='moderator'?'player':'moderator'}));
          action('Expulsar',()=>SessaoTableTop.request('/api/rooms/'+this.client.code+'/members/'+member.userId+'/kick','POST',{}));
          action('Banir',()=>this.confirm('Banir participante?',()=>SessaoTableTop.request('/api/rooms/'+this.client.code+'/members/'+member.userId+'/ban','POST',{})));row.append(actions);
        }this.membersList.append(row);
      }this.updateOnline();
    }
    confirm(title,run){return new Promise((resolve,reject)=>{const d=document.createElement('dialog');d.className='sessao-dialog';const h=document.createElement('h2');h.textContent=title;const actions=document.createElement('div');actions.className='sessao-acoes';const cancel=document.createElement('button');cancel.textContent='Cancelar';const yes=document.createElement('button');yes.textContent='Confirmar';cancel.onclick=()=>{d.close();d.remove();resolve();};yes.onclick=async()=>{yes.disabled=true;try{await run();d.close();d.remove();resolve();}catch(e){reject(e);d.close();d.remove();}};d.addEventListener('cancel',()=>{d.remove();resolve();},{once:true});actions.append(cancel,yes);d.append(h,actions);document.body.append(d);d.showModal();});}
    settingsDialog(){this.dialogType='settings';const d=this.dialog('Configurações da sessão'),room=this.client.state.room;
      const code=document.createElement('p');code.textContent=room.code;code.className='sessao-codigo';d.append(code);
      const form=document.createElement('form');form.innerHTML='<label>Visibilidade <select name="visibility"><option value="public">Pública</option><option value="private">Privada</option></select></label><label>Máximo de pessoas <input name="maxPlayers" type="number" min="1" max="50" required></label><label>Nova senha <input name="password" type="password" maxlength="10" autocomplete="new-password" placeholder="Deixe em branco para manter"></label><div class="sessao-acoes"><button>Salvar</button></div><p role="alert" class="sessao-erro"></p>';
      form.elements.visibility.value=room.visibility;form.elements.maxPlayers.value=room.maxPlayers;
      for(const el of form.elements)el.disabled=!this.client.manager;
      form.onsubmit=async e=>{e.preventDefault();try{const visibility=form.elements.visibility.value,patch={visibility,maxPlayers:+form.elements.maxPlayers.value};if(visibility==='private'&&form.elements.password.value)patch.password=form.elements.password.value;await SessaoTableTop.request('/api/rooms/'+this.client.code,'PATCH',patch);await this.client.refresh();d.close();}catch(error){form.querySelector('[role=alert]').textContent=error.message;}};d.append(form);
      if(this.client.manager){const label=document.createElement('label');label.textContent='Trocar mapa da sessão';const select=document.createElement('select');const user=JSON.parse(localStorage.getItem('primordios_logado')||'{}');for(const map of JSON.parse(localStorage.getItem('primordios_mapas_'+user.usuario)||'[]')){const option=new Option(map.nome,map.id);option.dataset.i18nSkip='';select.append(option);}label.append(select);const button=document.createElement('button');button.textContent='Carregar mapa';button.disabled=!select.options.length;button.onclick=()=>this.confirm('Substituir o mapa da sessão?',async()=>{await this.client.flush();await this.publishMap(select.value);d.close();}).catch(error=>this.adapter.notice(error.message));d.append(label,button);}
      d.showModal();
    }
    async publishMap(mapId){const user=JSON.parse(localStorage.getItem('primordios_logado')||'{}'),db=await abrirBancoMapas();let record;
      try{record=await new Promise((resolve,reject)=>{const req=db.transaction('mapas').objectStore('mapas').get(JSON.stringify([user.usuario,mapId]));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}finally{db.close();}
      if(!record?.doc)throw new Error('Abra e salve o mapa no editor antes de compartilhá-lo.');
      this.adapter.status('Enviando mapa…');const scene=await this.client.prepareScene(record.doc,record.nome);await this.client.mutate([{type:'replace',value:scene}],this.client.state.revision);this.adapter.clearImages();this.adapter.status('Sincronizado');
    }
    async leave(){try{await this.client.flush();const go=async()=>{await SessaoTableTop.request('/api/rooms/'+this.client.code+'/leave','POST',{});await this.client.close();location.href='tabletop.html';};if(this.client.owner)await this.confirm('Encerrar sessão para todos?',go);else await go();}catch(error){this.adapter.notice(error.message);}}
  }
})();
