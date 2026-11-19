// Geometria compartilhada com o cliente: menor distância entre retângulos rotacionados.
export interface Footprint { x:number; y:number; w:number; h:number; rot?:number }
export interface ActionArea { shape:'circle'|'rectangle'|'line'|'cone'; anchor:'caster'|'point'; x:number; y:number; rotation:number; radius:number; length:number; width:number; angle:number; points?:Point[] }
interface Point { x:number; y:number }
export function corners(o:Footprint):Point[]{const a=(o.rot||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x=0,y=0])=>({x:o.x+x*o.w/2*c-y*o.h/2*s,y:o.y+x*o.w/2*s+y*o.h/2*c}));}
function pointSegment(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function borderDistance(a:Footprint,b:Footprint):number{
  const p=corners(a),q=corners(b);
  // Separating axis theorem cobre sobreposição, contenção e bordas em contato.
  let separated=false;
  for(const points of [p,q])for(let i=0;i<4;i++){const start=points[i]!,end=points[(i+1)%4]!,nx=-(end.y-start.y),ny=end.x-start.x,ap=p.map(v=>v.x*nx+v.y*ny),bp=q.map(v=>v.x*nx+v.y*ny);if(Math.max(...ap)<Math.min(...bp)-1e-8||Math.max(...bp)<Math.min(...ap)-1e-8)separated=true;}
  if(!separated)return 0;
  let distance=Infinity;for(let i=0;i<4;i++)for(const point of q)distance=Math.min(distance,pointSegment(point,p[i]!,p[(i+1)%4]!));for(let i=0;i<4;i++)for(const point of p)distance=Math.min(distance,pointSegment(point,q[i]!,q[(i+1)%4]!));return distance;
}
export function areaOrigin(area:ActionArea,caster:Footprint):Point{
  if(area.anchor==='point')return {x:area.x,y:area.y};
  if(area.shape==='circle'||area.shape==='rectangle')return {x:caster.x,y:caster.y};
  const local=area.rotation-(caster.rot||0)*Math.PI/180,c=Math.abs(Math.cos(local)),s=Math.abs(Math.sin(local)),edge=Math.min(c?caster.w/2/c:Infinity,s?caster.h/2/s:Infinity);
  return {x:caster.x+Math.cos(area.rotation)*edge,y:caster.y+Math.sin(area.rotation)*edge};
}
function pointInside(p:Point,box:Footprint){const a=-(box.rot||0)*Math.PI/180,dx=p.x-box.x,dy=p.y-box.y;return Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<=box.w/2+1e-7&&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<=box.h/2+1e-7;}
function intersects(a:Point,b:Point,c:Point,d:Point){const cross=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);return ab1*ab2<=1e-8&&cd1*cd2<=1e-8&&Math.max(a.x,b.x)+1e-7>=Math.min(c.x,d.x)&&Math.max(c.x,d.x)+1e-7>=Math.min(a.x,b.x)&&Math.max(a.y,b.y)+1e-7>=Math.min(c.y,d.y)&&Math.max(c.y,d.y)+1e-7>=Math.min(a.y,b.y);}
export function areaHits(area:ActionArea,caster:Footprint,target:Footprint,scale:number):boolean{
  if(area.points?.length){const {points,...single}=area;return points.some(p=>areaHits({...single,x:p.x,y:p.y},caster,target,scale));}
  const o=areaOrigin(area,caster),factor=50/scale,r=area.radius*factor,length=area.length*factor,width=area.width*factor;
  if(area.shape==='circle'){const a=-(target.rot||0)*Math.PI/180,dx=o.x-target.x,dy=o.y-target.y,x=dx*Math.cos(a)-dy*Math.sin(a),y=dx*Math.sin(a)+dy*Math.cos(a);return Math.hypot(Math.max(0,Math.abs(x)-target.w/2),Math.max(0,Math.abs(y)-target.h/2))<=r+1e-7;}
  if(area.shape!=='cone'){const shift=area.shape==='line'?length/2:0;return borderDistance({x:o.x+Math.cos(area.rotation)*shift,y:o.y+Math.sin(area.rotation)*shift,w:length,h:width,rot:area.rotation*180/Math.PI},target)<=1e-7;}
  const half=area.angle*Math.PI/360,relative=(p:Point)=>Math.atan2(Math.sin(Math.atan2(p.y-o.y,p.x-o.x)-area.rotation),Math.cos(Math.atan2(p.y-o.y,p.x-o.x)-area.rotation)),inside=(p:Point)=>Math.hypot(p.x-o.x,p.y-o.y)<=length+1e-7&&Math.abs(relative(p))<=half+1e-7;
  const points=corners(target);if(pointInside(o,target)||points.some(inside))return true;
  const rays=[-half,half].map(a=>({x:o.x+Math.cos(area.rotation+a)*length,y:o.y+Math.sin(area.rotation+a)*length}));
  for(let i=0;i<4;i++){const a=points[i]!,b=points[(i+1)%4]!;if(rays.some(end=>intersects(o,end,a,b)))return true;
    const dx=b.x-a.x,dy=b.y-a.y,px=a.x-o.x,py=a.y-o.y,A=dx*dx+dy*dy,B=2*(px*dx+py*dy),C=px*px+py*py-length*length,disc=B*B-4*A*C;
    if(disc>=0&&A>0)for(const t of [(-B-Math.sqrt(disc))/(2*A),(-B+Math.sqrt(disc))/(2*A)])if(t>=0&&t<=1&&Math.abs(relative({x:a.x+t*dx,y:a.y+t*dy}))<=half+1e-7)return true;
  }return false;
}
