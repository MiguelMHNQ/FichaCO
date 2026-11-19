// Sobreposição transitória: nunca entra no documento ou no histórico do mapa.
class PonteiroLaser {
  constructor(obterCamera, obterCor) {
    this.obterCamera=obterCamera;this.obterCor=obterCor;this.pontos=[];this.cabeca=null;this.frame=null;
    this.canvas=document.createElement('canvas');this.canvas.className='laser-sobreposicao';this.canvas.setAttribute('aria-hidden','true');
    document.body.appendChild(this.canvas);this.ctx=this.canvas.getContext('2d');
    this.indicador=document.createElement('div');this.indicador.className='laser-direcao';this.indicador.hidden=true;this.indicador.setAttribute('role','img');
    this.indicador.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
    document.body.appendChild(this.indicador);
    this.redimensionar=()=>{const dpr=devicePixelRatio||1;this.canvas.width=innerWidth*dpr;this.canvas.height=innerHeight*dpr;this.agendar();};
    window.addEventListener('resize',this.redimensionar);this.redimensionar();
  }
  iniciar(ponto) { this.pontos=[];this.cabeca=ponto;this.mover(ponto); }
  mover(ponto) {
    this.cabeca=ponto;this.pontos.push({...ponto,t:performance.now()});
    if(this.pontos.length>100)this.pontos.shift();this.agendar();
  }
  soltar() { this.cabeca=null;this.indicador.hidden=true;this.agendar(); }
  limpar() { this.cabeca=null;this.indicador.hidden=true;this.pontos=[];if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); }
  atualizarIndicador(p) {
    const fora=p && (p.x<0 || p.y<0 || p.x>=innerWidth || p.y>=innerHeight);
    this.indicador.hidden=!fora;if(!fora)return;
    const cx=innerWidth/2,cy=innerHeight/2,dx=p.x-cx,dy=p.y-cy;
    const margem=Math.min(32,cx/2,cy/2);
    const fator=Math.min(dx ? (cx-margem)/Math.abs(dx) : Infinity,dy ? (cy-margem)/Math.abs(dy) : Infinity);
    this.indicador.style.left=(cx+dx*fator)+'px';this.indicador.style.top=(cy+dy*fator)+'px';
    this.indicador.style.setProperty('--laser-cor',this.obterCor());
    this.indicador.querySelector('svg').style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
    const direcao=Math.abs(dx)>Math.abs(dy) ? (dx>0?'direita':'esquerda') : (dy>0?'abaixo':'acima');
    this.indicador.setAttribute('aria-label','Laser fora da visão: '+direcao);
  }
  agendar() { if(this.frame===null)this.frame=requestAnimationFrame(()=>this.desenhar()); }
  desenhar() {
    this.frame=null;const ctx=this.ctx,dpr=devicePixelRatio||1,agora=performance.now(),duracao=280;
    this.pontos=this.pontos.filter(p=>agora-p.t<duracao);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
    const camera=this.obterCamera(),cor=this.obterCor();
    const tela=p=>({x:camera.x+p.x*camera.zoom,y:camera.y+p.y*camera.zoom});
    this.atualizarIndicador(this.cabeca ? tela(this.cabeca) : null);
    ctx.save();ctx.strokeStyle=cor;ctx.fillStyle=cor;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=cor;ctx.shadowBlur=9;
    for(let i=1;i<this.pontos.length;i++) {
      const a=tela(this.pontos[i-1]),b=tela(this.pontos[i]);ctx.globalAlpha=Math.max(0,1-(agora-this.pontos[i-1].t)/duracao)*.55;
      ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    if(this.cabeca) {
      const p=tela(this.cabeca);ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,1.3,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();if(this.cabeca||this.pontos.length)this.agendar();
  }
}
