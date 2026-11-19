(() => {
  let youtubeReady;
  function youtube(){
    if(window.YT?.Player)return Promise.resolve(window.YT);
    return youtubeReady ||= new Promise((resolve,reject)=>{const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT);};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>reject(new Error('Não foi possível abrir o YouTube.'));document.head.append(script);setTimeout(()=>{if(!window.YT?.Player)reject(new Error('O YouTube não respondeu.'));},15000);});
  }
  class SessaoMidia {
    constructor(client,notice){this.client=client;client.media=this;this.notice=notice;this.players={};this.signatures={};this.generations={audio:0,video:0};this.offset=0;this.localMuted=false;
      this.disc=document.createElement('div');this.disc.className='sessao-audio-disco painel';this.disc.hidden=true;this.disc.innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="16" cy="16" r="14"/><circle cx="16" cy="16" r="5"/><circle cx="16" cy="16" r="1"/><path d="M6 16A10 10 0 0 1 16 6m0 20a10 10 0 0 0 10-10"/></svg><span data-i18n-skip></span><button type="button" class="sessao-som-local" title="Som local" aria-label="Som local">♪</button>';document.body.append(this.disc);this.disc.querySelector('button').onclick=()=>{if(this.localMuted||this.blocked||!ConsentimentoAudio.permitido())this.enableSound();else{this.localMuted=true;this.applySound();}};
      this.audioStack=document.createElement('div');this.audioStack.className='sessao-audio-stack';document.body.append(this.audioStack);this.audioStack.append(this.disc);
      this.disc.querySelector('span').onclick=()=>{if(client.manager)this.libraryDialog('audio');};
      this.audioControls=document.createElement('div');this.audioControls.className='sessao-audio-controles';
      const actions=[['Voltar 10 s','seek',-10,'<path d="m11 5-8 7 8 7zM21 5l-8 7 8 7z"/>'],['Pausar / continuar','toggle',null,'<path d="M8 5v14M16 5v14"/>'],['Avançar 10 s','seek',10,'<path d="m3 5 8 7-8 7zM13 5l8 7-8 7z"/>'],['Parar','stop',null,'<rect x="5" y="5" width="14" height="14" rx="2"/>']];
      const row=document.createElement('div');row.className='sessao-audio-botoes';for(const [title,action,value,icon]of actions){const b=document.createElement('button');b.title=title;b.setAttribute('aria-label',title);b.dataset.action=action;b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">'+icon+'</svg>';b.onclick=()=>this.control('audio',action,value);row.append(b);}this.audioControls.append(row);
      this.seek=document.createElement('input');this.seek.type='range';this.seek.min=0;this.seek.max=100;this.seek.step=.1;this.seek.setAttribute('aria-label','Posição da música');this.seek.onpointerdown=()=>{this.seeking=true;};this.seek.onchange=()=>{this.seeking=false;this.control('audio','position',+this.seek.value);};this.seek.onpointercancel=()=>{this.seeking=false;};this.seek.onpointerup=()=>{this.seeking=false;};this.audioControls.append(this.seek);
      for(const [key,title,action]of [['loop','Repetir','loop'],['endWhenFinished','Encerrar ao terminar','end']]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.dataset.option=key;input.onchange=()=>this.control('audio',action,input.checked);label.append(input,document.createTextNode(title));this.audioControls.append(label);}this.disc.append(this.audioControls);this.audioControls.id='sessaoAudioControles';this.audioExpand=document.createElement('button');this.audioExpand.type='button';this.audioExpand.className='sessao-audio-expandir';this.audioExpand.title='Controles de música';this.audioExpand.setAttribute('aria-label','Controles de música');this.audioExpand.setAttribute('aria-controls','sessaoAudioControles');this.audioExpand.setAttribute('aria-expanded','false');this.audioExpand.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 9 6 6 6-6"/></svg>';this.audioExpand.onclick=()=>{const open=this.disc.classList.toggle('audio-aberto');this.audioExpand.setAttribute('aria-expanded',open);};this.disc.insertBefore(this.audioExpand,this.audioControls);
      this.cinema=document.createElement('div');this.cinema.className='sessao-cinema';this.cinema.hidden=true;this.cinema.innerHTML='<div class="sessao-video-host"></div><p class="sessao-cinema-erro" role="alert" hidden></p><button type="button" class="sessao-cinema-som">Ativar áudio</button><div class="sessao-cinema-controles painel"></div>';document.body.append(this.cinema);this.cinema.querySelector('.sessao-cinema-som').onclick=()=>this.enableSound();this.cinema.onpointerdown=this.cinema.onpointermove=()=>{this.cinema.classList.add('mexendo');clearTimeout(this.mouseTimer);this.mouseTimer=setTimeout(()=>this.cinema.classList.remove('mexendo'),2500);};
      const bar=this.cinema.querySelector('.sessao-cinema-controles');for(const [label,action] of [['Voltar 10 s',()=>this.control('video','seek',-10)],['Pausar / continuar',()=>this.control('video','toggle')],['Avançar 10 s',()=>this.control('video','seek',10)],['Parar vídeo',()=>this.control('video','stop')]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=action;bar.append(button);}
      this.config=()=>this.applySound();window.addEventListener('primordios:config',this.config);window.addEventListener('storage',this.config);
      this.tick=setInterval(()=>{for(const kind of ['audio','video'])this.synchronize(kind);},1500);
    }
    position(playback,kind){let position=playback.position+(playback.playing?(Date.now()+this.offset-playback.at)/1000:0);const duration=this.duration(kind);if(playback.loop&&duration>0)position%=duration;return Math.max(0,position);}
    duration(kind){const p=this.players[kind];return p?.youtube?p.instance.getDuration?.()||0:p?.element.duration||0;}
    update(state){this.state=state;this.offset=state.serverTime-Date.now();this.cinema.querySelector('.sessao-cinema-controles').hidden=!this.client.owner;
      for(const kind of ['audio','video']){
        const playback=state[kind],sig=JSON.stringify(playback);if(sig===this.signatures[kind])continue;this.signatures[kind]=sig;
        if(!playback){if(kind==='video')this.hideCinema();else this.clear(kind);continue;}
        if(this.players[kind]?.source.id!==playback.source.id)this.load(kind,playback.source).catch(e=>{this.failure(kind,e.message);});else this.synchronize(kind,true);
      }
      this.disc.hidden=!state.audio;this.disc.classList.toggle('tocando',!!state.audio?.playing);this.disc.querySelector('span').textContent=state.audio?.source.title||'';this.audioControls.hidden=!this.client.manager;this.audioExpand.hidden=!this.client.manager;for(const input of this.audioControls.querySelectorAll('[data-option]'))input.checked=!!state.audio?.[input.dataset.option];this.disc.querySelector('[data-action=toggle]').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">'+(state.audio?.playing?'<path d="M8 5v14M16 5v14"/>':'<path d="m7 4 13 8-13 8z"/>')+'</svg>';
      if(state.video&&state.video.at!==this.endedVideoAt){clearTimeout(this.fadeTimer);this.fadeTimer=null;this.cinema.classList.remove('saindo');this.cinema.hidden=false;this.cinema.onmousemove();}this.applySound();
      window.PrimordiosAudioSuspenso=!!(state.audio||state.video);window.dispatchEvent(new Event('primordios:audio-sessao'));
    }
    failure(kind,message){this.notice(message);if(kind==='video'){const error=this.cinema.querySelector('.sessao-cinema-erro');error.textContent=message;error.hidden=false;this.cinema.classList.add('erro');}}
    async load(kind,source){
      this.clear(kind);if(kind==='video'){this.cinema.classList.remove('erro');this.cinema.querySelector('.sessao-cinema-erro').hidden=true;}const generation=++this.generations[kind];
      if(source.type==='youtube'){
        const YT=await youtube();if(generation!==this.generations[kind])return;
        const host=document.createElement('div'),container=document.createElement('div');container.className=kind==='video'?'sessao-youtube-video':'sessao-youtube-audio';container.append(host);if(kind==='video')this.cinema.querySelector('.sessao-video-host').append(container);else this.audioStack.prepend(container);
        const record={source,youtube:true,container,instance:null};this.players[kind]=record;
        record.instance=new YT.Player(host,{host:'https://www.youtube-nocookie.com',videoId:source.path,width:'100%',height:'100%',playerVars:{controls:0,disablekb:1,fs:0,playsinline:1,rel:0,origin:location.origin},events:{onReady:()=>this.synchronize(kind,true),onStateChange:event=>{if(event.data===0)this.ended(kind);},onAutoplayBlocked:()=>this.soundBlocked(),onError:()=>this.failure(kind,'Este vídeo do YouTube não está disponível para reprodução.')}});return;
      }
      const url=await this.client.assetUrl(source.path);if(generation!==this.generations[kind])return;
      const element=document.createElement(kind==='video'?'video':'audio');element.preload='metadata';element.playsInline=true;element.controls=false;element.src=url;
      const record={source,youtube:false,element};this.players[kind]=record;
      if(kind==='video')this.cinema.querySelector('.sessao-video-host').append(element);else document.body.append(element);
      element.onloadedmetadata=()=>this.synchronize(kind,true);element.onended=()=>this.ended(kind);
      element.onerror=async()=>{if(Date.now()-(record.lastRetry||0)<10000){this.failure(kind,'Não foi possível reproduzir este arquivo.');return;}record.lastRetry=Date.now();try{element.src=await this.client.assetUrl(source.path,true);}catch(e){this.failure(kind,e.message);}};
      this.synchronize(kind,true);
    }
    synchronize(kind,force=false){
      const playback=this.state?.[kind],player=this.players[kind];if(!playback||!player)return;
      this.applySound();if(kind==='audio'&&!this.seeking){const duration=this.duration(kind);this.seek.disabled=!(duration>0);this.seek.max=duration>0?duration:100;this.seek.value=this.position(playback,kind);}
      const position=this.position(playback,kind),duration=this.duration(kind);
      if(duration>0&&position>=duration&&!playback.loop){this.ended(kind);return;}
      if(player.youtube){if(!player.instance?.seekTo)return;const current=player.instance.getCurrentTime?.()||0;if(force||Math.abs(current-position)>1.25)player.instance.seekTo(position,true);if(playback.playing)player.instance.playVideo();else player.instance.pauseVideo();}
      else{const element=player.element;element.loop=playback.loop;if(element.readyState>=1&&(force||Math.abs(element.currentTime-position)>1.25))try{element.currentTime=Math.min(position,Number.isFinite(duration)&&duration>0?duration-.01:position);}catch{}
        if(playback.playing&&element.paused)element.play().catch(()=>this.soundBlocked());else if(!playback.playing&&!element.paused)element.pause();}
    }
    applySound(){const permitted=!!window.ConsentimentoAudio?.permitido()&&!this.localMuted;let config={};try{config=JSON.parse(localStorage.getItem('primordios_config')||'{}');}catch{}const volume=Math.max(0,Math.min(1,(Number(config.volume??40)||0)/100));
      for(const p of Object.values(this.players)){if(p.youtube){if(p.instance?.setVolume){p.instance.setVolume(volume*100);if(permitted)p.instance.unMute();else p.instance.mute();}}else{p.element.volume=volume;p.element.muted=!permitted;}}
      this.cinema.querySelector('.sessao-cinema-som').hidden=permitted&&!this.blocked;
      const muted=!permitted||volume===0||this.blocked,button=this.disc.querySelector('.sessao-som-local');button.classList.toggle('mutado',muted);button.setAttribute('aria-pressed',String(muted));button.title=muted?'Ativar áudio':'Silenciar áudio';button.setAttribute('aria-label',button.title);button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="17" rx="3" ry="2"/><ellipse cx="17" cy="15" rx="3" ry="2"/>'+(muted?'<path d="m3 3 18 18"/>':'')+'</svg>';
    }
    soundBlocked(){this.blocked=true;this.cinema.querySelector('.sessao-cinema-som').hidden=false;this.disc.querySelector('button').title='Ativar áudio';}
    async enableSound(){if(!ConsentimentoAudio.permitido()&&!await ConsentimentoAudio.pedir())return;this.localMuted=false;this.blocked=false;this.applySound();for(const kind of ['audio','video']){const player=this.players[kind];if(!this.state?.[kind]?.playing||!player)continue;if(player.youtube)player.instance.playVideo?.();else player.element.play().catch(()=>this.soundBlocked());}}
    async ended(kind){const playback=this.state?.[kind];if(!playback||playback.loop||!playback.playing)return;
      if(kind==='video'&&playback.endWhenFinished){this.endedVideoAt=playback.at;this.hideCinema();}
      if((kind==='audio'?this.client.manager:this.client.owner)&&!this.ending?.[kind]){this.ending ||= {};this.ending[kind]=true;try{await this.control(kind,playback.endWhenFinished?'stop':'pause');}finally{this.ending[kind]=false;}}
    }
    hideCinema(){
      if(this.fadeTimer)return;
      if(this.cinema.hidden){this.clear('video');return;}
      this.generations.video++;const player=this.players.video;if(player?.youtube)player.instance?.pauseVideo?.();else player?.element.pause();
      this.cinema.classList.add('saindo');
      const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:350;
      this.fadeTimer=setTimeout(()=>{this.fadeTimer=null;this.cinema.hidden=true;this.cinema.classList.remove('saindo');this.clear('video');},delay);
    }
    clear(kind){this.generations[kind]++;const player=this.players[kind];if(player){if(player.youtube){player.instance?.destroy?.();player.container.remove();}else{player.element.pause();player.element.removeAttribute('src');player.element.load();player.element.remove();}delete this.players[kind];}}
    async control(kind,action,value){if(!(kind==='audio'?this.client.manager:this.client.owner))return;const playback=this.state?.[kind];if(!playback)return;
      try{if(action==='stop'){await this.client.mutate([{type:'playback',kind,value:null}]);return;}
        const position=this.position(playback,kind),duration=this.duration(kind);
        const next={sourceId:playback.source.id,playing:playback.playing,position,loop:playback.loop,endWhenFinished:playback.endWhenFinished};
        if(action==='toggle')next.playing=!next.playing;if(action==='pause')next.playing=false;
        if(action==='seek')next.position=Math.max(0,Math.min(position+value,Number.isFinite(duration)&&duration>0?duration-.1:864000));
        if(action==='position')next.position=Math.max(0,Math.min(value,Number.isFinite(duration)&&duration>0?duration-.1:864000));
        if(action==='loop')next.loop=value;if(action==='end')next.endWhenFinished=value;
        await this.client.mutate([{type:'playback',kind,value:next}]);
      }catch(error){this.notice(error.message);}
    }
    libraryDialog(kind){if(!(kind==='audio'?this.client.manager:this.client.owner))return;this.library?.remove();const d=document.createElement('dialog');d.className='sessao-dialog';d.innerHTML='<button class="sessao-fechar" aria-label="Fechar">✕</button><h2></h2><div class="sessao-midia-atuais"></div><div class="sessao-midia-lista"></div><label>Enviar arquivo <input type="file"></label><label>Link do YouTube <input type="url" placeholder="https://www.youtube.com/watch?v=…"></label><button class="sessao-adicionar-youtube">Adicionar link</button><small>O YouTube usa um player visível. O upload é a opção principal.</small><p class="sessao-erro" role="alert"></p>';
      d.querySelector('h2').textContent=kind==='audio'?'Música da sessão':'Vídeo da sessão';d.querySelector('.sessao-fechar').onclick=()=>d.close();const file=d.querySelector('[type=file]');file.accept=kind==='audio'?'audio/*':'video/mp4,video/webm';
      const list=d.querySelector('.sessao-midia-lista'),controls=d.querySelector('.sessao-midia-atuais'),error=d.querySelector('[role=alert]');
      const render=()=>{list.replaceChildren();for(const source of this.client.state.library.filter(s=>s.kind===kind)){const b=document.createElement('button');b.textContent=source.title;b.dataset.i18nSkip='';b.onclick=async()=>{b.disabled=true;try{await this.client.mutate([{type:'playback',kind,value:{sourceId:source.id,playing:true,position:0,loop:false,endWhenFinished:true}}]);d.close();}catch(e){error.textContent=e.message;b.disabled=false;}};list.append(b);}
        controls.replaceChildren();if(this.state?.[kind]){for(const [label,action,value]of [['Voltar 10 s','seek',-10],['Pausar / continuar','toggle'],['Avançar 10 s','seek',10],['Parar','stop']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>this.control(kind,action,value);controls.append(b);}for(const [key,label,action]of [['loop','Repetir','loop'],['endWhenFinished','Encerrar ao terminar','end']]){const l=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=this.state[kind][key];input.onchange=()=>this.control(kind,action,input.checked);l.append(input,document.createTextNode(label));controls.append(l);}}
      };
      file.onchange=async()=>{const selected=file.files[0];if(!selected)return;file.disabled=true;try{const path=await PrimordiosAuth.uploadRoomAsset(this.client.code,selected);await this.client.mutate([{type:'media.add',value:{id:crypto.randomUUID(),kind,type:'storage',path,title:selected.name.slice(0,100)}}]);render();}catch(e){error.textContent=e.message;}finally{file.disabled=false;file.value='';}};
      d.querySelector('.sessao-adicionar-youtube').onclick=async e=>{const button=e.currentTarget;button.disabled=true;try{const url=new URL(d.querySelector('[type=url]').value),valid=['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(url.hostname);if(!valid)throw new Error('Link do YouTube inválido.');const id=url.hostname==='youtu.be'?url.pathname.slice(1):url.pathname.startsWith('/shorts/')?url.pathname.split('/')[2]:url.searchParams.get('v');if(!/^[\w-]{11}$/.test(id||''))throw new Error('Link do YouTube inválido.');await this.client.mutate([{type:'media.add',value:{id:crypto.randomUUID(),kind,type:'youtube',path:id,title:'YouTube · '+id}}]);render();}catch(e){error.textContent=e.message;}finally{button.disabled=false;}};
      if(kind==='audio'&&typeof MUSICAS!=='undefined'){const heading=document.createElement('h3');heading.textContent='Músicas do site';d.append(heading);for(const track of MUSICAS){const button=document.createElement('button');button.textContent=track.nome;button.dataset.i18nSkip='';button.onclick=async()=>{button.disabled=true;try{const blob=await(await fetch(track.arquivo)).blob(),path=await PrimordiosAuth.uploadRoomAsset(this.client.code,blob);await this.client.mutate([{type:'media.add',value:{id:crypto.randomUUID(),kind:'audio',type:'storage',path,title:track.nome}}]);render();}catch(e){error.textContent=e.message;}finally{button.disabled=false;}};d.append(button);}}
      document.body.append(d);this.library=d;render();d.showModal();
    }
    destroy(){clearTimeout(this.fadeTimer);clearInterval(this.tick);clearTimeout(this.mouseTimer);for(const kind of ['audio','video'])this.clear(kind);this.audioStack.remove();this.cinema.remove();this.library?.remove();window.removeEventListener('primordios:config',this.config);window.removeEventListener('storage',this.config);window.PrimordiosAudioSuspenso=false;window.dispatchEvent(new Event('primordios:audio-sessao'));}
  }
  window.SessaoMidia=SessaoMidia;
})();
