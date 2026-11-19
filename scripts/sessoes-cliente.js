/* Transporte compartilhado. Nenhum nome/papel enviado pelo navegador concede autorização. */
(() => {
  const clone=v=>JSON.parse(JSON.stringify(v));
  const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const base64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
  async function request(path,method='GET',body){
    const response=await PrimordiosAuth.request(path,{method,...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
    const data=await response.json();if(!response.ok){const error=new Error(data.error?.message||data.message||'Não foi possível acessar a sessão.');error.status=response.status;error.code=data.error?.code||data.code;throw error;}return data;
  }
  class SessaoTableTop {
    constructor(code,handlers={}){this.code=code;this.handlers=handlers;this.state=null;this.channels=new Map();this.urls=new Map();this.uploads=new Map();this.online=new Map();this.liveRates=new Map();this.closed=false;this.lastLaser=0;this.laserTimer=null;}
    static request=request;
    get me(){const id=JSON.parse(localStorage.getItem('primordios_logado')||'{}').id;return this.state?.room.members.find(m=>m.userId===id);}
    get manager(){return this.me?.role==='owner'||this.me?.role==='moderator';}
    get owner(){return this.me?.role==='owner';}
    async liveCrypto(){const raw=this.state?.liveKey;if(!raw)throw new Error('Sincronização indisponível.');if(this.cryptoRaw!==raw){this.cryptoRaw=raw;this.cryptoKey=crypto.subtle.importKey('raw',bytes(raw),{name:'AES-GCM'},false,['encrypt','decrypt']);}return this.cryptoKey;}
    async sendLive(event,payload){
      try{const topic='laser:'+this.code+':'+this.me?.userId,nonce=crypto.getRandomValues(new Uint8Array(12)),key=await this.liveCrypto();const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:new TextEncoder().encode(topic+'|'+event)},key,new TextEncoder().encode(JSON.stringify(payload)));await this.channels.get(this.me?.userId)?.send(event,{nonce:base64(nonce),cipher:base64(cipher)});}catch{}
    }
    async readLive(topic,event,payload){
      if(typeof payload?.nonce!=='string'||typeof payload?.cipher!=='string'||payload.nonce.length>24||payload.cipher.length>8192)return null;
      try{const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(payload.nonce),additionalData:new TextEncoder().encode(topic+'|'+event)},await this.liveCrypto(),bytes(payload.cipher));return JSON.parse(new TextDecoder().decode(plain));}catch{return null;}
    }
    async start(){
      await this.refresh();
      try{this.main=await PrimordiosAuth.roomChannel('tabletop:'+this.code,()=>this.scheduleRefresh(),status=>{this.connected=status==='SUBSCRIBED';this.handlers.connection?.(this.connected);if(this.connected)this.scheduleRefresh();});}catch{this.connected=false;}
      await this.syncLasers();
      this.heartbeat=setInterval(()=>this.sendLive('presence',{online:true}),10000);
      this.presenceTimer=setInterval(()=>this.handlers.presence?.(),5000);
      const poll=async()=>{if(this.closed)return;try{await this.refresh();}catch(error){this.fail(error);}this.poll=setTimeout(poll,this.connected?15000:2500);};this.poll=setTimeout(poll,2500);
      return this;
    }
    scheduleRefresh(){if(this.refreshTimer||this.closed)return;this.refreshTimer=setTimeout(()=>{this.refreshTimer=null;this.refresh().catch(e=>this.fail(e));},80);}
    async refresh(){
      if(this.refreshing)return this.refreshing;
      this.refreshing=(async()=>{const next=await request('/api/rooms/'+this.code+'/tabletop'+(this.state?'?since='+this.state.room.version:''));if(this.closed)return this.state;if(!next.unchanged&&(!this.state||next.room.version>=this.state.room.version)){this.state=next;this.handlers.state?.(clone(next));await this.syncLasers();}return this.state;})();
      try{return await this.refreshing;}finally{this.refreshing=null;}
    }
    async syncLasers(){
      if(!this.state||this.closed||!PrimordiosAuth.roomChannel)return;
      const members=this.state.room.members;
      for(const [id,channel]of this.channels)if(!members.some(m=>m.userId===id)){await channel.close();this.channels.delete(id);this.handlers.laser?.(id,null);this.handlers.measurement?.(id,null);}
      for(const member of members)if(!this.channels.has(member.userId)){
        this.channels.set(member.userId,{send:()=>Promise.resolve(),close:()=>Promise.resolve()});
        const topic='laser:'+this.code+':'+member.userId;
        try{const channel=await PrimordiosAuth.roomChannel(topic,async(event,encrypted)=>{
          const current=this.state?.room.members.find(m=>m.userId===member.userId);if(!current||current.userId===this.me?.userId)return;
          if(!['presence','laser','measurement','preview'].includes(event))return;const now=Date.now();let rate=this.liveRates.get(member.userId);if(!rate||now-rate.at>1000){rate={at:now,count:0};this.liveRates.set(member.userId,rate);}if(++rate.count>60)return;
          const payload=await this.readLive(topic,event,encrypted);if(!payload)return;
          if(event==='presence'){if(payload.online)this.online.set(current.userId,Date.now());else this.online.delete(current.userId);this.handlers.presence?.();return;}
          if(event==='laser'){
            if(payload?.active===false){this.handlers.laser?.(current.userId,null);return;}
            if(Number.isFinite(payload?.x)&&Number.isFinite(payload?.y)&&Math.abs(payload.x)<=1e6&&Math.abs(payload.y)<=1e6)this.handlers.laser?.(current.userId,{x:payload.x,y:payload.y,color:current.color,name:current.name});
          }
          if(event==='measurement'){const points=payload.pontos;if(!Array.isArray(points)||points.length>32||!points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=1e6&&Math.abs(p.y)<=1e6)||!Number.isFinite(payload.distancia)||payload.distancia<0||payload.distancia>1e9)return;this.handlers.measurement?.(current.userId,points.length?{pontos:points,distancia:payload.distancia,color:current.color}:null);return;}
          if(event==='preview'&&payload&&typeof payload.id==='string'&&(current.role!=='player'||this.state.scene.imagens.some(i=>i.id===payload.id&&i.token===true&&!i.travada&&!this.state.scene.camadas.find(c=>c.id===i.camadaId)?.travada)))this.handlers.preview?.(payload);
        },status=>{if(status==='SUBSCRIBED'&&member.userId===this.me?.userId)setTimeout(()=>this.sendLive('presence',{online:true}),100);});if(this.closed){await channel.close();return;}this.channels.set(member.userId,channel);}catch{this.channels.delete(member.userId);}
      }
    }
    measurement(value){this.latestMeasurement=value;if(this.measureTimer)return;this.measureTimer=setTimeout(()=>{this.measureTimer=null;const value=this.latestMeasurement,points=value.pontos||[],step=Math.max(1,Math.ceil((points.length-1)/30)),sample=points.filter((p,i)=>i%step===0||i===points.length-1);this.sendLive('measurement',{pontos:sample,distancia:value.distancia});},50);}
    laser(point){
      this.latestLaser=point;
      const send=()=>{this.lastLaser=performance.now();this.laserTimer=null;const p=this.latestLaser;this.sendLive('laser',p?{active:true,x:p.x,y:p.y}:{active:false});};
      if(!point){clearTimeout(this.laserTimer);send();return;}
      if(performance.now()-this.lastLaser>60)send();else if(!this.laserTimer)this.laserTimer=setTimeout(send,60);
    }
    preview(image){if((!this.manager&&image.token!==true)||performance.now()-(this.lastPreview||0)<65)return;const current=this.state.scene.imagens.find(i=>i.id===image.id);if(current&&(current.visivel===false||this.state.scene.camadas.find(c=>c.id===current.camadaId)?.visivel===false))return;this.lastPreview=performance.now();this.sendLive('preview',{id:image.id,x:image.x,y:image.y,w:image.w,h:image.h,rot:image.rot});}
    fail(error){if([401,403,404].includes(error.status)){this.close();this.handlers.removed?.(error);}else this.handlers.error?.(error);}
    async mutate(operations,baseRevision,mutationId=crypto.randomUUID()){
      const packet={mutationId,operations,...(baseRevision===undefined?{}:{baseRevision})};
      // Retentativas reutilizam a mutação, impedindo gasto/alteração duplicados.
      for(let attempt=0;;attempt++){
        try{const state=await request('/api/rooms/'+this.code+'/tabletop','POST',packet);if(this.closed)return this.state||state;if(!this.state||state.room.version>=this.state.room.version)this.state=state;this.handlers.state?.(clone(this.state));return this.state;}
        catch(error){if(attempt<2&&(!error.status||error.status>=500)){await new Promise(r=>setTimeout(r,500*(attempt+1)));continue;}throw error;}
      }
    }
    async assetUrl(path,force=false){if(path.startsWith('/assets/'))return path;const cached=this.urls.get(path);if(!force&&cached&&cached.expires>Date.now())return cached.url;const url=await PrimordiosAuth.roomAssetUrl(path);this.urls.set(path,{url,expires:Date.now()+90000});return url;}
    async upload(src){
      if(typeof src!=='string')throw new Error('Imagem inválida.');
      if(new RegExp('^'+this.code+'/[a-f0-9-]{36}\\.[a-z0-9]+$').test(src))return src;
      const url=new URL(src,location.href);
      if(url.origin===location.origin&&url.pathname.startsWith('/assets/images/'))return url.pathname;
      if(!src.startsWith('data:image/')&&!/^data:video\/(mp4|webm)[;,]/.test(src)&&!src.startsWith('blob:'))throw new Error('Importe a imagem antes de compartilhar.');
      const key=src.startsWith('data:')?base64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(src))):src;
      if(this.uploads.has(key))return this.uploads.get(key);
      const task=(async()=>{let blob;if(src.startsWith('data:')){const match=/^data:((?:image\/(?:png|jpeg|webp|gif))|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=]+)$/.exec(src);if(!match||match[2].length>70*1024*1024)throw new Error('Arquivo inválido ou muito grande.');blob=new Blob([Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0))],{type:match[1]});}else blob=await(await fetch(src)).blob();return PrimordiosAuth.uploadRoomAsset(this.code,blob);})();this.uploads.set(key,task);
      try{return await task;}catch(e){this.uploads.delete(key);throw e;}
    }
    async prepareScene(doc,nome){
      const scene={...(doc.visao?{visao:clone(doc.visao)}:{}),nome,imagens:clone(doc.imagens||[]),tracos:clone(doc.tracos||[]),camadas:(doc.camadas||[]).map(c=>({id:c.id,nome:c.nome,visivel:c.visivel!==false,travada:!!c.travada})),grade:doc.grade||{frente:false,transparencia:92,ima:false},escalaMetros:doc.escalaMetros||1.5};
      if(!scene.camadas.length)scene.camadas=[{id:'base',nome:'Camada 1',visivel:true,travada:false}];
      for(const entity of [...scene.imagens,...scene.tracos])entity.camadaId ||= scene.camadas.at(-1).id;
      for(const image of scene.imagens){image.src=await this.upload(image.src);if(image.srcSeg)image.srcSeg=await this.upload(image.srcSeg);}
      return scene;
    }
    async close(){this.closed=true;clearTimeout(this.poll);clearTimeout(this.refreshTimer);clearTimeout(this.laserTimer);clearTimeout(this.measureTimer);clearInterval(this.heartbeat);clearInterval(this.presenceTimer);await this.main?.close();for(const channel of this.channels.values())await channel.close();this.channels.clear();}
  }
  window.SessaoTableTop=SessaoTableTop;
})();
