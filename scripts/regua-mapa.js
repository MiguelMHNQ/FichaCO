// Medição em coordenadas do mapa, sem gravar linhas no documento.
class ReguaMapa {
  constructor(obterCamera,obterEscala,aoAtualizar) {
    this.obterCamera=obterCamera;this.obterEscala=obterEscala;this.aoAtualizar=aoAtualizar;this.pontos=[];this.percurso=false;
    this.canvas=document.createElement('canvas');this.canvas.className='regua-sobreposicao';this.canvas.setAttribute('aria-hidden','true');document.body.appendChild(this.canvas);this.ctx=this.canvas.getContext('2d');
  }
  iniciar(p,percurso=false){this.pontos=[{...p}];this.percurso=percurso;this.desenhar();this.aoMedir?.();}
  mover(p){if(!this.pontos.length)return;if(this.percurso){const ultimo=this.pontos.at(-1);if(ultimo.x!==p.x||ultimo.y!==p.y)this.pontos.push({...p});}else this.pontos[1]={...p};this.desenhar();this.aoMedir?.();}
  limpar(){this.pontos=[];this.desenhar();this.aoMedir?.();}
  distancia(){if(Number.isFinite(this.distanciaRemota))return this.distanciaRemota;let total=0;for(let i=1;i<this.pontos.length;i++)total+=Math.hypot(this.pontos[i].x-this.pontos[i-1].x,this.pontos[i].y-this.pontos[i-1].y);return total/50*this.obterEscala();}
  desenhar(){
    const dpr=devicePixelRatio||1,ctx=this.ctx;
    if(this.canvas.width!==innerWidth*dpr||this.canvas.height!==innerHeight*dpr){this.canvas.width=innerWidth*dpr;this.canvas.height=innerHeight*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
    const texto=this.distancia().toLocaleString('pt-BR',{maximumFractionDigits:2})+' m';this.aoAtualizar(texto);
    if(!this.pontos.length)return;
    const cam=this.obterCamera(),tela=p=>({x:cam.x+p.x*cam.zoom,y:cam.y+p.y*cam.zoom}),inicio=tela(this.pontos[0]),fim=tela(this.pontos.at(-1));
    ctx.save();ctx.strokeStyle=this.cor||'#f0cb70';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();this.pontos.forEach((p,i)=>{const s=tela(p);i?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y);});ctx.stroke();ctx.setLineDash([]);
    for(const p of [inicio,fim]){ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#191620';ctx.fill();ctx.stroke();}
    ctx.font='13px system-ui,sans-serif';const largura=ctx.measureText(texto).width+20;
    const x=Math.max(8,Math.min(innerWidth-largura-8,fim.x+12)),y=Math.max(8,Math.min(innerHeight-36,fim.y-38));
    ctx.fillStyle='#15121ef2';ctx.fillRect(x,y,largura,28);ctx.strokeStyle='#c9a84c88';ctx.strokeRect(x,y,largura,28);ctx.fillStyle='#ffe4a3';ctx.fillText(texto,x+10,y+19);ctx.restore();
  }
}
