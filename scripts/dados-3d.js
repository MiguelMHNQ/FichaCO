/* Geometria 3D projetada em canvas, sem CDN, instalação ou contexto WebGL. */
(() => {
  const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),sub=(a,b)=>add(a,mul(b,-1));
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const qm=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-dot(a.slice(0,3),b.slice(0,3))];
  const axis=(v,a)=>[...mul(unit(v),Math.sin(a/2)),Math.cos(a/2)];
  function rotate(v,q){const t=mul(cross(q.slice(0,3),v),2);return add(v,add(mul(t,q[3]),cross(q.slice(0,3),t)));}
  function align(a,b){const d=dot(a,b);return d<-.99999?axis(unit(cross(a,Math.abs(a[0])<.8?[1,0,0]:[0,1,0])),Math.PI):unit([...cross(a,b),1+d]);}
  function slerp(a,b,t){let c=dot(a,b);if(c<0){b=mul(b,-1);c=-c;}if(c>.9995)return unit(add(mul(a,1-t),mul(b,t)));const angle=Math.acos(Math.min(1,c)),s=Math.sin(angle);return add(mul(a,Math.sin((1-t)*angle)/s),mul(b,Math.sin(t*angle)/s));}
  function hull(vertices){
    const faces=new Map();
    for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++)for(let k=j+1;k<vertices.length;k++){
      const raw=cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i]));if(Math.hypot(...raw)<1e-6)continue;
      let n=unit(raw),d=dot(n,vertices[i]);const sides=vertices.map(v=>dot(n,v)-d);
      if(sides.some(v=>v>1e-5)&&sides.some(v=>v< -1e-5))continue;
      if(d<0){n=mul(n,-1);d=-d;}
      const ids=vertices.map((v,id)=>Math.abs(dot(n,v)-d)<1e-5?id:-1).filter(id=>id>=0),key=ids.join(',');if(faces.has(key))continue;
      const center=mul(ids.reduce((s,id)=>add(s,vertices[id]),[0,0,0]),1/ids.length),u=unit(sub(vertices[ids[0]],center)),v=cross(n,u);
      ids.sort((a,b)=>Math.atan2(dot(sub(vertices[a],center),v),dot(sub(vertices[a],center),u))-Math.atan2(dot(sub(vertices[b],center),v),dot(sub(vertices[b],center),u)));
      faces.set(key,{ids,n,d,center,u,v});
    }
    return [...faces.values()];
  }
  const cache=new Map();
  function geometry(sides){
    if(cache.has(sides))return cache.get(sides);
    let vertices=[];const p=(1+Math.sqrt(5))/2;
    if(sides===4)vertices=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
    if(sides===6)for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])vertices.push([x,y,z]);
    if(sides===8)vertices=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    if(sides===20||sides===12){for(const a of [-1,1])for(const b of [-p,p])vertices.push([0,a,b],[a,b,0],[b,0,a]);if(sides===12)vertices=hull(vertices).map(f=>mul(f.n,1/f.d));}
    if([10,14,16].includes(sides)){const count=sides/2,h=Math.sqrt(Math.sin(Math.PI/count)**2-Math.sin(Math.PI/(2*count))**2),anti=[];for(let i=0;i<count;i++)for(const top of [0,1]){const a=i*2*Math.PI/count+top*Math.PI/count;anti.push([Math.cos(a),top?h:-h,Math.sin(a)]);}vertices=hull(anti).map(f=>mul(f.n,1/f.d));}
    if(sides===2)for(let i=0;i<16;i++)for(const y of [-.15,.15])vertices.push([Math.cos(i*Math.PI/8),y,Math.sin(i*Math.PI/8)]);
    if(!vertices.length)throw new Error('Dado não suportado');
    const r=Math.max(...vertices.map(v=>Math.hypot(...v)));vertices=vertices.map(v=>mul(v,1/r));
    const faces=hull(vertices);let value=1;
    for(const face of faces){if(sides===2){face.value=Math.abs(face.n[1])>.99?(face.n[1]>0?1:2):null;continue;}if(face.value)continue;face.value=value;const opposite=faces.find(f=>!f.value&&dot(f.n,face.n)<-.999);if(opposite)opposite.value=sides+1-value;value++;}
    const result={vertices,faces,sides};cache.set(sides,result);return result;
  }
  const styles=[
    {id:'ivory',name:'Metal',h:34,s:13,base:30,spread:42,ink:'#211b16',edge:'#f4dfae',icon:'m12 2 9 5v10l-9 5-9-5V7zM8 8h8v8H8z'},
    {id:'obsidian',name:'Pintado',h:38,s:18,base:66,spread:21,ink:'#27212b',edge:'#fff3d7',icon:'M7 5a2 2 0 1 0 0 .1M17 6a1 1 0 1 0 0 .1M11 13a3 3 0 1 0 0 .1M18 19a2 2 0 1 0 0 .1M5 19a1 1 0 1 0 0 .1'},
    {id:'ruby',name:'Olho',h:267,s:29,base:11,spread:20,ink:'#f1dcaa',edge:'#b6a1c6',icon:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'},
    {id:'sapphire',name:'Patinhos',h:181,s:34,base:45,spread:27,ink:'#172f3a',edge:'#d0f7ec',icon:'M5 12c-3 0-3 7 4 8h6c5-1 6-5 5-7l-5-1a4 4 0 1 0-5-4l-4 1 4 2v2M14 6h.1M8 15l4 2 4-2'},
    {id:'emerald',name:'Fosforescente',h:139,s:75,base:28,spread:30,ink:'#092e1b',edge:'#baff9b',icon:'m12 6 2 4 4 2-4 2-2 4-2-4-4-2 4-2zM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2'},
    {id:'arcane',name:'Cristal',h:281,s:44,base:27,spread:40,ink:'#fff3ec',edge:'#e5cffb',icon:'M7 3h10l5 7-10 12L2 10zM2 10h20M7 3l5 19 5-19'},
    {id:'magma',name:'Magma',h:22,s:30,base:10,spread:23,ink:'#f2dab2',edge:'#c89565',dynamic:true,icon:'M13 2c2 7-4 6-1 11 3-2 4-4 4-6 6 6 5 14-4 15C3 21 2 14 7 9c-1 4 1 5 2 5-2-6 3-7 4-12z'},
    {id:'nebula',name:'Nebulosa',h:242,s:26,base:10,spread:28,ink:'#e4e1ed',edge:'#a8a5c5',dynamic:true,icon:'M20 7c4 5-12 13-16 9S16 2 20 7zM9 3l1 3m5 12 1 3M3 9l3 1m12 4 3 1M12 9v6m-3-3h6'}
  ];
  const materialTextures=new Map();
  function materialTexture(skin,value){
    const key=skin.id+':'+value;if(materialTextures.has(key))return materialTextures.get(key);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.setTransform(64,0,0,64,64,64);
        const noise=i=>{const v=Math.sin(i*127.1+(value||0)*311.7)*43758.5453;return v-Math.floor(v);};
        if(skin.id==='ivory'){
          ctx.lineWidth=.004;for(let i=0;i<35;i++){const x=noise(i)*2-1,y=noise(i+50)*2-1;ctx.strokeStyle=i%2?'#fff3d735':'#231b1630';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.09+noise(i+90)*.25,y+.015);ctx.stroke();}
        }else if(skin.id==='obsidian'){
          for(let i=0;i<85;i++){ctx.fillStyle=['#302d38cc','#bb794caa','#fffdf388'][i%3];ctx.beginPath();ctx.ellipse(noise(i)*2-1,noise(i+100)*2-1,.008+noise(i+150)*.027,.006+noise(i+160)*.02,noise(i+200)*6,0,Math.PI*2);ctx.fill();}
        }else if(skin.id==='ruby'){
          ctx.strokeStyle='#b784bb44';ctx.lineWidth=.01;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-1,i*.22-.5);ctx.bezierCurveTo(-.3,i*.2-.7,.2,i*.15-.2,1,i*.22-.7);ctx.stroke();}
          if(value!==null){
            ctx.beginPath();ctx.moveTo(-.49,-.08);ctx.quadraticCurveTo(0,-.6,.49,-.08);ctx.quadraticCurveTo(0,.33,-.49,-.08);ctx.fillStyle='#eee1cc';ctx.fill();ctx.lineWidth=.025;ctx.strokeStyle='#4b243d';ctx.stroke();
            const iris=ctx.createRadialGradient(-.04,-.12,.02,0,-.09,.21);iris.addColorStop(0,'#192d26');iris.addColorStop(.35,'#498f76');iris.addColorStop(.75,'#b5b352');iris.addColorStop(1,'#263e35');ctx.fillStyle=iris;ctx.beginPath();ctx.arc(0,-.09,.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#080d0d';ctx.beginPath();ctx.ellipse(0,-.09,.045,.17,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffffdd';ctx.beginPath();ctx.arc(-.065,-.17,.045,0,Math.PI*2);ctx.fill();
          }
        }else if(skin.id==='sapphire'){
          for(let i=0;i<7;i++){ctx.strokeStyle='#f2fffd66';ctx.lineWidth=.008;ctx.beginPath();ctx.arc(noise(i)*2-1,noise(i+40)*2-1,.015+noise(i+10)*.035,0,Math.PI*2);ctx.stroke();}
          ctx.save();ctx.translate(-.03,-.13);ctx.fillStyle='#e9a92d';ctx.beginPath();ctx.ellipse(.02,.12,.36,.17,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dbc36e';ctx.beginPath();ctx.ellipse(0,.05,.34,.17,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(.18,-.13,.17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b98244';ctx.beginPath();ctx.moveTo(.31,-.16);ctx.lineTo(.48,-.1);ctx.lineTo(.31,-.05);ctx.fill();ctx.fillStyle='#dba32c';ctx.beginPath();ctx.ellipse(-.06,.04,.16,.08,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#243538';ctx.beginPath();ctx.arc(.23,-.18,.024,0,Math.PI*2);ctx.fill();ctx.restore();
        }else if(skin.id==='emerald'){
          for(let i=0;i<45;i++){ctx.fillStyle=i%3?'#d5ff9d44':'#efffdc99';ctx.beginPath();ctx.arc(noise(i)*2-1,noise(i+90)*2-1,.005+noise(i+80)*.012,0,Math.PI*2);ctx.fill();}
          const glow=ctx.createRadialGradient(-.12,-.15,.03,0,0,.8);glow.addColorStop(0,'#d9ffac70');glow.addColorStop(1,'#8aff7400');ctx.fillStyle=glow;ctx.fillRect(-1,-1,2,2);
        }else if(skin.id==='magma'){
          ctx.strokeStyle='#a2613766';ctx.lineWidth=.03;for(let i=0;i<5;i++){const x=noise(i)*1.6-.8;ctx.beginPath();ctx.moveTo(x,-1);ctx.lineTo(x+.16,-.4);ctx.lineTo(x-.12,.04);ctx.lineTo(x+.25,.5);ctx.lineTo(x+.12,1);ctx.stroke();}
        }else if(skin.id==='nebula'){
          for(let i=0;i<8;i++){const cloud=ctx.createRadialGradient(noise(i)*1.6-.8,noise(i+10)*1.6-.8,0,0,0,1.1);cloud.addColorStop(0,i%2?'#a17caa33':'#60849c33');cloud.addColorStop(1,'#40365b00');ctx.fillStyle=cloud;ctx.fillRect(-1,-1,2,2);}
        }else{
          ctx.fillStyle='#ead5ff18';ctx.beginPath();ctx.moveTo(-1,-1);ctx.lineTo(.35,.15);ctx.lineTo(-.4,1);ctx.fill();ctx.strokeStyle='#f3e5ff66';ctx.lineWidth=.014;ctx.beginPath();ctx.moveTo(-.7,-.8);ctx.lineTo(.1,-.1);ctx.lineTo(-.2,.7);ctx.moveTo(.1,-.1);ctx.lineTo(.7,.2);ctx.stroke();
        }

    // Pátina estável: poros, poeira e riscos são gerados uma vez por face.
    for(let i=0;i<9;i++){const x=noise(i+340)*2-1,y=noise(i+380)*2-1,stain=ctx.createRadialGradient(x,y,0,x,y,.12+noise(i+410)*.3);stain.addColorStop(0,'#30271e30');stain.addColorStop(1,'#30271e00');ctx.fillStyle=stain;ctx.fillRect(-1,-1,2,2);}
    for(let i=0;i<230;i++){ctx.fillStyle=i%3?'#211e191c':'#eadfc528';ctx.fillRect(noise(i+500)*2-1,noise(i+800)*2-1,.004+noise(i+900)*.012,.005);}
    ctx.lineWidth=.005;ctx.strokeStyle='#f0e0bf30';for(let i=0;i<12;i++){const x=noise(i+1000)*2-1,y=noise(i+1100)*2-1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.08+noise(i)*.12,y+.02);ctx.stroke();}
    materialTextures.set(key,canvas);return canvas;
  }
  function paintMaterial(ctx,skin,value,time=0){
    ctx.drawImage(materialTexture(skin,value),-1,-1,2,2);
        if(skin.id==='magma'){ctx.save();ctx.globalAlpha=.45+.18*Math.sin(time*1.7+(value||0));ctx.strokeStyle='#e9a25b';ctx.shadowColor='#d86a29';ctx.shadowBlur=5;ctx.lineWidth=.014;for(let i=0;i<3;i++){const x=-.6+i*.5;ctx.beginPath();ctx.moveTo(x,-1);ctx.lineTo(x+.16,-.4);ctx.lineTo(x-.12,.04);ctx.lineTo(x+.25,.5);ctx.lineTo(x+.12,1);ctx.stroke();}ctx.restore();}
        if(skin.id==='nebula'){for(let i=0;i<18;i++){const phase=i*2.399+(value||0),x=Math.cos(phase+time*.025)*(.15+i*.045),y=Math.sin(phase+time*.025)*(.15+i*.045);ctx.globalAlpha=.35+.5*(.5+.5*Math.sin(time*.8+i));ctx.fillStyle=i%3?'#dcd9ed':'#98c3d7';ctx.beginPath();ctx.arc(x,y,i%4?.006:.014,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}


  }
  class BandejaDados3D {
    constructor(canvas){
      let saved;try{saved=localStorage.getItem('primordios_estilo_dados');}catch{}this.style=styles.find(s=>s.id===saved)||styles[0];
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.bodies=[];this.frame=null;this.timer=null;this.busy=false;
      this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas);
      this.idleFrame=null;this.idleAt=0;this.destroyed=false;this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.visibility=()=>this.syncIdle();document.addEventListener('visibilitychange',this.visibility);this.motion.addEventListener('change',this.visibility);
      this.theme=()=>this.draw();window.addEventListener('primordios:preferencias',this.theme);this.draw();
    }
    setStyle(id){const style=styles.find(s=>s.id===id);if(!style)return;this.style=style;this.draw();}
    syncIdle(){
      const active=!this.destroyed&&this.style.dynamic&&!this.busy&&this.bodies.length&&!document.hidden&&!this.motion.matches&&this.canvas.getClientRects().length&&!this.canvas.closest('[hidden]');
      if(!active){cancelAnimationFrame(this.idleFrame);this.idleFrame=null;return;}
      if(this.idleFrame!==null)return;this.idleFrame=requestAnimationFrame(now=>{this.idleFrame=null;if(now-this.idleAt>=1000/30){this.idleAt=now;this.draw();}else this.syncIdle();});
    }
    roll(results){
      this.finish();this.results=results.map(r=>({...r}));
      const specs=results.flatMap((r,index)=>r.d===100?[{sides:10,value:r.v===100?0:Math.floor(r.v/10),mode:'tens',index},{sides:10,value:r.v%10,mode:'units',index}]:[{sides:r.d,value:r.v,index}]);
      const cols=Math.ceil(Math.sqrt(specs.length||1)),rows=Math.ceil(specs.length/cols),gap=8/Math.max(cols,rows),radius=Math.min(1.15,gap*.32);
      this.bodies=specs.map((s,i)=>{
        const g=geometry(s.sides),face=g.faces.find(f=>f.value===(s.mode?s.value+1:s.value));
        // d4 é lido no vértice superior: sua face oposta fica apoiada no chão.
        const normal=s.sides===4?unit(g.vertices[s.value-1]):face.n;
        const baseQ=align(normal,[0,1,0]),u=rotate(face.u,baseQ);
        const yaw=s.sides===4?(Math.random()-.5)*1.3:Math.atan2(u[2],u[0])+(Math.random()-.5)*.25;
        const targetQ=qm(axis([0,1,0],yaw),baseQ);
        return {...s,g,radius,q:axis(unit([Math.random(),Math.random(),Math.random()]),Math.random()*6),targetQ,p:[(Math.random()-.5)*6,3+Math.random()*2,(Math.random()-.5)*6],velocity:[(Math.random()-.5)*5,1+Math.random()*2,(Math.random()-.5)*5],spin:unit([Math.random()-.5,Math.random()-.5,Math.random()-.5]),speed:7+Math.random()*7,target:[(i%cols-(cols-1)/2)*gap,0,(Math.floor(i/cols)-(rows-1)/2)*gap]};
      });
      if(!this.bodies.length){this.draw();return Promise.resolve();}
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.busy=true;const start=performance.now(),duration=reduced?180:2500;let previous=start;
      return new Promise(resolve=>{
        this.resolve=resolve;
        const tick=now=>{
          if(!this.busy)return;
          const elapsed=now-start,dt=Math.min(.025,(now-previous)/1000);previous=now;
          if(elapsed<1550&&!reduced)this.step(dt);
          else for(const b of this.bodies){
            if(!b.settle)b.settle={p:[...b.p],q:[...b.q]};
            const t=Math.min(1,reduced?elapsed/duration:(elapsed-1550)/950),e=1-(1-t)**3;
            b.q=slerp(b.settle.q,b.targetQ,e);
            const floor=-Math.min(...b.g.vertices.map(v=>rotate(mul(v,b.radius),b.q)[1]));
            b.p=[b.settle.p[0]+(b.target[0]-b.settle.p[0])*e,Math.max(floor,b.settle.p[1]*(1-e)+floor*e),b.settle.p[2]+(b.target[2]-b.settle.p[2])*e];
          }
          this.draw();if(elapsed>=duration)this.finish();else this.frame=requestAnimationFrame(tick);
        };
        this.frame=requestAnimationFrame(tick);
        // Rolagens também concluem quando o painel está fechado ou a aba perde foco.
        this.timer=setTimeout(()=>this.finish(),duration+250);
      });
    }
    step(dt){
      for(const b of this.bodies){
        b.velocity[1]-=16*dt;b.p=add(b.p,mul(b.velocity,dt));b.q=qm(axis(b.spin,b.speed*dt),b.q);
        const floor=-Math.min(...b.g.vertices.map(v=>rotate(mul(v,b.radius),b.q)[1]));
        if(b.p[1]<floor){b.p[1]=floor;b.velocity[1]=Math.abs(b.velocity[1])*.46;b.velocity[0]*=.82;b.velocity[2]*=.82;b.speed*=.82;}
        for(const a of [0,2]){const bound=4.5-b.radius;if(Math.abs(b.p[a])>bound){b.p[a]=Math.sign(b.p[a])*bound;b.velocity[a]*=-.65;b.speed*=.9;}}
      }
      for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++){
        const a=this.bodies[i],b=this.bodies[j],dx=b.p[0]-a.p[0],dz=b.p[2]-a.p[2],d=Math.hypot(dx,dz),limit=(a.radius+b.radius)*.8;
        if(d<limit&&Math.abs(a.p[1]-b.p[1])<limit){const n=[dx/(d||1),0,dz/(d||1)],overlap=(limit-d)*.5;a.p=sub(a.p,mul(n,overlap));b.p=add(b.p,mul(n,overlap));const speed=dot(sub(b.velocity,a.velocity),n);if(speed<0){a.velocity=add(a.velocity,mul(n,speed*.65));b.velocity=sub(b.velocity,mul(n,speed*.65));}}
      }
    }
    finish(){
      cancelAnimationFrame(this.frame);clearTimeout(this.timer);this.frame=null;this.timer=null;
      for(const b of this.bodies){b.q=[...b.targetQ];b.p=[b.target[0],-Math.min(...b.g.vertices.map(v=>rotate(mul(v,b.radius),b.q)[1])),b.target[2]];}
      this.busy=false;this.draw();const resolve=this.resolve;this.resolve=null;resolve?.();
    }
    snapshot(){return this.bodies.map(b=>{
      const top=b.sides===4?b.g.vertices.map((v,i)=>({value:i+1,y:rotate(v,b.q)[1]})).sort((a,c)=>c.y-a.y)[0].value:b.g.faces.filter(f=>f.value!==null).map(f=>({value:f.value,y:rotate(f.n,b.q)[1]})).sort((a,c)=>c.y-a.y)[0].value;
      return {d:b.sides,value:b.mode?top-1:top,mode:b.mode||'normal',index:b.index,floor:Math.min(...b.g.vertices.map(v=>b.p[1]+rotate(mul(v,b.radius),b.q)[1]))};
    });}
    draw(){
      if(!this.ctx)return;const canvas=this.canvas,size=canvas.clientWidth||360,dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(size*dpr)||canvas.height!==Math.round(size*dpr)){canvas.width=Math.round(size*dpr);canvas.height=Math.round(size*dpr);}
      const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
      const light=document.documentElement.classList.contains('tema-claro'),scale=size/13;
      const depth=p=>p[1]*.894+p[2]*.447;
      const project=p=>{const k=scale/(1-depth(p)/25);return [size*.5+p[0]*k,size*.53-(p[1]*.447-p[2]*.894)*k];};
      const polygon=points=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();};
      const corners=[[-5,0,-5],[5,0,-5],[5,0,5],[-5,0,5]],floor=corners.map(project);
      for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];polygon([a,b,add(b,[0,-.3,0]),add(a,[0,-.3,0])].map(project));ctx.fillStyle=light?'#9f895f':'#332a1e';ctx.fill();}
      ctx.fillStyle=light?'#eee8d9':'#151d23';ctx.strokeStyle=light?'#b7a079':'#74603c';ctx.lineWidth=6;polygon(floor);ctx.fill();ctx.stroke();
      ctx.save();polygon(floor);ctx.clip();ctx.strokeStyle=light?'#a48b6320':'#c9a84c0b';ctx.lineWidth=.5;
      for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(...project([-5,0,i/2]));ctx.lineTo(...project([5,0,i/2]));ctx.stroke();}
      ctx.restore();
      if(!this.bodies.length){const c=project([0,.02,0]);ctx.strokeStyle=light?'#a48b6370':'#c9a84c38';ctx.lineWidth=1;polygon([[c[0],c[1]-24],[c[0]+22,c[1]],[c[0],c[1]+24],[c[0]-22,c[1]]]);ctx.stroke();}
      const faces=[];
      for(const b of this.bodies){
        const shadow=project([b.p[0],.02,b.p[2]]);ctx.fillStyle=`rgba(0,0,0,${.3/(1+b.p[1]*.25)})`;ctx.beginPath();ctx.ellipse(shadow[0],shadow[1],b.radius*scale*.92,b.radius*scale*.36,0,0,Math.PI*2);ctx.fill();
        for(const f of b.g.faces){const n=rotate(f.n,b.q);if(dot(n,[0,.894,.447])<.025)continue;const points=f.ids.map(id=>add(b.p,rotate(mul(b.g.vertices[id],b.radius),b.q))),center=add(b.p,rotate(mul(f.center,b.radius),b.q));faces.push({b,f,n,points,center,z:depth(center)});}
      }
      faces.sort((a,b)=>a.z-b.z);
      for(const face of faces){
        const {b,f,n,points,center}=face,shade=.35+.65*Math.max(0,dot(n,unit([-.35,.8,.45]))),skin=this.style,hue=skin.h;
        const projected=points.map(project),c=project(center),xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys),gradient=ctx.createLinearGradient(c[0]-width*.6,c[1]-height*.65,c[0]+width*.6,c[1]+height*.65);
        const tone=skin.base+shade*skin.spread-4,saturation=skin.s*.72;
        if(skin.id==='ivory'){
          const shift=dot(n,unit([.7,.2,-.6]))*.11;
          for(const [at,l]of [[0,23],[.22,40],[.39,70],[.46,85],[.52,43],[.72,26],[1,59]])gradient.addColorStop(Math.max(0,Math.min(1,at+(at===0||at===1?0:shift))),`hsl(35 14% ${l}%)`);
        }else{gradient.addColorStop(0,`hsl(${hue} ${saturation}% ${Math.min(96,tone+11)}%)`);gradient.addColorStop(.48,`hsl(${hue} ${saturation}% ${tone}%)`);gradient.addColorStop(1,`hsl(${hue} ${saturation}% ${tone-15}%)`);}
        polygon(projected);ctx.fillStyle=gradient;ctx.strokeStyle=skin.edge;ctx.lineWidth=skin.id==='ivory'?1.3:.7;
        if(skin.id==='emerald'){ctx.save();ctx.shadowColor='#79b969';ctx.shadowBlur=8;ctx.fill();ctx.stroke();ctx.restore();}else{ctx.fill();ctx.stroke();}
        polygon(projected.map(p=>[c[0]+(p[0]-c[0])*.95,c[1]+(p[1]-c[1])*.95]));ctx.strokeStyle='#30282070';ctx.lineWidth=2;ctx.stroke();
        polygon(projected.map(p=>[c[0]+(p[0]-c[0])*.91,c[1]+(p[1]-c[1])*.91]));ctx.strokeStyle=skin.edge+'66';ctx.lineWidth=.5;ctx.stroke();
        ctx.save();polygon(points.map(project));ctx.clip();
        // Textura no plano da face, gerada uma vez e reutilizada na animação.
        ctx.save();const fc=project(center),fu=project(add(center,rotate(mul(f.u,b.radius),b.q))),fv=project(add(center,rotate(mul(f.v,b.radius),b.q)));
        ctx.transform(fu[0]-fc[0],fu[1]-fc[1],fc[0]-fv[0],fc[1]-fv[1],fc[0],fc[1]);
        paintMaterial(ctx,skin,f.value,this.motion.matches?0:performance.now()/1000);
        ctx.restore();

        const label=(position,value,small=false)=>{
          const motif=!small&&(skin.id==='ruby'||skin.id==='sapphire'),labelPos=motif?add(position,rotate(mul(f.v,-b.radius*.29),b.q)):position;
          const c=project(labelPos),u=project(add(labelPos,rotate(mul(f.u,b.radius*(small?.18:motif?.23:.35)),b.q))),v=project(add(labelPos,rotate(mul(f.v,b.radius*(small?.18:motif?.23:.35)),b.q)));
          ctx.save();ctx.transform(u[0]-c[0],u[1]-c[1],c[0]-v[0],c[1]-v[1],c[0],c[1]);ctx.font='bold 1.35px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';const text=b.mode==='tens'?String(value*10).padStart(2,'0'):String(value),printed=text==='6'||text==='9'?text+'.':text;ctx.fillStyle=skin.id==='ivory'?'#ffedbf99':'#00000060';ctx.fillText(printed,.035,.045);ctx.fillStyle=skin.ink;ctx.fillText(printed,0,0);ctx.restore();
        };
        if(b.sides===4)for(const id of f.ids)label(add(b.p,rotate(mul(add(mul(b.g.vertices[id],.63),mul(f.center,.37)),b.radius),b.q)),id+1,true);
        else if(f.value!==null)label(center,b.mode?f.value-1:f.value);
        ctx.restore();
      }
      this.syncIdle();
    }
    destroy(){this.destroyed=true;cancelAnimationFrame(this.idleFrame);this.idleFrame=null;document.removeEventListener('visibilitychange',this.visibility);this.motion.removeEventListener('change',this.visibility);this.finish();this.observer.disconnect();window.removeEventListener('primordios:preferencias',this.theme);}
  }
  window.BandejaDados3D=BandejaDados3D;
  BandejaDados3D.geometry=geometry;
  BandejaDados3D.styles=styles;
  BandejaDados3D.paintMaterial=paintMaterial;
})();
