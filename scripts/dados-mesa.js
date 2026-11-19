/* Dados livres em coordenadas do mapa. O resultado vem do servidor; a física é visual. */
(() => {
  const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=v=>mul(v,1/(Math.hypot(...v)||1));
  const qm=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-dot(a.slice(0,3),b.slice(0,3))];
  const axis=(v,a)=>[...mul(unit(v),Math.sin(a/2)),Math.cos(a/2)];
  const rotate=(v,q)=>{const t=mul(cross(q.slice(0,3),v),2);return add(v,add(mul(t,q[3]),cross(q.slice(0,3),t)));};
  const align=(a,b)=>{const d=dot(a,b);return d<-.99999?axis(unit(cross(a,Math.abs(a[0])<.8?[1,0,0]:[0,1,0])),Math.PI):unit([...cross(a,b),1+d]);};
  const slerp=(a,b,t)=>{let d=dot(a,b);if(d<0){b=mul(b,-1);d=-d;}if(d>.9995)return unit(add(mul(a,1-t),mul(b,t)));const angle=Math.acos(Math.min(1,d)),s=Math.sin(angle);return add(mul(a,Math.sin((1-t)*angle)/s),mul(b,Math.sin(t*angle)/s));};
  function random(id){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let v=Math.imul(h^h>>>15,1|h);v^=v+Math.imul(v^v>>>7,61|v);return((v^v>>>14)>>>0)/4294967296;};}
  const path=(ctx,points)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
  class DadosNaMesa {
    constructor({draw,camera}){this.draw=draw;this.camera=camera;this.batches=[];this.frame=null;this.hidden=()=>{if(document.hidden){cancelAnimationFrame(this.frame);this.frame=null;}else this.wake();};document.addEventListener('visibilitychange',this.hidden);this.leave=()=>this.destroy();window.addEventListener('pagehide',this.leave);}
    roll(roll,anchors,targetResults=[]){
      if(!anchors.length)return;
      const skin=BandejaDados3D.styles.find(s=>s.id===roll.style)||BandejaDados3D.styles[0];
      const rng=random(roll.id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const specs=roll.dice.slice(0,40).flatMap((d,index)=>d.d===100?[{d:10,value:d.v===100?0:Math.floor(d.v/10),mode:'tens',index},{d:10,value:d.v%10,mode:'units',index}]:[{d:d.d,value:d.v,index}]);
      const batch={id:roll.id,roll,start:performance.now(),previous:0,reduced,breakAt:specs.length?(reduced?120:2200):0,life:(specs.length?(reduced?120:2200):0)+(targetResults.length?8000:3700),targetResults,anchors:anchors.map(a=>({...a})),bodies:[]};
      batch.bodies=specs.map((s,i)=>{
        const g=BandejaDados3D.geometry(s.d),face=g.faces.find(f=>f.value===(s.mode?s.value+1:s.value)),normal=s.d===4?unit(g.vertices[s.value-1]):face.n;
        const target=qm(axis([0,1,0],rng()*Math.PI*2),align(normal,[0,1,0])),anchor=targetResults.find(r=>r.diceIndices.includes(s.index))?.anchor||anchors[s.index%anchors.length],angle=rng()*Math.PI*2,spread=24+Math.sqrt(i)*9,radius=22+rng()*3;
        return {...s,g,skin,radius,x:anchor.x+Math.cos(angle)*spread-58,y:anchor.y+Math.sin(angle)*spread+18,z:50+rng()*50,vx:65+rng()*60,vy:(rng()-.5)*90,vz:40+rng()*60,q:axis([rng(),rng(),rng()],rng()*6),target,spin:unit([rng()-.5,rng()-.5,rng()-.5]),speed:8+rng()*10,shards:Array.from({length:9},()=>({angle:rng()*Math.PI*2,speed:25+rng()*60,size:2+rng()*4,spin:rng()*6}))};
      });
      this.batches.push(batch);if(this.batches.length>4)this.batches.shift();this.wake();
    }
    wake(){if(this.frame!==null||document.hidden||!this.batches.length)return;this.frame=requestAnimationFrame(()=>{this.frame=null;this.draw();this.wake();});}
    advance(batch,elapsed){
      const until=Math.min(elapsed,batch.breakAt),from=batch.previous;batch.previous=until;
      // Passos limitados mantêm a apresentação leve depois de uma aba suspensa.
      if(until-from>400){for(const b of batch.bodies){b.q=b.target;b.z=b.radius;}return;}
      for(let at=from;at<until;at+=16){const dt=Math.min(16,until-at)/1000;
        for(const b of batch.bodies){
          const floor=-Math.min(...b.g.vertices.map(v=>rotate(mul(v,b.radius),b.q)[1]));
          b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vz-=440*dt;
          if(b.z<floor){b.z=floor;b.vz=Math.abs(b.vz)*.4;b.vx*=.75;b.vy*=.75;b.speed*=.73;}
          if(at<1300&&!batch.reduced)b.q=qm(axis(b.spin,b.speed*dt),b.q);
          else{b.settle ||= [...b.q];const t=Math.min(1,batch.reduced?1:(at-1300)/650);b.q=slerp(b.settle,b.target,1-(1-t)**3);b.vx*=.97;b.vy*=.97;b.z=Math.max(-Math.min(...b.g.vertices.map(v=>rotate(mul(v,b.radius),b.q)[1])),b.z);}
        }
        for(let i=0;i<batch.bodies.length;i++)for(let j=i+1;j<batch.bodies.length;j++){
          const a=batch.bodies[i],b=batch.bodies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),limit=(a.radius+b.radius)*.9;if(d>=limit||Math.abs(a.z-b.z)>limit)continue;
          const nx=d?dx/d:1,ny=d?dy/d:0,overlap=(limit-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;const speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(speed<0){a.vx+=nx*speed*.7;a.vy+=ny*speed*.7;b.vx-=nx*speed*.7;b.vy-=ny*speed*.7;}
        }
      }
    }
    paint(ctx){
      const now=performance.now(),zoom=this.camera().zoom;
      this.batches=this.batches.filter(b=>now-b.start<b.life);
      for(const batch of this.batches){const elapsed=now-batch.start;this.advance(batch,elapsed);const broken=elapsed>=batch.breakAt;
        ctx.save();
        if(!broken){for(const b of [...batch.bodies].sort((a,b)=>a.y-b.y))this.body(ctx,b);}
        else{
          const age=(elapsed-batch.breakAt)/1000,fade=Math.min(1,(batch.life-elapsed)/600);
          for(const b of batch.bodies){
            if(!batch.reduced&&age<.7){ctx.save();ctx.globalAlpha=(1-age/.7)*.85;for(const shard of b.shards){const x=b.x+Math.cos(shard.angle)*shard.speed*age,y=b.y+Math.sin(shard.angle)*shard.speed*age-28*age+55*age*age;ctx.save();ctx.translate(x,y);ctx.rotate(shard.spin+age*5);ctx.fillStyle=b.skin.edge;ctx.strokeStyle=b.skin.ink;ctx.lineWidth=.6;path(ctx,[{x:-shard.size,y:-shard.size/2},{x:shard.size,y:0},{x:0,y:shard.size}]);ctx.fill();ctx.stroke();ctx.restore();}ctx.restore();}
            const value=b.mode==='tens'?String(b.value*10).padStart(2,'0'):String(b.value),y=b.y-30-Math.min(age*14,20);
            ctx.save();ctx.globalAlpha=fade*Math.min(1,age*9+.15);ctx.translate(b.x,y);const scale=1/zoom;ctx.scale(scale,scale);ctx.font='600 26px Georgia,serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#100e16';ctx.fillStyle=b.value===(b.mode?9:b.d)?'#f6d77f':'#fff2cd';ctx.strokeText(value,0,0);ctx.fillText(value,0,0);ctx.font='10px system-ui,sans-serif';ctx.fillStyle='#dacaa9';ctx.fillText('d'+(b.mode?100:b.d),0,16);ctx.restore();
          }
          const anchor=batch.anchors[0];ctx.globalAlpha=fade;ctx.font=`600 ${14/zoom}px system-ui,sans-serif`;ctx.textAlign='center';ctx.lineWidth=3/zoom;ctx.strokeStyle='#100e16';ctx.fillStyle='#ead19a';const text=batch.roll.title.slice(0,48)+(batch.roll.title.length>48?'…':'')+' · '+(batch.roll.bonus?((batch.roll.bonus>0?'+':'')+batch.roll.bonus+' · '):'')+(batch.roll.dice.length||batch.roll.bonus?'= '+batch.roll.total:(window.PrimordiosI18n?.t('Efeito sem rolagem de dados')||'Efeito sem rolagem de dados'));ctx.strokeText(text,anchor.x,anchor.y+75);ctx.fillText(text,anchor.x,anchor.y+75);
        }
        ctx.restore();
      }
      for(const batch of this.batches)this.damage(ctx,batch,now,zoom);
    }
    damage(ctx,batch,now,zoom){
      const elapsed=now-batch.start;if(elapsed<batch.breakAt||!batch.roll.dice.length&&!batch.roll.bonus)return;
      const age=(elapsed-batch.breakAt)/1000,fade=Math.min(1,(batch.life-elapsed)/600);
      for(const result of batch.targetResults){const anchor=result.anchor,stack=this.batches.slice(0,this.batches.indexOf(batch)).filter(b=>b.targetResults.some(r=>r.targetId===result.targetId)).length;
        ctx.save();ctx.globalAlpha=fade*Math.min(1,age*5);ctx.translate(anchor.x,anchor.y-(anchor.h||50)/2-(20+stack*55)/zoom);ctx.scale(1/zoom,1/zoom);
        ctx.fillStyle='#181018ee';ctx.fillRect(-59,-28,118,52);const heal=batch.roll.category==='heal';ctx.font='700 25px system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#100e16';ctx.fillStyle=result.factor===0?'#d3d0cb':heal?'#95e4b0':'#ffb19a';const label=result.factor===0?(window.PrimordiosI18n?.t('Errou / evitou')||'Errou / evitou'):(heal?'+':'−')+result.total;ctx.strokeText(label,0,0);ctx.fillText(label,0,0);ctx.font='10px system-ui,sans-serif';ctx.fillStyle='#eee0c8';ctx.fillText(batch.roll.title.slice(0,22),0,17);ctx.restore();
      }
    }
    body(ctx,b){
      const project=p=>({x:b.x+p[0],y:b.y+p[2]*.78-(b.z+p[1])*.65}),faces=[];
      const shadow=ctx.createRadialGradient(b.x,b.y,1,b.x,b.y,b.radius*1.4);shadow.addColorStop(0,'#0008');shadow.addColorStop(1,'#0000');ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(b.x,b.y,b.radius*1.4,b.radius*.75,0,0,Math.PI*2);ctx.fill();
      for(const f of b.g.faces){const n=rotate(f.n,b.q);if(dot(n,[0,.77,.64])<=.02)continue;const points=f.ids.map(id=>project(rotate(mul(b.g.vertices[id],b.radius),b.q))),center=project(rotate(mul(f.center,b.radius),b.q));faces.push({f,n,points,center,depth:dot(rotate(f.center,b.q),[0,.77,.64])});}
      faces.sort((a,b)=>a.depth-b.depth);
      for(const {f,n,points,center}of faces){
        const skin=b.skin,light=Math.max(0,dot(n,unit([-.4,.85,.35]))),gradient=ctx.createLinearGradient(center.x-14,center.y-16,center.x+14,center.y+16),tone=skin.base+light*skin.spread-4;
        if(skin.id==='ivory'){for(const [at,l]of [[0,23],[.22,40],[.39,70],[.46,85],[.52,43],[.72,26],[1,59]])gradient.addColorStop(at,`hsl(35 14% ${l}%)`);}else{gradient.addColorStop(0,`hsl(${skin.h} ${skin.s*.72}% ${tone+11}%)`);gradient.addColorStop(.48,`hsl(${skin.h} ${skin.s*.72}% ${tone}%)`);gradient.addColorStop(1,`hsl(${skin.h} ${skin.s*.72}% ${tone-15}%)`);}
        path(ctx,points);ctx.fillStyle=gradient;ctx.fill();ctx.lineJoin='round';ctx.strokeStyle=skin.edge+'99';ctx.lineWidth=1.15;ctx.stroke();
        const bevel=points.map(p=>({x:center.x+(p.x-center.x)*.9,y:center.y+(p.y-center.y)*.9}));path(ctx,bevel);ctx.strokeStyle=skin.edge+'66';ctx.lineWidth=.65;ctx.stroke();
        ctx.save();path(ctx,bevel);ctx.clip();
        const pos=rotate(mul(f.center,b.radius),b.q),u=project(add(pos,rotate(mul(f.u,b.radius*.37),b.q))),v=project(add(pos,rotate(mul(f.v,b.radius*.37),b.q)));
        const mu=project(add(pos,rotate(mul(f.u,b.radius),b.q))),mv=project(add(pos,rotate(mul(f.v,b.radius),b.q)));
        ctx.save();ctx.transform(mu.x-center.x,mu.y-center.y,center.x-mv.x,center.y-mv.y,center.x,center.y);BandejaDados3D.paintMaterial(ctx,skin,f.value,matchMedia('(prefers-reduced-motion: reduce)').matches?0:performance.now()/1000);ctx.restore();
        ctx.transform(u.x-center.x,u.y-center.y,center.x-v.x,center.y-v.y,center.x,center.y);ctx.fillStyle=skin.ink;ctx.strokeStyle=skin.edge+'66';ctx.lineWidth=.04;
        const motif=skin.id==='ruby'||skin.id==='sapphire';if(motif&&b.d!==4){ctx.translate(0,.8);ctx.scale(.7,.7);}
        if(b.d===4){ctx.font='bold 0.57px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';for(const id of f.ids){const delta=add(mul(b.g.vertices[id],.62),mul(f.center,-.62));ctx.fillText(String(id+1),dot(delta,f.u)/.37,-dot(delta,f.v)/.37);}}
        else if(b.d===6&&!motif){const pips={1:[[0,0]],2:[[-.45,-.45],[.45,.45]],3:[[-.45,-.45],[0,0],[.45,.45]],4:[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]],5:[[-.45,-.45],[.45,-.45],[0,0],[-.45,.45],[.45,.45]],6:[[-.45,-.5],[.45,-.5],[-.45,0],[.45,0],[-.45,.5],[.45,.5]]};for(const [x,y]of pips[f.value]||[]){ctx.beginPath();ctx.arc(x,y,.14,0,Math.PI*2);ctx.fill();ctx.stroke();}}
        else if(f.value!==null){const value=b.mode?(f.value-1)*(b.mode==='tens'?10:1):f.value;ctx.font='bold 1.2px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.mode==='tens'?String(value).padStart(2,'0'):String(value)+(value===6||value===9?'.':''),0,0);}
        ctx.restore();
      }
    }
    snapshot(){return this.batches.map(b=>({id:b.id,style:b.roll.style||'ivory',phase:performance.now()-b.start>=b.breakAt?'broken':'rolling',bodies:b.bodies.map(d=>({x:d.x,y:d.y,value:d.value,d:d.d,mode:d.mode||'normal'})),total:b.roll.total,targetResults:b.targetResults.map(r=>({targetId:r.targetId,total:r.total,units:r.units,factor:r.factor})),life:b.life}));}
    destroy(){cancelAnimationFrame(this.frame);this.frame=null;this.batches=[];document.removeEventListener('visibilitychange',this.hidden);window.removeEventListener('pagehide',this.leave);}
  }
  window.DadosNaMesa=DadosNaMesa;
})();
