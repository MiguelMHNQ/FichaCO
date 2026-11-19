import test from 'node:test';
import assert from 'node:assert/strict';
import {rollTargets} from '../domain/rolagem-alvos.js';
const allocation=(targetId:string,units=1,factor=1)=>({targetId,units,factor});
test('quatro fragmentos de 3d4 concentram 12d4 ou distribuem 3d4 por alvo',()=>{
  const one=rollTargets({mode:'projectiles',count:4,allocations:[allocation('a',4)]},['a'],[4,4,4],0);
  assert.equal(one.dice.length,12);assert.equal(one.results[0]!.diceIndices.length,12);assert.equal(one.results[0]!.total,one.total);
  const ids=['a','b','c','d'],four=rollTargets({mode:'projectiles',count:4,allocations:ids.map(id=>allocation(id))},ids,[4,4,4],0);
  assert.equal(four.dice.length,12);assert.ok(four.results.every(r=>r.diceIndices.length===3&&r.total>=3&&r.total<=12));assert.equal(new Set(four.results.flatMap(r=>r.diceIndices)).size,12);
});
test('área compartilha a rolagem, resistência reduz por alvo e projéteis não duplicam',()=>{
  const r=rollTargets({mode:'shared',count:1,allocations:[allocation('a'),allocation('b',1,.5),allocation('c',1,0)]},['a','b','c'],[6,6],0);
  assert.equal(r.dice.length,2);assert.equal(r.results[0]!.total,r.total);assert.equal(r.results[1]!.total,Math.floor(r.total/2));assert.equal(r.results[2]!.total,0);
  assert.throws(()=>rollTargets({mode:'projectiles',count:4,allocations:[allocation('a',3),allocation('b',2)]},['a','b'],[4],0),{code:'INVALID_DISTRIBUTION'});
  assert.throws(()=>rollTargets({mode:'individual',allocations:[allocation('a'),allocation('a')]},['a','b'],[6],0),{code:'INVALID_DISTRIBUTION'});
  assert.throws(()=>rollTargets({mode:'individual',allocations:[allocation('a',2)]},['a'],[6],0),{code:'INVALID_DISTRIBUTION'});
});
test('dano misto repete a fórmula inteira e o bônus por projétil; limites e efeito sem dados',()=>{
  const r=rollTargets({mode:'projectiles',count:4,allocations:[allocation('a',2),allocation('b',2)]},['a','b'],[6,6,6,6,4,4],2);
  assert.equal(r.dice.length,24);assert.ok(r.results.every(a=>a.diceIndices.length===12));assert.equal(r.results.reduce((n,a)=>n+a.total,0),r.total);
  const effect=rollTargets({mode:'individual',allocations:[allocation('a')]},['a'],[],0);assert.equal(effect.results[0]!.total,0);
  assert.throws(()=>rollTargets({mode:'projectiles',count:20,allocations:[allocation('a',20)]},['a'],Array(40).fill(6),0),{code:'INVALID_DICE'});
});
