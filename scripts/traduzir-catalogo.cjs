// Geração opcional de catálogo. O site e o build nunca usam tradução remota.
// Execute somente com --allow-network; entradas vêm exclusivamente de locales/source.json.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=require('../locales/source.json'),glossary=require('../locales/glossary.json');
const file=path.join(root,'locales/content.json');
const cache=require('./catalogo-local.cjs')();
const normalize=s=>s.normalize('NFC').replace(/\s+/g,' ').trim();
const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const save=()=>fs.writeFileSync(file,JSON.stringify(cache,null,2)+'\n');
const mechanics=/\{v\d+\}|\b\d+d\d+\b|\bx\d+\b|[+−-]?\d+(?:[.,]\d+)?(?:\s*(?:m|km|cm|kg|g|%)(?![\p{L}]))?/giu;
const tokens=s=>(s.match(mechanics)||[]).sort();
const glossaryPattern=()=>new RegExp('(?<![\\p{L}\\p{N}_])('+Object.keys(glossary).sort((a,b)=>b.length-a.length).map(escaped).join('|')+')(?![\\p{L}\\p{N}_])','giu');
const normalizeGlossary=new Map(Object.keys(glossary).map(k=>[k.toLocaleLowerCase('pt-BR'),k]));
function prepare(text,lang,values){
  const protect=value=>{const marker='ZXQ'+values.length.toString(36).toUpperCase()+'QXZ';values.push([marker,value]);return marker;};
  // Línguas fictícias continuam fictícias; a explicação entre parênteses é traduzida.
  text=text.replace(/^"[^"]+"(?=\s*\()/,protect);
  text=text.replace(mechanics,protect);
  text=text.replace(glossaryPattern(),match=>{
    const key=normalizeGlossary.get(match.toLocaleLowerCase('pt-BR'));let value=glossary[key][lang==='en'?0:1];
    if(match===match.toLocaleUpperCase('pt-BR')&&match.length>3)value=value.toLocaleUpperCase(lang);
    return protect(value);
  });
  return text;
}
async function batch(keys,lang){
  const values=[];const prepared=keys.map(key=>prepare(key,lang,values));
  const separator='ZXQ999999QXZ';
  const url=new URL('https://translate.googleapis.com/translate_a/single');url.search=new URLSearchParams({client:'gtx',sl:'pt',tl:lang,dt:'t',q:prepared.join('\n'+separator+'\n')});
  let error;
  for(let attempt=0;attempt<4;attempt++){
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw new Error('HTTP_'+response.status);
      const data=await response.json(),result=data[0].map(row=>row[0]||'').join('').split(new RegExp('\\s*'+separator+'\\s*'));
      if(result.length!==keys.length)throw new Error('BATCH_BOUNDARY');
      result.forEach((translated,i)=>{
        const expected=prepared[i].match(/ZXQ[A-Z0-9]+QXZ/g)||[];
        for(const marker of expected)if(!translated.includes(marker))throw new Error('MISSING_PLACEHOLDER');
        for(const [marker,value] of values)translated=translated.split(marker).join(value);
        if(/ZXQ[A-Z0-9]+QXZ/.test(translated))throw new Error('LEFTOVER_PLACEHOLDER');
        const original=tokens(keys[i]),actual=tokens(translated);
        if(JSON.stringify(original)!==JSON.stringify(actual))throw new Error('MECHANICS_CHANGED');
        cache[lang][keys[i]]=normalize(translated);
      });return;
    }catch(e){error=e;if(attempt===1&&!/^HTTP_|Timeout/.test(e.message))break;await delay(1000*(attempt+1));}
  }
  if(keys.length>1){console.log(lang+' dividindo lote: '+error.message+' ('+keys.length+' textos)');const middle=Math.ceil(keys.length/2);await batch(keys.slice(0,middle),lang);await batch(keys.slice(middle),lang);return;}
  throw new Error(lang+': '+error.message+' — '+keys[0]);
}
(async()=>{
  if(process.argv.includes('--seed-only')){save();console.log('Glossário e correções locais aplicados, sem rede.');return;}
  if(!process.argv.includes('--allow-network'))throw new Error('Tradução remota desativada. Use --allow-network explicitamente.');
  for(const lang of ['en','es']){
    const keys=[...new Set([...source.names,...source.strings])].filter(key=>!Object.hasOwn(cache[lang],key));
    let group=[],size=0,done=0;
    for(const key of [...keys,null]){
      if(group.length&&(key===null||size+key.length>1800||group.length>=35)){
        await batch(group,lang);done+=group.length;save();console.log(lang+' '+done+'/'+keys.length);group=[];size=0;await delay(180);
      }
      if(key!==null){group.push(key);size+=key.length;}
    }
  }
  save();console.log('Catálogos completos: '+Object.keys(cache.en).length+' en, '+Object.keys(cache.es).length+' es.');
})().catch(error=>{save();console.error(error.message);process.exitCode=1;});
