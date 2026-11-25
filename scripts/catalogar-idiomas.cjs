// Extrai somente textos públicos do código. Não lê .env, banco ou dados do navegador.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const normalize = text => text.normalize('NFC').replace(/\s+/g,' ').trim();
const decode = text => text.replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, entity => {
  const names={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};
  if(names[entity])return names[entity];const code=entity.startsWith('&#x')?parseInt(entity.slice(3),16):parseInt(entity.slice(2),10);return Number.isFinite(code)?String.fromCodePoint(code):entity;
});
const strings=new Set(),names=new Set(),templates=new Map();
const files={};let activeFile=null;
function readable(text){
  if(/^\/[\w/.-]+\.html$/.test(text))return false;
  if(/^(?:600 |10px )/.test(text)&&text.endsWith('system-ui,sans-serif'))return false;
  if(/^(?:\d+ |bold |italic )?(?:\d+(?:\.\d+)?|\{v\d+\})px (?:Georgia|system-ui)/.test(text))return false;
  if(/^(?:SCENE_CONFLICT|WALL_COLLISION|fog-|cursor|fim|fogs|inicio|paredes|perigo|portas|rosto|tocha|linha|porta|retangulo|visao-painel painel|individual|projectiles|shared|angle|attack|caster|circle|cone|direction|grimorio-tipo grimorio-tipo-|heal|length|line|point|radius|rectangle|support|target|width|afterbegin|async|article|footer|nav|search|grimorio|grimorio-pagina grimorio-vazio-pagina|magma|nebula|ivory|obsidian|ruby|sapphire|emerald|arcane|Enter|broken|rolling|montarias|personagens|message|number|polite|sessao-acao painel|sessao-rolagem painel|regua|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|touch|mouse|sort|change|scroll|group|identidade|progresso|atributos|equipamentos|habilidades|inventario|vitalidade)$/.test(text))return false;
  if(/^(?:pageshow|pagehide)$/.test(text))return false;
  if(/^(?:var|color-mix)\(/.test(text)||/^[-\d].*\b(?:var|color-mix)\(/.test(text))return false;
  if (/^(?:AES-GCM|IMG|VIDEO|ftyp|optgroup|auto|constancias|mutado|header|iframe|measurement|position|range|tokens|sessao-ficha painel|_blank|decrypt|encrypt|noopener|personagem|presence|raw)$|^tela5\.html\?(?:mesa=1&)?personagem=/.test(text)) return false;
  if (/^(?:display:|width:|primordios:|jpg$)/.test(text)) return false;
  if (/^(?:\/(?:api|assets|ban|join|kick|leave|lookup|members|shorts|tabletop|uploads)(?:\/|$)|\?since=|[a-z]+:$|(?:image|audio|video)\/|editor-mapa\.html\?|painel sessao-|sessao-audio-disco painel$)/.test(text)) return false;
  if (/^(?:GET|PATCH|SUBSCRIBED|audio|broadcast|camadas|color|create|end|erro|form|gif|grade|home|imagens|join|loop|members|metadata|mexendo|moderator|mp3|mp4|ogg|order|owner|playback|player|png|preview|private|put|remove|replace|script|section|seek|sessao|settings|small|stop|tocando|toggle|tracos|video|wav|webm|webp|youtube)$/.test(text)) return false;
  if (/^\d+(?:px)? \d+(?:px)? \d+(?:px)? .*#|^[a-z]+(?:-[a-z]+)*-__I18N_\d+__$/.test(text)) return false;
  if (/^(?:--[\w-]+$|[.#][a-zA-Z][\w-]*[\s.[:]|\(prefers-|(?:brightness|hsl|rgba|translateY)\(|bold \d|\d+ \d+ \d+ .*#|[a-z]+(?:[A-Z][a-z0-9]+)+$|[a-z]+(?:-[a-z]+)*-\{v\d+\}$|deg$|tens$|units$)/.test(text)) return false;
  if (/^(?:[Mm]\d|\[[^\]]+\]$|translate\()/.test(text)) return false;
  return /[A-Za-zÀ-ÿ]{2}/.test(text) && !/^(?:https?:|\.\.?\/|data:|data-[\w-]+$|#[\w-]+$|\.[\w-]+$|primordios_|fragmentados_|[a-z]+-[a-z-]+$)/.test(text)
    && !/[{}][^}]*[:;]|=>|document\.|window\.|localStorage|sessionStorage|querySelector|\b(?:function|const|return)\b/.test(text)
    && !/^[-\w]+\.(?:js|css|png|mp3|webp|jpg|html)$/i.test(text)
    && !/^[\w-]+(?:\.[\w-]+)+$/.test(text);
}
function collect(value){
  if(!value||value.length>100000)return;
  // Remove apenas tags reais. Comparações de regras como “< 10” não são tags.
  for(const part of value.replace(/<!--[\s\S]*?-->/g,'').split(/<\/?[a-z][^>]*>/gi)){
    const clean=normalize(decode(part));if(!clean||!readable(clean))continue;
    if(/__I18N_\d+__/.test(clean)){
      if(clean.replace(/__I18N_\d+__/g,'').replace(/[^A-Za-zÀ-ÿ]/g,'').length<3)continue;
      const key=clean.replace(/__I18N_(\d+)__/g,'{v$1}');templates.set(key,key);strings.add(key);if(activeFile)files[activeFile].add(key);
    }else {strings.add(clean);if(activeFile)files[activeFile].add(clean);}
  }
  for(const match of value.matchAll(/\b(?:placeholder|title|aria-label|alt)=["']([^"']+)["']/g))collect(match[1]);
}
function script(source,file){
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  function visit(node){
    if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){
      const parent=node.parent;
      if(ts.isCallExpression(parent)&&/(?:^|\.)(?:matchMedia|querySelector|querySelectorAll|closest|matches)$/.test(parent.expression.getText(ast)))return;
      const isKey=(ts.isPropertyAssignment(parent)||ts.isMethodDeclaration(parent))&&parent.name===node;
      if(!isKey)collect(node.text);
      if(ts.isPropertyAssignment(parent)&&parent.initializer===node&&['nome','titulo','label'].includes(parent.name.getText(ast).replace(/["']/g,''))&&node.text.length<100&&!/<|__I18N/.test(node.text))names.add(normalize(node.text));
    }else if(ts.isTemplateExpression(node)){
      let text=node.head.text;node.templateSpans.forEach((span,i)=>text+='__I18N_'+i+'__'+span.literal.text);collect(text);
    }
    ts.forEachChild(node,visit);
  }visit(ast);
}
const scriptFiles=fs.readdirSync(path.join(root,'scripts')).filter(f=>f.endsWith('.js')&&f!=='preferencias.js'&&f!=='auth-online.js'&&!f.startsWith('i18n-')).map(f=>'scripts/'+f);
const pageFiles=['index.html',...fs.readdirSync(path.join(root,'pages')).filter(f=>f.endsWith('.html')).map(f=>'pages/'+f)];
for(const file of [...scriptFiles,'frontend/auth.js','frontend/characters.js']){activeFile=file;files[file]=new Set();script(fs.readFileSync(path.join(root,file),'utf8'),file);}
for(const file of pageFiles){activeFile=file;files[file]=new Set();const html=fs.readFileSync(path.join(root,file),'utf8');for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))script(match[1],file+'.js');collect(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,''));}
for(const key of Object.keys(require('../locales/interface.json')))strings.add(key);
for(const key of Object.keys(require('../locales/sessions.json')))strings.add(key);
// Chaves também aparecem como nomes de atributos/classes, sem literais de valor.
for(const text of ['Guerreiro','Obscuro','Espadachim','Bardo','Mago','Druida','Micélio','Enxame','Caçada','Vigor','Destreza','Sabedoria','Inteligência','Força','Carisma','Combate','Reflexos','Constituição','Arcanismo','Natureza','Medicina','PV','PE','CA','CD','PCE']){strings.add(text);names.add(text);}
const result={strings:[...strings].sort(),names:[...names].filter(readable).sort(),templates:[...templates.keys()].sort(),files:Object.fromEntries(Object.entries(files).map(([file,keys])=>[file,[...keys].sort()]))};
fs.mkdirSync(path.join(root,'locales'),{recursive:true});fs.writeFileSync(path.join(root,'locales/source.json'),JSON.stringify(result,null,2)+'\n');
for(const locale of ['en','es']){
  const contentPath=path.join(root,'locales/content.json');
  const content=JSON.parse(fs.readFileSync(contentPath,'utf8'));
  for(const key of result.strings){
    const section=content[locale];
    if(!section[key])section[key]=key;
  }
  fs.writeFileSync(contentPath,JSON.stringify(content,null,2)+'\n');
}
console.log(JSON.stringify({strings:result.strings.length,names:result.names.length,templates:result.templates.length,characters:result.strings.reduce((n,s)=>n+s.length,0)}));
