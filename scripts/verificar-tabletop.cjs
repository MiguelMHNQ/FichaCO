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
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser, ws;
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = spawn(browserPath, ['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'], { windowsHide:true, stdio:'ignore' });
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
  await send('Runtime.enable');
  await send('Page.navigate',{url:origin+'/index.html'});await sleep(500);
  await evaluate(`localStorage.setItem('primordios_logado',JSON.stringify({usuario:'teste'})); localStorage.setItem('primordios_mapas_teste',JSON.stringify([{id:'teste-mapa',nome:'Mapa de teste',data:'Hoje'}])); sessionStorage.setItem('primordios_mapa_idx','0');`);
  if(process.argv.includes('--pe')) {
    await evaluate(`localStorage.setItem('primordios_config',JSON.stringify({musicaAtiva:false}));sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Bardo',nivel:7,nomePersonagem:'Teste PE'}));sessionStorage.setItem('fragmentados_pe','100');sessionStorage.setItem('fragmentados_pemax','100');`);
    await send('Page.navigate',{url:origin+'/pages/tela5.html'});
    for(let i=0;i<100;i++){await sleep(100);if(await evaluate(`!!document.getElementById('peAtual')`))break;}
    await evaluate(`window.alert=m=>(window.ultimoAlerta=m)`);
    const casos=[
      ['Bardo','Bravura',6,'Ataque Extra',4],['Bardo','Bravura',9,'Ataque Extra',8],
      ['Bardo','Bravura',13,'Ataque Extra',12],['Bardo','Bravura',20,'Ataque Extra',12],
      ['Guerreiro',null,5,'Ataque Extra',4],['Guerreiro',null,9,'Ataque Extra',8],
      ['Guerreiro',null,15,'Ataque Extra',14],['Guerreiro',null,20,'Ataque Extra',14],
      ['Bardo',null,1,'Canção de Cura',1],['Bardo',null,5,'Canção de Cura',1],
      ['Bardo',null,6,'Canção de Cura',4],['Bardo',null,20,'Canção de Cura',4],
      ['Bardo',null,2,'Canção Barbica',1],['Bardo',null,3,'Canção Barbica',2],
      ['Bardo',null,6,'Canção Barbica',4],['Bardo',null,9,'Canção Barbica',8],
      ['Bardo',null,11,'Canção Barbica',10],['Bardo',null,20,'Canção Barbica',10],
      ['Bardo',null,7,'Inspirar Confiança',6],['Bardo',null,20,'Inspirar Confiança',6],
      ['Bardo','Vigor',9,'Toque Acolhedor',8],['Bardo','Vigor',13,'Toque Acolhedor',12],
      ['Bardo','Vigor',17,'Toque Acolhedor',16],['Bardo','Vigor',17,'Ajuda Temporária',16],
      ['Guerreiro',null,2,'Ataque Preciso',1],['Guerreiro',null,3,'Ataque Preciso',2],
      ['Guerreiro',null,6,'Ataque Preciso',4],['Guerreiro',null,9,'Ataque Preciso',8],
      ['Guerreiro',null,11,'Ataque Preciso',10],['Guerreiro',null,7,'Pancada Potente',6],
      ['Guerreiro','Capitão',13,'Revigorar',12],['Guerreiro','Capitão',15,'Revigorar',14],
      ['Guerreiro','Capitão',17,'Revigorar',16],['Bardo',null,3,'Canção Barbica',2],
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
    await send('Page.reload');await sleep(500);
    assert.deepEqual(await lerPV(),{normal:'30',bonus:'+5',oculto:false,azul:true,total:'35'});
    await evaluate('alterarPV(-5)');assert.deepEqual(await lerPV(),{normal:'30',bonus:'+0',oculto:true,azul:false,total:'30'});
    await evaluate('alterarPV(-8)');assert.equal((await lerPV()).normal,'22');
    await evaluate('alterarPV(13)');assert.equal((await lerPV()).bonus,'+5');
    assert.equal(await evaluate(`ajustarRecursoFicha('pv',10)`),0);
    assert.equal((await lerPV()).total,'35');
    await evaluate('alterarPV(-100);renderFicha()');assert.equal((await lerPV()).normal,'0');
    await evaluate('alterarPV(45);definirPVMaxFicha(40)');assert.deepEqual(await lerPV(),{normal:'40',bonus:'+0',oculto:true,azul:false,total:'40'});
    assert.equal(await evaluate(`!![...document.querySelectorAll('.ficha-hab-item')].find(l=>l.textContent.includes('Grimório Arcano'))?.querySelector('button')`),false);
    assert.deepEqual(errors,[]);
    console.log(`OK: ${casos.length} cenários de custo por evolução, gasto real de PE, Inspirar Confiança e bloqueio com PE insuficiente.`);
    return;
  }
  await send('Page.navigate',{url:origin+'/pages/editor-mapa.html'});
  for(let i=0;i<50;i++){await sleep(100);if(await evaluate(`document.getElementById('estadoSalvo')?.textContent==='Novo mapa'`))break;}
  assert.equal(await evaluate(`document.getElementById('estadoSalvo').textContent`),'Novo mapa');
  const draw=async(x,y,type,button='left',buttons=1)=>send('Input.dispatchMouseEvent',{type,x,y,button,buttons});
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
  await send('Page.reload');await sleep(500);
  assert.equal(await evaluate(`document.getElementById('nomeMapa').value`),'Floresta');
  await evaluate(`document.querySelector('[data-category="personagens"]').click()`);
  assert.equal(await evaluate(`document.getElementById('biblioteca').open`),true);
  await evaluate(`document.getElementById('biblioteca').close()`);
  // Colar uma imagem real e validar transformações, duplicação e exclusão.
  await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=100;c.height=80;c.getContext('2d').fillRect(0,0,100,80);const blob=await new Promise(r=>c.toBlob(r));const dt=new DataTransfer();dt.items.add(new File([blob],'token.png',{type:'image/png'}));document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt}));})()`);
  await sleep(300);
  assert.equal(await evaluate(`document.getElementById('selecao').hidden`),false);
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
  await send('Page.reload');await sleep(500);
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
  const antesCamadas=await lerMapa();
  assert.equal(antesCamadas.doc.camadas.length,3);
  const camadaId=antesCamadas.doc.imagens.at(-1).camadaId;
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').click()`);
  assert.equal(await evaluate(`document.getElementById('selecao').hidden`),true);
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="descer"]').click();document.getElementById('salvar').click()`);await sleep(150);
  const oculto=await lerMapa();
  assert.equal(oculto.doc.camadas.find(c=>c.id===camadaId).visivel,false);
  assert.equal(oculto.doc.camadas[1].id,camadaId);
  await evaluate(`document.getElementById('desfazer').click();document.getElementById('salvar').click()`);await sleep(150);
  assert.equal((await lerMapa()).doc.camadas.at(-1).id,camadaId);
  await evaluate(`document.getElementById('refazer').click();document.getElementById('salvar').click()`);await sleep(150);
  await send('Page.reload');await sleep(500);
  await evaluate(`document.getElementById('organizar').click()`);
  assert.equal(await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').getAttribute('aria-pressed')`),'false');
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="visibilidade"]').click();document.querySelector('[data-id="${camadaId}"] [data-action="selecionar"]').click();document.querySelector('[data-id="${camadaId}"] [data-action="travar"]').click()`);
  assert.equal(await evaluate(`document.getElementById('largura').disabled`),true);
  await evaluate(`document.querySelector('[data-id="${camadaId}"] [data-action="travar"]').click();const nome=document.querySelector('[data-id="${camadaId}"] input');nome.value='Personagens';nome.dispatchEvent(new Event('change'));document.getElementById('novaCamada').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('.camada').length`),4);
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
