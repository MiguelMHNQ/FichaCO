import {applyVisionOperation} from './operacoes-visao.js';
import {validateVision,validateLight} from './validar-visao.js';
import {emptyVision,calculateVision,fogPolygons,visibleRegions,tokenMovement,type Light,type Vision,type VisionRegion} from './visao.js';
import {rollTargets,type TargetResult} from './rolagem-alvos.js';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import type { Principal, Room, RoomRepository } from './models.js';
import { borderDistance, areaHits, type ActionArea, type Footprint } from './alcance.js';
import { open, member, manager, changed, view } from './rooms.js';
import { requireCondition } from './errors.js';
import { object, fields, roomCode, color } from './validation.js';
import { RateLimiter, type AttemptLimiter } from '../security/rate-limit.js';

type Entity = Record<string, unknown> & { id: string };
export interface Scene { visao?:Vision; nome: string; imagens: Entity[]; tracos: Entity[]; camadas: Entity[]; grade: { frente: boolean; transparencia: number; ima: boolean }; escalaMetros: number }
interface MediaSource { id: string; kind: 'audio' | 'video'; type: 'storage' | 'youtube'; path: string; title: string }
interface Playback { source: MediaSource; playing: boolean; position: number; at: number; loop: boolean; endWhenFinished: boolean }
export interface TokenBinding { tokenId: string; characterId: string; userId: string; name: string }
export interface TableRoll { targetResults?:TargetResult[]; caster?: Footprint; scale?: number; category?: 'attack'|'heal'|'support'; area?: ActionArea; style?: string; id: string; userId: string; tokenId: string; title: string; targets: string[]; dice: {d:number;v:number}[]; bonus: number; total: number; at: number }
export interface TabletopDocument { bindings?: TokenBinding[]; rolls?: TableRoll[]; revision: number; scene: Scene; library: MediaSource[]; audio: Playback | null; video: Playback | null; applied: { id: string; actor: string; hash: string }[] }
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export const emptyTabletop = (): TabletopDocument => ({ revision: 0, scene: { nome: 'Mapa da sessão', imagens: [], tracos: [], camadas: [{ id: 'base', nome: 'Camada 1', visivel: true }], grade: { frente: false, transparencia: 92, ima: false }, escalaMetros: 1.5 }, library: [], audio: null, video: null, applied: [] });
function number(value: unknown, min: number, max: number): number { requireCondition(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max, 400, 'INVALID_SCENE', 'Valor inválido no mapa.'); return value; }
function text(value: unknown, max = 100): string { requireCondition(typeof value === 'string' && value.length <= max && !/[<>\p{Cc}\p{Cf}]/u.test(value), 400, 'INVALID_SCENE', 'Texto inválido no mapa.'); return value.normalize('NFC'); }
function id(value: unknown): string { requireCondition(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value), 400, 'INVALID_SCENE', 'Identificador inválido no mapa.'); return value; }
function bool(value: unknown): boolean { requireCondition(typeof value === 'boolean', 400, 'INVALID_SCENE', 'Opção inválida no mapa.'); return value; }
export function asset(value: unknown, code: string): string {
  requireCondition(typeof value === 'string' && (new RegExp('^'+code+'/[a-f0-9-]{36}\\.[a-z0-9]{1,5}$').test(value) || /^\/assets\/(?:images|audio)\/[a-zA-Z0-9_/.% -]+$/.test(value)) && !value.includes('..'), 400, 'INVALID_ASSET', 'O arquivo precisa pertencer a esta sessão.'); return value;
}
function entity(value: unknown, kind: 'imagens' | 'tracos' | 'camadas', code: string): Entity {
  const d = object(value); const result: Entity = { id: id(d.id) };
  const common = ['id','nome','visivel','travada'];
  fields(d, kind === 'camadas' ? common : kind === 'imagens' ? [...common,'camadaId','src','srcSeg','x','y','w','h','rot','proporcional','token','recorte','luz'] : [...common,'camadaId','tipo','pontos','cor','tamanho','preencher','x','y','w','h','authorId']);
  for (const key of ['nome']) if (d[key] !== undefined) result[key] = text(d[key]);
  for (const key of ['visivel','travada','proporcional','preencher','token']) if (d[key] !== undefined) result[key] = bool(d[key]);
  if (kind !== 'camadas') result.camadaId = id(d.camadaId);
  if (kind === 'imagens') {
    if(d.luz!==undefined)result.luz=validateLight(d.luz);
    if(d.recorte!==undefined){const r=object(d.recorte);fields(r,['x','y','w','h','forma']);const x=number(r.x,0,1),y=number(r.y,0,1),w=number(r.w,.000001,1),h=number(r.h,.000001,1);requireCondition(x+w<=1+1e-8&&y+h<=1+1e-8&&(r.forma==='quadrado'||r.forma==='circulo'),400,'INVALID_SCENE','Recorte inválido.');result.recorte={x,y,w,h,forma:r.forma};}
    result.src = asset(d.src, code); if (d.srcSeg) result.srcSeg = asset(d.srcSeg, code);
    for (const key of ['x','y']) result[key] = number(d[key], -1_000_000, 1_000_000);
    for (const key of ['w','h']) result[key] = number(d[key], 1, 20000);
    result.rot = number(d.rot ?? 0, -360000, 360000);
  }
  if (kind === 'tracos') {
    requireCondition(['pen','rect','ellipse'].includes(String(d.tipo)), 400, 'INVALID_SCENE', 'Desenho inválido.'); result.tipo = d.tipo;
    result.cor = color(d.cor); result.tamanho = number(d.tamanho, 1, 100);
    if (d.authorId !== undefined) result.authorId = text(d.authorId, 80);
    requireCondition(Array.isArray(d.pontos) && d.pontos.length > 0 && d.pontos.length <= 10000, 400, 'INVALID_SCENE', 'Traço muito grande.'); result.pontos = d.pontos.map(p=>{const point=object(p);fields(point,['x','y']);return {x:number(point.x,-1_000_000,1_000_000),y:number(point.y,-1_000_000,1_000_000)};});
  }
  return result;
}
function grid(value: unknown): Scene['grade'] { const d=object(value);fields(d,['frente','transparencia','ima']);return {frente:bool(d.frente),transparencia:number(d.transparencia,0,100),ima:bool(d.ima)}; }
function scene(value: unknown, code: string): Scene {
  const d=object(value);fields(d,['nome','imagens','tracos','camadas','grade','escalaMetros','visao']);
  const out: Scene={nome:text(d.nome),imagens:[],tracos:[],camadas:[],grade:grid(d.grade),escalaMetros:number(d.escalaMetros,.1,1000)};
  for(const kind of ['imagens','tracos','camadas'] as const){requireCondition(Array.isArray(d[kind]) && d[kind].length<=(kind==='camadas'?100:2000),400,'INVALID_SCENE','O mapa ultrapassou o limite de elementos.');out[kind]=d[kind].map(v=>entity(v,kind,code));requireCondition(new Set(out[kind].map(e=>e.id)).size===out[kind].length,400,'INVALID_SCENE','Identificadores repetidos.');}
  requireCondition(out.imagens.filter(e=>/\.gif$/i.test(String(e.src))).length<=4&&out.imagens.filter(e=>/\.(mp4|webm)$/i.test(String(e.src))).length<=2,400,'ANIMATION_LIMIT','O mapa permite até 4 GIFs e 2 vídeos em loop.');
  if(d.visao!==undefined)out.visao=validateVision(d.visao);
  requireCondition(out.imagens.filter(e=>(e.luz as {ativa?:boolean}|undefined)?.ativa).length<=24,400,'INVALID_VISION','Use até 24 luzes ativas no mapa.');
  requireCondition(out.camadas.length>0,400,'INVALID_SCENE','Mantenha ao menos uma camada.');
  requireCondition([...out.imagens,...out.tracos].every(e=>out.camadas.some(c=>c.id===e.camadaId)),400,'INVALID_SCENE','Camada inexistente.');return out;
}
function source(value: unknown, code: string): MediaSource {
  const d=object(value);fields(d,['id','kind','type','path','title']);requireCondition(d.kind==='audio'||d.kind==='video',400,'INVALID_MEDIA','Tipo de mídia inválido.');requireCondition(d.type==='storage'||d.type==='youtube',400,'INVALID_MEDIA','Fonte de mídia inválida.');
  const path=d.type==='youtube'?(requireCondition(typeof d.path==='string'&&/^[\w-]{11}$/.test(d.path),400,'INVALID_MEDIA','Link do YouTube inválido.'),d.path):asset(d.path,code);
  requireCondition(d.type!=='storage'||!path.startsWith('/'),400,'INVALID_MEDIA','Envie o arquivo para a sessão.');return {id:id(d.id),kind:d.kind,type:d.type,path,title:text(d.title)};
}
function visible(scene: Scene, e: Entity): boolean { const layer=scene.camadas.find(c=>c.id===e.camadaId); return !!layer&&layer.visivel!==false&&e.visivel!==false; }
const visionCache=new Map<string,VisionRegion[]>();
function lightRegions(s:Scene){if(!s.visao?.escuro)return null;const lights=s.imagens.filter(e=>visible(s,e)&&(e.luz as {ativa?:boolean}|undefined)?.ativa),key=JSON.stringify([s.visao,s.escalaMetros,lights.map(e=>[e.x,e.y,e.luz])]);const cached=visionCache.get(key);if(cached)return cached;const {regions}=calculateVision(s.visao,s.escalaMetros,lights as unknown as (Footprint&{luz:Light})[]);visionCache.set(key,regions);if(visionCache.size>4)visionCache.delete(visionCache.keys().next().value!);return regions;}
function lit(s:Scene,e:Entity){const polygons=lightRegions(s);return visibleRegions(e as unknown as Footprint,polygons,fogPolygons(s.visao??emptyVision()));}
function result(room: Room, actor: Principal, now: number) {
  const current=member(room,actor),board=copy(room.tabletop??emptyTabletop());
  if(current.role==='player'){const polygons=lightRegions(board.scene),own=new Set((board.bindings||[]).filter(b=>b.userId===actor.id).map(b=>b.tokenId));board.scene.imagens=board.scene.imagens.filter(e=>visible(board.scene,e)&&(e.token!==true||own.has(e.id)||visibleRegions(e as unknown as Footprint,polygons,fogPolygons(board.scene.visao??emptyVision()))));board.scene.tracos=board.scene.tracos.filter(e=>visible(board.scene,e));board.scene.camadas=board.scene.camadas.filter(c=>c.visivel!==false);}
  return {room:view(room),revision:board.revision,scene:board.scene,library:current.role!=='player'?board.library:[],audio:board.audio,video:board.video,serverTime:now,liveKey:room.liveKey,bindings:(board.bindings||[]).filter(b=>board.scene.imagens.some(e=>e.id===b.tokenId)),rolls:(board.rolls||[]).filter(r=>board.scene.imagens.some(e=>e.id===r.tokenId)&&r.targets.every(id=>board.scene.imagens.some(e=>e.id===id)))};
}
export class TabletopService {
  private readonly limiter: AttemptLimiter;
  constructor(private readonly repository: RoomRepository, private readonly now=Date.now, limiter?: AttemptLimiter){this.limiter=limiter??new RateLimiter(now);}
  async get(actor: Principal, code: string, since?: number){roomCode(code);await this.limiter.check(`tabletop-read:${actor.id}`,120);return this.repository.transaction(async tx=>{const room=await tx.get(code);open(room);member(room,actor);if(!room.liveKey){room.liveKey=randomBytes(32).toString('base64url');changed(room,this.now());await tx.put(room);}if(since===room.version)return {unchanged:true,serverTime:this.now()};return result(room,actor,this.now());},code);}
  async apply(actor: Principal, code: string, input: unknown, character?: (id:string)=>Promise<{id:string;name:string}>){
    roomCode(code);await this.limiter.check(`tabletop:${actor.id}`,180);
    const d=object(input);fields(d,['mutationId','operations','baseRevision']);const mutationId=id(d.mutationId);
    requireCondition(Array.isArray(d.operations)&&d.operations.length>0&&d.operations.length<=300,400,'INVALID_COMMAND','Alterações inválidas.');
    const hash=createHash('sha256').update(JSON.stringify(d.operations)).digest('hex');
    return this.repository.transaction(async tx=>{
      const room=await tx.get(code);open(room);const caller=member(room,actor);const board=copy(room.tabletop??emptyTabletop());
      const prior=board.applied.find(m=>m.id===mutationId&&m.actor===actor.id);
      if(prior){requireCondition(prior.hash===hash,409,'MUTATION_REUSED','Essa alteração já foi utilizada.');return result(room,actor,this.now());}
      for(const raw of d.operations as unknown[]){
        const op=object(raw);fields(op,['type','kind','id','value']);
        if(['vision.settings','wall.put','wall.remove','door.put','door.remove','fog.put','fog.remove'].includes(String(op.type))){
          manager(room,actor);board.scene.visao=applyVisionOperation(board.scene.visao,String(op.type),op.id,op.value);continue;
        }
        if(op.type==='token.bind'){
          const tokenId=id(op.id),token=board.scene.imagens.find(e=>e.id===tokenId),layer=board.scene.camadas.find(c=>c.id===token?.camadaId);
          requireCondition(token?.token===true&&visible(board.scene,token)&&(caller.role!=='player'||lit(board.scene,token)||board.bindings?.some(b=>b.tokenId===tokenId&&b.userId===actor.id)),404,'TOKEN_NOT_FOUND','Escolha um token visível.');
          requireCondition(caller.role!=='player'||(token.travada!==true&&layer?.travada!==true),403,'FORBIDDEN','Esse token está bloqueado.');
          const bindings=board.bindings||[],existing=bindings.find(b=>b.tokenId===tokenId);
          requireCondition(!existing||existing.userId===actor.id||(op.value===null&&caller.role!=='player'),403,'TOKEN_BOUND','Esse token já representa uma ficha de outro participante.');
          if(op.value===null){board.bindings=bindings.filter(b=>b.tokenId!==tokenId);continue;}
          const value=object(op.value);fields(value,['characterId']);const characterId=id(value.characterId);
          requireCondition(character,503,'CHARACTERS_NOT_CONFIGURED','Armazenamento de fichas indisponível.');const owned=await character(characterId);
          requireCondition(owned.id===characterId,403,'FORBIDDEN','Escolha uma ficha da sua conta.');
          requireCondition(!bindings.some(b=>b.characterId===characterId&&b.tokenId!==tokenId),409,'CHARACTER_BOUND','Esta ficha já está vinculada a outro token nesta sessão.');
          board.bindings=[...bindings.filter(b=>b.tokenId!==tokenId),{tokenId,characterId,userId:actor.id,name:text(owned.name)}];continue;
        }
        if(op.type==='action.roll'){
          const value=object(op.value);fields(value,['tokenId','title','targets','range','maxTargets','dice','bonus','style','category','includeSelf','area','distribution']);
          const tokenId=id(value.tokenId),binding=board.bindings?.find(b=>b.tokenId===tokenId),origin=board.scene.imagens.find(e=>e.id===tokenId);
          requireCondition(binding?.userId===actor.id&&origin&&visible(board.scene,origin),403,'TOKEN_UNBOUND','Vincule sua ficha a um token visível.');
          const range=number(value.range,0,1000),max=number(value.maxTargets,1,100);requireCondition(Number.isInteger(max),400,'INVALID_COMMAND','Quantidade inválida.');
          const category=value.category??'attack';requireCondition(category==='attack'||category==='heal'||category==='support',400,'INVALID_COMMAND','Tipo de ação inválido.');const includeSelf=value.includeSelf===undefined?false:bool(value.includeSelf);
          let area:ActionArea|undefined;
          if(value.area!==undefined){const a=object(value.area);fields(a,['shape','anchor','x','y','rotation','radius','length','width','angle','points']);requireCondition(['circle','rectangle','line','cone'].includes(String(a.shape))&&(a.anchor==='caster'||a.anchor==='point'),400,'INVALID_AREA','Área inválida.');
            area={shape:a.shape as ActionArea['shape'],anchor:a.anchor as ActionArea['anchor'],x:number(a.x,-1e6,1e6),y:number(a.y,-1e6,1e6),rotation:number(a.rotation,-1e6,1e6),radius:number(a.radius,0,1000),length:number(a.length,0,1000),width:number(a.width,0,1000),angle:number(a.angle,0,180)};
            requireCondition(area.shape==='circle'?area.radius>0:area.shape==='cone'?area.length>0&&area.angle>0:area.length>0&&area.width>0,400,'INVALID_AREA','Confirme as dimensões da área.');
            if(a.points!==undefined){requireCondition(area.shape==='circle'&&area.anchor==='point'&&Array.isArray(a.points)&&a.points.length>0&&a.points.length<=5,400,'INVALID_AREA','Pontos de área inválidos.');area.points=a.points.map(raw=>{const p=object(raw);fields(p,['x','y']);return {x:number(p.x,-1e6,1e6),y:number(p.y,-1e6,1e6)};});for(const p of area.points)requireCondition(borderDistance(origin as unknown as Footprint,{...p,w:.000001,h:.000001})/50*board.scene.escalaMetros<=range+1e-7,409,'OUT_OF_RANGE','Um centro da área está fora do alcance.');}
            if(area.anchor==='point')requireCondition(borderDistance(origin as unknown as Footprint,{x:area.x,y:area.y,w:.000001,h:.000001})/50*board.scene.escalaMetros<=range+1e-7,409,'OUT_OF_RANGE','O centro da área está fora do alcance.');
          }
          requireCondition(Array.isArray(value.targets)&&value.targets.length<=(max)&&!!(area||value.targets.length),400,'INVALID_TARGETS','Selecione a quantidade permitida de alvos.');
          const targets=value.targets.map(id);requireCondition(new Set(targets).size===targets.length,400,'INVALID_TARGETS','Alvo repetido.');
          const actionVision=caller.role==='player'?lightRegions(board.scene):null;
          for(const targetId of targets){const target=board.scene.imagens.find(e=>e.id===targetId);requireCondition(target&&target.token===true&&(target.id!==tokenId||includeSelf)&&visible(board.scene,target)&&(caller.role!=='player'||target.id===tokenId||visibleRegions(target as unknown as Footprint,actionVision,fogPolygons(board.scene.visao??emptyVision()))),400,'INVALID_TARGETS','Alvo indisponível.');const hit=area?areaHits(area,origin as unknown as Footprint,target as unknown as Footprint,board.scene.escalaMetros):borderDistance(origin as unknown as Footprint,target as unknown as Footprint)/50*board.scene.escalaMetros<=range+1e-7;requireCondition(hit,409,'OUT_OF_RANGE','Um alvo saiu da área ou do alcance. Selecione novamente.');}
          requireCondition(Array.isArray(value.dice)&&value.dice.length<=40&&value.dice.every(d=>[2,4,6,8,10,12,14,16,20,100].includes(Number(d))&&typeof d==='number'),400,'INVALID_DICE','Dados inválidos.');
          const bonus=number(value.bonus,-10000,10000),distributed=value.distribution===undefined?undefined:rollTargets(value.distribution,targets,value.dice as number[],bonus),dice=distributed?.dice??(value.dice as number[]).map(d=>({d,v:randomInt(1,d+1)}));
          const style=value.style??'ivory';requireCondition(typeof style==='string'&&['ivory','obsidian','ruby','sapphire','emerald','arcane','magma','nebula'].includes(style),400,'INVALID_DICE','Estilo de dados inválido.');
          const roll:TableRoll={...(distributed?{targetResults:distributed.results}:{}),caster:{x:Number(origin.x),y:Number(origin.y),w:Number(origin.w),h:Number(origin.h),rot:Number(origin.rot)},scale:board.scene.escalaMetros,category,...(area?{area}:{}),style,id:mutationId,userId:actor.id,tokenId,title:text(value.title,160),targets,dice,bonus,total:distributed?.total??dice.reduce((s,d)=>s+d.v,bonus),at:this.now()};
          board.rolls=[...(board.rolls||[]),roll].slice(-12);continue;
        }
        if(op.type==='replace') {manager(room,actor);requireCondition(d.baseRevision===board.revision,409,'SCENE_CONFLICT','O mapa mudou. Atualize antes de substituir.');board.scene=scene(op.value,code);continue;}
        if(op.type==='settings'){manager(room,actor);const value=object(op.value);fields(value,['nome','grade','escalaMetros']);if(value.nome!==undefined)board.scene.nome=text(value.nome);if(value.grade!==undefined)board.scene.grade=grid(value.grade);if(value.escalaMetros!==undefined)board.scene.escalaMetros=number(value.escalaMetros,.1,1000);continue;}
        if(op.type==='media.add'||op.type==='media.remove'||op.type==='playback'){
          const mediaKind=op.type==='media.add'?object(op.value).kind:op.type==='media.remove'?board.library.find(m=>m.id===op.id)?.kind:op.kind;
          requireCondition(caller.role==='owner'||(caller.role==='moderator'&&mediaKind==='audio'),403,'OWNER_ONLY','Esta mídia exige permissão de administrador.');
          if(op.type==='media.add'){const media=source(op.value,code);requireCondition(board.library.length<100,400,'LIBRARY_FULL','A biblioteca está cheia.');requireCondition(!board.library.some(m=>m.id===media.id),409,'MEDIA_EXISTS','Essa mídia já existe.');board.library.push(media);}
          if(op.type==='media.remove'){const mediaId=id(op.id);board.library=board.library.filter(m=>m.id!==mediaId);for(const kind of ['audio','video'] as const)if(board[kind]?.source.id===mediaId)board[kind]=null;}
          if(op.type==='playback'){
            requireCondition(op.kind==='audio'||op.kind==='video',400,'INVALID_MEDIA','Tipo de mídia inválido.');
            if(op.value===null){board[op.kind]=null;continue;}
            const value=object(op.value);fields(value,['sourceId','playing','position','loop','endWhenFinished']);const media=board.library.find(m=>m.id===value.sourceId&&m.kind===op.kind);requireCondition(media,404,'MEDIA_NOT_FOUND','Mídia não encontrada.');
            board[op.kind]={source:copy(media),playing:bool(value.playing),position:number(value.position,0,864000),loop:bool(value.loop),endWhenFinished:bool(value.endWhenFinished),at:this.now()};
          }continue;
        }
        requireCondition(op.kind==='imagens'||op.kind==='tracos'||op.kind==='camadas',400,'INVALID_COMMAND','Elemento inválido.');const kind=op.kind;const list=board.scene[kind];
        if(op.type==='order'){manager(room,actor);requireCondition(Array.isArray(op.value)&&op.value.every(v=>typeof v==='string')&&op.value.length<=2000,400,'INVALID_COMMAND','Ordem inválida.');const ids=op.value as string[];board.scene[kind]=[...ids.map(v=>list.find(e=>e.id===v)).filter((e):e is Entity=>!!e),...list.filter(e=>!ids.includes(e.id))];continue;}
        const entityId=id(op.id),existing=list.find(e=>e.id===entityId);
        if(caller.role==='player'){
          const token=kind==='imagens'&&existing?.token===true&&op.type==='put';
          requireCondition(token||(kind==='tracos'&&(!existing||existing.authorId===actor.id)),403,'FORBIDDEN','Você só pode alterar tokens disponíveis e seus próprios desenhos.');
          if(token)fields(object(op.value),['x','y','w','h','rot','proporcional','nome','trajeto']);
        }else manager(room,actor);
        if(caller.role==='player'&&existing){const layer=board.scene.camadas.find(c=>c.id===existing.camadaId);requireCondition(visible(board.scene,existing)&&(existing.token!==true||lit(board.scene,existing)||board.bindings?.some(b=>b.tokenId===existing.id&&b.userId===actor.id))&&layer?.travada!==true&&existing.travada!==true,403,'FORBIDDEN','Esse desenho está bloqueado.');}
        if(op.type==='remove'){if(existing)list.splice(list.indexOf(existing),1);continue;}
        if(op.type==='put'){
          const rawPatch=object(op.value),{trajeto,...patch}=rawPatch;requireCondition(trajeto===undefined||kind==='imagens'&&existing?.token===true,400,'INVALID_COMMAND','Trajeto inválido.');requireCondition(patch.id===undefined||patch.id===entityId,400,'INVALID_SCENE','Identificador incompatível.');const e=entity({...existing,...patch,id:entityId},kind,code);
          if(kind==='imagens'&&existing?.token===true&&e.token===true&&(e.x!==existing.x||e.y!==existing.y)){
            const points=trajeto===undefined?[{x:existing.x,y:existing.y},{x:e.x,y:e.y}]:(requireCondition(Array.isArray(trajeto)&&trajeto.length>=2&&trajeto.length<=2048,400,'INVALID_COMMAND','Trajeto inválido.'),trajeto);
            const route=points.map(raw=>{const p=object(raw);fields(p,['x','y']);return {x:number(p.x,-1e6,1e6),y:number(p.y,-1e6,1e6)};});
            requireCondition(Math.hypot(route[0]!.x-Number(existing.x),route[0]!.y-Number(existing.y))<.01&&Math.hypot(route.at(-1)!.x-Number(e.x),route.at(-1)!.y-Number(e.y))<.01,409,'SCENE_CONFLICT','O token mudou. Selecione novamente.');
            for(let i=1;i<route.length;i++)requireCondition(!tokenMovement({...existing,...route[i-1]} as unknown as Footprint,route[i]!,board.scene.visao??emptyVision()).blocked,409,'WALL_COLLISION','O token não pode atravessar uma parede ou porta fechada.');
          }
          if(kind==='tracos'){e.authorId=existing?.authorId??actor.id;if(caller.role==='player'){const layer=board.scene.camadas.find(c=>c.id===e.camadaId);requireCondition(layer&&layer.visivel!==false&&layer.travada!==true&&e.visivel!==false&&e.travada!==true,403,'FORBIDDEN','Essa camada não pode receber desenhos.');}}
          if(existing)list[list.indexOf(existing)]=e;else list.push(e);continue;
        }
        requireCondition(false,400,'INVALID_COMMAND','Alteração desconhecida.');
      }
      board.scene=scene(board.scene,code);
      board.bindings=(board.bindings||[]).filter(b=>board.scene.imagens.some(e=>e.id===b.tokenId&&e.token===true));
      requireCondition(Buffer.byteLength(JSON.stringify(board))<=3_000_000,413,'SCENE_TOO_LARGE','O mapa está muito grande. Divida os desenhos em mais mapas.');
      board.revision++;board.applied.push({id:mutationId,actor:actor.id,hash});board.applied=board.applied.slice(-128);room.tabletop=board;changed(room,this.now());await tx.put(room);return result(room,actor,this.now());
    },code);
  }
}
