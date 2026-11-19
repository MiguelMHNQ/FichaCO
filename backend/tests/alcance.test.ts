import test from 'node:test';
import assert from 'node:assert/strict';
import {borderDistance,areaHits,areaOrigin,type ActionArea,type Footprint} from '../domain/alcance.js';
test('alcance usa bordas de atacante e alvo, incluindo tokens grandes',()=>{
  const a={x:0,y:0,w:50,h:50};assert.equal(borderDistance(a,{...a,x:100}),50);
  assert.equal(borderDistance(a,{...a,x:150,w:200}),25);
  assert.equal(borderDistance({...a,w:200},{...a,x:150}),25);
  assert.equal(borderDistance({...a,w:400,h:400},{...a,x:100}),0);
  assert.equal(borderDistance(a,{...a,x:50}),0);
  assert.ok(Math.abs(borderDistance(a,{...a,x:200,y:200})-Math.hypot(150,150))<1e-8);
});
test('rotação preserva distâncias sem usar uma caixa envolvente maior',()=>{
  const a={x:0,y:0,w:50,h:50},b={x:200,y:0,w:100,h:100,rot:45};
  assert.ok(Math.abs(borderDistance(a,b)-(200-25-50*Math.SQRT2))<1e-8);
  const rotate=(p:Footprint):Footprint=>({...p,x:p.x*Math.cos(.7)-p.y*Math.sin(.7),y:p.x*Math.sin(.7)+p.y*Math.cos(.7),rot:(p.rot||0)+.7*180/Math.PI});
  assert.ok(Math.abs(borderDistance(a,b)-borderDistance(rotate(a),rotate(b)))<1e-8);
  assert.equal(borderDistance(b,a),borderDistance(a,b));
});
test('círculo usa interseção com as bordas e retângulo respeita rotação',()=>{
  const caster={x:0,y:0,w:50,h:50},area:ActionArea={shape:'circle',anchor:'point',x:200,y:0,rotation:0,radius:1.5,length:0,width:0,angle:0};
  assert.equal(areaHits(area,caster,{x:290,y:0,w:100,h:50},1.5),true);assert.equal(areaHits(area,caster,{x:301,y:0,w:100,h:50},1.5),false);
  const rect={...area,shape:'rectangle' as const,length:6,width:1.5,rotation:Math.PI/2};assert.equal(areaHits(rect,caster,{x:200,y:90,w:20,h:20},1.5),true);assert.equal(areaHits(rect,caster,{x:290,y:0,w:20,h:20},1.5),false);
});
test('linha parte da borda e cone não atinge tokens atrás ou fora da abertura',()=>{
  const caster={x:0,y:0,w:100,h:100},line:ActionArea={shape:'line',anchor:'caster',x:0,y:0,rotation:0,length:6,width:1.5,radius:0,angle:0};assert.deepEqual(areaOrigin(line,caster),{x:50,y:0});
  assert.equal(areaHits(line,caster,{x:180,y:0,w:50,h:50},1.5),true);assert.equal(areaHits(line,caster,{x:180,y:80,w:50,h:50},1.5),false);
  const cone={...line,shape:'cone' as const,angle:60};assert.equal(areaHits(cone,caster,{x:190,y:30,w:30,h:30},1.5),true);assert.equal(areaHits(cone,caster,{x:-100,y:0,w:40,h:40},1.5),false);assert.equal(areaHits(cone,caster,{x:100,y:120,w:40,h:40},1.5),false);
  assert.equal(areaHits(cone,caster,{x:260,y:0,w:40,h:40},1.5),true,'Borda do token encosta no arco do cone');
});
test('vários centros formam a união dos círculos sem preencher o espaço entre eles',()=>{
  const caster={x:0,y:0,w:50,h:50},area:ActionArea={shape:'circle',anchor:'point',x:100,y:0,rotation:0,radius:.5,length:0,width:0,angle:0,points:[{x:100,y:0},{x:200,y:0}]};
  assert.equal(areaHits(area,caster,{x:200,y:0,w:20,h:20},1.5),true);assert.equal(areaHits(area,caster,{x:150,y:0,w:20,h:20},1.5),false);
});
