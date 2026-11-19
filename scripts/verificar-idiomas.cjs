const assert=require('node:assert/strict');
const source=require('../locales/source.json'),content=require('../locales/content.json');
const mechanics=/\{v\d+\}|\b\d+d\d+\b|\bx\d+\b|[+−-]?\d+(?:[.,]\d+)?(?:\s*(?:m|km|cm|kg|g|%)(?![\p{L}]))?/giu;
const tokens=s=>(s.match(mechanics)||[]).sort();
let count=0;
const languages=process.argv.includes('--en')?['en']:['en','es'];
for(const key of new Set([...source.strings,...source.names]))for(const lang of languages){
  const translated=content[lang][key];
  assert.equal(typeof translated,'string',`Tradução ausente: ${lang}: ${key}`);
  assert.ok(translated.trim(),`Tradução vazia: ${lang}: ${key}`);
  assert.ok(!/ZXQ[A-Z0-9]+QXZ/.test(translated),`Marcador não restaurado: ${lang}: ${key}`);
  assert.deepEqual(tokens(translated),tokens(key),`Dados, números ou unidades alterados: ${lang}: ${key}`);
  count++;
}
for(const [pt,[en,es]] of Object.entries(require('../locales/glossary.json'))){assert.equal(content.en[pt],en);assert.equal(content.es[pt],es);}
console.log(`OK: ${count} traduções; cobertura completa, glossário e números/dados/unidades preservados.`);
