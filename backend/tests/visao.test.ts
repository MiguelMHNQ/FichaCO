import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {visibilityPolygon,wallSegments,insidePolygon,emptyVision,validDoor,wallPoint,projectWall,footprintLit,calculateVision,visibleFootprint,visibleRegions,fogPolygons,remapDoors,doorMiddle,tokenMovement,type Wall} from '../domain/visao.js';
import {validateVision,validateLight} from '../domain/validar-visao.js';
import {MemoryRooms} from '../adapters/memory-rooms.js';
import {RoomService} from '../domain/rooms.js';
import {TabletopService} from '../domain/tabletop.js';
const wall:Wall={id:'parede',forma:'retangulo',a:{x:-100,y:-100},b:{x:100,y:100}};
test('tocha só ativa pela visão direta de rosto; parede, Fog e outras tochas não ativam',()=>{
  const light=(x:number,tipo:'rosto'|'tocha',raio:number)=>({x,y:0,w:20,h:20,luz:{ativa:true,raio,suave:true,tipo}}),lights=[light(0,'rosto',3),light(90,'tocha',4),light(300,'tocha',4)];
  const clear=calculateVision(emptyVision(),1.5,lights);assert.equal(clear.sources.length,2);assert.equal(footprintLit({x:200,y:0,w:10,h:10},clear.polygons),true);
  const v={...emptyVision(),paredes:[{id:'bloqueio',forma:'linha' as const,a:{x:50,y:-100},b:{x:50,y:100}}]};assert.equal(calculateVision(v,1.5,lights).sources.length,1);
  v.portas=[{id:'porta',paredeId:'bloqueio',inicio:.4,fim:.6,aberta:true}];assert.equal(calculateVision(v,1.5,lights).sources.length,2);
  v.fogs=[{...wall,id:'fog',a:{x:-500,y:-500},b:{x:500,y:500}}];assert.equal(calculateVision(v,1.5,lights).sources.length,1);
});
test('tocha ativa pela interseção das luzes sem alcançar seu centro',()=>{
  const lights=[{x:0,y:0,w:10,h:10,luz:{ativa:true,raio:3,suave:true,tipo:'rosto' as const}},{x:150,y:0,w:10,h:10,luz:{ativa:true,raio:3,suave:true,tipo:'tocha' as const}}];
  assert.equal(calculateVision(emptyVision(),1.5,lights).sources.length,2);
  lights[1]!.x=210;assert.equal(calculateVision(emptyVision(),1.5,lights).sources.length,1);
});
test('tocha amplia a visão apenas onde existe linha de visão desde o rosto, sem enxergar atrás da parede',()=>{
  const v={...emptyVision(),paredes:[{id:'w',forma:'linha' as const,a:{x:100,y:-100},b:{x:100,y:100}}]},lights=[{x:0,y:0,w:20,h:20,luz:{ativa:true,raio:4.5,suave:false,tipo:'rosto' as const}},{x:140,y:100,w:20,h:20,luz:{ativa:true,raio:4.5,suave:false,tipo:'tocha' as const}}];
  const result=calculateVision(v,1.5,lights);assert.equal(result.sources.length,2,'Luzes se encontram ao redor do final da parede');
  assert.equal(visibleRegions({x:180,y:190,w:10,h:10},result.regions,[]),true,'A luz da tocha estende a visão além do raio original');
  assert.equal(visibleRegions({x:150,y:0,w:10,h:10},result.regions,[]),false,'Mesmo iluminado pela tocha, o alvo atrás da parede não é visível');
  v.portas=[{id:'d',paredeId:'w',inicio:.45,fim:.55,aberta:true}];assert.equal(visibleRegions({x:150,y:0,w:10,h:10},calculateVision(v,1.5,lights).regions,[]),true,'Abrir a porta cria linha de visão para o alvo');
  v.portas[0]!.aberta=false;assert.equal(visibleRegions({x:150,y:0,w:10,h:10},calculateVision(v,1.5,lights).regions,[]),false);
});
test('colisão varre token inteiro, para saltos rápidos e respeita passagem e tamanho da porta',()=>{
  const v={...emptyVision(),paredes:[{id:'w',forma:'linha' as const,a:{x:100,y:-100},b:{x:100,y:100}}]},token={x:0,y:0,w:40,h:40,rot:0};
  const hit=tokenMovement(token,{x:300,y:0},v);assert.equal(hit.blocked,true);assert.ok(hit.x<80&&hit.x>79.9);
  assert.equal(tokenMovement(token,{x:300,y:150},v).blocked,true,'Trajeto diagonal também colide');
  v.portas=[{id:'d',paredeId:'w',inicio:.35,fim:.65,aberta:true}];assert.equal(tokenMovement(token,{x:300,y:0},v).blocked,false);assert.equal(tokenMovement({...token,h:70},{x:300,y:0},v).blocked,true);
  v.portas[0]!.aberta=false;assert.equal(tokenMovement(token,{x:300,y:0},v).blocked,true);
  assert.equal(tokenMovement({x:80,y:0,w:40,h:40},{x:0,y:0},v).blocked,false,'Permite se afastar quando encostado');
});
test('Fog oculta seu interior em mapa claro ou iluminado, preservando partes descobertas',()=>{
  const target={x:0,y:0,w:40,h:40},fog=(id:string,a:number,b:number)=>({...wall,id,a:{x:a,y:-30},b:{x:b,y:30}});
  assert.equal(visibleFootprint(target,null,fogPolygons({...emptyVision(),fogs:[fog('total',-30,30)]})),false);
  assert.equal(visibleFootprint(target,null,fogPolygons({...emptyVision(),fogs:[fog('parcial',-30,0)]})),true);
  assert.equal(visibleFootprint(target,null,fogPolygons({...emptyVision(),fogs:[fog('esquerda',-30,5),fog('direita',-5,30)]})),false);
  assert.equal(visibleFootprint(target,null,fogPolygons({...emptyVision(),fogs:[fog('esquerda',-30,-1),fog('direita',1,30)]})),true);
});
test('linha contínua valida vértices e mantém portas na mesma aresta ao esticar',()=>{
  const line:Wall={id:'linha',forma:'linha',a:{x:0,y:0},b:{x:100,y:100},pontos:[{x:0,y:0},{x:100,y:0},{x:100,y:100}],espessura:5};
  assert.equal(wallSegments({...emptyVision(),paredes:[line]}).length,2);assert.equal(validDoor(line,{id:'d',paredeId:'linha',inicio:.4,fim:.6,aberta:false}),false);
  const d={id:'d',paredeId:wall.id,inicio:.3125,fim:.4375,aberta:false},next={...wall,a:{x:0,y:0},b:{x:400,y:200}},moved=remapDoors(wall,next,[d])[0]!;assert.equal(validDoor(next,moved),true);const center=doorMiddle(next,moved);assert.ok(Math.abs(center.x-400)<1e-6&&Math.abs(center.y-100)<1e-6);
  assert.throws(()=>validateVision({...emptyVision(),fogs:[{...line,pontos:line.pontos!.slice(0,2)}]}),{code:'INVALID_VISION'});
});
test('parede fecha a visão; porta aberta permite luz sem abrir o resto da parede',()=>{
  const v={escuro:true,paredes:[wall],portas:[{id:'porta',paredeId:wall.id,inicio:.3125,fim:.4375,aberta:false}]};
  assert.equal(insidePolygon({x:0,y:0},visibilityPolygon({x:0,y:0},500,wallSegments(v))),true);
  assert.equal(insidePolygon({x:200,y:0},visibilityPolygon({x:0,y:0},500,wallSegments(v))),false);
  v.portas[0]!.aberta=true;const poly=visibilityPolygon({x:0,y:0},500,wallSegments(v));
  assert.equal(insidePolygon({x:200,y:0},poly),true);assert.equal(insidePolygon({x:200,y:200},poly),false);
  assert.equal(footprintLit({x:205,y:0,w:40,h:40},[poly]),true);
});
test('porta usa a borda, não atravessa cantos e portas circulares seguem o arco',()=>{
  const d={id:'d',paredeId:wall.id,inicio:.2,fim:.3,aberta:false};assert.equal(validDoor(wall,d),false);
  const hit=projectWall(wall,{x:101,y:0});assert.ok(Math.abs(hit.distance-1)<1e-8);assert.deepEqual(wallPoint(wall,hit.t),{x:100,y:0});
  const circle:Wall={...wall,forma:'circulo'};assert.equal(validDoor(circle,{...d,inicio:.95,fim:.05}),true);
  const poly=visibilityPolygon({x:0,y:0},500,wallSegments({escuro:true,paredes:[circle],portas:[]}));assert.equal(insidePolygon({x:50,y:0},poly),true);assert.equal(insidePolygon({x:150,y:0},poly),false);
  assert.equal(footprintLit({x:100,y:0,w:60,h:60,rot:35},[[{x:0,y:-1},{x:200,y:-1},{x:200,y:1},{x:0,y:1}]]),true,'Feixe fino atravessando as bordas do token');
});
test('visão limita geometria, números, luzes e portas sobrepostas',()=>{
  assert.deepEqual(validateVision(undefined),emptyVision());assert.throws(()=>validateLight({ativa:true,raio:Infinity,suave:true}),{code:'INVALID_VISION'});
  assert.throws(()=>validateVision({escuro:true,paredes:[wall],portas:[{id:'d',paredeId:'inexistente',inicio:.1,fim:.2,aberta:false}]}),{code:'INVALID_VISION'});
  assert.throws(()=>validateVision({escuro:true,paredes:Array.from({length:12},(_,i)=>({...wall,id:'w'+i,forma:'circulo'})),portas:[]}),{code:'INVALID_VISION'});
  assert.throws(()=>validateVision({escuro:true,paredes:[wall],portas:['a','b'].map(id=>({id,paredeId:wall.id,inicio:.3,fim:.4,aberta:false}))}),{code:'INVALID_VISION'});
});
test('API bloqueia travessia mesmo por salto, aceita porta aberta e trajeto contornando parede',async()=>{
  const repository=new MemoryRooms(),rooms=new RoomService(repository),table=new TabletopService(repository),owner={id:randomUUID(),displayName:'Mestre'},player={id:randomUUID(),displayName:'Jogador'},room=await rooms.create(owner,{visibility:'public',maxPlayers:4});await rooms.join(player,room.code,{});
  const apply=(actor:typeof owner,ops:unknown[])=>table.apply(actor,room.code,{mutationId:randomUUID(),operations:ops});
  await apply(owner,[{type:'put',kind:'imagens',id:'token',value:{src:'/assets/images/mapa.png',camadaId:'base',x:0,y:0,w:40,h:40,token:true}},{type:'wall.put',id:'w',value:{id:'w',forma:'linha',a:{x:100,y:-100},b:{x:100,y:100}}}]);
  const move=(x:number,y:number,trajeto?:{x:number;y:number}[])=>({type:'put',kind:'imagens',id:'token',value:{x,y,...(trajeto?{trajeto}:{})}});
  for(const actor of [owner,player])await assert.rejects(apply(actor,[move(300,0)]),{code:'WALL_COLLISION'});
  await assert.rejects(apply(player,[move(300,0,[{x:0,y:0},{x:300,y:0}])]),{code:'WALL_COLLISION'});
  await apply(player,[move(300,0,[{x:0,y:0},{x:0,y:150},{x:300,y:150},{x:300,y:0}])]);
  const around=await table.get(player,room.code);assert.ok('scene'in around);assert.equal(around.scene.imagens[0]!.x,300);assert.equal('trajeto'in around.scene.imagens[0]!,false,'Trajeto não vira propriedade persistida do token');
  await apply(owner,[{type:'door.put',id:'d',value:{id:'d',paredeId:'w',inicio:.35,fim:.65,aberta:true}}]);await apply(player,[move(0,0)]);
  await apply(owner,[{type:'door.put',id:'d',value:{id:'d',paredeId:'w',inicio:.35,fim:.65,aberta:false}}]);await assert.rejects(apply(player,[move(300,0)]),{code:'WALL_COLLISION'});
});
test('mestre controla luz, escuridão e portas; servidor oculta tokens no escuro e mantém vínculos próprios',async()=>{
  const repository=new MemoryRooms(),rooms=new RoomService(repository),table=new TabletopService(repository),owner={id:randomUUID(),displayName:'Mestre'},player={id:randomUUID(),displayName:'Jogador'},room=await rooms.create(owner,{visibility:'public',maxPlayers:4});await rooms.join(player,room.code,{});
  const apply=(actor:typeof owner,ops:unknown[])=>table.apply(actor,room.code,{mutationId:randomUUID(),operations:ops},async id=>({id,name:'Herói'}));
  await apply(owner,[...['fonte','inimigo'].map((id,i)=>({type:'put',kind:'imagens',id,value:{src:'/assets/images/mapa.png',camadaId:'base',x:i*200,y:0,w:40,h:40,token:true,...(!i?{luz:{ativa:true,raio:12,suave:true}}:{})}})),{type:'wall.put',id:wall.id,value:wall},{type:'door.put',id:'d',value:{id:'d',paredeId:wall.id,inicio:.3125,fim:.4375,aberta:false}},{type:'vision.settings',value:{escuro:true}}]);
  const dark=await table.get(player,room.code);assert.ok('scene'in dark);assert.equal(dark.scene.imagens.length,1);
  for(const op of [{type:'vision.settings',value:{escuro:false}},{type:'wall.remove',id:wall.id},{type:'fog.put',id:'fog',value:{...wall,id:'fog'}},{type:'fog.remove',id:'fog'},{type:'door.put',id:'d',value:{id:'d',paredeId:wall.id,inicio:.3125,fim:.4375,aberta:true}},{type:'put',kind:'imagens',id:'fonte',value:{luz:{ativa:true,raio:120,suave:false}}}])await assert.rejects(apply(player,[op]),e=>['FORBIDDEN','UNKNOWN_FIELD'].includes((e as {code:string}).code));
  await apply(player,[{type:'token.bind',id:'fonte',value:{characterId:'heroi'}}]);
  await assert.rejects(apply(player,[{type:'action.roll',value:{tokenId:'fonte',title:'Teste',targets:['inimigo'],range:12,maxTargets:1,dice:[6],bonus:0}}]),{code:'INVALID_TARGETS'});
  await apply(owner,[{type:'door.put',id:'d',value:{id:'d',paredeId:wall.id,inicio:.3125,fim:.4375,aberta:true}}]);const lit=await table.get(player,room.code);assert.ok('scene'in lit);assert.equal(lit.scene.imagens.length,2);
  await apply(owner,[{type:'wall.put',id:wall.id,value:{...wall,b:{x:150,y:100}}}]);const stretched=await table.get(owner,room.code);assert.ok('scene'in stretched);const sw=stretched.scene.visao!.paredes[0]!,sd=stretched.scene.visao!.portas[0]!;assert.equal(validDoor(sw,sd),true);assert.notEqual(sd.inicio,.3125);
  await apply(owner,[{type:'wall.remove',id:wall.id}]);const clear=await table.get(owner,room.code);assert.ok('scene'in clear);assert.equal(clear.scene.visao!.portas.length,0);assert.equal(clear.scene.visao!.paredes.length,0);
  await apply(owner,[{type:'put',kind:'imagens',id:'fonte',value:{luz:{ativa:false,raio:12,suave:false}}}]);const unlit=await table.get(player,room.code);assert.ok('scene'in unlit);assert.deepEqual(unlit.scene.imagens.map(i=>i.id),['fonte']);assert.equal(unlit.bindings[0]?.characterId,'heroi');
  await apply(owner,[{type:'vision.settings',value:{escuro:false}},{type:'fog.put',id:'fog',value:{...wall,id:'fog',a:{x:150,y:-50},b:{x:250,y:50}}}]);const masked=await table.get(player,room.code);assert.ok('scene'in masked);assert.deepEqual(masked.scene.imagens.map(i=>i.id),['fonte']);
  await assert.rejects(apply(player,[{type:'action.roll',value:{tokenId:'fonte',title:'Teste',targets:['inimigo'],range:12,maxTargets:1,dice:[6],bonus:0}}]),{code:'INVALID_TARGETS'});
  await apply(owner,[{type:'fog.remove',id:'fog'}]);const revealed=await table.get(player,room.code);assert.ok('scene'in revealed);assert.equal(revealed.scene.imagens.length,2);
});
