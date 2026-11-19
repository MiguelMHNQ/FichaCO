// Geometria pura compartilhada entre servidor e mesa. Coordenadas em pixels do mundo.
import {corners,type Footprint} from './alcance.js';
export interface Point {x:number;y:number}
export interface Wall {id:string;forma:'linha'|'retangulo'|'circulo';a:Point;b:Point;pontos?:Point[];espessura?:number}
export interface Door {id:string;paredeId:string;inicio:number;fim:number;aberta:boolean}
export interface Vision {escuro:boolean;paredes:Wall[];portas:Door[];fogs?:Wall[]}
export interface Light {ativa:boolean;raio:number;suave:boolean;tipo?:'rosto'|'tocha'}
export interface Segment {a:Point;b:Point}
export interface VisionRegion {polygon:Point[];clips?:Point[][]}
export const emptyVision=():Vision=>({escuro:false,paredes:[],portas:[],fogs:[]});
const EPS=1e-7;
const lerp=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export function wallPoints(w:Wall):Point[]{
  if(w.forma==='linha')return w.pontos||[w.a,w.b];
  if(w.forma==='retangulo')return [w.a,{x:w.b.x,y:w.a.y},w.b,{x:w.a.x,y:w.b.y},w.a];
  const x=(w.a.x+w.b.x)/2,y=(w.a.y+w.b.y)/2,rx=Math.abs(w.b.x-w.a.x)/2,ry=Math.abs(w.b.y-w.a.y)/2;
  return Array.from({length:49},(_,i)=>({x:x+Math.cos(i*Math.PI/24)*rx,y:y+Math.sin(i*Math.PI/24)*ry}));
}
export function wallLength(w:Wall){const p=wallPoints(w);return p.slice(1).reduce((n,b,i)=>n+Math.hypot(b.x-p[i]!.x,b.y-p[i]!.y),0);}
export function wallPoint(w:Wall,t:number):Point {const p=wallPoints(w),total=wallLength(w);let at=Math.max(0,Math.min(1,t))*total;for(let i=1;i<p.length;i++){const a=p[i-1]!,b=p[i]!,d=Math.hypot(b.x-a.x,b.y-a.y);if(at<=d||i===p.length-1)return lerp(a,b,d?at/d:0);at-=d;}return w.a;}
export function projectWall(w:Wall,p:Point){const points=wallPoints(w),length=wallLength(w);let best={distance:Infinity,t:0,point:w.a},at=0;
  for(let i=1;i<points.length;i++){const a=points[i-1]!,b=points[i]!,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),u=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(d*d||1))),q=lerp(a,b,u),distance=Math.hypot(q.x-p.x,q.y-p.y);if(distance<best.distance)best={distance,t:length?(at+u*d)/length:0,point:q};at+=d;}return best;
}
export function doorIntervals(d:Door):[number,number][]{return d.inicio<d.fim?[[d.inicio,d.fim]]:[[d.inicio,1],[0,d.fim]];}
export function doorMiddle(w:Wall,d:Door){return wallPoint(w,((d.inicio+d.fim+(d.inicio>d.fim?1:0))/2)%1);}
export function validDoor(w:Wall,d:Door){const span=d.fim>d.inicio?d.fim-d.inicio:1-d.inicio+d.fim,len=span*wallLength(w);if(len<3||len>2000||span>(w.forma==='linha'?1:.5)+EPS)return false;if(w.forma==='linha'&&d.inicio>d.fim)return false;if(w.forma==='linha'&&!w.pontos)return true;if(w.forma==='circulo')return true;
  // Uma porta reta não pode atravessar o canto de uma parede retangular.
  const a=wallPoint(w,d.inicio),b=wallPoint(w,d.fim),mid=wallPoint(w,(d.inicio+span/2)%1);return Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-len)<.01&&Math.abs((mid.x-a.x)*(b.y-a.y)-(mid.y-a.y)*(b.x-a.x))<.01;
}
// Preserva a posição da porta na mesma aresta ao mover ou esticar sua parede.
export function remapDoors(from:Wall,to:Wall,doors:Door[]):Door[]{const old=wallPoints(from),next=wallPoints(to),before=wallLength(from),after=wallLength(to);if(old.length!==next.length)return doors;
  const remap=(t:number)=>{let at=t*before,prefix=0;for(let i=1;i<old.length;i++){const d=Math.hypot(old[i]!.x-old[i-1]!.x,old[i]!.y-old[i-1]!.y),n=Math.hypot(next[i]!.x-next[i-1]!.x,next[i]!.y-next[i-1]!.y);if(at<=d+EPS||i===old.length-1)return (prefix+(d?at/d:0)*n)/after;at-=d;prefix+=n;}return t;};
  return doors.map(d=>d.paredeId===from.id?{...d,inicio:Math.max(0,Math.min(1,remap(d.inicio))),fim:Math.max(0,Math.min(1,remap(d.fim)))}:d);
}
export function fogPolygons(v:Vision){return (v.fogs||[]).map(w=>wallPoints(w));}
export function calculateVision(v:Vision,scale:number,lights:(Footprint&{luz:Light})[]){const segments=wallSegments(v),faces=lights.filter(o=>o.luz.ativa&&o.luz.tipo!=='tocha'),facePolygons=faces.map(o=>visibilityPolygon(o,o.luz.raio*50/scale,segments)),fogs=fogPolygons(v);
  const torches=facePolygons.length?lights.filter(o=>o.luz.ativa&&o.luz.tipo==='tocha').map(source=>{const polygon=visibilityPolygon(source,source.luz.raio*50/scale,segments),viewers=faces.filter((_,i)=>regionsOverlap(facePolygons[i]!,polygon,fogs));return {source,polygon,viewers};}).filter(o=>o.viewers.length):[];
  const sources=[...faces,...torches.map(o=>o.source)],polygons=[...facePolygons,...torches.map(o=>o.polygon)];
  // Iluminação não muda o ponto de vista. A tocha só revela o que o rosto vê sem paredes no caminho.
  const regions:VisionRegion[]=[...facePolygons.map(polygon=>({polygon})),...torches.map(o=>({polygon:o.polygon,...(segments.length?{clips:o.viewers.map(face=>visibilityPolygon(face,Math.hypot(face.x-o.source.x,face.y-o.source.y)+o.source.luz.raio*50/scale+1,segments))}:{})}))];
  return {sources,polygons,facePolygons,regions};
}
// Interseção com área positiva: tocar uma mesma parede não acende o outro lado.
export function regionsOverlap(a:Point[],b:Point[],fogs:Point[][]=[]){
  const box=(ps:Point[])=>({l:Math.min(...ps.map(p=>p.x)),r:Math.max(...ps.map(p=>p.x)),t:Math.min(...ps.map(p=>p.y)),b:Math.max(...ps.map(p=>p.y))}),aa=box(a),bb=box(b);if(Math.min(aa.r,bb.r)-Math.max(aa.l,bb.l)<=.00001||Math.min(aa.b,bb.b)-Math.max(aa.t,bb.t)<=.00001)return false;
  const overlap=[{x:Math.max(aa.l,bb.l),y:Math.max(aa.t,bb.t)},{x:Math.min(aa.r,bb.r),y:Math.max(aa.t,bb.t)},{x:Math.min(aa.r,bb.r),y:Math.min(aa.b,bb.b)},{x:Math.max(aa.l,bb.l),y:Math.min(aa.b,bb.b)}];
  const convex=(p:Point[])=>{let sign=0;for(let i=0;i<p.length;i++){const a=p[i]!,b=p[(i+1)%p.length]!,c=p[(i+2)%p.length]!,cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(Math.abs(cross)<EPS)continue;if(sign&&sign*cross<0)return false;sign=Math.sign(cross);}if(!sign)return false;for(let i=0;i<p.length;i++){const a=p[i]!,b=p[(i+1)%p.length]!;if(p.some(q=>((b.x-a.x)*(q.y-a.y)-(b.y-a.y)*(q.x-a.x))*sign < -EPS))return false;}return true;};
  if(fogs.some(poly=>convex(poly)&&overlap.every(p=>insidePolygon(p,poly))))return false;
  const distance=(p:Point,x:Point,y:Point)=>{const dx=y.x-x.x,dy=y.y-x.y,t=Math.max(0,Math.min(1,((p.x-x.x)*dx+(p.y-x.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-x.x-t*dx,p.y-x.y-t*dy);};
  const strict=(p:Point,poly:Point[])=>insidePolygon(p,poly)&&!poly.some((x,i)=>distance(p,x,poly[(i+1)%poly.length]!)<.000001);
  const visible=(p:Point)=>strict(p,a)&&strict(p,b)&&!fogs.some(poly=>insidePolygon(p,poly));
  const probe=(p:Point)=>{if(visible(p))return true;for(let i=0;i<16;i++){const angle=i*Math.PI/8;if(visible({x:p.x+Math.cos(angle)*.0001,y:p.y+Math.sin(angle)*.0001}))return true;}return false;};
  for(const p of [...a,...b])if(p.x>=Math.max(aa.l,bb.l)&&p.x<=Math.min(aa.r,bb.r)&&p.y>=Math.max(aa.t,bb.t)&&p.y<=Math.min(aa.b,bb.b)&&probe(p))return true;
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){const x=a[i]!,y=a[(i+1)%a.length]!,u=b[j]!,v=b[(j+1)%b.length]!;if(!crosses(x,y,u,v))continue;const dx=y.x-x.x,dy=y.y-x.y,sx=v.x-u.x,sy=v.y-u.y,det=dx*sy-dy*sx;if(Math.abs(det)<EPS)continue;const t=((u.x-x.x)*sy-(u.y-x.y)*sx)/det;if(probe({x:x.x+t*dx,y:x.y+t*dy}))return true;}return false;
}
// SAT contínuo entre um token retangular e segmentos: impede saltar paredes em um só evento.
export function tokenMovement(from:Footprint,to:Point,v:Vision):Point&{blocked:boolean}{
  const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy);if(distance<EPS)return {...to,blocked:false};const angle=(from.rot||0)*Math.PI/180,ux={x:Math.cos(angle),y:Math.sin(angle)},uy={x:-ux.y,y:ux.x};let first=1;
  for(const s of wallSegments(v)){const length=Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y);if(length<EPS)continue;const normal={x:-(s.b.y-s.a.y)/length,y:(s.b.x-s.a.x)/length},axes=[ux,uy,normal];let enter=-Infinity,exit=Infinity,possible=true;
    for(const axis of axes){const center=from.x*axis.x+from.y*axis.y,radius=Math.max(0,Math.abs(ux.x*axis.x+ux.y*axis.y)*from.w/2+Math.abs(uy.x*axis.x+uy.y*axis.y)*from.h/2-.000001),a=s.a.x*axis.x+s.a.y*axis.y,b=s.b.x*axis.x+s.b.y*axis.y,lo=Math.min(a,b)-radius,hi=Math.max(a,b)+radius,velocity=dx*axis.x+dy*axis.y;
      if(Math.abs(velocity)<EPS){if(center<lo||center>hi){possible=false;break;}}else{const x=(lo-center)/velocity,y=(hi-center)/velocity;enter=Math.max(enter,Math.min(x,y));exit=Math.min(exit,Math.max(x,y));}
    }
    if(!possible||enter>exit||exit<0||enter>1)continue;
    if(enter<0){const old=(from.x-s.a.x)*normal.x+(from.y-s.a.y)*normal.y,next=(to.x-s.a.x)*normal.x+(to.y-s.a.y)*normal.y;if(old*next>=0&&Math.abs(next)>Math.abs(old)+EPS)continue;}
    first=Math.min(first,Math.max(0,enter));
  }
  if(first>=1)return {...to,blocked:false};const fraction=Math.max(0,first-.001/distance);return {x:from.x+dx*fraction,y:from.y+dy*fraction,blocked:true};
}
export function wallSegments(v:Vision):Segment[]{const out:Segment[]=[];
  for(const w of v.paredes){const p=wallPoints(w),total=wallLength(w),gaps=v.portas.filter(d=>d.paredeId===w.id&&d.aberta).flatMap(doorIntervals);let at=0;
    for(let i=1;i<p.length;i++){const a=p[i-1]!,b=p[i]!,len=Math.hypot(b.x-a.x,b.y-a.y),start=at/total,end=(at+len)/total;let intervals:[number,number][]=[[start,end]];
      for(const [lo,hi]of gaps)intervals=intervals.flatMap(([x,y])=>hi<=x||lo>=y?[[x,y]]:([...(lo>x?[[x,Math.min(lo,y)]]:[]),...(hi<y?[[Math.max(hi,x),y]]:[])] as [number,number][]));
      for(const [x,y]of intervals)if(y-x>EPS)out.push({a:lerp(a,b,(x-start)/(end-start)),b:lerp(a,b,(y-start)/(end-start))});at+=len;
    }
  }return out;
}
function ray(o:Point,angle:number,radius:number,segments:Segment[]){const dx=Math.cos(angle),dy=Math.sin(angle);let dist=radius;
  for(const s of segments){const sx=s.b.x-s.a.x,sy=s.b.y-s.a.y,det=dx*sy-dy*sx;if(Math.abs(det)<EPS)continue;const ax=s.a.x-o.x,ay=s.a.y-o.y,t=(ax*sy-ay*sx)/det,u=(ax*dy-ay*dx)/det;if(t>=-EPS&&u>=-EPS&&u<=1+EPS)dist=Math.min(dist,Math.max(0,t));}return {x:o.x+dx*dist,y:o.y+dy*dist};
}
export function visibilityPolygon(o:Point,radius:number,all:Segment[]):Point[]{
  const segments=all.filter(s=>{const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,t=Math.max(0,Math.min(1,((o.x-s.a.x)*dx+(o.y-s.a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(s.a.x+t*dx-o.x,s.a.y+t*dy-o.y)<=radius;});
  const angles=Array.from({length:192},(_,i)=>i*Math.PI/96-Math.PI);
  for(const s of segments)for(const p of [s.a,s.b]){const a=Math.atan2(p.y-o.y,p.x-o.x);angles.push(a-.00001,a,a+.00001);}
  return angles.sort((a,b)=>a-b).map(a=>ray(o,a,radius,segments));
}
export function insidePolygon(p:Point,poly:Point[]){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i]!,b=poly[j]!;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function crosses(a:Point,b:Point,c:Point,d:Point){const cross=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,c)*cross(a,b,d)<=EPS&&cross(c,d,a)*cross(c,d,b)<=EPS&&Math.max(a.x,b.x)+EPS>=Math.min(c.x,d.x)&&Math.max(c.x,d.x)+EPS>=Math.min(a.x,b.x)&&Math.max(a.y,b.y)+EPS>=Math.min(c.y,d.y)&&Math.max(c.y,d.y)+EPS>=Math.min(a.y,b.y);}
export function footprintLit(target:Footprint,polygons:Point[][]){const cs=corners(target);for(const poly of polygons){if(insidePolygon(target,poly)||cs.some(p=>insidePolygon(p,poly)))return true;for(let i=0;i<poly.length;i++){const p=poly[i]!,next=poly[(i+1)%poly.length]!,angle=-(target.rot||0)*Math.PI/180,dx=p.x-target.x,dy=p.y-target.y;if(Math.abs(dx*Math.cos(angle)-dy*Math.sin(angle))<=target.w/2&&Math.abs(dx*Math.sin(angle)+dy*Math.cos(angle))<=target.h/2)return true;for(let j=0;j<4;j++)if(crosses(p,next,cs[j]!,cs[(j+1)%4]!))return true;}}return false;}
export function visibleFootprint(target:Footprint,polygons:Point[][]|null,fogs:Point[][],clips?:Point[][]){
  if(polygons&&!footprintLit(target,polygons)||clips&&!footprintLit(target,clips))return false;if(!fogs.length&&!clips)return true;
  const cs=corners(target),angle=-(target.rot||0)*Math.PI/180,inside=(p:Point)=>{const dx=p.x-target.x,dy=p.y-target.y;return Math.abs(dx*Math.cos(angle)-dy*Math.sin(angle))<=target.w/2+EPS&&Math.abs(dx*Math.sin(angle)+dy*Math.cos(angle))<=target.h/2+EPS;};
  const visible=(p:Point)=>inside(p)&&(!polygons||polygons.some(poly=>insidePolygon(p,poly)))&&(!clips||clips.some(poly=>insidePolygon(p,poly)))&&!fogs.some(poly=>insidePolygon(p,poly));
  const candidates:Point[]=[target,...cs],edges:Segment[]=cs.map((a,i)=>({a,b:cs[(i+1)%4]!})),left=Math.min(...cs.map(p=>p.x)),right=Math.max(...cs.map(p=>p.x)),top=Math.min(...cs.map(p=>p.y)),bottom=Math.max(...cs.map(p=>p.y));
  for(const poly of [...(polygons||[]),...(clips||[]),...fogs])for(let i=0;i<poly.length;i++){const a=poly[i]!,b=poly[(i+1)%poly.length]!;if(Math.max(a.x,b.x)<left||Math.min(a.x,b.x)>right||Math.max(a.y,b.y)<top||Math.min(a.y,b.y)>bottom)continue;edges.push({a,b});if(inside(a))candidates.push(a);}
  for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const a=edges[i]!,b=edges[j]!;if(!crosses(a.a,a.b,b.a,b.b))continue;const dx=a.b.x-a.a.x,dy=a.b.y-a.a.y,sx=b.b.x-b.a.x,sy=b.b.y-b.a.y,det=dx*sy-dy*sx;if(Math.abs(det)<EPS)continue;const t=((b.a.x-a.a.x)*sy-(b.a.y-a.a.y)*sx)/det;candidates.push({x:a.a.x+t*dx,y:a.a.y+t*dy});}
  for(const p of candidates){if(visible(p))return true;for(let i=0;i<16;i++){const a=i*Math.PI/8;if(visible({x:p.x+Math.cos(a)*.001,y:p.y+Math.sin(a)*.001}))return true;}}return false;
}
export function visibleRegions(target:Footprint,regions:VisionRegion[]|null,fogs:Point[][]){return regions?regions.some(r=>visibleFootprint(target,[r.polygon],fogs,r.clips)):visibleFootprint(target,null,fogs);}
