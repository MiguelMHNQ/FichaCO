// Verificação de integração sem dependências: node scripts/verificar-tabletop.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'primordios-test-'));
const browserPath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const server = http.createServer((req, res) => {
  if(process.argv.includes('--security')||process.argv.includes('--animations'))for(const {key,value} of require('../vercel.json').headers[0].headers)res.setHeader(key,value);
  // Estes testes verificam mapa/ficha. O fluxo Auth com SDK real é testado em verificar-auth.cjs.
  // O mock existe apenas neste servidor de testes, nunca no build da aplicação.
  if (req.url.split('?')[0] === '/scripts/auth-online.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end("window.PrimordiosAuth={ready:Promise.resolve(true),status:async()=>({user:{id:'teste'}}),sair:async()=>{localStorage.removeItem('primordios_logado');location.href='tela0.html';}};");
    return;
  }
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)] || 'application/octet-stream');
    if (process.argv.includes('--audio-continuity') && req.headers.range) {
      const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;res.writeHead(206,{'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));return;}
    }
    res.end(data);
  });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser, ws;
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = spawn(browserPath, ['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',...(process.argv.includes('--audio-continuity')?['--autoplay-policy=no-user-gesture-required']:[]),'--user-data-dir='+profile,'about:blank'], { windowsHide:true, stdio:'ignore' });
  const endpoint = path.join(profile, 'DevToolsActivePort');
  for (let i=0; !fs.existsSync(endpoint) && i<100; i++) await sleep(100);
  let port;
  for(let i=0;i<50;i++){
    try{port=fs.readFileSync(endpoint,'utf8').split('\n')[0];if(port)break;}catch{}
    await sleep(100);
  }
  const targets = await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let seq=0; const pending=new Map(), errors=[];
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text + ': ' + m.params.exceptionDetails.exception?.description);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description);return r.result.value;};
  const esperar = async expressao => {
    for (let i=0;i<150;i++) { try { if(await evaluate(expressao)) return; } catch {} await sleep(100); }
    throw new Error('Tempo esgotado esperando: '+expressao);
  };
  await send('Runtime.enable');
  await send('Page.navigate',{url:origin+'/index.html'});await sleep(500);
  await evaluate(`localStorage.setItem('primordios_logado',JSON.stringify({usuario:'teste'})); localStorage.setItem('primordios_mapas_teste',JSON.stringify([{id:'teste-mapa',nome:'Mapa de teste',data:'Hoje'}])); sessionStorage.setItem('primordios_mapa_idx','0');localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false}));`);
  if(process.argv.includes('--vision-editor')){await require('./verificar-visao-editor.cjs')({send,evaluate,esperar,sleep,origin,profile,errors});return;}
  if(process.argv.includes('--grimorio')){await require('./verificar-grimorio.cjs')({send,evaluate,esperar,sleep,origin,profile,errors});return;}
  if(process.argv.includes('--mobile')){await require('./verificar-mobile.cjs')({send,evaluate,esperar,sleep,origin,profile,errors});return;}
  if(process.argv.includes('--organisation')){
    assert.equal(await evaluate(`performance.getEntriesByType('resource').some(r=>/i18n-(en|es)(?:-|\\.)/.test(r.name))`),false);
    await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`const NativeObserver=window.MutationObserver;window.auditTranslationCalls=0;window.MutationObserver=class extends NativeObserver{constructor(callback){super((changes,observer)=>{window.auditTranslationCalls++;callback(changes,observer);});}};`});
    await send('Page.navigate',{url:origin+'/pages/editor-mapa.html'});await esperar(`document.getElementById('estadoSalvo')?.textContent==='Novo mapa'`);
    await evaluate(`const probe=document.createElement('span');probe.id='auditTranslation';probe.textContent='Salvar';document.body.append(probe)`);await sleep(80);
    assert.equal(await evaluate('auditTranslationCalls'),0);
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}));aplicarPreferencias()`);
    assert.equal(await evaluate(`document.getElementById('salvar').textContent.includes('Save')`),true);
    assert.equal(await evaluate(`performance.getEntriesByType('resource').some(r=>/i18n-es(?:-|\\.)/.test(r.name))`),false);
    assert.equal(await evaluate(`performance.getEntriesByType('resource').some(r=>/i18n-en-livro/.test(r.name))`),false);
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'pt-BR'}));aplicarPreferencias()`);
    const pausedCalls=await evaluate('auditTranslationCalls');await evaluate(`document.getElementById('auditTranslation').textContent='Guerreiro'`);await sleep(80);assert.equal(await evaluate('auditTranslationCalls'),pausedCalls);
    await evaluate(`window.auditCacheRemovals=0;const remove=CacheRecursosMapa.prototype.delete;CacheRecursosMapa.prototype.delete=function(src){if(this.has(src))auditCacheRemovals++;return remove.call(this,src);};`);
    await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=c.height=80;c.getContext('2d').fillRect(0,0,80,80);const blob=await new Promise(r=>c.toBlob(r)),dt=new DataTransfer();dt.items.add(new File([blob],'cache.png',{type:'image/png'}));document.getElementById('upload').files=dt.files;await document.getElementById('upload').onchange();})()`);
    await esperar(`!document.getElementById('selecao').hidden`);const beforeDelete=await evaluate('auditCacheRemovals');
    await evaluate(`document.getElementById('deletar').click()`);assert.ok(await evaluate('auditCacheRemovals')>beforeDelete);
    await evaluate(`document.getElementById('desfazer').click();document.getElementById('salvar').click()`);await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    assert.equal(await evaluate(`new Promise(resolve=>{const request=indexedDB.open('primordios_tabletop');request.onsuccess=()=>{const db=request.result,q=db.transaction('mapas').objectStore('mapas').getAll();q.onsuccess=()=>{resolve(q.result[0].doc.imagens.length);db.close();};};})`),1);
    await evaluate(`sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Bardo',raca:'Humano',nivel:1,nomePersonagem:'Cores'}))`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});await esperar(`!!document.getElementById('pvAtual')`);
    await evaluate(`editCorPrincipal.value='#11aa33';editCorTexto.value='#2244bb';aplicarCores()`);
    assert.equal(await evaluate(`getComputedStyle(document.getElementById('xpBarra')).backgroundColor`),'rgb(17, 170, 51)');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('input[maxlength="30"]')).color`),'rgb(34, 68, 187)');
    await evaluate(`renderFicha()`);assert.equal(await evaluate(`getComputedStyle(document.getElementById('xpBarra')).backgroundColor`),'rgb(17, 170, 51)');
    assert.equal(await evaluate(`!!document.getElementById('fichaEstilosDinamicos')`),false);
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}));aplicarPreferencias()`);
    assert.equal(await evaluate(`document.querySelector('#roda-maos>span:last-child').textContent`),'Hands');
    assert.equal(await evaluate(`document.querySelector('#roda-dedo1>span:last-child').textContent`),'Finger');
    assert.notEqual(await evaluate(`PrimordiosI18n.t('Você foi banido desta sessão.')`),'Você foi banido desta sessão.');
    assert.deepEqual(errors,[]);console.log('OK: português sem catálogo/observador ativo; idiomas sob demanda sem carregar livro/idioma alheio; bitmap removido com desfazer preservado; cores personalizadas via CSS sem remapeamento.');return;
  }
  if(process.argv.includes('--security')) {
    const payload='<img src="invalid-security-image" onerror="window.__securityXss=true">';
    await evaluate('sessionStorage.setItem("fragmentados_estado",'+JSON.stringify(JSON.stringify({classe:'Guerreiro',nivel:1,nomePersonagem:'Segurança',raca:payload,caminho:payload,arma:payload,constancias:{Vigor:1}}))+')');
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});await esperar('!!document.getElementById("pvAtual")');await sleep(150);
    assert.equal(await evaluate('window.__securityXss===true'),false);assert.equal(await evaluate('document.getElementById("fichaConteudo").textContent.includes('+JSON.stringify(payload)+')'),true);
    await evaluate('adicionarLinhaInventario("Seguro",'+JSON.stringify('" onmouseover="window.__securityXss=true')+',0,9)');
    assert.equal(await evaluate('!!document.querySelector("#inv-row-9 input[onmouseover]")'),false);
    const headers=await evaluate('fetch(location.href).then(r=>({csp:r.headers.get("content-security-policy"),frame:r.headers.get("x-frame-options")}))');assert.ok(headers.csp.includes("frame-ancestors 'self'"));assert.equal(headers.frame,'SAMEORIGIN');
    assert.deepEqual(errors,[]);console.log('OK: HTML malicioso na ficha vira texto, atributos numéricos não executam código; cabeçalhos CSP e enquadramento ativos.');return;
  }
  if(process.argv.includes('--vitality')) {
    await evaluate(`sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Guerreiro',nivel:1,nomePersonagem:'Vitalidade'}))`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});await esperar(`document.readyState==='complete'&&!!document.getElementById('pvAtual')`);
    await evaluate(`window.vitalityRandom=Math.random;Math.random=()=>.5`);
    const attrs={Vigor:3,Destreza:9,Sabedoria:5,'Inteligência':13,'Força':7,Carisma:11};
    const cases=[['Guerreiro',12,5,20,9],['Obscuro',10,4,17,8],['Espadachim',12,6,20,12],['Bardo',10,7,17,14],['Mago',8,9,14,22]];
    for(const [classe,pv1,pe1,pv2,pe2]of cases){
      await evaluate(`limparDadosFicha();Object.assign(estado,criarEstadoInicial(),{classe:`+JSON.stringify(classe)+`,nivel:1,nomePersonagem:'Vitalidade',raca:'Humanos',racaEscolhas:{Vigor:1,'Inteligência':1},constancias:`+JSON.stringify(attrs)+`});sessionStorage.setItem('fragmentados_const_checks',JSON.stringify({Arcanismo:2}));renderFicha();`);
      const values=()=>evaluate(`({pv:+document.getElementById('pvMax').value,pe:+document.getElementById('peMax').value})`);
      assert.deepEqual(await values(),{pv:pv1,pe:pe1},classe+' inicial');await evaluate('fichaAlterarNivel(1)');assert.deepEqual(await values(),{pv:pv2,pe:pe2},classe+' nível 2');
      if(classe==='Mago')assert.equal(await evaluate(`document.getElementById('ficha-const-Arcanismo').textContent`),'+11');
      await evaluate('fichaAlterarNivel(-1)');assert.deepEqual(await values(),{pv:pv1,pe:pe1},classe+' reversão');
    }
    await evaluate(`limparDadosFicha();Object.assign(estado,criarEstadoInicial(),{classe:'Guerreiro',nivel:1,nomePersonagem:'Atualização',raca:'Humanos',racaEscolhas:{Vigor:1,'Força':1},constancias:{Vigor:3,Destreza:0,Sabedoria:0,'Inteligência':0,'Força':3,Carisma:0}});renderFicha();fichaAlterarNivel(1);fichaAlterarAtributo('Vigor',1);fichaAlterarAtributo('Vigor',1);`);
    assert.equal(await evaluate(`+document.getElementById('pvMax').value`),20);await evaluate('fichaAlterarNivel(1)');assert.equal(await evaluate(`+document.getElementById('pvMax').value`),29);assert.equal(await evaluate(`+document.getElementById('peMax').value`),13);
    await evaluate('fichaAlterarNivel(-2);fichaAlterarNivel(1)');assert.equal(await evaluate(`+document.getElementById('pvMax').value`),21);assert.equal(await evaluate(`+document.getElementById('peMax').value`),9);
    await evaluate('Math.random=vitalityRandom');assert.deepEqual(errors,[]);console.log('OK: cinco classes no navegador, bônus de Humanos, Arcanismo completo, alterações reais de atributo, ganhos atuais e reversão sem rerrolar.');return;
  }
  if(process.argv.includes('--proficiencies')) {
    await send('Page.navigate',{url:origin+'/pages/tela1.html'});await esperar(`document.readyState==='complete'&&typeof abrirPreviewClasse==='function'`);
    await evaluate(`abrirPreviewClasse('Guerreiro',document.querySelector('[data-classe=Guerreiro]'))`);
    await evaluate(`document.querySelectorAll('#pcConstanciasEscolha .popup-tag')[0].click();document.querySelectorAll('#pcConstanciasEscolha .popup-tag')[1].click();confirmarClassePopup()`);
    assert.equal(await evaluate(`document.getElementById('popupClasse').classList.contains('aberto')`),true);
    assert.equal(await evaluate(`document.querySelector('#pcProficiencias [data-familiaridade]').disabled`),true);
    const choose=(selector,value)=>evaluate(`(()=>{const el=document.querySelector(`+JSON.stringify(selector)+`);el.value=`+JSON.stringify(value)+`;el.dispatchEvent(new Event('change'));})()`);
    await choose('#pcProficiencias [data-conhecimento="0"]','espadas-leves');await choose('#pcProficiencias [data-conhecimento="1"]','machados-pesados');
    assert.deepEqual(await evaluate(`Array.from(document.querySelector('#pcProficiencias [data-familiaridade]').options).map(o=>o.value).filter(Boolean)`),['Espadas Pesadas','Machados Leves']);
    await choose('#pcProficiencias [data-familiaridade]','Espadas Pesadas');await choose('#pcProficiencias [data-conhecimento="0"]','martelos-pesados');assert.equal(await evaluate(`document.querySelector('#pcProficiencias [data-familiaridade]').value`),'');
    await choose('#pcProficiencias [data-familiaridade]','Martelos Leves');await choose('#pcProficiencias [data-especializacao]','Bastões');await evaluate('confirmarClassePopup()');assert.equal(await evaluate('estado.classe'),'Guerreiro');
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});await esperar(`!!document.querySelector('#fichaProficiencias [data-especializacao]')&&document.readyState==='complete'`);
    assert.equal(await evaluate(`document.querySelector('#fichaProficiencias [data-familiaridade]').value`),'Martelos Leves');assert.equal(await evaluate(`document.querySelector('#fichaProficiencias [data-especializacao]').value`),'Bastões');
    await choose('#fichaProficiencias [data-especializacao]','Espadas (Pesada)');const before=await evaluate('performance.timeOrigin');await send('Page.reload');await esperar(`performance.timeOrigin!==`+before+`&&!!document.querySelector('#fichaProficiencias [data-especializacao]')&&document.readyState==='complete'`);assert.equal(await evaluate(`document.querySelector('#fichaProficiencias [data-especializacao]').value`),'Espadas (Pesada)');
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({idioma:'en',audioPermitido:false,musicaAtiva:false}));aplicarPreferencias()`);await esperar(`document.getElementById('fichaProficiencias').textContent.includes('Specialization')`);assert.equal(await evaluate(`document.querySelector('#fichaProficiencias [data-especializacao]').value`),'Espadas (Pesada)');
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({idioma:'pt-BR',audioPermitido:false,musicaAtiva:false}));aplicarPreferencias()`);
    for(const [classe,knowledge]of [['Espadachim','Espadas (Geral)'],['Mago','Bastão (Arma Específica)'],['Obscuro','Besta de Mão (Arma Específica)'],['Bardo','Florete (Arma Específica)']]){await evaluate(`estado.classe=`+JSON.stringify(classe)+`;renderFicha()`);assert.ok(await evaluate(`document.getElementById('fichaProficiencias').textContent.includes(`+JSON.stringify(knowledge)+`)`));}
    await choose('#fichaProficiencias [data-especializacao]','');assert.equal(await evaluate('estado.especializacaoArma'),null);assert.deepEqual(errors,[]);console.log('OK: Guerreiro escolhe duas categorias e familiaridade válida, escolhas persistem na ficha/reload, especialização é opcional e traduzível, listas das cinco classes exibidas.');return;
  }
  if(process.argv.includes('--equipment-search')) {
    await evaluate(`sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Guerreiro',nivel:1,nomePersonagem:'Busca',acessorio:'Puxa Corte'}))`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});await esperar(`document.readyState==='complete'&&typeof abrirPopupEquip==='function'`);
    for(const [slot,termo,nome] of [['arma','ferroada','Ferroada'],['armadura','placas','Armadura de Placas']]){
      await evaluate(`abrirPopupEquip(${JSON.stringify(slot)});popupEquipBusca.value=${JSON.stringify(termo)};popupEquipBusca.dispatchEvent(new Event('input'))`);
      assert.ok(await evaluate(`document.querySelector('#popupEquipLista .item-linha')?.textContent.includes(${JSON.stringify(nome)})`));
      await evaluate(`[...document.querySelectorAll('#popupEquipLista .item-linha')].find(el=>el.firstElementChild.textContent===${JSON.stringify(nome)}).click()`);
      assert.equal(await evaluate(`estado[${JSON.stringify(slot)}]`),nome);
    }
    await evaluate(`abrirPopupEquip('arma');popupEquipBusca.value='zzzzzzzz';popupEquipBusca.dispatchEvent(new Event('input'))`);
    assert.equal(await evaluate(`document.querySelectorAll('#popupEquipLista .item-linha').length`),0);
    await evaluate(`fecharPopupEquip();abrirPopupEquip('armadura')`);assert.equal(await evaluate(`popupEquipBusca.value`),'');
    await evaluate(`fecharPopupEquip();filtrarAcessoriosSlot('dedo1','inexistente')`);
    assert.equal(await evaluate(`document.querySelector('select[data-slot="dedo1"]').value`),'Puxa Corte');
    assert.equal(await evaluate(`document.querySelector('[data-busca-status="dedo1"]').hidden`),false);
    assert.equal(await evaluate(`estado.acessoriosEquipados.dedo1`),'Puxa Corte');
    await evaluate(`filtrarAcessoriosSlot('dedo1','energia');const s=document.querySelector('select[data-slot="dedo1"]');s.value='Anel de Energia';s.dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate(`estado.acessoriosEquipados.dedo1`),'Anel de Energia');
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}));await aplicarPreferencias();abrirPopupEquip('armadura');popupEquipBusca.value='Plate Armor';popupEquipBusca.dispatchEvent(new Event('input'))`);
    assert.ok(await evaluate(`[...document.querySelectorAll('#popupEquipLista .item-linha')].some(el=>el.firstElementChild.textContent==='Plate Armor')`));
    await evaluate(`fecharPopupEquip();filtrarAcessoriosSlot('dedo1','Rings')`);assert.ok(await evaluate(`document.querySelector('select[data-slot="dedo1"]').options.length>3`));
    assert.deepEqual(errors,[]);console.log('OK: busca de armas/armaduras/acessórios, troca, nenhum resultado, idioma traduzido e equipamento preservado ao filtrar.');return;
  }
  if(process.argv.includes('--dice')) {
    await send('Emulation.setDeviceMetricsOverride',{width:1200,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate(`sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Guerreiro',nivel:1,nomePersonagem:'Bandeja'}))`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});await esperar(`document.readyState==='complete'&&typeof rolagemRapida==='function'&&typeof renderFicha==='function'`);
    await evaluate(`document.getElementById('btnEditarFicha').click()`);assert.equal(await evaluate(`document.getElementById('fichaEditToolbar').classList.contains('ativo')`),true);await evaluate(`toggleModoEdicao()`);
    await evaluate(`window.diceCallbacks=[];window.dicePromise=rolagemRapida([20,6],3,'Teste da bandeja',n=>diceCallbacks.push(n));void 0`);await sleep(650);
    assert.equal(await evaluate(`document.getElementById('diceBtnRolar').disabled`),true);
    assert.equal(await evaluate(`document.getElementById('diceResult').hidden`),true);
    const screenshot=async name=>{const clip=await evaluate(`(()=>{const r=document.getElementById('dicePanel').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`);const shot=await send('Page.captureScreenshot',{format:'png',clip});const file=path.join(profile,name+'.png');fs.writeFileSync(file,Buffer.from(shot.data,'base64'));console.log(file);};
    await screenshot('dados-rolando');await evaluate(`dicePromise`);
    assert.equal(await evaluate(`diceCallbacks.length`),1);assert.equal(await evaluate(`document.getElementById('diceSum').textContent`),await evaluate(`'= '+diceCallbacks[0]`));
    assert.deepEqual(await evaluate(`_diceTray.snapshot().map(b=>b.value)`),await evaluate(`_diceTray.results.map(r=>r.v)`));
    assert.ok(await evaluate(`_diceTray.snapshot().every(b=>Math.abs(b.floor)<1e-6)`));
    await screenshot('dados-escuro');
    assert.equal(await evaluate(`document.querySelectorAll('[data-dice-style]').length`),8);
    const beforeStyle=await evaluate(`JSON.stringify(_diceTray.snapshot())`),finishes=[];
    for(const skin of ['ivory','obsidian','ruby','sapphire','emerald','arcane','magma','nebula']){await evaluate(`document.querySelector('[data-dice-style="`+skin+`"]').click()`);assert.equal(await evaluate(`JSON.stringify(_diceTray.snapshot())`),beforeStyle,'Estilo preserva resultados e posição');assert.equal(await evaluate(`document.querySelectorAll('[data-dice-style][aria-pressed=true]').length`),1);finishes.push(await evaluate(`diceCanvas.toDataURL()`));await screenshot('estilo-'+skin);}
    assert.equal(new Set(finishes).size,8,'Oito acabamentos visualmente distintos');
    assert.equal(await evaluate(`(()=>{const tray=new BandejaDados3D(document.createElement('canvas')),style=tray.style.id;tray.destroy();return style;})()`),'nebula','Estilo guardado para novas bandejas');

    const resting=await evaluate(`JSON.stringify(_diceTray.snapshot())`),sky=await evaluate(`diceCanvas.toDataURL()`);await sleep(250);assert.notEqual(await evaluate(`diceCanvas.toDataURL()`),sky,'Nebulosa anima o material em repouso');assert.equal(await evaluate(`JSON.stringify(_diceTray.snapshot())`),resting);
    await evaluate(`toggleDice()`);await sleep(100);assert.equal(await evaluate(`_diceTray.idleFrame`),null,'Material pausa com bandeja fechada');await evaluate(`toggleDice()`);
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await sleep(100);assert.equal(await evaluate(`_diceTray.idleFrame`),null,'Respeita movimento reduzido');await send('Emulation.setEmulatedMedia',{features:[]});
    await evaluate(`rolagemRapida([2,4,6,8,10,12,20,100],-2,'Todos os dados')`);
    assert.ok(await evaluate(`_diceTray.snapshot().every(b=>Math.abs(b.floor)<1e-6)`));
    assert.ok(await evaluate(`_diceTray.results.every((r,i)=>{const p=_diceTray.snapshot().filter(b=>b.index===i);return (r.d===100?((p[0].value*10+p[1].value)||100):p[0].value)===r.v})`));
    await evaluate(`window.sequencia=[];Promise.all([rolagemRapida([6],0,'Primeiro',n=>sequencia.push(['a',n])),rolagemRapida([8],2,'Segundo',n=>sequencia.push(['b',n]))])`);
    assert.deepEqual(await evaluate(`sequencia.map(r=>r[0])`),['a','b']);
    await evaluate(`window.fechado=0;window.rollFechado=rolagemRapida([12],0,'Painel fechado',()=>fechado++);toggleDice();rollFechado`);assert.equal(await evaluate(`fechado`),1);
    await evaluate(`rolagemRapida([], -3,'Dano fixo')`);assert.equal(await evaluate(`document.getElementById('diceSum').textContent`),'= -3');
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    for(const modifier of [-10,5]){await evaluate(`limparDados();adicionarDado(10);adicionarDado(10);adicionarDado(10);diceBonus.value='`+modifier+`';rolarDadosManuais()`);assert.equal(await evaluate(`diceSum.textContent`),await evaluate(`'= '+(_diceTray.results.reduce((sum,d)=>sum+d.v,0)+Number(diceBonus.value))`));}
    await evaluate(`diceBonus.value='-10';rolagemRapida([6],3,'Automática')`);assert.equal(await evaluate(`diceSum.textContent`),await evaluate(`'= '+(_diceTray.results[0].v+3)`),'Modificador manual não interfere na rolagem automática');
    await evaluate(`limparDados()`);assert.equal(await evaluate(`diceBonus.value`),'0');
    await send('Emulation.setEmulatedMedia',{features:[]});
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,tema:'claro',idioma:'en'}));aplicarPreferencias();rolagemRapida([20,6],0,'')`);await screenshot('dados-claro');
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await sleep(100);
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));assert.ok(await evaluate(`document.getElementById('dicePanel').getBoundingClientRect().right<=innerWidth`));await screenshot('dados-celular');
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await evaluate(`rolagemRapida([4,100],0,'Reduced motion')`);assert.equal(await evaluate(`_diceBusy`),false);
    await evaluate(`window.saida=0;window.pendentes=[rolagemRapida([6],0,'Saída A',()=>saida++),rolagemRapida([6],0,'Saída B',()=>saida++)];window.dispatchEvent(new PageTransitionEvent('pagehide'));Promise.all(pendentes)`);assert.equal(await evaluate(`saida`),2);
    assert.deepEqual(errors,[]);console.log('OK: dados 3D/resultados iguais, todos os formatos, bônus negativo/fixo, callbacks únicos/fila/saída, painel fechado, celular/temas e edição da ficha.');return;
  }
  if(process.argv.includes('--accessories')) {
    await send('Emulation.setDeviceMetricsOverride',{width:1200,height:1000,deviceScaleFactor:1,mobile:false});
    await evaluate(`sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Guerreiro',nivel:1,nomePersonagem:'Acessórios',acessorio:'Puxa Corte',acessoriosEquipados:{dedo1:'Puxa Corte',pescoco:'Colar de Cura'}}))`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});
    await esperar(`document.readyState==='complete'&&document.querySelectorAll('[data-acessorio-roda]').length===9`);
    await evaluate(`document.querySelector('.ficha-acessorios-equipados').scrollIntoView({block:'center'})`);await sleep(100);
    await evaluate(`window.alert=()=>{window.alertasAcessorios=(window.alertasAcessorios||0)+1};window.alertasAcessorios=0`);
    assert.equal(await evaluate(`document.querySelectorAll('[data-acessorio-painel]:not([hidden])').length`),1);
    const trajeto=await evaluate(`new Promise(resolve=>{const roda=document.querySelector('.acessorios-roda'),raio=parseFloat(getComputedStyle(roda).getPropertyValue('--raio-roda')),inicio=parseFloat(getComputedStyle(roda).getPropertyValue('--giro-acessorios'));const amostras=[];document.getElementById('roda-dedo1').click();const destino=rotacaoAcessorios;function quadro(){const r=roda.getBoundingClientRect(),giro=parseFloat(getComputedStyle(roda).getPropertyValue('--giro-acessorios'));amostras.push({giro,distancias:[...roda.querySelectorAll('[data-acessorio-roda]')].map(b=>{const a=b.getBoundingClientRect();return Math.hypot(a.x+a.width/2-r.x-r.width/2,a.y+a.height/2-r.y-r.height/2)})});if(amostras.length<32)requestAnimationFrame(quadro);else resolve({raio,inicio,destino,amostras});}requestAnimationFrame(quadro);})`);
    assert.ok(trajeto.amostras.some(a=>Math.abs(a.giro-trajeto.inicio)>1&&Math.abs(a.giro-trajeto.destino)>1),'A roda passa por ângulos intermediários');
    assert.ok(trajeto.amostras.every(a=>a.distancias.every(d=>Math.abs(d-trajeto.raio)<1.5)),'Todos os acessórios mantêm o raio durante o giro, sem atravessar o círculo');
    await esperar(`(()=>{const a=document.getElementById('roda-dedo1').getBoundingClientRect(),r=document.querySelector('.acessorios-roda').getBoundingClientRect();return a.x+a.width/2>r.x+r.width*.75&&Math.abs(a.y+a.height/2-r.y-r.height/2)<2})()`);
    assert.equal(await evaluate(`document.getElementById('acessorio-painel-dedo1').hidden`),false);
    assert.ok(await evaluate(`(()=>{const a=document.getElementById('roda-dedo1').getBoundingClientRect(),r=document.querySelector('.acessorios-roda').getBoundingClientRect();return a.x+a.width/2>r.x+r.width*.75&&Math.abs(a.y+a.height/2-r.y-r.height/2)<2})()`),'Selecionado chega à direita da roda');
    await evaluate(`document.getElementById('puxaCorteUsar').click()`);
    assert.ok(await evaluate(`document.getElementById('puxaCorteUsar').getAnimations().some(a=>a.playState!=='finished')`),'Usar ilumina o botão');
    assert.ok(await evaluate(`document.querySelector('#acessorio-painel-dedo1 h5').getAnimations().length>0`),'Usar ilumina o nome');
    assert.equal(await evaluate(`document.querySelectorAll('.acessorio-ghost[aria-hidden="true"]').length`),1,'Ghost decorativo sem duplicar controles');
    const ghostY=await evaluate(`document.querySelector('.acessorio-ghost').getBoundingClientRect().top`);await sleep(120);
    assert.ok(await evaluate(`document.querySelector('.acessorio-ghost').getBoundingClientRect().top<${ghostY}-1`),'Ghost sobe a partir do botão');
    for(let i=1;i<5;i++)await evaluate(`document.getElementById('puxaCorteUsar').click()`);
    assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_puxa_corte_cargas')`),'0');
    assert.equal(await evaluate(`document.getElementById('puxaCorteUsar').disabled`),true);
    await evaluate(`document.getElementById('puxaCorteRecarregar').click()`);
    assert.ok(await evaluate(`document.getElementById('acessorio-painel-dedo1').getAnimations().some(a=>a.playState!=='finished')`),'Recarregar ilumina todo o painel, incluindo nome e descrição');
    assert.equal(await evaluate(`window.alertasAcessorios`),0,'Uso e recarga não abrem alerts');
    await esperar(`document.getElementById('acessorio-painel-dedo1').getAnimations().length===0&&document.getElementById('puxaCorteUsar').getAnimations().length===0&&!document.querySelector('.acessorio-ghost')`);
    assert.equal(await evaluate(`getComputedStyle(document.getElementById('acessorio-painel-dedo1')).filter`),'none','O painel retorna ao visual original');
    assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_puxa_corte_cargas')`),'5');
    await evaluate(`document.getElementById('roda-dedo2').click();equiparAcessorioSlot('dedo2','Puxa Corte')`);
    assert.equal(await evaluate(`estado.acessoriosEquipados.dedo2`),null);
    await evaluate(`document.getElementById('roda-pes').click();const s=document.querySelector('select[data-slot="pes"]');s.value=ACESSORIOS.find(a=>categoriaAcessorio(a)==='Botas').nome;s.dispatchEvent(new Event('change'))`);await sleep(100);
    assert.ok(await evaluate(`estado.acessoriosEquipados.pes`));
    assert.equal(await evaluate(`document.getElementById('acessorio-painel-pes').hidden`),false);
    await evaluate(`window.alertasAcessorios=0;const p=document.querySelector('#acessorio-painel-pes .acessorio-acao-btn');p.click()`);
    assert.ok(await evaluate(`document.querySelector('#acessorio-painel-pes .acessorio-acao-btn').getAnimations().length>0`),'Acessório genérico ilumina o botão');
    assert.equal(await evaluate(`window.alertasAcessorios`),0);
    await evaluate(`document.getElementById('roda-pes').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))`);await sleep(750);
    assert.equal(await evaluate(`document.activeElement.id`),'roda-pulsos');
    await evaluate(`selecionarAcessorioRoda('cabeca')`);await sleep(70);
    await evaluate(`selecionarAcessorioRoda('dedo2')`);await sleep(70);
    await evaluate(`selecionarAcessorioRoda('costas')`);
    await esperar(`quadroRodaAcessorios===null`);
    assert.ok(await evaluate(`(()=>{const a=document.getElementById('roda-costas').getBoundingClientRect(),r=document.querySelector('.acessorios-roda').getBoundingClientRect();return Math.abs(a.y+a.height/2-r.y-r.height/2)<2&&a.x>r.x+r.width/2})()`),'Cliques rápidos mantêm a última seleção à direita');
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    const reduzido=await evaluate(`new Promise(resolve=>{const r=document.querySelector('.acessorios-roda'),inicio=Number(r.dataset.giroAtual);selecionarAcessorioRoda('pes');requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({inicio,atual:Number(r.dataset.giroAtual),animando:quadroRodaAcessorios!==null})));})`);
    assert.notEqual(reduzido.inicio,reduzido.atual,'Movimento reduzido ainda permite o giro solicitado');
    await esperar(`quadroRodaAcessorios===null`);
    await send('Emulation.setEmulatedMedia',{features:[]});
    await evaluate(`equiparAcessorioSlot('cabeca','Puxa Corte')`);assert.equal(await evaluate(`estado.acessoriosEquipados.cabeca`),null);
    await evaluate(`selecionarAcessorioRoda('dedo1')`);await sleep(750);
    const screenshot=async name=>{const clip=await evaluate(`(()=>{const r=document.querySelector('.ficha-acessorios-equipados').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);const shot=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});const file=path.join(profile,name+'.png');fs.writeFileSync(file,Buffer.from(shot.data,'base64'));console.log(file);};
    await screenshot('acessorios-escuro');
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,tema:'claro',idioma:'en'}));aplicarPreferencias()`);await sleep(150);await screenshot('acessorios-claro');
    assert.ok(await evaluate(`document.getElementById('acessorio-painel-dedo1').textContent.includes('Charges')`));
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await sleep(150);
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),'Sem rolagem horizontal no celular');
    await screenshot('acessorios-celular');
    await evaluate(`ACESSORIOS.find(a=>a.nome==='Puxa Corte').imagem='assets/images/LogoT.png';renderFicha()`);await esperar(`document.querySelector('#roda-dedo1 img')?.naturalWidth>0`);
    await send('Page.reload');await esperar(`document.readyState==='complete'&&document.querySelector('[data-acessorio-roda]')`);assert.equal(await evaluate(`estado.acessoriosEquipados.dedo1`),'Puxa Corte');assert.ok(await evaluate(`estado.acessoriosEquipados.pes`));
    await evaluate(`selecionarAcessorioRoda('dedo1')`);await esperar(`quadroRodaAcessorios===null`);assert.equal(await evaluate(`document.getElementById('acessorio-painel-dedo1').hidden`),false);
    await send('Page.navigate',{url:origin+'/pages/livro.html'});await esperar(`document.readyState==='complete'&&typeof renderAcessorios==='function'`);
    await evaluate(`renderAcessorios('')`);await sleep(100);
    assert.ok(await evaluate(`document.querySelectorAll('.livro-grupo-acessorios').length>5`));
    assert.equal(await evaluate(`document.querySelectorAll('.livro-grupo-acessorios .livro-card').length`),await evaluate(`ACESSORIOS.length`));
    await evaluate(`pesquisar('Rings')`);await sleep(100);assert.ok(await evaluate(`document.querySelector('.livro-grupo-acessorios')?.textContent.includes('Rings')`));
    await send('Page.navigate',{url:origin+'/pages/tela3.html'});await esperar(`document.readyState==='complete'&&typeof renderLista==='function'`);
    await evaluate(`abaAtiva='acessorios';renderLista()`);await sleep(100);
    assert.ok(await evaluate(`document.querySelectorAll('.t3-categoria').length>5`));
    assert.ok(await evaluate(`[...document.querySelectorAll('.t3-categoria')].some(el=>el.textContent==='Rings')`));
    assert.deepEqual(errors,[]);console.log('OK: categorias no livro/criação, roda, teclado, cargas/recarga, compatibilidade, imagens opcionais, persistência e celular/temas/idiomas.');return;
  }
  if(process.argv.includes('--game-i18n')) {
    const language=async lang=>{await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:${JSON.stringify(lang)}}));aplicarPreferencias()`);await sleep(120);};
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}))`);
    await send('Page.navigate',{url:origin+'/pages/tela1.html'});
    await esperar(`document.readyState==='complete'&&document.body.textContent.includes('Warrior')`);
    for(const name of ['Warrior','Shadow','Swordsman','Bard','Mage'])assert.ok(await evaluate(`document.body.textContent.includes(${JSON.stringify(name)})`),name);
    await language('es');for(const name of ['Guerrero','Oscuro','Espadachín','Bardo','Mago'])assert.ok(await evaluate(`document.body.textContent.includes(${JSON.stringify(name)})`),name);
    await language('en');
    await evaluate(`const fixture=document.createElement('div');fixture.id='i18nFixture';fixture.innerHTML='<button id="i18nLock" title="Travar imagem">Salvar</button><select id="i18nOption"><option>Guerreiro</option></select>';document.body.append(fixture)`);await sleep(100);
    assert.equal(await evaluate(`document.getElementById('i18nOption').value`),'Guerreiro');
    assert.equal(await evaluate(`document.getElementById('i18nOption').options[0].textContent`),'Warrior');
    assert.equal(await evaluate(`document.getElementById('i18nLock').title`),'Lock image');
    await evaluate(`document.getElementById('i18nLock').title='Destravar imagem'`);await sleep(100);
    assert.equal(await evaluate(`document.getElementById('i18nLock').title`),'Unlock image');
    await language('pt-BR');assert.equal(await evaluate(`document.getElementById('i18nLock').title`),'Destravar imagem');
    await language('en');
    await evaluate(`abrirPreviewClasse('Guerreiro',document.querySelector('[data-classe="Guerreiro"]'))`);
    await esperar(`document.querySelector('#pcConstanciasEscolha .popup-tag')`);
    const key=await evaluate(`CLASSES_PREVIEW.Guerreiro.constanciasEscolha[0]`);
    await evaluate(`toggleConstanciaPopup(${JSON.stringify(key)})`);
    assert.equal(await evaluate(`estado.constanciasEscolhidas.includes(${JSON.stringify(key)})`),true);
    await evaluate(`estado.constanciasEscolhidas=CLASSES_PREVIEW.Guerreiro.constanciasEscolha.slice(0,CLASSES_PREVIEW.Guerreiro.constanciasEscolhaQtd||2);estado.proficienciasGuerreiro={conhecimentos:['espadas-leves','macas-leves'],familiaridade:'Maças Pesadas'};confirmarClassePopup();salvarEstado()`);
    assert.equal(await evaluate(`estado.classe`),'Guerreiro');
    await evaluate(`sessionStorage.setItem('fragmentados_estado',JSON.stringify({...criarEstadoInicial(),classe:'Guerreiro',nivel:1,nomePersonagem:'Guerreiro',raca:'Humano',arma:'Ferroada'}))`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});
    await esperar(`document.readyState==='complete'&&!!document.getElementById('pvAtual')`);
    assert.ok(await evaluate(`document.body.textContent.includes('Warrior')&&document.body.textContent.includes('Strength')`));
    assert.equal(await evaluate(`estado.classe`),'Guerreiro');
    assert.equal(await evaluate(`document.querySelector('input[maxlength="30"]').value`),'Guerreiro');
    const before=await evaluate(`[calcularPV(),calcularPE(),calcularCAAutomatica()]`);
    await language('es');assert.ok(await evaluate(`document.body.textContent.includes('Guerrero')`));
    assert.deepEqual(await evaluate(`[calcularPV(),calcularPE(),calcularCAAutomatica()]`),before);
    await language('pt-BR');assert.ok(await evaluate(`document.body.textContent.includes('Guerreiro')`));
    await language('en');
    await send('Page.navigate',{url:origin+'/pages/livro.html'});
    await esperar(`document.readyState==='complete'&&typeof pesquisar==='function'&&!!window.PrimordiosI18n`);
    await evaluate(`pesquisar('Warrior')`);await sleep(150);
    assert.ok(await evaluate(`document.getElementById('livroConteudo').textContent.includes('Warrior')&&!document.getElementById('livroConteudo').textContent.includes('Nenhum resultado')`));
    assert.ok(await evaluate(`document.querySelector('#livroConteudo mark')?.textContent.toLowerCase()==='warrior'`));
    assert.ok(await evaluate(`Array.from(document.querySelectorAll('#livroConteudo .livro-card-titulo')).some(el=>el.textContent==='Warrior')`),'Busca traduzida inclui a categoria Classes');
    for(const lang of ['en','es']){
      await language(lang);
      const catalog=require('../locales/content.json')[lang];
      for(const [render,expression] of [['renderClasses','CLASSES_PREVIEW.Guerreiro.desc'],['renderHabilidades','HABILIDADES.Guerreiro.base[0].nome'],['renderArmaduras',"ARMADURAS.find(a=>a.nome==='Armadura de Placas').nome"]]){
        const source=await evaluate(expression),expected=catalog[source.normalize('NFC').replace(/\s+/g,' ').trim()];assert.ok(expected,'Tradução no catálogo: '+source);
        await evaluate(`${render}('')`);await sleep(80);
        assert.ok(await evaluate(`document.getElementById('livroConteudo').textContent.includes(${JSON.stringify(expected)})`),lang+': '+render);
      }
      await evaluate(`for(const render of Object.values(RENDERS))render('')`);await sleep(100);
    }
    await language('es');await evaluate(`pesquisar('Guerrero')`);await sleep(150);assert.ok(await evaluate(`document.getElementById('livroConteudo').textContent.includes('Guerrero')`));
    await evaluate(`localStorage.setItem('primordios_personagens_teste',JSON.stringify([{nomePersonagem:'Sair',classe:'Guerreiro',desc:'Salvar Guerreiro',nivel:1,estadoCompleto:{classe:'Guerreiro'}}]))`);
    await send('Page.navigate',{url:origin+'/pages/inventario.html'});await esperar(`document.querySelector('.inv-card-nome')&&document.readyState==='complete'`);
    await language('en');assert.equal(await evaluate(`document.querySelector('.inv-card-nome').textContent`),'Sair');assert.equal(await evaluate(`document.querySelector('.inv-card-desc').textContent`),'Salvar Guerreiro');assert.ok(await evaluate(`document.querySelector('.inv-card-classe').textContent.includes('Warrior')`));
    assert.deepEqual(errors,[]);console.log('OK: classes, ficha, livro e busca em inglês/espanhol; retorno ao português; IDs, nomes/anotações e cálculos preservados.');return;
  }
  if(process.argv.includes('--audio-continuity')) {
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:true,musicaAtiva:true,musicaIdx:0,volume:20}));sessionStorage.removeItem('primordios_audio_estado');sessionStorage.setItem('primordios_audio_pos','29')`);
    await send('Page.navigate',{url:origin+'/pages/tela1.html'});
    await esperar(`location.pathname.endsWith('/tela1.html')&&!!window.AudioPrimordios&&Number.isFinite(_primordiosAudio.duration)&&_primordiosAudio.duration>45`);
    await esperar(`!_primordiosAudio.seeking&&_primordiosAudio.currentTime>=29`);
    assert.equal(await evaluate(`sessionStorage.getItem('primordios_audio_pos')`),null);
    await esperar(`document.getElementById('vinil-container')?.classList.contains('vinil-visivel')`);
    await evaluate(`_primordiosAudio.currentTime=37`);await esperar(`!_primordiosAudio.seeking&&_primordiosAudio.currentTime>=37`);
    await evaluate(`AudioPrimordios.salvarPosicao()`);
    for(const page of ['configuracoes.html','editor-mapa.html','inventario.html','configurar-perfil.html']){
      const before=await evaluate(`JSON.parse(sessionStorage.getItem('primordios_audio_estado')).segundos`);
      await send('Page.navigate',{url:origin+'/pages/'+page});
      await esperar(`location.pathname.endsWith('/${page}')&&!!window.AudioPrimordios&&Number.isFinite(_primordiosAudio.duration)&&!_primordiosAudio.seeking&&_primordiosAudio.currentTime>=${before}-.5`);
      assert.ok(await evaluate(`_primordiosAudio.currentTime>=36`));
    }
    await send('Page.navigate',{url:origin+'/pages/configuracoes.html'});
    await esperar(`location.pathname.endsWith('/configuracoes.html')&&!!window.AudioPrimordios&&_primordiosAudio.currentTime>=36&&!_primordiosAudio.seeking`);
    await evaluate(`salvarConfig('musicaAtiva',false)`);const paused=await evaluate(`_primordiosAudio.currentTime`);
    await evaluate(`alternarMusica()`);await esperar(`!_primordiosAudio.paused`);assert.ok(await evaluate(`_primordiosAudio.currentTime>=${paused}-.5`));
    await evaluate(`salvarConfig('musicaIdx',1);AudioPrimordios.carregar(1,false)`);
    await esperar(`Number.isFinite(_primordiosAudio.duration)&&!_primordiosAudio.seeking&&_primordiosAudio.src.includes('Tocarein')`);assert.ok(await evaluate(`_primordiosAudio.currentTime<3`));
    assert.deepEqual(errors,[]);console.log('OK: música retoma a posição entre configurações, editor, inventário e perfil; pausar/ativar não reinicia; trocar faixa começa do zero.');return;
  }
  if(process.argv.includes('--audio')) {
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({musicaAtiva:true,volume:20}))`);
    await send('Page.navigate',{url:origin+'/pages/tela1.html'});
    await esperar(`document.getElementById('consentimentoAudio')?.open`);
    assert.equal(await evaluate(`_primordiosAudio.paused`),true);
    await evaluate(`document.getElementById('audioSemSom').click()`);
    assert.equal(await evaluate(`ConsentimentoAudio.permitido()`),false);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_config')).musicaAtiva`),false);
    await evaluate(`window.__aguardandoReloadAudio=true`);
    await send('Page.reload');await esperar(`window.__aguardandoReloadAudio!==true && document.readyState==='complete' && !!window.ConsentimentoAudio && !!window.AudioPrimordios`);
    assert.equal(await evaluate(`!!document.getElementById('consentimentoAudio')?.open`),false);
    await evaluate(`void ConsentimentoAudio.pedir()`);
    await esperar(`document.getElementById('consentimentoAudio').open`);
    await evaluate(`document.getElementById('audioPermitir').click()`);
    assert.equal(await evaluate(`ConsentimentoAudio.permitido()`),true);
    assert.equal(await evaluate(`_primordiosAudio.src.includes('Espera.mp3')`),true);
    await send('Page.navigate',{url:origin+'/pages/configuracoes.html'});await esperar(`location.pathname.endsWith('/configuracoes.html') && document.readyState==='complete' && !!window.ConsentimentoAudio && !!window.AudioPrimordios && typeof config!=='undefined'`);
    await evaluate(`void ConsentimentoAudio.pedir();document.getElementById('audioSemSom').click()`);
    assert.equal(await evaluate(`_primordiosAudio.paused`),true);
    assert.equal(await evaluate(`config.musicaAtiva`),false);
    assert.deepEqual(errors,[]);
    console.log('OK: consentimento inicial, áudio bloqueado antes da escolha, recusa persistente, ativação e revogação nas configurações.');
    return;
  }
  if (process.argv.includes('--interface')) {
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false}));localStorage.setItem('primordios_usuarios',JSON.stringify([{usuario:'teste',senha:'teste123'}]));localStorage.setItem('primordios_personagens_teste',JSON.stringify([{nomePersonagem:'Sair',classe:'Guerreiro',desc:'<img id="htmlIndevido" src="x">',estadoCompleto:{classe:'Guerreiro'}}]))`);
    await send('Page.navigate',{url:origin+'/pages/inventario.html'});
    await esperar(`!!document.querySelector('.inv-card-nome') && document.readyState==='complete'`);
    assert.equal(await evaluate(`!!document.getElementById('htmlIndevido')`),false);
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}));aplicarPreferencias()`);
    assert.equal(await evaluate(`document.querySelector('.inv-card-nome').textContent`),'Sair');
    await send('Page.navigate',{url:origin+'/pages/configuracoes.html'});
    await esperar(`!!window.AudioPrimordios && document.readyState==='complete'`);
    assert.equal(await evaluate(`window._primordiosAudio===document.getElementById('audioPlayer')`),true);
    await evaluate(`ConsentimentoAudio.pedir();document.getElementById('audioPermitir').click();salvarConfig('musicaAtiva',true)`);
    assert.equal(await evaluate(`window._primordiosAudio.src.includes('Espera.mp3')`),true);
    await evaluate(`salvarConfig('volume',37);salvarConfig('modo','aleatoria')`);
    assert.equal(await evaluate(`window._primordiosAudio.volume`),0.37);
    await evaluate(`salvarConfig('musicaAtiva',false)`);
    assert.equal(await evaluate(`window._primordiosAudio.paused`),true);
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,...config,musicaAtiva:true,musicaIdx:1}));window.dispatchEvent(new StorageEvent('storage',{key:'primordios_config'}))`);
    assert.equal(await evaluate(`decodeURIComponent(window._primordiosAudio.src).includes('TocareinNossaCanção.MP3')`),true);
    await evaluate(`salvarConfig('musicaAtiva',false);localStorage.setItem('primordios_config','{inválido');carregarConfig()`);
    // Exclusão remove mapas/recursos apenas da conta selecionada.
    await evaluate(`(async()=>{const db=await abrirBancoMapas();await new Promise((r,j)=>{const tx=db.transaction(['mapas','recursos'],'readwrite');for(const usuario of ['teste','outra']){tx.objectStore('mapas').put({chave:JSON.stringify([usuario,'mapa']),usuario});tx.objectStore('recursos').put({id:usuario,usuario});}tx.oncomplete=r;tx.onerror=j;});db.close();await excluirDadosMapas('teste');})()`);
    assert.deepEqual(await evaluate(`(async()=>{const db=await abrirBancoMapas();const dados=await Promise.all(['mapas','recursos'].map(store=>new Promise(r=>{const q=db.transaction(store).objectStore(store).getAll();q.onsuccess=()=>r(q.result.map(x=>x.usuario));})));db.close();return dados;})()`),[['outra'],['outra']]);
    assert.deepEqual(errors,[]);
    console.log('OK: HTML escapado, nome preservado na tradução, áudio compartilhado/volume/ativação entre abas, JSON inválido e exclusão isolada de mapas/recursos.');
    return;
  }
  if(process.argv.includes('--pe') || process.argv.includes('--ficha') || process.argv.includes('--foto') || process.argv.includes('--temporary-pe')) {
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false}));sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Bardo',nivel:7,nomePersonagem:'Teste PE'}));sessionStorage.setItem('fragmentados_pe','100');sessionStorage.setItem('fragmentados_pemax','100');`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});
    for(let i=0;i<100;i++){await sleep(100);if(await evaluate(`!!document.getElementById('peAtual')`))break;}
    await evaluate(`window.alert=m=>(window.ultimoAlerta=m)`);
    if(process.argv.includes('--temporary-pe')){
      const read=()=>evaluate(`({normal:peAtual.textContent,bonus:peTemporarios.textContent,hidden:peTemporarios.hidden,total:sessionStorage.getItem('fragmentados_pe'),green:peAtual.classList.contains('pe-com-temporarios')})`);
      await evaluate(`definirPEMaxFicha(20);alterarPE(15)`);
      assert.deepEqual(await read(),{normal:'20',bonus:'+15',hidden:false,total:'35',green:true});
      assert.equal(await evaluate(`getComputedStyle(peTemporarios).color`),'rgb(94, 217, 154)');
      await evaluate(`gastarPE(10)`);assert.deepEqual(await read(),{normal:'20',bonus:'+5',hidden:false,total:'25',green:true});
      await evaluate(`renderFicha()`);assert.equal((await read()).bonus,'+5');
      const epoch=await evaluate('performance.timeOrigin');await send('Page.reload');await esperar(`performance.timeOrigin!==${epoch}&&!!document.getElementById('peTemporarios')&&document.readyState==='complete'`);
      assert.deepEqual(await read(),{normal:'20',bonus:'+5',hidden:false,total:'25',green:true});
      await evaluate(`gastarPE(8)`);assert.deepEqual(await read(),{normal:'17',bonus:'+0',hidden:true,total:'17',green:false});
      await evaluate(`definirPEMaxFicha(10);alterarPE(7)`);
      assert.equal(await evaluate(`ajustarRecursoFicha('pe',5)`),0);assert.equal((await read()).total,'17');
      await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({tema:'claro',audioPermitido:false}));aplicarPreferencias()`);
      assert.equal(await evaluate(`getComputedStyle(peTemporarios).color`),'rgb(36, 118, 76)');
      await evaluate(`estado.classe='Mago';renderFicha()`);assert.equal((await read()).bonus,'+7');
      assert.ok(await evaluate(`document.getElementById('fichaConteudo').textContent.includes('MANA')`));
      await evaluate(`alterarPE(-100)`);assert.equal((await read()).normal,'0');assert.equal((await read()).hidden,true);
      await evaluate(`definirPEMaxFicha(12)`);assert.equal((await read()).normal,'12');assert.equal((await read()).hidden,true);
      assert.deepEqual(errors,[]);console.log('OK: PE temporário verde, gasto prioriza excedente, render/reload preservam, recuperação não reduz excedente, Mana e tema claro, zero e ajuste do máximo.');return;
    }
    if(process.argv.includes('--foto')) {
      await evaluate(`window.enviarFotoTeste=async(tipo='image/png')=>{const c=document.createElement('canvas');c.width=800;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,200,400);ctx.fillStyle='lime';ctx.fillRect(200,0,400,400);ctx.fillStyle='blue';ctx.fillRect(600,0,200,400);const blob=await new Promise(r=>c.toBlob(r));const dt=new DataTransfer();dt.items.add(new File([blob],'retrato.png',{type:tipo}));const input=document.getElementById('fotoInput');input.files=dt.files;input.dispatchEvent(new Event('change'));};enviarFotoTeste()`);
      await esperar(`document.getElementById('recorteFoto')?.open && !document.getElementById('recorteFotoAplicar').disabled`);
      assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_foto')`),null);
      assert.deepEqual(await evaluate(`Array.from(document.getElementById('recorteFotoCanvas').getContext('2d').getImageData(5,250,1,1).data)`),[0,255,0,255]);
      const rect=await evaluate(`(()=>{const r=document.getElementById('recorteFotoCanvas').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width};})()`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',buttons:1});
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+rect.w/3,y:rect.y,button:'left',buttons:1});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x+rect.w/3,y:rect.y,button:'left',buttons:0});
      assert.deepEqual(await evaluate(`Array.from(document.getElementById('recorteFotoCanvas').getContext('2d').getImageData(5,250,1,1).data)`),[255,0,0,255]);
      await evaluate(`const z=document.getElementById('recorteFotoZoom');z.value='2';z.dispatchEvent(new Event('input'));document.getElementById('recorteFotoAplicar').click()`);
      await esperar(`!document.getElementById('recorteFoto').open && !!document.querySelector('.foto-moldura img')`);
      assert.deepEqual(await evaluate(`(async()=>{const img=new Image();img.src=sessionStorage.getItem('fragmentados_foto');await img.decode();return [img.naturalWidth,img.naturalHeight];})()`),[500,500]);
      const salva=await evaluate(`sessionStorage.getItem('fragmentados_foto')`);
      await evaluate(`enviarFotoTeste()`);
      await esperar(`document.getElementById('recorteFoto').open && !document.getElementById('recorteFotoAplicar').disabled`);
      await evaluate(`document.getElementById('recorteFotoCancelar').click()`);
      assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_foto')`),salva);
      await evaluate(`enviarFotoTeste('text/plain')`);
      await esperar(`document.getElementById('recorteFoto').open`);
      assert.equal(await evaluate(`document.getElementById('recorteFotoAplicar').disabled`),true);
      await evaluate(`document.getElementById('recorteFotoCancelar').click()`);
      await send('Page.reload');await esperar(`!!document.querySelector('.foto-moldura img') && document.readyState==='complete'`);
      assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_foto')`),salva);
      assert.equal(await evaluate(`!!document.querySelector('.foto-moldura svg')`),false);
      assert.deepEqual(errors,[]);
      console.log('OK: modal de recorte, enquadramento quadrado, arrasto real, zoom, imagem 500×500, cancelamento, mesmo arquivo, arquivo inválido e persistência.');
      return;
    }
    const casos=[
      ['Bardo','Bravura',6,'Ataque Extra',4],['Bardo','Bravura',9,'Ataque Extra',8],
      ['Bardo','Bravura',13,'Ataque Extra',12],['Bardo','Bravura',20,'Ataque Extra',12],
      ['Guerreiro',null,5,'Ataque Extra',4],['Guerreiro',null,9,'Ataque Extra',8],
      ['Guerreiro',null,15,'Ataque Extra',14],['Guerreiro',null,20,'Ataque Extra',14],
      ['Bardo',null,1,'Canção de Cura',2],['Bardo',null,5,'Canção de Cura',2],
      ['Bardo',null,6,'Canção de Cura',4],['Bardo',null,20,'Canção de Cura',4],
      ['Bardo',null,2,'Canção Bárbica',1],['Bardo',null,3,'Canção Bárbica',1],
      ['Bardo',null,6,'Canção Bárbica',1],['Bardo',null,9,'Canção Bárbica',1],
      ['Bardo',null,11,'Canção Bárbica',1],['Bardo',null,20,'Canção Bárbica',1],
      ['Bardo',null,7,'Inspirar Confiança',2],['Bardo',null,20,'Inspirar Confiança',2],
      ['Bardo','Vigor',9,'Toque Acolhedor',8],['Bardo','Vigor',13,'Toque Acolhedor',12],
      ['Bardo','Vigor',17,'Toque Acolhedor',16],['Bardo','Vigor',17,'Ajuda Temporária',16],
      ['Guerreiro',null,2,'Ataque Preciso',1],['Guerreiro',null,3,'Ataque Preciso',2],
      ['Guerreiro',null,6,'Ataque Preciso',4],['Guerreiro',null,9,'Ataque Preciso',8],
      ['Guerreiro',null,11,'Ataque Preciso',10],['Guerreiro',null,7,'Pancada Potente',6],
      ['Guerreiro','Capitão',13,'Revigorar',12],['Guerreiro','Capitão',15,'Revigorar',14],
      ['Guerreiro','Capitão',17,'Revigorar',16],['Bardo',null,3,'Canção Bárbica',1],
    ];
    for(const [classe,caminho,nivel,nome,custo] of casos) {
      const resultado=await evaluate(`(()=>{Object.assign(estado,{classe:${JSON.stringify(classe)},caminho:${JSON.stringify(caminho)},nivel:${nivel}});renderFicha();sessionStorage.setItem('fragmentados_pe','100');document.getElementById('peAtual').textContent='100';const linha=[...document.querySelectorAll('.ficha-hab-item')].find(l=>l.querySelector('.ficha-hab-nome')?.textContent.trim().startsWith(${JSON.stringify(nome+' ')}));if(!linha)throw Error('Habilidade não encontrada: '+${JSON.stringify(nome)});const botao=linha.querySelector('button');if(!botao)throw Error('Botão ausente: '+${JSON.stringify(nome)});const titulo=botao.title;botao.click();return {titulo,pe:+sessionStorage.getItem('fragmentados_pe'),texto:+document.getElementById('peAtual').textContent};})()`);
      assert.equal(resultado.titulo,`Gastar ${custo} PE ao usar esta habilidade`,`${nome} nível ${nivel}`);
      assert.equal(resultado.pe,100-custo);assert.equal(resultado.texto,100-custo);
    }
    await evaluate(`Object.assign(estado,{classe:'Bardo',nivel:7,caminho:null});renderFicha();sessionStorage.setItem('fragmentados_pe','5');document.getElementById('peAtual').textContent='5';[...document.querySelectorAll('.ficha-hab-item')].find(l=>l.textContent.includes('Inspirar Confiança')).querySelector('button').click()`);
    assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_pe')`),'5');
    assert.equal(await evaluate(`document.querySelector('.aviso-pe')?.textContent`),'PE insuficiente');
    assert.equal(await evaluate(`window.ultimoAlerta`),undefined);
    await evaluate(`const linha=[...document.querySelectorAll('.ficha-hab-item')].find(l=>l.textContent.includes('Inspirar Confiança'));linha.querySelector('button').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.aviso-pe').length`),1);
    await evaluate(`sessionStorage.setItem('fragmentados_pe','10');document.getElementById('peAtual').textContent='10';[...document.querySelectorAll('.ficha-hab-item')].find(l=>l.textContent.includes('Inspirar Confiança')).querySelector('button').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.aviso-pe').length`),0);
    assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_pe')`),'4');
    await evaluate(`definirPVMaxFicha(30);alterarPV(15)`);
    const lerPV=()=>evaluate(`({normal:document.getElementById('pvAtual').textContent,bonus:document.getElementById('pvTemporarios').textContent,oculto:document.getElementById('pvTemporarios').hidden,azul:document.getElementById('pvAtual').classList.contains('pv-com-temporarios'),total:sessionStorage.getItem('fragmentados_pv')})`);
    assert.deepEqual(await lerPV(),{normal:'30',bonus:'+15',oculto:false,azul:true,total:'45'});
    await evaluate('alterarPV(-10)');assert.deepEqual(await lerPV(),{normal:'30',bonus:'+5',oculto:false,azul:true,total:'35'});
    await evaluate('renderFicha()');assert.equal((await lerPV()).bonus,'+5');
    await send('Page.reload');await esperar(`!!document.getElementById('pvTemporarios') && document.readyState==='complete'`);
    assert.deepEqual(await lerPV(),{normal:'30',bonus:'+5',oculto:false,azul:true,total:'35'});
    await evaluate('alterarPV(-5)');assert.deepEqual(await lerPV(),{normal:'30',bonus:'+0',oculto:true,azul:false,total:'30'});
    await evaluate('alterarPV(-8)');assert.equal((await lerPV()).normal,'22');
    await evaluate('alterarPV(13)');assert.equal((await lerPV()).bonus,'+5');
    assert.equal(await evaluate(`ajustarRecursoFicha('pv',10)`),0);
    assert.equal((await lerPV()).total,'35');
    await evaluate('alterarPV(-100);renderFicha()');assert.equal((await lerPV()).normal,'0');
    await evaluate('alterarPV(45);definirPVMaxFicha(40)');assert.deepEqual(await lerPV(),{normal:'40',bonus:'+0',oculto:true,azul:false,total:'40'});
    assert.equal(await evaluate(`!![...document.querySelectorAll('.ficha-hab-item')].find(l=>l.textContent.includes('Grimório Arcano'))?.querySelector('button')`),false);
    if (process.argv.includes('--ficha')) {
      await evaluate(`Object.assign(estado,{classe:'Guerreiro',nivel:1,armadura:null,ganhosNivel:{},constancias:{Vigor:0,Destreza:0,Sabedoria:0,'Inteligência':0,'Força':0,Carisma:0}});sessionStorage.setItem('fragmentados_pvmax','30');sessionStorage.setItem('fragmentados_pemax','10');sessionStorage.setItem('fragmentados_pv','0');sessionStorage.setItem('fragmentados_pe','0');renderFicha();fichaAlterarNivel(1)`);
      const ganhos = await evaluate(`({pv:+sessionStorage.getItem('fragmentados_pvmax')-30,pe:+sessionStorage.getItem('fragmentados_pemax')-10})`);
      assert.equal(await evaluate(`+sessionStorage.getItem('fragmentados_pv')`),ganhos.pv);
      assert.equal(await evaluate(`+sessionStorage.getItem('fragmentados_pe')`),ganhos.pe);
      await evaluate(`fichaAlterarNivel(-1)`);
      assert.equal(await evaluate(`+sessionStorage.getItem('fragmentados_pvmax')`),30);
      assert.equal(await evaluate(`+sessionStorage.getItem('fragmentados_pv')`),0);
      assert.equal(await evaluate(`+sessionStorage.getItem('fragmentados_pe')`),0);
      await send('Page.reload');await esperar(`!!document.getElementById('pvAtual') && document.readyState==='complete'`);
      await evaluate(`fichaAlterarNivel(1)`);
      assert.equal(await evaluate(`+sessionStorage.getItem('fragmentados_pvmax')`),30+ganhos.pv);
      await evaluate(`fichaAlterarNivel(-1);setXP(1050)`);
      assert.equal(await evaluate(`estado.nivel`),3);
      assert.equal(await evaluate(`+sessionStorage.getItem('fragmentados_xp')`),250);
      assert.ok(Math.abs(await evaluate(`parseFloat(document.getElementById('xpBarra').style.width)`)-250/700*100)<0.01);
      assert.equal(await evaluate(`(()=>{const nivel=estado.nivel;estado.nivel=10;const pe=calcularPE();const esperado=1+Array.from({length:9},(_,i)=>bonusDeClasse(i+2)).reduce((a,b)=>a+b,0);estado.nivel=nivel;return pe===esperado;})()`),true);
      await evaluate(`sessionStorage.removeItem('fragmentados_ca_ajuste');sessionStorage.removeItem('fragmentados_ca');estado.armadura=null;renderFicha();estado.armadura='Armadura de Placas';renderFicha()`);
      assert.equal(await evaluate(`+document.getElementById('caValor').textContent`),14);
      assert.equal(await evaluate(`document.getElementById('caValor').classList.contains('ca-com-armadura')`),true);
      assert.equal(await evaluate(`getComputedStyle(document.getElementById('caValor')).color`),'rgb(166, 166, 173)');
      await evaluate(`definirCAFicha(17);estado.armadura=null;renderFicha()`);
      assert.equal(await evaluate(`+document.getElementById('caValor').textContent`),13);
      const id = await evaluate(`estado.id`);
      await evaluate(`estado.nomePersonagem='Renomeado';sincronizarPersonagem()`);
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_personagens_teste')).find(p=>p.id===${JSON.stringify(id)}).nomePersonagem`),'Renomeado');
      await evaluate(`sessionStorage.setItem('fragmentados_pv','11');localStorage.setItem('fragmentados_pv','99')`);
      assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_pv')`),'11');
      await evaluate(`sessionStorage.setItem('fragmentados_pce','9');sessionStorage.setItem('fragmentados_const_checks','{"Atletismo":true}');novoPersonagem()`);
      await esperar(`location.pathname.endsWith('/tela1.html') && document.readyState==='complete'`);
      assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_pce')`),null);
      assert.equal(await evaluate(`sessionStorage.getItem('fragmentados_const_checks')`),null);
      assert.notEqual(await evaluate(`estado.id`),id);
      assert.equal(await evaluate(`estado.persistido`),false);
      await evaluate(`estado.classe='Guerreiro';estado.nomePersonagem='Renomeado';salvarFichaAtual()`);
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_personagens_teste')).filter(p=>p.nomePersonagem==='Renomeado').length`),2);
      console.log('OK: níveis reversíveis após recarregar, XP excedente/barra, CA automática/cinza e ajuste manual, IDs, isolamento e novo personagem.');
    }
    assert.deepEqual(errors,[]);
    console.log(`OK: ${casos.length} cenários de custo por evolução, gasto real de PE, Inspirar Confiança e bloqueio com PE insuficiente.`);
    return;
  }
  if (process.argv.includes('--livro')) {
    await send('Page.navigate',{url:origin+'/pages/livro.html'});await sleep(600);
    await evaluate(`pesquisar('Marreta Impulsiva');document.querySelector('[data-habilidade-arma="Marreta Impulsiva"]').click()`);
    assert.equal(await evaluate(`document.getElementById('habilidadeArmaModal').open`),true);
    assert.equal(await evaluate(`document.getElementById('habilidadeArmaTitulo').textContent`),'Marreta Impulsiva');
    assert.equal(await evaluate(`document.getElementById('habilidadeArmaTexto').textContent.includes('+1d8')`),true);
    await evaluate(`document.querySelector('#habilidadeArmaModal .arma-modal-fechar').click()`);
    assert.equal(await evaluate(`document.getElementById('habilidadeArmaModal').open`),false);
    await evaluate(`pesquisar('Adaga Balística');document.querySelector('[data-habilidade-arma="Adaga Balística"]').click()`);
    assert.equal(await evaluate(`document.getElementById('habilidadeArmaTitulo').textContent`),'Adaga Balística');
    await evaluate(`document.querySelector('#habilidadeArmaModal .arma-modal-fechar').click();pesquisar('Besta Leve de Repetição');document.querySelector('[data-habilidade-arma="Besta Leve de Repetição"]').click()`);
    assert.equal(await evaluate(`document.getElementById('habilidadeArmaTexto').textContent.includes('Após 6 disparos')`),true);
    await evaluate(`document.querySelector('#habilidadeArmaModal .arma-modal-fechar').click();pesquisar('Balista')`);
    assert.equal(await evaluate(`document.getElementById('livroConteudo').textContent.includes('90m')`),true);
    assert.deepEqual(errors,[]);
    console.log('OK: livro, pesquisa, abertura e fechamento do modal e troca de habilidade. Sem erros JavaScript.');
    return;
  }
  await send('Page.navigate',{url:origin+'/pages/editor-mapa.html'});
  for(let i=0;i<50;i++){await sleep(100);if(await evaluate(`document.getElementById('estadoSalvo')?.textContent==='Novo mapa'`))break;}
  assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Novo mapa');
  const draw=async(x,y,type,button='left',buttons=1)=>send('Input.dispatchMouseEvent',{type,x,y,button,buttons});
  if(process.argv.includes('--animations')) {
    const gif=Buffer.from([71,73,70,56,57,97,1,0,1,0,128,0,0,255,0,0,0,0,255,...[0,1].flatMap(color=>[33,249,4,0,10,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,color?76:68,1,0]),59]).toString('base64');
    await evaluate(`window.animationSrc='data:image/gif;base64,${gif}'`);
    assert.deepEqual(await evaluate(`(async()=>{const media=MapaAnimado.criar(animationSrc,async()=>animationSrc,()=>{},e=>{throw e;});await media.ready;const cx=media.getContext('2d'),a=[...cx.getImageData(0,0,1,1).data];media.update(performance.now()+200,true);const b=[...cx.getImageData(0,0,1,1).data];media.update(performance.now()+400,true);const c=[...cx.getImageData(0,0,1,1).data];media.dispose();return [a,b,c];})()`),[[255,0,0,255],[0,0,255,255],[255,0,0,255]]);
    await evaluate(`(async()=>{const dt=new DataTransfer();dt.items.add(new File([Uint8Array.from(atob(animationSrc.split(',')[1]),c=>c.charCodeAt(0))],'Portal.gif',{type:'image/gif'}));document.getElementById('upload').files=dt.files;await document.getElementById('upload').onchange();})()`);
    await esperar(`!document.getElementById('selecao').hidden`);
    await evaluate(`document.getElementById('cortar').click()`);await esperar(`document.getElementById('recorte').open`);
    await evaluate(`recorteCirculo.click();aplicarRecorte.click();salvar.click()`);await esperar(`estadoSalvo.textContent==='Salvo neste navegador'`);
    const cropped=await evaluate(`new Promise(resolve=>{const r=indexedDB.open('primordios_tabletop');r.onsuccess=()=>{const db=r.result,q=db.transaction('mapas').objectStore('mapas').getAll();q.onsuccess=()=>{resolve(q.result[0].doc.imagens[0]);db.close();};};})`);
    assert.equal(cropped.src,'data:image/gif;base64,'+gif);assert.equal(cropped.recorte.forma,'circulo');assert.ok(cropped.recorte.w<1);
    await evaluate(`desfazer.click();salvar.click()`);await esperar(`estadoSalvo.textContent==='Salvo neste navegador'`);await evaluate(`refazer.click()`);await draw(await evaluate('innerWidth/2'),await evaluate('innerHeight/2'),'mousePressed');await draw(await evaluate('innerWidth/2'),await evaluate('innerHeight/2'),'mouseReleased','left',0);await evaluate(`cortar.click()`);assert.equal(await evaluate(`recorte.open`),true);assert.equal(await evaluate(`recorteCirculo.getAttribute('aria-pressed')`),'true');await evaluate(`document.querySelector('[data-close=recorte]').click()`);

    await evaluate(`document.getElementById('duplicar').click();document.getElementById('duplicar').click();document.getElementById('duplicar').click();document.getElementById('duplicar').click()`);
    assert.equal(await evaluate(`document.getElementById('aviso').textContent`),'Limite de 4 GIFs por mapa.');
    assert.equal(await evaluate(`(async()=>{try{await MapaAnimado.importar(new File([new Uint8Array(10*1024*1024+1)],'grande.gif',{type:'image/gif'}));return false;}catch(e){return e.message.includes('10 MB');}})()`),true);
    assert.equal(await evaluate(`(async()=>{try{await MapaAnimado.importar(new File([new Uint8Array(40*1024*1024+1)],'grande.mp4',{type:'video/mp4'}));return false;}catch(e){return e.message.includes('40 MB');}})()`),true);
    assert.equal(await evaluate(`(()=>{try{const b=Uint8Array.from(atob(animationSrc.split(',')[1]),c=>c.charCodeAt(0));b[6]=255;b[7]=255;MapaAnimado.gif(b.buffer);return false;}catch{return true;}})()`),true);
    const frames=await evaluate(`(()=>{const c=document.createElement('canvas');c.width=c.height=32;const cx=c.getContext('2d');return ['red','blue'].map(color=>{cx.fillStyle=color;cx.fillRect(0,0,32,32);return c.toDataURL('image/webp',.8);});})()`);
    const fixture=require('./fixtures-video.cjs')(frames);
    await evaluate(`window.animationVideo=new File([Uint8Array.from(atob('${fixture.toString('base64')}'),c=>c.charCodeAt(0))],'Agua.webm',{type:'video/webm'})`);
    await evaluate(`(async()=>{const dt=new DataTransfer();dt.items.add(animationVideo);document.getElementById('upload').files=dt.files;await document.getElementById('upload').onchange();})()`);
    await sleep(1200);
    await sleep(250);await evaluate(`document.getElementById('salvar').click()`);await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    const record=()=>evaluate(`new Promise(resolve=>{const req=indexedDB.open('primordios_tabletop');req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains('mapas')){resolve(null);db.close();return;}const r=db.transaction('mapas').objectStore('mapas').getAll();r.onsuccess=()=>{resolve(r.result);db.close();};};})`);
    const saved=await record();assert.ok(saved[0].doc.imagens.filter(i=>i.src.startsWith('data:image/gif;')).every(i=>i.recorte.forma==='circulo'));assert.equal(saved[0].doc.imagens.filter(i=>i.src.startsWith('data:image/gif;')).length,4);assert.equal(saved[0].doc.imagens.filter(i=>i.src.startsWith('data:video/webm;')).length,1,JSON.stringify([saved[0].doc.imagens.map(i=>[i.nome,i.src.slice(0,50)]),await evaluate(`document.getElementById('aviso').textContent`)]));
    assert.equal(await evaluate(`document.getElementById('upload').accept.includes('video/webm')`),true);
    await send('Page.reload');await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Salvo neste navegador');
    assert.equal(await evaluate(`new Promise(resolve=>{const cx=document.getElementById('mesa').getContext('2d'),colors=new Set();let n=0;const timer=setInterval(()=>{colors.add([...cx.getImageData(innerWidth/2,innerHeight/2,1,1).data].join(','));if(++n===35){clearInterval(timer);resolve(colors.size>1);}},100);})`),true);
    await evaluate(`document.querySelector('[data-tool="select"]').click()`);
    await draw(await evaluate('innerWidth/2'),await evaluate('innerHeight/2'),'mousePressed');await draw(await evaluate('innerWidth/2'),await evaluate('innerHeight/2'),'mouseReleased','left',0);
    await evaluate(`document.getElementById('duplicar').click();document.getElementById('duplicar').click()`);
    assert.equal(await evaluate(`document.getElementById('aviso').textContent`),'Limite de 2 vídeos por mapa.');
    assert.deepEqual(errors,[]);console.log('OK: GIF alterna quadros e repete; upload GIF/WebM, limites de tamanho/resolução/quantidade, recorte circular animado preserva GIF, desfazer/refazer e mapa salvo/reaberto sem erros.');return;
  }
  if(process.argv.includes('--regua')) {
    await evaluate(`document.getElementById('salvar').click()`);await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    await evaluate(`document.querySelector('[data-tool="measure"]').click()`);
    await draw(230,220,'mousePressed');await draw(330,220,'mouseMoved');await draw(330,220,'mouseReleased','left',0);
    assert.equal(await evaluate(`document.getElementById('reguaDistancia').textContent`),'3 m');
    assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Salvo neste navegador');
    await evaluate(`document.getElementById('mais').click()`);
    assert.equal(await evaluate(`document.getElementById('reguaDistancia').textContent`),'3 m');
    await evaluate(`document.getElementById('reguaEscala').value=2;document.getElementById('reguaEscala').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate(`document.getElementById('reguaDistancia').textContent`),'4 m');
    await evaluate(`document.getElementById('zoom').click();document.querySelector('[data-tool="select"]').click();(async()=>{const c=document.createElement('canvas');c.width=c.height=80;c.getContext('2d').fillRect(0,0,80,80);const b=await new Promise(r=>c.toBlob(r));const dt=new DataTransfer();dt.items.add(new File([b],'token.png',{type:'image/png'}));document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt}));})()`);
    await esperar(`document.getElementById('selecao').hidden===false`);
    const centro=await evaluate(`({x:innerWidth/2,y:innerHeight/2})`);
    await evaluate(`document.querySelector('[data-tool="movement"]').click()`);
    await draw(centro.x,centro.y,'mousePressed');await draw(centro.x+50,centro.y,'mouseMoved');await draw(centro.x+50,centro.y+50,'mouseMoved');await draw(centro.x+50,centro.y+50,'mouseReleased','left',0);
    assert.equal(await evaluate(`document.getElementById('reguaDistancia').textContent`),'4 m');
    await evaluate(`document.getElementById('salvar').click()`);await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    await evaluate(`document.getElementById('ocultarLayout').click()`);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.ferramentas')).visibility`),'hidden');
    assert.equal(await evaluate(`document.getElementById('mostrarLayout').hidden`),false);
    assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Salvo neste navegador');
    await send('Page.reload');await esperar(`document.getElementById('estadoSalvo')?.textContent==='Salvo neste navegador'`);
    assert.equal(await evaluate(`document.body.classList.contains('layout-oculto')`),true);
    assert.equal(await evaluate(`document.getElementById('reguaEscala').value`),'2');
    await evaluate(`document.getElementById('mostrarLayout').click()`);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.ferramentas')).visibility`),'visible');
    assert.deepEqual(errors,[]);
    console.log('OK: régua A/B, escala/zoom, percurso da imagem, medição sem alterar mapa e layout individual persistente/restaurável.');
    return;
  }
  if(process.argv.includes('--camadas')) {
    await evaluate(`window.colarImagensGrupo=async(qtd)=>{const c=document.createElement('canvas');c.width=c.height=50;c.getContext('2d').fillRect(0,0,50,50);const b=await new Promise(r=>c.toBlob(r));const dt=new DataTransfer();for(let i=0;i<qtd;i++)dt.items.add(new File([b],'Imagem '+i+'.png',{type:'image/png'}));document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt}));};document.getElementById('organizar').click();colarImagensGrupo(2)`);
    await esperar(`document.querySelectorAll('.camada-item').length===2`);
    await evaluate(`document.querySelector('[data-tool="pen"]').click()`);
    await draw(230,250,'mousePressed');await draw(270,280,'mouseMoved');await draw(270,280,'mouseReleased','left',0);
    await esperar(`document.querySelectorAll('.camada-item').length===3`);
    const salvar=async()=>{await evaluate(`document.getElementById('salvar').click()`);await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);};
    const ler=()=>evaluate(`new Promise(r=>{const q=indexedDB.open('primordios_tabletop');q.onsuccess=()=>{const db=q.result,s=db.transaction('mapas').objectStore('mapas').get(JSON.stringify(['teste','teste-mapa']));s.onsuccess=()=>{r(s.result);db.close();};};})`);
    await salvar();const inicial=(await ler()).doc;
    assert.equal(inicial.camadas.length,1);assert.equal(inicial.imagens.length,2);assert.equal(inicial.tracos.length,1);
    assert.ok([...inicial.imagens,...inicial.tracos].every(i=>i.camadaId===inicial.camadaAtiva));
    const imagemId=inicial.imagens[0].id,tracoId=inicial.tracos[0].id,camadaId=inicial.camadaAtiva;
    await evaluate(`document.querySelector('[data-item-id="${imagemId}"] [data-action="visibilidade-item"]').click();document.querySelector('[data-item-id="${tracoId}"] [data-action="visibilidade-item"]').click();document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').click();document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').click()`);
    await salvar();let doc=(await ler()).doc;
    assert.equal(doc.camadas[0].visivel,true);assert.equal(doc.imagens[0].visivel,false);assert.equal(doc.tracos[0].visivel,false);assert.notEqual(doc.imagens[1].visivel,false);
    await evaluate(`document.getElementById('novaCamada').click();window.grupoNovo=document.querySelector('.camada.ativa').dataset.id;const select=document.querySelector('[data-item-id="${tracoId}"] select');select.value=grupoNovo;select.dispatchEvent(new Event('change'))`);
    await salvar();assert.equal((await ler()).doc.tracos[0].camadaId,await evaluate(`grupoNovo`));
    await evaluate(`document.getElementById('desfazer').click()`);await salvar();assert.equal((await ler()).doc.tracos[0].camadaId,camadaId);
    await evaluate(`document.getElementById('refazer').click()`);await salvar();
    await evaluate(`document.querySelector('.camada.ativa [data-action="travar"]').click();colarImagensGrupo(1)`);
    await esperar(`!document.getElementById('aviso').hidden`);await salvar();assert.equal((await ler()).doc.imagens.length,2);
    await send('Page.reload');await esperar(`document.getElementById('estadoSalvo')?.textContent==='Salvo neste navegador'`);
    await evaluate(`document.getElementById('organizar').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.camada').length`),2);
    assert.equal(await evaluate(`document.querySelector('[data-item-id="${tracoId}"] [data-action="visibilidade-item"]').getAttribute('aria-pressed')`),'false');
    assert.deepEqual(errors,[]);
    console.log('OK: colagem múltipla/desenho na camada ativa, visibilidade individual/grupo, mover desenho, bloqueio, desfazer/refazer e persistência.');
    return;
  }
  if(process.argv.includes('--recorte')) {
    await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=300;c.height=200;c.getContext('2d').fillStyle='cyan';c.getContext('2d').fillRect(0,0,300,200);const b=await new Promise(r=>c.toBlob(r));const d=new DataTransfer();d.items.add(new File([b],'recorte.png',{type:'image/png'}));document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d}));})()`);
    await esperar(`document.getElementById('selecao').hidden===false`);
    await evaluate(`document.getElementById('cortar').click()`);
    assert.equal(await evaluate(`document.getElementById('aplicarRecorte').disabled`),false);
    const r=await evaluate(`(()=>{const c=document.getElementById('canvasRecorte'),r=c.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`);
    // A seleção inicial tem lado 160, com a alça direita em (230,100).
    await draw(r.x+230/300*r.w,r.y+r.h/2,'mousePressed');
    await draw(r.x+200/300*r.w,r.y+r.h/2,'mouseMoved');
    await draw(r.x+200/300*r.w,r.y+r.h/2,'mouseReleased','left',0);
    await evaluate(`document.getElementById('recorteCirculo').click()`);
    assert.equal(await evaluate(`document.getElementById('recorteCirculo').getAttribute('aria-pressed')`),'true');
    await evaluate(`document.getElementById('aplicarRecorte').click();document.getElementById('salvar').click()`);
    await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    const ler=()=>evaluate(`new Promise(r=>{const q=indexedDB.open('primordios_tabletop');q.onsuccess=()=>{const db=q.result,s=db.transaction('mapas').objectStore('mapas').get(JSON.stringify(['teste','teste-mapa']));s.onsuccess=()=>{r(s.result);db.close();};};})`);
    let imagem=(await ler()).doc.imagens[0];
    const pixels=src=>evaluate(`(async()=>{const img=new Image();img.src=${JSON.stringify(src)};await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);return {w:c.width,h:c.height,canto:c.getContext('2d').getImageData(0,0,1,1).data[3],centro:c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data[3]};})()`);
    assert.deepEqual(await pixels(imagem.src),{w:130,h:130,canto:0,centro:255});
    assert.equal(imagem.w,imagem.h);
    await evaluate(`document.getElementById('desfazer').click();document.getElementById('salvar').click()`);await sleep(150);
    imagem=(await ler()).doc.imagens[0];assert.equal((await pixels(imagem.src)).w,300);
    // Restaura a seleção após desfazer e verifica recorte quadrado com centro pronto.
    const centro=await evaluate(`({x:innerWidth/2,y:innerHeight/2})`);
    await draw(centro.x,centro.y,'mousePressed');await draw(centro.x,centro.y,'mouseReleased','left',0);
    await evaluate(`document.getElementById('cortar').click();document.getElementById('recorteQuadrado').click();document.getElementById('aplicarRecorte').click();document.getElementById('salvar').click()`);await sleep(150);
    imagem=(await ler()).doc.imagens[0];assert.deepEqual(await pixels(imagem.src),{w:160,h:160,canto:255,centro:255});
    assert.deepEqual(errors,[]);
    console.log('OK: seleção pronta, alça lateral com arrasto real, círculo com transparência, quadrado, proporção e desfazer.');
    return;
  }
  if(process.argv.includes('--grade')) {
    await evaluate(`document.getElementById('abrirGrade').click();window.configurarGrade=(id,valor)=>{const el=document.getElementById(id);if(el.type==='checkbox')el.checked=valor;else el.value=valor;el.dispatchEvent(new Event(el.type==='range'?'input':'change'));if(el.type==='range')el.dispatchEvent(new Event('change'));};configurarGrade('gradeTransparencia',0)`);
    await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=c.height=200;c.getContext('2d').fillStyle='red';c.getContext('2d').fillRect(0,0,200,200);const b=await new Promise(r=>c.toBlob(r));const d=new DataTransfer();d.items.add(new File([b],'grade.png',{type:'image/png'}));document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d}));})()`);
    await esperar(`document.getElementById('selecao').hidden===false`);
    const pixel=()=>evaluate(`(()=>{const c=document.getElementById('mesa'),d=devicePixelRatio;return Array.from(c.getContext('2d').getImageData(Math.round(innerWidth/2*d),Math.round((innerHeight/2+20)*d),1,1).data);})()`);
    assert.ok((await pixel())[1]<=3); // WebP pode introduzir uma pequena variação na cor sólida.
    await evaluate(`configurarGrade('gradePosicao','frente')`);
    assert.ok((await pixel())[1]>50);
    await evaluate(`configurarGrade('gradeTransparencia',100)`);
    assert.ok((await pixel())[1]<=3);
    await evaluate(`configurarGrade('gradeTransparencia',50);configurarGrade('gradeIma',true)`);
    assert.ok((await pixel())[1]>0);
    await evaluate(`if(!document.getElementById('painelGrade').hidden)document.getElementById('abrirGrade').click()`);
    const centro=await evaluate(`({x:innerWidth/2,y:innerHeight/2})`);
    await draw(centro.x,centro.y,'mousePressed');await draw(centro.x+22,centro.y+22,'mouseMoved');await draw(centro.x+22,centro.y+22,'mouseReleased','left',0);
    await evaluate(`document.getElementById('salvar').click()`);
    await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    const ler=()=>evaluate(`new Promise(r=>{const q=indexedDB.open('primordios_tabletop');q.onsuccess=()=>{const db=q.result,s=db.transaction('mapas').objectStore('mapas').get(JSON.stringify(['teste','teste-mapa']));s.onsuccess=()=>{r(s.result);db.close();};};})`);
    assert.deepEqual((await ler()).doc.grade,{frente:true,transparencia:50,ima:true});
    assert.equal((await ler()).doc.imagens[0].x,25);assert.equal((await ler()).doc.imagens[0].y,25);
    await draw(centro.x+25,centro.y+25,'mousePressed');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:centro.x+47,y:centro.y+25,button:'left',buttons:1,modifiers:1});
    await draw(centro.x+47,centro.y+25,'mouseReleased','left',0);
    await evaluate(`document.getElementById('salvar').click()`);await sleep(150);
    assert.equal((await ler()).doc.imagens[0].x,47);
    await evaluate(`configurarGrade('gradeIma',false);document.getElementById('desfazer').click()`);
    assert.equal(await evaluate(`document.getElementById('gradeIma').checked`),true);
    await evaluate(`document.getElementById('refazer').click()`);
    assert.equal(await evaluate(`document.getElementById('gradeIma').checked`),false);
    await evaluate(`document.getElementById('salvar').click()`);await sleep(150);
    await send('Page.reload');await esperar(`document.getElementById('estadoSalvo')?.textContent==='Salvo neste navegador'`);
    assert.equal(await evaluate(`document.getElementById('gradeTransparencia').value`),'50');
    assert.equal(await evaluate(`document.getElementById('gradePosicao').value`),'frente');
    assert.equal(await evaluate(`document.getElementById('gradeIma').checked`),false);
    assert.deepEqual(errors,[]);
    console.log('OK: grade atrás/frente, transparência por pixels, ímã suave, Alt, desfazer/refazer e persistência.');
    return;
  }
  if(process.argv.includes('--laser')) {
    await evaluate(`document.getElementById('mais').click();document.getElementById('mais').click()`);
    const zoomAntes=await evaluate(`document.getElementById('zoom').textContent`);
    await draw(350,250,'mousePressed');await draw(450,350,'mouseMoved');await draw(450,350,'mouseReleased','left',0);
    await evaluate(`document.getElementById('centralizar').click();document.getElementById('salvar').click()`);
    await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);
    const lerMapa=`new Promise(r=>{const q=indexedDB.open('primordios_tabletop');q.onsuccess=()=>{const db=q.result,s=db.transaction('mapas').objectStore('mapas').get(JSON.stringify(['teste','teste-mapa']));s.onsuccess=()=>{r(s.result);db.close();};};})`;
    const antes=await evaluate(lerMapa);
    assert.equal(antes.camera.x,await evaluate('innerWidth/2'));assert.equal(antes.camera.y,await evaluate('innerHeight/2'));
    assert.equal(await evaluate(`document.getElementById('zoom').textContent`),zoomAntes);
    await evaluate(`document.querySelector('[data-tool="laser"]').click();document.getElementById('laserCor').value='#00ff00';document.getElementById('laserCor').dispatchEvent(new Event('input'))`);
    assert.equal(await evaluate(`document.getElementById('laserCorControle').hidden`),false);
    await draw(320,250,'mousePressed');await draw(420,300,'mouseMoved');await sleep(50);
    assert.equal(await evaluate(`(()=>{const c=document.querySelector('.laser-sobreposicao'),d=devicePixelRatio;return c.getContext('2d').getImageData(Math.round(420*d),Math.round(300*d),1,1).data[3]>0;})()`),true);
    await draw(420,300,'mouseReleased','left',0);await sleep(400);
    assert.equal(await evaluate(`document.querySelector('.laser-sobreposicao').getContext('2d').getImageData(0,0,document.querySelector('.laser-sobreposicao').width,document.querySelector('.laser-sobreposicao').height).data.some((v,i)=>i%4===3&&v>0)`),false);
    assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Salvo neste navegador');
    assert.equal(await evaluate(`document.getElementById('desfazer').disabled`),true);
    await evaluate(`document.getElementById('salvar').click()`);await sleep(150);
    assert.deepEqual((await evaluate(lerMapa)).doc,antes.doc);
    await send('Page.reload');await esperar(`document.getElementById('estadoSalvo')?.textContent==='Salvo neste navegador'`);
    assert.equal(await evaluate(`document.getElementById('laserCor').value`),'#00ff00');
    await evaluate(`window.cameraLaserTeste={x:0,y:0,zoom:1};window.laserTeste=new PonteiroLaser(()=>cameraLaserTeste,()=>'#0088ff')`);
    for (const ponto of ['{x:innerWidth+500,y:innerHeight/2}','{x:-500,y:innerHeight/2}','{x:innerWidth/2,y:-500}','{x:innerWidth/2,y:innerHeight+500}','{x:innerWidth+500,y:-500}','{x:-500,y:innerHeight+500}']) {
      await evaluate(`laserTeste.iniciar(${ponto})`);
      await esperar(`!laserTeste.indicador.hidden && !!laserTeste.indicador.style.left`);
      assert.equal(await evaluate(`(()=>{const r=laserTeste.indicador.getBoundingClientRect();return r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight;})()`),true);
      assert.equal(await evaluate(`getComputedStyle(laserTeste.indicador).color`),'rgb(0, 136, 255)');
    }
    await evaluate(`laserTeste.mover({x:innerWidth/2,y:innerHeight/2})`);await esperar(`laserTeste.indicador.hidden`);
    await evaluate(`cameraLaserTeste.x=innerWidth*2`);await esperar(`!laserTeste.indicador.hidden`);
    await evaluate(`cameraLaserTeste.x=0`);await esperar(`laserTeste.indicador.hidden`);
    await evaluate(`laserTeste.mover({x:-500,y:0})`);await esperar(`!laserTeste.indicador.hidden`);
    await evaluate(`laserTeste.soltar()`);assert.equal(await evaluate(`laserTeste.indicador.hidden`),true);
    await evaluate(`laserTeste.limpar()`);
    assert.deepEqual(errors,[]);
    console.log('OK: centro, laser/rastro/cor e indicador fora da visão (bordas, cantos, câmera, cor e desaparecimento ao soltar).');
    return;
  }
  await evaluate(`document.querySelector('[data-tool="pen"]').click()`);
  await draw(400,300,'mousePressed');await draw(450,350,'mouseMoved');await draw(470,380,'mouseReleased','left',0);
  await evaluate(`document.getElementById('sair').click()`);
  assert.equal(await evaluate(`document.getElementById('confirmarSaida').open`),true);
  await evaluate(`document.querySelector('#confirmarSaida .confirmacao-acoes [data-close]').click()`);
  assert.equal(await evaluate(`document.getElementById('confirmarSaida').open`),false);
  assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Alterações não salvas');
  await evaluate(`document.getElementById('nomeMapa').value='Floresta';document.getElementById('salvar').click()`);await sleep(250);
  assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Salvo neste navegador');
  const saved=await evaluate(`new Promise((resolve,reject)=>{const r=indexedDB.open('primordios_tabletop');r.onsuccess=()=>{const q=r.result.transaction('mapas').objectStore('mapas').get(JSON.stringify(['teste','teste-mapa']));q.onsuccess=()=>resolve(q.result);q.onerror=reject;};})`);
  assert.equal(saved.doc.tracos.length,1);assert.equal(saved.nome,'Floresta');
  await evaluate(`document.getElementById('desfazer').click();document.getElementById('salvar').click()`);await sleep(150);
  await evaluate(`document.getElementById('refazer').click();document.getElementById('salvar').click()`);await sleep(150);
  const paginaAntesReload=await evaluate('performance.timeOrigin');
  await send('Page.reload');await esperar(`performance.timeOrigin!==${paginaAntesReload} && !!document.getElementById('nomeMapa') && document.readyState==='complete' && document.getElementById('estadoSalvo').textContent!=='Carregando…'`);
  assert.equal(await evaluate(`document.getElementById('nomeMapa').value`),'Floresta');
  await evaluate(`document.querySelector('[data-category="personagens"]').click()`);
  assert.equal(await evaluate(`document.getElementById('biblioteca').open`),true);
  await evaluate(`document.getElementById('biblioteca').close()`);
  // Colar uma imagem real e validar transformações, duplicação e exclusão.
  await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=100;c.height=80;c.getContext('2d').fillRect(0,0,100,80);const blob=await new Promise(r=>c.toBlob(r));const dt=new DataTransfer();dt.items.add(new File([blob],'token.png',{type:'image/png'}));document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt}));})()`);
  await sleep(300);
  assert.equal(await evaluate(`document.getElementById('selecao').hidden`),false);
  await evaluate(`document.getElementById('proporcao').click();const w=document.getElementById('largura');w.value=250;w.dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`+document.getElementById('altura').value`),200);
  await evaluate(`const h=document.getElementById('altura');h.value=160;h.dispatchEvent(new Event('change'))`);
  assert.equal(await evaluate(`+document.getElementById('largura').value`),200);
  await evaluate(`document.getElementById('proporcao').click()`);
  await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,tema:'claro',idioma:'en',musicaAtiva:false}));aplicarPreferencias()`);
  await sleep(50);
  assert.equal(await evaluate(`document.documentElement.lang`),'en');
  assert.equal(await evaluate(`document.getElementById('salvar').textContent.includes('Save')`),true);
  assert.equal(await evaluate(`document.body.classList.contains('tema-claro')`),true);
  assert.equal(await evaluate(`!!window._primordiosAudio`),true);
  await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,tema:'escuro',idioma:'pt-BR',musicaAtiva:false}));aplicarPreferencias()`);
  await sleep(50);
  assert.equal(await evaluate(`document.getElementById('salvar').textContent.includes('Salvar')`),true);
  await evaluate(`document.getElementById('travar').click()`);
  assert.equal(await evaluate(`document.getElementById('largura').disabled`),true);
  await evaluate(`document.getElementById('salvar').click()`);await sleep(150);
  const lerMapa = () => evaluate(`new Promise(resolve=>{const r=indexedDB.open('primordios_tabletop');r.onsuccess=()=>{const q=r.result.transaction('mapas').objectStore('mapas').get(JSON.stringify(['teste','teste-mapa']));q.onsuccess=()=>resolve(q.result);};})`);
  const antesPan = await lerMapa();
  assert.equal(antesPan.doc.imagens[0].travada,true);
  await draw(280,300,'mousePressed');await draw(340,340,'mouseMoved');await draw(340,340,'mouseReleased','left',0);
  await evaluate(`document.getElementById('salvar').click()`);await sleep(150);
  const depoisPan = await lerMapa();
  assert.equal(depoisPan.camera.x-antesPan.camera.x,60);
  assert.equal(depoisPan.camera.y-antesPan.camera.y,40);
  assert.deepEqual(depoisPan.doc.imagens[0],antesPan.doc.imagens[0]);
  const lockedReloadEpoch=await evaluate('performance.timeOrigin');
  await send('Page.reload');await esperar(`performance.timeOrigin!==${lockedReloadEpoch}&&document.readyState==='complete'&&document.getElementById('estadoSalvo')?.textContent==='Salvo neste navegador'`);
  // A imagem travada continua selecionável, sem mudar de posição ao arrastar.
  const locked = depoisPan.doc.imagens[0], cam = depoisPan.camera;
  const ix=locked.x*cam.zoom+cam.x, iy=locked.y*cam.zoom+cam.y;
  await draw(ix,iy,'mousePressed');await draw(ix+20,iy+10,'mouseMoved');await draw(ix+20,iy+10,'mouseReleased','left',0);
  assert.equal(await evaluate(`document.getElementById('travar').getAttribute('aria-pressed')`),'true');
  await evaluate(`document.getElementById('travar').click()`);
  assert.equal(await evaluate(`document.getElementById('largura').disabled`),false);
  await evaluate(`const largura=document.getElementById('largura');largura.value=220;largura.dispatchEvent(new Event('change'));document.getElementById('duplicar').click();document.getElementById('salvar').click()`);await sleep(200);
  const count=await evaluate(`new Promise(resolve=>{const r=indexedDB.open('primordios_tabletop');r.onsuccess=()=>{const q=r.result.transaction('mapas').objectStore('mapas').get(JSON.stringify(['teste','teste-mapa']));q.onsuccess=()=>resolve(q.result.doc.imagens.map(i=>i.w));};})`);
  assert.deepEqual(count,[220,220]);
  await evaluate(`document.getElementById('organizar').click()`);
  assert.equal(await evaluate(`document.getElementById('painelCamadas').hidden`),false);
  // As duas imagens pertencem ao mesmo grupo. Move a cópia para outro grupo manualmente.
  assert.equal((await lerMapa()).doc.camadas.length,1);
  const copiaId=(await lerMapa()).doc.imagens.at(-1).id;
  await evaluate(`document.getElementById('novaCamada').click();const alvo=document.querySelector('.camada.ativa').dataset.id;const mover=document.querySelector('[data-item-id="${copiaId}"] [data-action="mover-item"]');mover.value=alvo;mover.dispatchEvent(new Event('change'));document.getElementById('salvar').click()`);await sleep(150);
  const antesCamadas=await lerMapa();
  assert.equal(antesCamadas.doc.camadas.length,2);
  const camadaId=antesCamadas.doc.imagens.at(-1).camadaId;
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').click()`);
  assert.equal(await evaluate(`document.getElementById('selecao').hidden`),true);
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="descer"]').click();document.getElementById('salvar').click()`);await sleep(150);
  const oculto=await lerMapa();
  assert.equal(oculto.doc.camadas.find(c=>c.id===camadaId).visivel,false);
  assert.equal(oculto.doc.camadas[0].id,camadaId);
  await evaluate(`document.getElementById('desfazer').click();document.getElementById('salvar').click()`);await sleep(150);
  assert.equal((await lerMapa()).doc.camadas.at(-1).id,camadaId);
  await evaluate(`document.getElementById('refazer').click();document.getElementById('salvar').click()`);await sleep(150);
  await send('Page.reload');await sleep(500);
  await evaluate(`document.getElementById('organizar').click()`);
  assert.equal(await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').getAttribute('aria-pressed')`),'false');
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').click();document.querySelector('[data-id="${camadaId}"] [data-action="selecionar"]').click();document.querySelector('[data-id="${camadaId}"] [data-action="travar"]').click()`);
  assert.equal(await evaluate(`document.getElementById('largura').disabled`),true);
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="travar"]').click();const nome=document.querySelector('[data-id="${camadaId}"] input');nome.value='Personagens';nome.dispatchEvent(new Event('change'));document.getElementById('novaCamada').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('.camada').length`),3);
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="selecionar"]').click();document.getElementById('fecharCamadas').click()`);
  await evaluate(`document.getElementById('deletar').click();document.getElementById('salvar').click()`);await sleep(150);
  const antesSair=await lerMapa();
  const previaAntes=await evaluate(`localStorage.getItem('primordios_mapas_teste')`);
  await evaluate(`document.getElementById('nomeMapa').value='Não salvar';document.getElementById('nomeMapa').dispatchEvent(new Event('input'));document.getElementById('sair').click();document.getElementById('sairSemSalvar').click()`);await sleep(400);
  assert.deepEqual(await lerMapa(),antesSair);
  assert.equal(await evaluate(`localStorage.getItem('primordios_mapas_teste')`),previaAntes);
  for(let i=0;i<50;i++){if(await evaluate(`typeof abrirEditar==='function'`))break;await sleep(100);}
  assert.deepEqual(errors,[]);
  await evaluate('abrirEditar()');assert.equal(await evaluate(`document.querySelector('.tt-mapa-nome').textContent`),'Floresta');
  await evaluate('abrirDeleteMapa(0)');
  assert.equal(await evaluate(`document.getElementById('popupDeleteMapa').open`),true);
  assert.equal(await evaluate(`document.getElementById('descricaoDeleteMapa').textContent.includes('Floresta')`),true);
  await evaluate('fecharDeleteMapa()');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_mapas_teste')).length`),1);
  await evaluate('abrirDeleteMapa(0); confirmarDeleteMapa()');
  assert.equal(await evaluate(`document.getElementById('popupDeleteMapa').open`),false);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_mapas_teste')).length`),0);
  await evaluate('novoMapa()');await sleep(500);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_mapas_teste')).length`),0);
  await evaluate(`document.getElementById('nomeMapa').value='Descartar rascunho';document.getElementById('nomeMapa').dispatchEvent(new Event('input'));document.getElementById('sair').click();document.getElementById('sairSemSalvar').click()`);await sleep(400);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_mapas_teste')).length`),0);
  for(let i=0;i<50;i++){if(await evaluate(`typeof novoMapa==='function'`))break;await sleep(100);}
  await evaluate('novoMapa()');await sleep(500);
  await evaluate(`document.getElementById('salvarSair').click()`);await sleep(500);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('primordios_mapas_teste')).length`),1);
  assert.deepEqual(errors,[]);
  console.log('OK: editor, cadeado, camadas (criar, renomear, ocultar, reordenar, travar, desfazer/refazer e persistir), salvamento e lista. Sem erros JavaScript.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(ws)ws.close();if(browser)browser.kill();server.close();
  // O perfil temporário fica isolado dos dados reais do navegador.
});
