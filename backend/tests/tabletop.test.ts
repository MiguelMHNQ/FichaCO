import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { RoomService } from '../domain/rooms.js';
import { TabletopService } from '../domain/tabletop.js';
import { MemoryRooms } from '../adapters/memory-rooms.js';
const setup=async()=>{const repository=new MemoryRooms(),rooms=new RoomService(repository),tabletop=new TabletopService(repository),owner={id:randomUUID(),displayName:'Dono'},player={id:randomUUID(),displayName:'Jogador'},other={id:randomUUID(),displayName:'Outro'};const room=await rooms.create(owner,{visibility:'public',maxPlayers:8});await rooms.join(player,room.code,{});await rooms.join(other,room.code,{});return {rooms,tabletop,owner,player,other,code:room.code};};
test('recorte visual de GIF é compartilhado, preserva fonte e rejeita máscara inválida ou alteração por jogador',async()=>{
  const s=await setup(),src=s.code+'/'+randomUUID()+'.gif',recorte={x:.1,y:.2,w:.7,h:.6,forma:'circulo'},apply=(actor:typeof s.owner,value:unknown)=>s.tabletop.apply(actor,s.code,{mutationId:randomUUID(),operations:[{type:'put',kind:'imagens',id:'gif',value}]});
  await apply(s.owner,{camadaId:'base',src,x:0,y:0,w:80,h:80,token:true,recorte});const state=await s.tabletop.get(s.player,s.code);assert.ok('scene'in state);assert.deepEqual(state.scene.imagens[0]?.recorte,recorte);assert.equal(state.scene.imagens[0]?.src,src);
  for(const bad of [{...recorte,x:.9},{...recorte,w:0},{...recorte,forma:'script'},{...recorte,html:'<script>'}])await assert.rejects(apply(s.owner,{recorte:bad}));
  await assert.rejects(apply(s.player,{recorte}),{code:'UNKNOWN_FIELD'});
  const resized=await apply(s.player,{w:100});assert.deepEqual(resized.scene.imagens[0]?.recorte,recorte);
});
test('mapa aceita animações e rejeita excesso de GIFs ou vídeos sem salvar parcialmente',async()=>{
 const s=await setup();const put=(id:string,ext:string)=>({type:'put',kind:'imagens',id,value:{camadaId:'base',src:s.code+'/'+randomUUID()+'.'+ext,x:0,y:0,w:100,h:100}});
 await s.tabletop.apply(s.owner,s.code,{mutationId:randomUUID(),operations:[...Array.from({length:4},(_,i)=>put('gif'+i,'gif')),put('video1','webm'),put('video2','mp4')]});
 for(const ext of ['gif','webm'])await assert.rejects(s.tabletop.apply(s.owner,s.code,{mutationId:randomUUID(),operations:[put('excesso',ext)]}),{code:'ANIMATION_LIMIT'});
 const state=await s.tabletop.get(s.player,s.code);assert.ok('scene'in state);assert.equal(state.scene.imagens.length,6);
});
test('desenhos concorrentes não se sobrescrevem; autoria e permissões vêm do servidor',async()=>{
  const s=await setup();
  const write=(actor:typeof s.owner,id:string)=>s.tabletop.apply(actor,s.code,{mutationId:randomUUID(),operations:[{type:'put',kind:'tracos',id,value:{camadaId:'base',tipo:'pen',pontos:[{x:1,y:2}],cor:'#ffffff',tamanho:4}}]});
  await Promise.all([write(s.player,'a'),write(s.other,'b')]);const state=await s.tabletop.get(s.owner,s.code);assert.ok('scene'in state);assert.equal(state.scene.tracos.length,2);assert.equal(state.scene.tracos.find(t=>t.id==='a')?.authorId,s.player.id);
  await assert.rejects(s.tabletop.apply(s.other,s.code,{mutationId:randomUUID(),operations:[{type:'remove',kind:'tracos',id:'a'}]}),{code:'FORBIDDEN'});
  await assert.rejects(s.tabletop.apply(s.player,s.code,{mutationId:randomUUID(),operations:[{type:'put',kind:'imagens',id:'img',value:{}}]}),{code:'FORBIDDEN'});
});
test('camadas e imagens ocultas não saem para jogadores; administrador recebe mapa completo',async()=>{
  const s=await setup();await s.tabletop.apply(s.owner,s.code,{mutationId:randomUUID(),operations:[{type:'put',kind:'camadas',id:'secreta',value:{nome:'Segredo',visivel:false}},{type:'put',kind:'imagens',id:'oculta',value:{camadaId:'secreta',src:'/assets/images/mapa.png',x:0,y:0,w:100,h:100}}]});
  const owner=await s.tabletop.get(s.owner,s.code),player=await s.tabletop.get(s.player,s.code);assert.ok('scene'in owner&&'scene'in player);assert.equal(owner.scene.imagens.length,1);assert.equal(player.scene.imagens.length,0);assert.ok(!JSON.stringify(player).includes('Segredo'));
  await assert.rejects(s.tabletop.apply(s.player,s.code,{mutationId:randomUUID(),operations:[{type:'put',kind:'tracos',id:'bad',value:{camadaId:'secreta',tipo:'pen',pontos:[{x:0,y:0}],cor:'#ffffff',tamanho:2}}]}),{code:'FORBIDDEN'});
});
test('mutações são idempotentes, patches preservam propriedades e sala encerrada recusa operações',async()=>{
  const s=await setup(),packet={mutationId:randomUUID(),operations:[{type:'put',kind:'imagens',id:'a',value:{camadaId:'base',src:'/assets/images/mapa.png',x:0,y:0,w:100,h:100}}]};
  await s.tabletop.apply(s.owner,s.code,packet);const repeated=await s.tabletop.apply(s.owner,s.code,packet);assert.equal(repeated.revision,1);
  await s.tabletop.apply(s.owner,s.code,{mutationId:randomUUID(),operations:[{type:'put',kind:'imagens',id:'a',value:{x:50}}]});const state=await s.tabletop.get(s.owner,s.code);assert.ok('scene'in state);assert.equal(state.scene.imagens[0]?.x,50);assert.equal(state.scene.imagens[0]?.w,100);
  await s.rooms.leave(s.owner,s.code);await assert.rejects(s.tabletop.get(s.player,s.code),{code:'ROOM_NOT_FOUND'});
});
test('mídia exige dono, não aceita URL arbitrária e usa relógio do servidor',async()=>{
  const s=await setup();await assert.rejects(s.tabletop.apply(s.player,s.code,{mutationId:randomUUID(),operations:[{type:'playback',kind:'video',value:null}]}),{code:'OWNER_ONLY'});
  const source={id:'video',kind:'video',type:'youtube',path:'dQw4w9WgXcQ',title:'Vídeo'};
  await s.tabletop.apply(s.owner,s.code,{mutationId:randomUUID(),operations:[{type:'media.add',value:source},{type:'playback',kind:'video',value:{sourceId:'video',position:12,playing:true,loop:false,endWhenFinished:true}}]});
  const state=await s.tabletop.get(s.player,s.code);assert.ok('scene'in state);assert.equal(state.video?.position,12);assert.ok(state.video?.at);assert.equal(state.library.length,0);
  await assert.rejects(s.tabletop.apply(s.owner,s.code,{mutationId:randomUUID(),operations:[{type:'media.add',value:{...source,id:'bad',type:'storage',path:'https://example.org/x'}}]}),{code:'INVALID_ASSET'});
});

