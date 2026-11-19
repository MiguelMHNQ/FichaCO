const { buildSync } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const {createHash}=require('node:crypto');
buildSync({entryPoints:['backend/domain/alcance.ts'],bundle:true,format:'iife',globalName:'GeometriaAlcance',outfile:'scripts/gerados/alcance.js',target:'es2020'});
buildSync({entryPoints:['backend/domain/visao.ts'],bundle:true,format:'iife',globalName:'GeometriaVisao',outfile:'scripts/gerados/visao.js',target:'es2020'});
buildSync({entryPoints:['frontend/visao-mapa.ts'],bundle:true,format:'iife',globalName:'VisaoMapa',outfile:'scripts/gerados/visao-mapa.js',target:'es2020'});
require('./catalogar-idiomas.cjs');
const reviewed=JSON.stringify(require('./catalogo-local.cjs')(),null,2)+'\n';
if(fs.readFileSync('locales/content.json','utf8')!==reviewed)fs.writeFileSync('locales/content.json',reviewed);
require('./verificar-idiomas.cjs');
const source = require('../locales/source.json');
const content = require('../locales/content.json');
const common=new Set([...source.names,...Object.keys(require('../locales/interface.json')),...Object.keys(require('../locales/glossary.json')),...Object.keys(require('../locales/sessions.json'))]);
const pages=['index.html',...fs.readdirSync('pages').filter(f=>f.endsWith('.html')).map(f=>'pages/'+f)];
const manifest={en:{},es:{}};
const catalogDirectory='scripts/gerados/idiomas';
fs.mkdirSync(catalogDirectory,{recursive:true});
// Atualiza somente os catálogos desta ferramenta, sem tocar nos scripts-fonte.
for(const name of fs.readdirSync(catalogDirectory))if(/^i18n-(?:en|es)(?:-[a-z0-9-]+)?\.js$/.test(name))fs.unlinkSync(path.join(catalogDirectory,name));
function emit(lang,name,keys){
  const entries=[...keys].sort().map(pt=>{if(!content[lang][pt])throw new Error('Tradução ausente: '+lang+': '+pt);return [pt,content[lang][pt]];});
  const filename=`gerados/idiomas/i18n-${lang}${name?'-'+name:''}.js`;
  const output='window.PrimordiosLanguageCatalogs['+JSON.stringify(filename)+']='+JSON.stringify({entries,templates:source.templates.filter(key=>keys.has(key))})+';\n';
  fs.writeFileSync('scripts/'+filename,output);
  return filename+'?v='+createHash('sha256').update(output).digest('hex').slice(0,12);
}
for(const lang of ['en','es']){
  const shared=emit(lang,'',common);
  for(const page of pages){
    const keys=new Set(source.files[page]);
    const html=fs.readFileSync(page,'utf8');
    const dependencies=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>path.posix.normalize(path.posix.join(path.posix.dirname(page),m[1].split('?')[0])));
    for(const file of dependencies){
      const sources=file==='scripts/auth-online.js'?['frontend/auth.js','frontend/characters.js']:[file];
      for(const dependency of sources)for(const key of source.files[dependency]||[])keys.add(key);
    }
    // Nomes também são usados como fragmentos em buscas e textos compostos.
    for(const name of source.names)keys.add(name);
    for(const key of common)keys.delete(key);
    manifest[lang][path.posix.basename(page)]=[shared,emit(lang,path.posix.basename(page,'.html'),keys)];
  }
}
const loader=fs.readFileSync('frontend/idiomas.js','utf8');
fs.writeFileSync('scripts/i18n-content.js','window.PrimordiosLocaleManifest='+JSON.stringify(manifest)+';\n'+loader);
buildSync({
  entryPoints: ['frontend/auth.js'],
  outfile: 'scripts/auth-online.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  sourcemap: false,
  legalComments: 'inline'
});
console.log('Cliente Supabase gerado localmente.');
