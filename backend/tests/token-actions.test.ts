import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {MemoryRooms} from '../adapters/memory-rooms.js';
import {RoomService} from '../domain/rooms.js';
import {TabletopService} from '../domain/tabletop.js';
const setup=async()=>{
  const repository=new MemoryRooms(),rooms=new RoomService(repository),tabletop=new TabletopService(repository),owner={id:randomUUID(),displayName:'Mestre'},player={id:randomUUID(),displayName:'Jogador'};
  const room=await rooms.create(owner,{visibility:'public',maxPlayers:8});await rooms.join(player,room.code,{});
  const apply=(actor:typeof owner,operations:unknown[],mutationId=randomUUID())=>tabletop.apply(actor,room.code,{mutationId,operations},async id=>{if(id==='foreign')throw Object.assign(Error('Ficha de outro usuário'),{code:'FORBIDDEN'});return {id,name:'Ficha '+actor.displayName};});
  await apply(owner,['a','b','c'].map((id,i)=>({type:'put',kind:'imagens',id,value:{src:'/assets/images/mapa.png',camadaId:'base',x:i*100,y:0,w:50,h:50,token:true}})));
  const bind=(token:string,characterId:string|null)=>({type:'token.bind',id:token,value:characterId?{characterId}:null});
  const roll=(targets=['b'])=>({type:'action.roll',value:{tokenId:'a',title:'Teste',targets,range:3,maxTargets:2,dice:[6,20],bonus:2}});
  return {rooms,tabletop,owner,player,code:room.code,apply,bind,roll};
};
test('ataque distribuído persiste resultados por alvo e retentativa mantém os mesmos dados',async()=>{
  const s=await setup();await s.apply(s.player,[s.bind('a','f1')]);
  const op={type:'action.roll',value:{...s.roll(['b','c']).value,range:9,dice:[4,4,4],bonus:0,category:'attack',distribution:{mode:'projectiles',count:4,allocations:[{targetId:'b',units:3,factor:1},{targetId:'c',units:1,factor:.5}]}}},mutation=randomUUID();
  const state=await s.apply(s.player,[op],mutation),r=state.rolls.at(-1)!;
  assert.equal(r.dice.length,12);assert.equal(r.targetResults?.[0]?.diceIndices.length,9);assert.equal(r.targetResults?.[1]?.diceIndices.length,3);
  assert.deepEqual((await s.apply(s.player,[op],mutation)).rolls.at(-1),r);
  await assert.rejects(s.apply(s.player,[{...op,value:{...op.value,distribution:{mode:'projectiles',count:4,allocations:[{targetId:'b',units:4,factor:1},{targetId:'c',units:4,factor:1}]}}}]),{code:'INVALID_DISTRIBUTION'});
});
test('vínculos 1:1 são exclusivos, pertencem ao usuário e não alteram ficha ou imagem',async()=>{
  const s=await setup();await s.apply(s.player,[s.bind('a','ficha1')]);
  await assert.rejects(s.apply(s.player,[s.bind('b','ficha1')]),{code:'CHARACTER_BOUND'});
  await assert.rejects(s.apply(s.owner,[s.bind('a','ficha2')]),{code:'TOKEN_BOUND'});
  await assert.rejects(s.apply(s.owner,[s.bind('b','foreign')]),{code:'FORBIDDEN'});
  const state=await s.tabletop.get(s.player,s.code);assert.ok('scene'in state);assert.equal(state.bindings[0]?.userId,s.player.id);assert.ok(!('characterId'in state.scene.imagens[0]!));
  await s.apply(s.owner,[s.bind('a',null)]);await s.apply(s.owner,[s.bind('a','ficha2')]);
  await assert.rejects(s.apply(s.player,[s.bind('a',null)]),{code:'TOKEN_BOUND'});
});
test('vínculo concorrente não sobrescreve dono e não atravessa sessões',async()=>{
  const s=await setup(),results=await Promise.allSettled([s.apply(s.owner,[s.bind('a','f1')]),s.apply(s.player,[s.bind('a','f2')])]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const other=await s.rooms.create(s.player,{visibility:'public',maxPlayers:4}),state=await s.tabletop.get(s.player,other.code);assert.ok('bindings'in state);assert.deepEqual(state.bindings,[]);
});
test('tokens ocultos, bloqueados, removidos e cenário não oferecem vínculo indevido',async()=>{
  const s=await setup();await s.apply(s.owner,[{type:'put',kind:'imagens',id:'a',value:{travada:true}}]);await assert.rejects(s.apply(s.player,[s.bind('a','f1')]),{code:'FORBIDDEN'});
  await s.apply(s.owner,[s.bind('a','f1'),{type:'put',kind:'imagens',id:'a',value:{visivel:false}}]);const state=await s.tabletop.get(s.player,s.code);assert.ok('bindings'in state);assert.deepEqual(state.bindings,[]);
  await s.apply(s.owner,[{type:'remove',kind:'imagens',id:'a'}]);const after=await s.tabletop.get(s.owner,s.code);assert.ok('bindings'in after);assert.deepEqual(after.bindings,[]);
});
test('rolagens validam vínculo, alcance atual e alvos, sem aplicar recursos ou dano',async()=>{
  const s=await setup();await s.apply(s.player,[s.bind('a','f1')]);
  await assert.rejects(s.apply(s.owner,[s.roll()]),{code:'TOKEN_UNBOUND'});
  await assert.rejects(s.apply(s.player,[s.roll(['c'])]),{code:'OUT_OF_RANGE'});
  await assert.rejects(s.apply(s.player,[s.roll(['a'])]),{code:'INVALID_TARGETS'});
  await assert.rejects(s.apply(s.player,[s.roll(['b','b'])]),{code:'INVALID_TARGETS'});
  const invalid=s.roll();invalid.value.dice=[999];await assert.rejects(s.apply(s.player,[invalid]),{code:'INVALID_DICE'});
  await assert.rejects(s.apply(s.player,[{...s.roll(),value:{...s.roll().value,style:'estilo-inexistente'}}]),{code:'INVALID_DICE'});
  const styled=await s.apply(s.player,[{...s.roll(),value:{...s.roll().value,style:'magma'}}]);assert.equal(styled.rolls[0]?.style,'magma');
  const before=await s.tabletop.get(s.owner,s.code),result=await s.apply(s.player,[s.roll()]);assert.ok('scene'in before);assert.deepEqual(result.scene,before.scene);const r=result.rolls.at(-1)!;assert.equal(r.style,'ivory');assert.equal(r.total,r.dice.reduce((s,d)=>s+d.v,2));assert.ok(r.dice.every(d=>d.v>=1&&d.v<=d.d));
  await s.apply(s.owner,[{type:'put',kind:'imagens',id:'b',value:{x:151}}]);await assert.rejects(s.apply(s.player,[s.roll()]),{code:'OUT_OF_RANGE'});
});
test('retentativas não sorteiam novamente e rolagens ocultas não vazam',async()=>{
  const s=await setup();await s.apply(s.player,[s.bind('a','f1')]);const mutation=randomUUID(),first=await s.apply(s.player,[s.roll()],mutation),second=await s.apply(s.player,[s.roll()],mutation);assert.deepEqual(second.rolls,first.rolls);
  await s.apply(s.owner,[{type:'put',kind:'imagens',id:'b',value:{visivel:false}}]);const state=await s.tabletop.get(s.player,s.code);assert.ok('rolls'in state);assert.deepEqual(state.rolls,[]);
});
test('área valida ponto de conjuração e interseção, permite cura própria e área vazia',async()=>{
  const s=await setup();await s.apply(s.player,[s.bind('a','f1')]);
  const area={shape:'circle',anchor:'point',x:100,y:0,rotation:0,radius:4.5,length:0,width:0,angle:0};
  const action=(extra:Record<string,unknown>)=>({...s.roll(),value:{...s.roll().value,...extra}});
  const result=await s.apply(s.player,[action({targets:['c'],area})]);assert.equal(result.rolls[0]?.area?.radius,4.5);assert.deepEqual(result.rolls[0]?.targets,['c'],'A área pode alcançar além do alcance de conjuração');
  await assert.rejects(s.apply(s.player,[action({area:{...area,x:400}})]),{code:'OUT_OF_RANGE'});
  await assert.rejects(s.apply(s.player,[action({area:{...area,shape:'cone',length:6,angle:0}})]),{code:'INVALID_AREA'});
  await assert.rejects(s.apply(s.player,[action({targets:['c'],area:{...area,x:0,radius:1.5}})]),{code:'OUT_OF_RANGE'});
  const healing=await s.apply(s.player,[action({targets:['a'],range:0,category:'heal',includeSelf:true})]);assert.equal(healing.rolls.at(-1)?.category,'heal');
  const terrain=await s.apply(s.player,[action({targets:[],category:'support',area,dice:[]})]);assert.deepEqual(terrain.rolls.at(-1)?.targets,[]);
  await assert.rejects(s.apply(s.player,[action({targets:[],area:undefined})]),{code:'INVALID_TARGETS'});
});
