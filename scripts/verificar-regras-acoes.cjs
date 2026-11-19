const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('scripts/regras-acoes.js','utf8'),context);const analyze=context.window.RegrasAcoes.analyze;
const book=new Map([...fs.readFileSync('scripts/livro-dados.js','utf8').matchAll(/\{ titulo: '([^']+)', texto: `([^`]+)` \}/g)].filter(m=>/livro-tag-nivel">Vol/.test(m[2])).map(m=>[m[1],m[2]]));
const spell=name=>JSON.parse(JSON.stringify(analyze(name,book.get(name),{spell:true})));
assert.equal(spell('Poeira').range,9);assert.equal(spell('Combustão Finalizadora').range,0,'Toque exige contato, não alcance de arma');assert.equal(spell('Força Vital').category,'heal');assert.equal(spell('Força Vital').range,12);assert.equal(spell('Armamento Ardente').category,'support');assert.equal(spell('Armamento Ardente').range,0);
assert.deepEqual(spell('Bola de Fogo').forms,[{shape:'circle',radius:4.5,anchor:'point'}]);assert.equal(spell('Bola de Fogo').range,18);
assert.deepEqual(spell('Armadilha de Lama').forms,[{shape:'rectangle',length:3,width:3,anchor:'point'}]);
assert.equal(spell('Portão em Fissura').forms[0].length,12);assert.equal(spell('Portão em Fissura').forms[0].width,3);
assert.equal(spell('Rajada de Cortes').forms[0].length,15);assert.equal(spell('Rajada de Cortes').forms[0].angle,null);
assert.deepEqual(spell('Dilúvio Devastador').forms.map(f=>f.shape),['circle','line','cone']);
assert.deepEqual(spell('Ciclone').forms,[{shape:'circle',radius:3,anchor:'caster'}]);
assert.equal(spell('Área Molhada').forms[0].radius,null,'Não confunde medida de área com raio');assert.ok(spell('Placa Gélida').notes.length>0);
assert.equal(spell('Chamas Azuis').forms[0].radius,3);assert.equal(spell('Chamas Azuis').placements,4);assert.equal(spell('Torres Contundentes').forms[0].radius,1.5);assert.equal(spell('Torres Contundentes').placements,5);assert.equal(spell('Ressuscitar Mortos').category,'heal');assert.deepEqual(spell('Broto Vampiro').effects,['attack','heal']);
assert.equal(analyze('Canção de Cura','Cura 1d6 + Carisma de PV a aliados em 4,5m ao redor.',{level:1}).forms[0].radius,4.5);assert.equal(analyze('Canção de Cura','Cura 1d6 + Carisma de PV a aliados em 4,5m ao redor.',{level:6}).forms[0].radius,6);
assert.equal(analyze('Mil Cortes','Em raio de 4,5m, escolha até 5 inimigos para atacar simultaneamente.').maxTargets,5);
for(const [name,html]of book){const m=analyze(name,html,{spell:true});assert.ok(['attack','heal','support'].includes(m.category),name);assert.ok(m.forms.length>0,name);assert.ok(m.range===null||Number.isFinite(m.range),name);}
console.log('OK: métricas de '+book.size+' magias, alcance separado da área, cura/suporte, múltiplos formatos e medidas ausentes sem inventar valores.');

assert.equal(spell('Tiros de Chamas').distribution.mode,'projectiles');assert.equal(spell('Tiros de Chamas').distribution.count,4);assert.deepEqual(spell('Tiros de Chamas').dice,[4,4,4]);assert.deepEqual(spell('Manipulação Terrena').dice,[6,6,6,6,4,4]);assert.equal(spell('Bola de Fogo').distribution.mode,'shared');assert.equal(spell('Bola de Fogo').dice.length,6);assert.equal(spell('Armamento Ardente').dice.length,0);assert.equal(spell('Jaula de Chamas').dice.length,0);assert.equal(spell('Prisão Glacial').dice.length,0);assert.equal(spell('Fogo Envernizado').dice.length,6);assert.equal(spell('Pedrinhas').dice.length,0);assert.equal(spell('Broto Vampiro').damageOptions[1][1],'4d8');
console.log('OK: projéteis por fragmento, dano misto, área compartilhada, fases e bônus futuros separados.');
