import {emptyVision,remapDoors,type Vision} from './visao.js';
import {validateVision,validateWall,validateDoor} from './validar-visao.js';
import {object,fields} from './validation.js';
import {requireCondition} from './errors.js';
// Usado pela API e pelo editor local; não contém autorização ou acesso a dados.
export function applyVisionOperation(current:Vision|undefined,type:string,entityId:unknown,value:unknown):Vision {
  const v=JSON.parse(JSON.stringify(current??emptyVision())) as Vision;
  if(type==='vision.settings'){const d=object(value);fields(d,['escuro']);requireCondition(typeof d.escuro==='boolean',400,'INVALID_VISION','Opção de visão inválida.');v.escuro=d.escuro;return validateVision(v);}
  requireCondition(typeof entityId==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(entityId),400,'INVALID_VISION','Identificador de visão inválido.');
  if(type==='wall.put'){const wall=validateWall(value);requireCondition(wall.id===entityId,400,'INVALID_VISION','Identificador incompatível.');const old=v.paredes.find(w=>w.id===wall.id);if(old)v.portas=remapDoors(old,wall,v.portas);v.paredes=[...v.paredes.filter(w=>w.id!==wall.id),wall];}
  else if(type==='wall.remove'){v.paredes=v.paredes.filter(w=>w.id!==entityId);v.portas=v.portas.filter(d=>d.paredeId!==entityId);}
  else if(type==='door.put'){const door=validateDoor(value);requireCondition(door.id===entityId,400,'INVALID_VISION','Identificador incompatível.');v.portas=[...v.portas.filter(d=>d.id!==door.id),door];}
  else if(type==='door.remove')v.portas=v.portas.filter(d=>d.id!==entityId);
  else if(type==='fog.put'){const fog=validateWall(value);requireCondition(fog.id===entityId,400,'INVALID_VISION','Identificador incompatível.');v.fogs=[...(v.fogs||[]).filter(f=>f.id!==fog.id),fog];}
  else if(type==='fog.remove')v.fogs=(v.fogs||[]).filter(f=>f.id!==entityId);
  else requireCondition(false,400,'INVALID_COMMAND','Alteração desconhecida.');
  return validateVision(v);
}
