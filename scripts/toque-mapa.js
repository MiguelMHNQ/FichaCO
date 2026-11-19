// Dois dedos navegam pela câmera; um dedo continua usando a ferramenta escolhida.
class NavegacaoToqueMapa {
  constructor(canvas,{camera,aplicar,iniciar,cancelar,fim}){
    const points=new Map();let navigating=false,base=null;
    const anchor=()=>{const [a,b]=[...points.values()];if(!b)return;const x=(a.x+b.x)/2,y=(a.y+b.y)/2,c=camera();base={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:c.zoom,world:{x:(x-c.x)/c.zoom,y:(y-c.y)/c.zoom}};};
    const block=e=>{e.preventDefault();e.stopImmediatePropagation();};
    canvas.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='touch')return;
      if(!points.size)iniciar();
      points.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
      if(points.size>=2){if(!navigating){cancelar();navigating=true;}anchor();block(e);}
    });
    canvas.addEventListener('pointermove',e=>{
      if(!points.has(e.pointerId))return;
      points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!navigating)return;
      block(e);const [a,b]=[...points.values()];if(!b||!base)return;
      const zoom=Math.max(.1,Math.min(4,base.zoom*Math.hypot(a.x-b.x,a.y-b.y)/base.distance));
      aplicar({zoom,x:(a.x+b.x)/2-base.world.x*zoom,y:(a.y+b.y)/2-base.world.y*zoom});
    });
    const end=e=>{
      if(!points.has(e.pointerId))return;
      points.delete(e.pointerId);if(navigating)block(e);
      if(!points.size){navigating=false;base=null;fim();}else if(points.size>=2)anchor();
    };
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
    this.reset=()=>{points.clear();navigating=false;base=null;fim();};
    window.addEventListener('blur',this.reset);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
  }
}
