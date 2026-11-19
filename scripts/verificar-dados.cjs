const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({window:{addEventListener(){},removeEventListener(){}},ResizeObserver:class{observe(){}disconnect(){}},performance,matchMedia:()=>({matches:false}),requestAnimationFrame:()=>0,cancelAnimationFrame(){},setTimeout,clearTimeout});
vm.runInContext(fs.readFileSync('scripts/dados-3d.js','utf8'),context);
const Tray=context.window.BandejaDados3D;
for(const n of [4,6,8,10,12,14,16,20]){
  const g=Tray.geometry(n);assert.equal(g.faces.length,n,`Faces do d${n}`);
  assert.deepEqual(Array.from(g.faces,f=>f.value).sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i+1));
  assert.ok(g.faces.every(f=>f.ids.length>=3&&f.d>0));
}
const tray=new Tray({getContext:()=>null});let count=0;
for(const d of [2,4,6,8,10,12,14,16,20,100])for(let value=1;value<=d;value++){
  tray.roll([{d,v:value}]);tray.finish();const state=tray.snapshot();
  const actual=d===100?((state[0].value*10+state[1].value)||100):state[0].value;
  assert.equal(actual,value,`Face final d${d}: ${value}`);assert.ok(state.every(s=>Math.abs(s.floor)<1e-8),'Dados apoiados na bandeja');count++;
}
tray.destroy();console.log(`OK: geometria de todos os dados e ${count} resultados/posições finais, incluindo vértice do d4 e par do d100.`);
