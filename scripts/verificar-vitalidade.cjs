const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function storage(){const values=new Map();return {getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),clear:()=>values.clear()};}
const math=Object.create(Math);let rolls=0;math.random=()=>{rolls++;return .5;};
const context=vm.createContext({console,Math:math,sessionStorage:storage(),localStorage:storage(),window:{addEventListener(){}},document:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},crypto:require('node:crypto').webcrypto});
for(const file of ["scripts/estado.js","scripts/ficha-recursos.js","scripts/ficha-magias.js","scripts/ficha-acessorios.js","scripts/ficha-inventario.js","scripts/ficha-layout.js","scripts/ficha-blocos.js","scripts/ficha-render.js","scripts/ficha.js"])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
vm.runInContext('renderFicha=()=>{};sincronizarPersonagem=()=>{};mostrarEvolucao=()=>{};',context);
const run=code=>vm.runInContext(code,context),read=code=>JSON.parse(JSON.stringify(run(code)));
const attrs={Vigor:3,Destreza:9,Sabedoria:5,'Inteligência':13,'Força':7,Carisma:11};
const cases=[{name:'Guerreiro',die:10,initial:['Força','Vigor'],gain:'Vigor'},{name:'Obscuro',die:8,initial:['Sabedoria','Vigor'],gain:'Sabedoria'},{name:'Espadachim',die:10,initial:['Sabedoria','Destreza'],gain:'Destreza'},{name:'Bardo',die:8,initial:['Carisma','Vigor'],gain:'Carisma'},{name:'Mago',die:6,initial:['Sabedoria','Inteligência'],gain:'Inteligência',arcane:true}];
const bc=n=>n>=15?5:n>=10?4:n>=5?3:2;
let checks=0;
for(const c of cases)for(const human of [false,true]){
 const racial=human?{Vigor:1,[c.gain==='Vigor'?'Força':c.gain]:1}:{};
 const bonus=a=>Math.floor(((attrs[a]||0)+(racial[a]||0))/2);
 const energy=n=>bc(n)+bonus(c.gain)+(c.arcane?bc(n)+2:0);
 const firstPV=c.die+bonus('Vigor'),firstPE=c.initial.reduce((sum,a)=>sum+bonus(a),0),pvGain=Math.floor(c.die*.5)+1+bonus('Vigor');
 run(`sessionStorage.clear();Object.assign(estado,criarEstadoInicial(),{classe:${JSON.stringify(c.name)},nivel:1,raca:${human?"'Humanos'":"null"},racaEscolhas:${JSON.stringify(racial)},constancias:${JSON.stringify(attrs)}});sessionStorage.setItem('fragmentados_const_checks',JSON.stringify({Arcanismo:2}));`);
 assert.deepEqual(read('recursosIniciaisClasse()'),{pv:firstPV,pe:firstPE},c.name+' início humano='+human);checks++;
 let pv=firstPV,pe=firstPE;run(`sessionStorage.setItem('fragmentados_pvmax',${pv});sessionStorage.setItem('fragmentados_pemax',${pe});sessionStorage.setItem('fragmentados_pv',${pv-2});sessionStorage.setItem('fragmentados_pe',${pe-1});`);
 for(let n=2;n<=20;n++){
  pv+=pvGain;pe+=energy(n);run('fichaAlterarNivel(1)');assert.equal(run('estado.nivel'),n);
  assert.equal(run("+sessionStorage.getItem('fragmentados_pvmax')"),pv,c.name+' PV nv '+n);assert.equal(run("+sessionStorage.getItem('fragmentados_pemax')"),pe,c.name+' PE nv '+n);
  assert.deepEqual(read(`estado.ganhosNivel[${n}].pe`),energy(n));checks+=3;
 }
 const rolled=rolls;assert.equal(run('calcularPV()'),pv);assert.equal(run('calcularPV()'),pv);assert.equal(run('calcularPE()'),pe);assert.equal(rolls,rolled,'Recalcular não deve rolar dados');checks+=4;
 for(let n=20;n>=2;n--){pv-=pvGain;pe-=energy(n);run('fichaAlterarNivel(-1)');assert.equal(run("+sessionStorage.getItem('fragmentados_pvmax')"),pv);assert.equal(run("+sessionStorage.getItem('fragmentados_pemax')"),pe);checks+=2;}
 assert.equal(run("+sessionStorage.getItem('fragmentados_pv')"),firstPV-2);assert.equal(run("+sessionStorage.getItem('fragmentados_pe')"),firstPE-1);checks+=2;
 run('estado.constancias.Vigor+=2;estado.constancias['+JSON.stringify(c.gain)+']+=2;');const changedPV=run("bonusAtributoVitalidade('Vigor')"),changedPE=run('energiaGanhaNoNivel(2)');
 run('fichaAlterarNivel(1)');assert.equal(run("+sessionStorage.getItem('fragmentados_pvmax')"),firstPV+Math.floor(c.die*.5)+1+changedPV);assert.equal(run("+sessionStorage.getItem('fragmentados_pemax')"),firstPE+changedPE);assert.equal(rolls,rolled,'Reentrada preserva dado e usa bônus atual');checks+=3;
}
run(`sessionStorage.clear();Object.assign(estado,criarEstadoInicial(),{classe:'Espadachim',nivel:1,constancias:${JSON.stringify(attrs)},acessoriosEquipados:{dedo1:'Anel de Adrenalina'}});`);
assert.equal(run('energiaGanhaNoNivel(2)'),bc(2)+Math.floor((attrs.Destreza+2)/2));checks++;
run(`estado.nivel=4;estado.ganhosNivel={};`);const before=rolls;run('calcularPE()');assert.equal(rolls,before,'Cálculo de PE não deve rolar PV');checks++;
run(`estado.nivel=1;estado.ganhosNivel={};sessionStorage.setItem('fragmentados_pvmax','20');sessionStorage.setItem('fragmentados_pemax','10');setXP(1050);`);assert.equal(run('estado.nivel'),3);assert.equal(run("+sessionStorage.getItem('fragmentados_xp')"),250);checks+=2;
run(`sessionStorage.clear();Object.assign(estado,criarEstadoInicial(),{classe:'Guerreiro',nivel:3});sessionStorage.setItem('fragmentados_pvmax','30');sessionStorage.setItem('fragmentados_pv','30');sessionStorage.setItem('fragmentados_pemax','10');sessionStorage.setItem('fragmentados_pe','10');`);const legacyRolls=rolls;run('fichaAlterarNivel(-2);fichaAlterarNivel(2)');assert.equal(run("+sessionStorage.getItem('fragmentados_pvmax')"),30);assert.equal(run("+sessionStorage.getItem('fragmentados_pemax')"),10);assert.equal(rolls,legacyRolls);checks+=3;
console.log('OK: '+checks+' verificações de PV/PE: cinco classes, Humanos, atributos distintos, níveis 1–20, mudanças de bônus de classe, Arcanismo, acessórios, reversão, reentrada, XP e preservação dos dados.');
