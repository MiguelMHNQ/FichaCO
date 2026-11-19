/* Decodificação limitada de GIF; apenas um quadro composto por recurso em memória. */
(() => {
  'use strict';
  const MiB=1024*1024;
  const tipo=src=>/^data:video\/(mp4|webm)[;,]|\.(mp4|webm)(?:[?#]|$)/i.test(src)?'video':/^data:image\/gif[;,]|\.gif(?:[?#]|$)/i.test(src)?'gif':null;
  async function arquivo(src){
    if(src.startsWith('data:')){const match=/^data:(image\/gif|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=]+)$/.exec(src);if(!match||match[2].length>56*MiB)throw new Error('Animação inválida.');return new Blob([Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0))],{type:match[1]});}
    const response=await fetch(src);if(!response.ok)throw new Error('Não foi possível carregar a animação.');return response.blob();
  }
  function dimensoes(w,h){if(!w||!h||w>1920||h>1920||w*h>2073600)throw new Error('Animações devem ter até 1920 pixels por lado e 2.073.600 pixels no total.');}
  function gif(buffer){
    const b=new Uint8Array(buffer);let p=6,total=0;
    const byte=()=>{if(p>=b.length)throw new Error('GIF incompleto.');return b[p++];};
    const word=()=>byte()|(byte()<<8);
    const take=n=>{if(p+n>b.length)throw new Error('GIF incompleto.');const v=b.slice(p,p+n);p+=n;return v;};
    const blocks=()=>{const parts=[];let n,size=0;while((n=byte())){parts.push(take(n));size+=n;}const out=new Uint8Array(size);let i=0;for(const v of parts){out.set(v,i);i+=v.length;}return out;};
    if(!/^GIF8[79]a$/.test(new TextDecoder().decode(b.slice(0,6))))throw new Error('GIF inválido.');
    const w=word(),h=word();dimensoes(w,h);const packed=byte();byte();byte();
    const global=packed&128?take(3*(1<<((packed&7)+1))):null,frames=[];
    let control={delay:100,disposal:0,transparent:-1};
    while(p<b.length){const tag=byte();if(tag===59)break;
      if(tag===33){const label=byte();if(label===249){if(byte()!==4)throw new Error('GIF inválido.');const f=byte(),delay=word(),transparent=byte();if(byte()!==0)throw new Error('GIF inválido.');control={delay:Math.max(20,delay*10||100),disposal:(f>>2)&7,transparent:f&1?transparent:-1};}else blocks();continue;}
      if(tag!==44)throw new Error('GIF inválido.');
      const x=word(),y=word(),fw=word(),fh=word(),f=byte();
      if(!fw||!fh||x+fw>w||y+fh>h||frames.length>=300||(total+=fw*fh)>32000000)throw new Error('GIF muito complexo: limite de 300 quadros e 32 milhões de pixels decodificados.');
      const palette=f&128?take(3*(1<<((f&7)+1))):global;if(!palette)throw new Error('GIF sem paleta.');
      const minimum=byte();if(minimum<2||minimum>8)throw new Error('GIF inválido.');
      frames.push({x,y,w:fw,h:fh,interlace:!!(f&64),palette,minimum,data:blocks(),...control});control={delay:100,disposal:0,transparent:-1};
    }
    if(!frames.length)throw new Error('GIF sem quadros.');
    for(const frame of frames)indices(frame);
    return {w,h,frames};
  }
  function indices(frame){
    const clear=1<<frame.minimum,end=clear+1,out=new Uint8Array(frame.w*frame.h),prefix=new Uint16Array(4096),suffix=new Uint8Array(4096),stack=new Uint8Array(4097);
    let bits=frame.minimum+1,next=end+1,bit=0,old=-1,first=0,pos=0;
    while(pos<out.length){if(bit+bits>frame.data.length*8)throw new Error('GIF truncado.');let code=0;for(let i=0;i<bits;i++)code|=((frame.data[(bit+i)>>3]>>((bit+i)&7))&1)<<i;bit+=bits;
      if(code===clear){bits=frame.minimum+1;next=end+1;old=-1;continue;}if(code===end)break;
      const original=code;let count=0;
      if(code>=next){if(code!==next||old<0)throw new Error('GIF inválido.');stack[count++]=first;code=old;}
      while(code>=clear){if(code>=next||count>=4096)throw new Error('GIF inválido.');stack[count++]=suffix[code];code=prefix[code];}
      first=code;stack[count++]=first;
      while(count){if(pos>=out.length)throw new Error('GIF inválido.');out[pos++]=stack[--count];}
      if(old>=0&&next<4096){prefix[next]=old;suffix[next]=first;next++;if(next===(1<<bits)&&bits<12)bits++;}old=original;
    }
    if(pos!==out.length)throw new Error('GIF incompleto.');return out;
  }
  function criar(src,resolve,onload,onerror){
    const kind=tipo(src),surface=document.createElement('canvas');surface.complete=false;surface.animado=true;surface.kind=kind;
    let cancelled=false,video=null,decoded=null,index=-1,due=0,previous=null,restore=null,lastActive=false,objectUrl=null;
    const cx=surface.getContext('2d');
    surface.dispose=()=>{cancelled=true;if(video){video.pause();video.removeAttribute('src');video.load();}if(objectUrl)URL.revokeObjectURL(objectUrl);decoded=null;restore=null;surface.width=surface.height=1;};
    surface.update=(now,active)=>{
      if(!surface.complete)return;
      if(video){if(active&&!lastActive)video.play().catch(()=>{});if(!active&&lastActive)video.pause();lastActive=active;if(active&&video.readyState>=2)cx.drawImage(video,0,0);return;}
      if(!active){due=0;return;}if(due&&now<due)return;
      if(previous?.disposal===2)cx.clearRect(previous.x,previous.y,previous.w,previous.h);
      if(previous?.disposal===3&&restore)cx.putImageData(restore,0,0);
      index=(index+1)%decoded.frames.length;if(index===0)cx.clearRect(0,0,surface.width,surface.height);
      const f=decoded.frames[index];restore=f.disposal===3?cx.getImageData(0,0,surface.width,surface.height):null;
      const pixels=indices(f),image=cx.getImageData(f.x,f.y,f.w,f.h);let n=0;
      const rows=[];if(f.interlace){for(const [start,step] of [[0,8],[4,8],[2,4],[1,2]])for(let y=start;y<f.h;y+=step)rows.push(y);}else for(let y=0;y<f.h;y++)rows.push(y);
      for(const y of rows)for(let x=0;x<f.w;x++){const color=pixels[n++],i=(y*f.w+x)*4;if(color===f.transparent)continue;if(color*3+2>=f.palette.length)throw new Error('GIF inválido.');image.data[i]=f.palette[color*3];image.data[i+1]=f.palette[color*3+1];image.data[i+2]=f.palette[color*3+2];image.data[i+3]=255;}
      cx.putImageData(image,f.x,f.y);previous=f;due=now+f.delay;
    };
    surface.ready=(async()=>{
      let url=await resolve();if(cancelled)return;
      if(kind==='video'&&url.startsWith('data:')){const blob=await arquivo(url);if(blob.size>40*MiB)throw new Error('Vídeo de mapa: máximo de 40 MB.');url=objectUrl=URL.createObjectURL(blob);}
      if(kind==='gif'){const blob=await arquivo(url);if(blob.size>10*MiB)throw new Error('GIF: máximo de 10 MB.');decoded=gif(await blob.arrayBuffer());surface.width=decoded.w;surface.height=decoded.h;}
      else{video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='auto';await new Promise((ok,bad)=>{const timer=setTimeout(()=>bad(new Error('Tempo esgotado ao carregar o vídeo.')),15000);video.onloadeddata=()=>{clearTimeout(timer);ok();};video.onerror=()=>{clearTimeout(timer);bad(new Error('Vídeo incompatível. Use MP4 ou WebM.'));};video.src=url;});dimensoes(video.videoWidth,video.videoHeight);surface.width=video.videoWidth;surface.height=video.videoHeight;}
      if(cancelled)return;surface.naturalWidth=surface.width;surface.naturalHeight=surface.height;surface.complete=true;surface.update(performance.now(),true);surface.dispatchEvent(new Event('load'));onload();
    })().catch(e=>{surface.error=e;surface.dispose();onerror(e);});
    return surface;
  }
  async function importar(file){
    const kind=tipo('data:'+file.type+';');if(!kind)return null;
    if(file.size>(kind==='gif'?10:40)*MiB)throw new Error(kind==='gif'?'GIF: máximo de 10 MB.':'Vídeo de mapa: máximo de 40 MB.');
    const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
    if(kind==='gif')gif(await file.arrayBuffer());
    else if(file.type==='video/webm'?!(bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163):new TextDecoder().decode(bytes.slice(4,8))!=='ftyp')throw new Error('Arquivo de vídeo inválido.');
    if(kind==='video'){const url=URL.createObjectURL(file);try{const media=criar('data:'+file.type+';',async()=>url,()=>{},()=>{});await media.ready;const valid=media.complete;media.dispose();if(!valid)throw media.error||new Error('Animação inválida ou resolução acima do limite.');}finally{URL.revokeObjectURL(url);}}
    return new Promise((ok,bad)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=bad;r.readAsDataURL(file);});
  }
  window.MapaAnimado={tipo,criar,importar,gif};
})();
