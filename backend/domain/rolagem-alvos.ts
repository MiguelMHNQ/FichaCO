import {randomInt} from 'node:crypto';
import {object,fields} from './validation.js';
import {requireCondition} from './errors.js';

export interface TargetResult { targetId:string; units:number; factor:number; diceIndices:number[]; total:number }
export function rollTargets(input:unknown,targets:string[],faces:number[],bonus:number){
  const dice:{d:number;v:number}[]=[],results:TargetResult[]=[];
  const roll=()=>{const indices=faces.map(d=>{dice.push({d,v:randomInt(1,d+1)});return dice.length-1;});return indices;};
  const sum=(indices:number[])=>indices.reduce((n,i)=>n+dice[i]!.v,bonus);
  const d=object(input);fields(d,['mode','count','allocations']);
  requireCondition(typeof d.mode==='string'&&['shared','individual','projectiles'].includes(d.mode),400,'INVALID_DISTRIBUTION','Distribuição inválida.');
  const count=d.count??1;requireCondition(typeof count==='number'&&Number.isInteger(count)&&count>=1&&count<=20,400,'INVALID_DISTRIBUTION','Quantidade de projéteis inválida.');
  requireCondition(Array.isArray(d.allocations)&&d.allocations.length===targets.length,400,'INVALID_DISTRIBUTION','Confira a distribuição por alvo.');
  const allocations=d.allocations.map(raw=>{const a=object(raw);fields(a,['targetId','units','factor']);requireCondition(typeof a.targetId==='string'&&targets.includes(a.targetId)&&typeof a.units==='number'&&Number.isInteger(a.units)&&a.units>=1&&a.units<=20&&[0,.5,1].includes(Number(a.factor))&&typeof a.factor==='number',400,'INVALID_DISTRIBUTION','Distribuição por alvo inválida.');return {targetId:a.targetId,units:a.units,factor:a.factor};});
  requireCondition(new Set(allocations.map(a=>a.targetId)).size===targets.length,400,'INVALID_DISTRIBUTION','Alvo repetido na distribuição.');
  const units=allocations.reduce((n,a)=>n+a.units,0);
  requireCondition(d.mode==='projectiles'?units<=count:allocations.every(a=>a.units===1),400,'INVALID_DISTRIBUTION','A distribuição excede a quantidade de projéteis.');
  requireCondition(faces.length*(d.mode==='shared'?1:units)<=400,400,'INVALID_DICE','A ação excede 400 dados.');
  const shared=d.mode==='shared'?roll():null;
  for(const a of allocations){const indices=shared||Array.from({length:a.units},()=>roll()).flat();const raw=shared?sum(indices):indices.reduce((n,i)=>n+dice[i]!.v,bonus*a.units);results.push({...a,diceIndices:indices,total:Math.max(0,Math.floor(raw*a.factor))});}
  if(!targets.length&&!shared)roll();
  return {dice,results,total:dice.reduce((n,d)=>n+d.v,bonus*(d.mode==='shared'?1:units||1))};
}