test('chave dos eventos gira após mudança de papel e expulsão revoga acesso',async()=>{
  const s=await setup(),first=await s.tabletop.get(s.player,s.code);assert.ok('liveKey' in first);
  await s.rooms.updateMember(s.owner,s.code,s.player.id,{role:'moderator'});
  const promoted=await s.tabletop.get(s.player,s.code);assert.ok('liveKey' in promoted);assert.notEqual(promoted.liveKey,first.liveKey);
  await s.rooms.removeMember(s.owner,s.code,s.player.id,false);
  await assert.rejects(s.tabletop.get(s.player,s.code),{code:'NOT_A_MEMBER'});
  const remaining=await s.tabletop.get(s.owner,s.code);assert.ok('liveKey' in remaining);assert.notEqual(remaining.liveKey,promoted.liveKey);
});

test('jogador transforma token visível, sem criar tokens nem mudar cenário, camada, arte ou cadeado',async()=>{
 const s=await setup(),put=(actor:typeof s.owner,id:string,value:Record<string,unknown>)=>s.tabletop.apply(actor,s.code,{mutationId:randomUUID(),operations:[{type:'put',kind:'imagens',id,value}]});
 await put(s.owner,'token',{camadaId:'base',src:'/assets/images/mapa.png',x:0,y:0,w:100,h:100,token:true});
 await put(s.player,'token',{x:75,w:120,rot:45});
 const state=await s.tabletop.get(s.owner,s.code);assert.ok('scene'in state);assert.equal(state.scene.imagens[0]?.x,75);
 for(const patch of [{token:false},{src:'/assets/images/outra.png'},{travada:false},{camadaId:'base'}])await assert.rejects(put(s.player,'token',patch));
 await assert.rejects(put(s.player,'novo',{camadaId:'base',src:'/assets/images/mapa.png',x:0,y:0,w:100,h:100,token:true}),{code:'FORBIDDEN'});
 await put(s.owner,'token',{travada:true});await assert.rejects(put(s.player,'token',{x:99}),{code:'FORBIDDEN'});
});
test('moderador controla áudio, mas não vídeo; jogador continua sem controle compartilhado',async()=>{
 const s=await setup();await s.rooms.updateMember(s.owner,s.code,s.player.id,{role:'moderator'});
 const audio={id:'audio',kind:'audio',type:'youtube',path:'dQw4w9WgXcQ',title:'Música'};
 await s.tabletop.apply(s.player,s.code,{mutationId:randomUUID(),operations:[{type:'media.add',value:audio},{type:'playback',kind:'audio',value:{sourceId:'audio',position:4,playing:true,loop:true,endWhenFinished:true}}]});
 const state=await s.tabletop.get(s.player,s.code);assert.ok('scene'in state);assert.equal(state.library.length,1);assert.equal(state.audio?.position,4);
 await assert.rejects(s.tabletop.apply(s.player,s.code,{mutationId:randomUUID(),operations:[{type:'media.add',value:{...audio,id:'video',kind:'video'}}]}),{code:'OWNER_ONLY'});
 await assert.rejects(s.tabletop.apply(s.other,s.code,{mutationId:randomUUID(),operations:[{type:'playback',kind:'audio',value:null}]}),{code:'OWNER_ONLY'});
});
