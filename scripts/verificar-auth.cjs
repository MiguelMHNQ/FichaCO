// SDK real + OAuth Google/Auth simulados. Não usa .env, contas Google reais ou SMTP.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const tempRoot = path.resolve(os.tmpdir());
const profile = fs.mkdtempSync(path.join(tempRoot, 'primordios-auth-test-'));
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'jogador@example.test', email_confirmed_at: new Date().toISOString(), user_metadata: { full_name: 'Nome vindo do Google' }, app_metadata: { provider: 'google', providers: ['google'] }, created_at: new Date().toISOString() };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const accessToken = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, aud: 'authenticated', role: 'authenticated' }) + '.c2ltdWxhdGVk';
const session = () => ({ access_token: accessToken, refresh_token: 'mock-refresh-token', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user });
const calls = [];
let challenge;
let failSaveName = false;
let origin;
let configurationEnabled = true;
const characters = new Map();
let charactersOffline = false, dropWriteResponse = false, delayWrites = false, rejectNextWrite = false;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, origin || 'http://localhost');
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  if (url.pathname === '/api/auth/config') return send(200, configurationEnabled ? { enabled: true, url: origin + '/mock', publishableKey: 'sb_publishable_browser_test' } : { enabled: false });
  if (url.pathname === '/api/characters' || url.pathname.startsWith('/api/characters/')) {
    if (req.headers.authorization !== 'Bearer ' + accessToken) return send(401, { error: { code: 'UNAUTHENTICATED', message: 'Entre.' } });
    if (charactersOffline) return send(503, { error: { code: 'UNAVAILABLE', message: 'Sem conexão simulada.' } });
    const id = url.pathname.split('/')[3];
    let body = ''; for await (const chunk of req) body += chunk;
    const data = body ? JSON.parse(body) : {};
    if (req.method === 'GET') {
      if (!id) return send(200, [...characters.values()].filter(record => !record.deleted).map(record => ({ id: record.document.id, nomePersonagem: record.document.nomePersonagem, classe: record.document.classe, nivel: record.document.nivel, desc: record.document.desc, version: record.version, updatedAt: record.updatedAt, hasPhoto: !!record.document.foto })));
      const record = characters.get(id); if (!record || record.deleted) return send(404, { error: { code: 'CHARACTER_NOT_FOUND', message: 'Ficha não encontrada.' } });
      return send(200, url.pathname.endsWith('/portrait') ? { foto: record.document.foto } : record);
    }
    if (delayWrites) await new Promise(resolve => setTimeout(resolve, 250));
    if (rejectNextWrite) { rejectNextWrite = false; return send(400, { error: { code: 'INVALID_CHARACTER', message: 'Corrija a ficha simulada.' } }); }
    if (req.method === 'POST') {
      const existing = characters.get(data.document.id) || [...characters.values()].find(record => data.importKey && record.importKey === data.importKey);
      if (existing && (existing.mutationId === data.mutationId || data.importKey && existing.importKey === data.importKey)) return send(201, existing);
      if (existing) return send(409, { error: { code: 'CHARACTER_EXISTS', message: 'Já existe.' } });
      const doc = data.document; doc.estadoCompleto = { ...doc.estadoCompleto, id: doc.id, usuarioDono: user.id, persistido: true, classe: doc.classe, nomePersonagem: doc.nomePersonagem, nivel: doc.nivel };
      const record = { document: doc, version: 1, updatedAt: Date.now(), mutationId: data.mutationId, importKey: data.importKey };
      characters.set(doc.id, record);
      if (dropWriteResponse) { dropWriteResponse = false; req.socket.destroy(); return; }
      return send(201, record);
    }
    const record = characters.get(id);
    if (!record || record.deleted) return send(404, { error: { code: 'CHARACTER_NOT_FOUND', message: 'Ficha não encontrada.' } });
    if (record.mutationId === data.mutationId) return send(200, record);
    if (record.version !== data.expectedVersion) return send(409, { error: { code: 'CHARACTER_CONFLICT', message: 'Conflito simulado; edição preservada.' } });
    if (req.method === 'DELETE') { record.deleted = true; return send(200, { deleted: true }); }
    record.document = data.document; record.version++; record.updatedAt = Date.now(); record.mutationId = data.mutationId;
    if (dropWriteResponse) { dropWriteResponse = false; req.socket.destroy(); return; }
    return send(200, record);
  }
  if (url.pathname.startsWith('/mock/auth/v1/')) {
    let text = ''; for await (const chunk of req) text += chunk;
    const body = text ? JSON.parse(text) : {};
    calls.push({ path: url.pathname, grant: url.searchParams.get('grant_type'), body, redirect: url.searchParams.get('redirect_to') });
    if (url.pathname.endsWith('/authorize')) {
      assert.equal(url.searchParams.get('provider'), 'google');
      assert.equal(url.searchParams.get('prompt'), 'select_account');
      assert.equal(url.searchParams.get('redirect_to'), origin + '/pages/tela0.html');
      challenge = url.searchParams.get('code_challenge');
      assert.ok(challenge);
      res.writeHead(302, { Location: origin + '/pages/tela0.html?code=valid-google-code' }); res.end(); return;
    }
    if (url.pathname.endsWith('/logout')) return send(200, {});
    if (url.pathname.endsWith('/user')) {
      if (req.headers.authorization !== 'Bearer ' + accessToken) return send(401, { msg: 'invalid token' });
      if (req.method === 'PUT') {
        if (failSaveName) return send(400, { msg: 'simulated save failure' });
        user.user_metadata = { ...user.user_metadata, ...body.data };
      }
      return send(200, user);
    }
    if (url.pathname.endsWith('/token')) {
      if (url.searchParams.get('grant_type') === 'pkce') {
        if (body.auth_code !== 'valid-google-code' || createHash('sha256').update(body.code_verifier).digest('base64url') !== challenge) return send(400, { error_code: 'bad_code_verifier', msg: 'invalid code' });
        return send(200, session());
      }
      if (body.password === 'senha-teste-123') return send(200, session());
      return send(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    return send(404, {});
  }
  const pathname = decodeURIComponent(url.pathname);
  if (!/^\/(pages|scripts|styles|assets)\//.test(pathname)) return send(404, {});
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return send(403, {});
  fs.readFile(file, (error, data) => {
    if (error) return send(404, {});
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let port;
  for (let i = 0; i < 100; i++) { try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch {} if (port) break; await sleep(100); }
  if (!port) throw new Error('Chrome não iniciou. Configure CHROME_PATH.');
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let seq = 0; const pending = new Map(); const errors = []; const loaded = new Set();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const operation = pending.get(message.id); pending.delete(message.id); message.error ? operation.reject(message.error) : operation.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Page.lifecycleEvent' && message.params.name === 'DOMContentLoaded') loaded.add(message.params.loaderId);
    if (message.method === 'Page.javascriptDialogOpening') void send('Page.handleJavaScriptDialog', { accept: true });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description); return result.result.value; };
  const wait = async expression => { for (let i = 0; i < 120; i++) { try { if (await evaluate(expression)) return; } catch {} await sleep(100); } throw new Error('Tempo esgotado: ' + expression + (expression.includes('fichas-dialog') ? '\n' + await evaluate("JSON.stringify(Array.from(document.querySelectorAll('dialog.fichas-dialog')).map(d=>({open:d.open,text:d.textContent})))") : '')); };
  const navigate = async page => {
    const navigation = await send('Page.navigate', { url: origin + '/pages/' + page });
    for (let i=0; navigation.loaderId && !loaded.has(navigation.loaderId) && i<120; i++) await sleep(100);
    await wait("document.readyState === 'complete' && !!window.PrimordiosAuth"); await evaluate('PrimordiosAuth.ready');
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.setLifecycleEventsEnabled', { enabled:true });

  await navigate('tela0.html');
  await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false}));localStorage.setItem('primordios_personagens_antigo',JSON.stringify([{nomePersonagem:'Preservado'}]));localStorage.setItem('primordios_logado',JSON.stringify({usuario:'intruso'}));");
  await navigate('inventario.html');
  await wait("location.pathname.endsWith('tela0.html')");
  assert.equal(await evaluate("localStorage.getItem('primordios_logado')"), null);
  console.log('OK: marcador local adulterado não concede login.');

  await navigate('tela0.html');
  assert.equal(await evaluate("document.querySelectorAll('input[type=password]').length"), 0);
  if (process.argv.includes('--i18n')) {
    await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}));aplicarPreferencias()");
    await wait("document.getElementById('entrarGoogle').textContent.includes('Sign in with Google')");
    assert.ok(await evaluate("document.querySelector('.auth-ajuda').textContent.includes('Use your Google account')"));
    await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'es'}));aplicarPreferencias()");
    await wait("document.getElementById('entrarGoogle').textContent.includes('Entrar con Google')");
    await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'pt-BR'}));aplicarPreferencias()");
  }
  await evaluate("document.getElementById('entrarGoogle').click()");
  await wait("location.pathname.endsWith('configurar-perfil.html') && !!document.getElementById('nomePublico') && !document.getElementById('nomePublico').disabled");
  assert.equal(await evaluate("document.getElementById('nomePublico').value"), '');
  assert.equal(await evaluate("new URL(location.href).searchParams.has('code')"), false);
  assert.ok(calls.find(call => call.grant === 'pkce' && call.body.code_verifier));
  if (process.argv.includes('--i18n')) {
    await evaluate("nomePublico.value='Sair';localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}));aplicarPreferencias()");
    await wait("document.querySelector('.login-titulo').textContent==='What should we call you?'");
    assert.equal(await evaluate("document.getElementById('nomePublico').placeholder"),'Your adventurer name');
    await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'es'}));aplicarPreferencias()");
    assert.equal(await evaluate("document.getElementById('nomePublico').value"),'Sair');
    assert.equal(await evaluate("document.querySelector('.login-titulo').textContent"),'¿Cómo te llamamos?');
    await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'pt-BR'}));aplicarPreferencias()");
  }
  console.log('OK: Google com PKCE, seletor de conta e retorno fixo; primeira entrada exige nome próprio.');

  await navigate('inventario.html');
  await wait("location.pathname.endsWith('configurar-perfil.html') && !!document.getElementById('nomePublico')");
  assert.equal(await evaluate("PrimordiosAuth.saveName('<script>').then(()=>false,()=>true)"), true);
  assert.equal(calls.some(call => call.body.data?.display_name === '<script>'), false);
  console.log('OK: perfil incompleto não pula etapa pelo endereço; nomes inválidos não são enviados.');

  await wait("!document.getElementById('salvarPerfil').disabled");
  failSaveName = true;
  await evaluate("nomePublico.value='Aventureiro';document.getElementById('perfilForm').requestSubmit()");
  await wait("document.getElementById('perfilErro').textContent.includes('Não foi possível salvar')");
  assert.equal(user.user_metadata.primordios_profile_complete, undefined);
  failSaveName = false;
  await evaluate("nomePublico.value='Aventureiro';document.getElementById('perfilForm').requestSubmit()");
  await wait("location.pathname.endsWith('inventario.html') && !!document.getElementById('listaPersonagens')");
  assert.equal(user.user_metadata.display_name, 'Aventureiro');
  assert.equal(user.user_metadata.primordios_profile_complete, true);
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('primordios_logado')).usuario"), user.id);
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('primordios_logado')).nome"), 'Aventureiro');
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('primordios_personagens_antigo'))[0].nomePersonagem"), 'Preservado');
  await evaluate("localStorage.setItem('primordios_personagens_'+JSON.parse(localStorage.getItem('primordios_logado')).id,JSON.stringify([{nomePersonagem:'Nova ficha'}]));localStorage.setItem('primordios_usuarios',JSON.stringify([{usuario:'antigo',email:'antigo@example.test',senha:'senha-legada'}]))");
  console.log('OK: falha ao salvar mantém bloqueio; sucesso confirma nome no Auth sem trocar identidade.');

  await navigate('configuracoes.html');
  await wait("!document.getElementById('credenciaisAntigas').hidden");
  assert.equal(await evaluate("document.getElementById('cfgUsuario').textContent"), 'Aventureiro');
  await evaluate("document.querySelector('#credenciaisAntigas button').click()");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('primordios_usuarios'))[0].senha"), undefined);
  await navigate('inventario.html');
  await evaluate("CloudFichas.import('auth-fixture',{id:'antigo',nomePersonagem:'Nova ficha',classe:'Guerreiro',nivel:1,estadoCompleto:{classe:'Guerreiro'}})");
  if (process.argv.includes('--i18n')) {
    await evaluate("localStorage.setItem('primordios_personagens_i18n',JSON.stringify([{id:'i18n-source',nomePersonagem:'Sair',classe:'Mago',nivel:1,estadoCompleto:{classe:'Mago'}}]));localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'en'}));aplicarPreferencias();abrirImportacaoFichas()");
    await wait("document.querySelector('dialog.fichas-dialog[open] h2')?.textContent==='Import local characters'");
    assert.equal(await evaluate("document.getElementById('resumoPersonagens').textContent"),'1 character');
    assert.equal(await evaluate("document.getElementById('buscaPersonagem').placeholder"),'Name, class or description');
    assert.ok(await evaluate("Array.from(document.querySelectorAll('dialog.fichas-dialog[open] label')).some(l=>l.textContent.includes('Sair · Mage · local account i18n'))"));
    await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'es'}));aplicarPreferencias()");
    assert.equal(await evaluate("document.querySelector('dialog.fichas-dialog[open] h2').textContent"),'Importar fichas locales');
    assert.ok(await evaluate("Array.from(document.querySelectorAll('dialog.fichas-dialog[open] label')).some(l=>l.textContent.includes('Sair · Mago · cuenta local i18n'))"));
    assert.equal(await evaluate("document.getElementById('resumoPersonagens').textContent"),'1 personaje');
    await evaluate("localStorage.setItem('primordios_config',JSON.stringify({audioPermitido:false,musicaAtiva:false,idioma:'pt-BR'}));aplicarPreferencias();document.querySelector('dialog.fichas-dialog[open]').close()");
    assert.equal(await evaluate("document.getElementById('resumoPersonagens').textContent"),'1 personagem');
    console.log('OK: login, nome público, placeholders, importação e contagens em inglês/espanhol/português; nomes de personagens preservados.');
  }
  await navigate('configurar-perfil.html?editar=1');
  await wait("!document.getElementById('salvarPerfil').disabled");
  assert.equal(await evaluate("document.getElementById('nomePublico').value"), 'Aventureiro');
  await evaluate("nomePublico.value='Arqueira';document.getElementById('perfilForm').requestSubmit()");
  await wait("location.pathname.endsWith('configuracoes.html') && document.getElementById('cfgUsuario')?.textContent==='Arqueira'");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('primordios_personagens_'+JSON.parse(localStorage.getItem('primordios_logado')).id))[0].nomePersonagem"), 'Nova ficha');
  await navigate('inventario.html');
  await wait("document.querySelector('.inv-card-nome')?.textContent==='Nova ficha'");
  if (process.argv.includes('--characters')) {
    const createdId = await evaluate("limparDadosFicha();Object.assign(estado,criarEstadoInicial(),{id:crypto.randomUUID(),classe:'Guerreiro',nomePersonagem:'Ficha online',usuarioDono:JSON.parse(localStorage.getItem('primordios_logado')).id});salvarEstado();estado.id");
    await navigate('tela5.html');
    await wait("!!document.getElementById('pvAtual') && estado.nomePersonagem==='Ficha online'");
    await evaluate('CloudFichas.flush(estado.id)');
    assert.ok(characters.has(createdId));
    assert.equal(characters.get(createdId).document.estadoCompleto.usuarioDono,user.id);
    await evaluate(`(()=>{const change=(selector,value)=>{const el=document.querySelector(selector);el.value=value;el.dispatchEvent(new Event('change'));};change('#fichaProficiencias [data-conhecimento="0"]','espadas-leves');change('#fichaProficiencias [data-conhecimento="1"]','macas-leves');change('#fichaProficiencias [data-familiaridade]','Maças Pesadas');change('#fichaProficiencias [data-especializacao]','Espadas');})()`);await evaluate('CloudFichas.flush(estado.id)');
    assert.deepEqual(characters.get(createdId).document.estadoCompleto.proficienciasGuerreiro,{conhecimentos:['espadas-leves','macas-leves'],familiaridade:'Maças Pesadas'});assert.equal(characters.get(createdId).document.estadoCompleto.especializacaoArma,'Espadas');
    console.log('OK: escolhas de Conhecimento/Familiaridade e especialização persistidas pela API da ficha.');
    await evaluate("sessionStorage.setItem('fragmentados_pv','13');sessionStorage.setItem('fragmentados_pe','4');sessionStorage.setItem('fragmentados_xp','321');sessionStorage.setItem('fragmentados_inventario',JSON.stringify([{nome:'Espada',qtd:2}]));sessionStorage.setItem('fragmentados_desc','Ficha completa');const canvas=document.createElement('canvas');canvas.width=canvas.height=40;canvas.getContext('2d').fillRect(0,0,40,40);sessionStorage.setItem('fragmentados_foto',canvas.toDataURL('image/png'));sincronizarPersonagem();CloudFichas.flush(estado.id)");
    const saved = characters.get(createdId).document;
    assert.equal(saved.dados.fragmentados_pv,'13'); assert.equal(saved.dados.fragmentados_pe,'4'); assert.equal(saved.dados.fragmentados_xp,'321');
    assert.equal(JSON.parse(saved.dados.fragmentados_inventario)[0].nome,'Espada'); assert.ok(saved.foto.startsWith('data:image/png;base64,'));
    console.log('OK: nova ficha e estado completo (PV, PE, XP, inventário, descrição e foto) gravados pela API.');

    delayWrites = true;
    await evaluate("sessionStorage.setItem('fragmentados_desc','Primeira edição');sincronizarPersonagem();void CloudFichas.flush(estado.id)");
    await sleep(70);
    await evaluate("sessionStorage.setItem('fragmentados_desc','Última edição durante envio');sincronizarPersonagem()");
    await wait("!Object.keys(localStorage).some(k=>k.startsWith('primordios_ficha_pendente:')&&k.endsWith(':'+estado.id))");
    delayWrites = false;
    assert.equal(characters.get(createdId).document.desc,'Última edição durante envio');
    console.log('OK: edições feitas durante uma requisição não são perdidas.');

    charactersOffline = true;
    await evaluate("sessionStorage.setItem('fragmentados_desc','Edição sem conexão');sincronizarPersonagem();CloudFichas.flush(estado.id)");
    assert.equal(await evaluate("Object.keys(localStorage).some(k=>k.startsWith('primordios_ficha_pendente:')&&k.endsWith(':'+estado.id))"),true);
    await navigate('tela5.html');
    await wait("!!document.getElementById('pvAtual') && sessionStorage.getItem('fragmentados_desc')==='Edição sem conexão'");
    charactersOffline = false;
    await evaluate('CloudFichas.retry()');
    await wait("!Object.keys(localStorage).some(k=>k.startsWith('primordios_ficha_pendente:')&&k.endsWith(':'+estado.id))");
    assert.equal(characters.get(createdId).document.desc,'Edição sem conexão');
    console.log('OK: falha de rede preserva a edição e retoma o envio após recarregar.');

    const beforeRetry = characters.get(createdId).version;
    dropWriteResponse = true;
    await evaluate("sessionStorage.setItem('fragmentados_desc','Resposta perdida');sincronizarPersonagem();CloudFichas.flush(estado.id)");
    await evaluate('CloudFichas.retry()');
    await wait("!Object.keys(localStorage).some(k=>k.startsWith('primordios_ficha_pendente:')&&k.endsWith(':'+estado.id))");
    assert.equal(characters.get(createdId).version,beforeRetry+1);
    console.log('OK: resposta perdida é repetida com a mesma mutação, sem duplicar a gravação.');

    rejectNextWrite = true;
    await evaluate("sessionStorage.setItem('fragmentados_desc','Documento rejeitado');sincronizarPersonagem();CloudFichas.flush(estado.id)");
    await evaluate("sessionStorage.setItem('fragmentados_desc','Documento corrigido');sincronizarPersonagem();CloudFichas.flush(estado.id)");
    assert.equal(characters.get(createdId).document.desc,'Documento corrigido');
    console.log('OK: documento rejeitado pode ser corrigido sem ficar preso à requisição inválida.');

    characters.get(createdId).version++; characters.get(createdId).document.desc='Alteração em outro dispositivo';
    await evaluate("sessionStorage.setItem('fragmentados_desc','Edição da minha aba');sincronizarPersonagem();CloudFichas.flush(estado.id)");
    assert.equal(characters.get(createdId).document.desc,'Alteração em outro dispositivo');
    await evaluate("Array.from(document.querySelectorAll('.fichas-sync button')).find(b=>b.textContent==='Ver pendências').click();Array.from(document.querySelectorAll('.fichas-dialog button')).find(b=>b.textContent==='Salvar como nova ficha').click()");
    await wait("estado.id!=="+JSON.stringify(createdId)+" && estado.nomePersonagem.endsWith('(cópia)')");
    const copyId = await evaluate('estado.id');
    await wait("!Object.keys(localStorage).some(k=>k.startsWith('primordios_ficha_pendente:')&&k.endsWith(':'+estado.id))");
    assert.equal(characters.get(createdId).document.desc,'Alteração em outro dispositivo');
    assert.equal(characters.get(copyId).document.desc,'Edição da minha aba');
    assert.equal(characters.get(copyId).document.dados.fragmentados_pv,'13');
    console.log('OK: conflito não sobrescreve a outra versão e pode ser preservado como nova ficha.');

    characters.get(copyId).version++; characters.get(copyId).document.desc='Versão online escolhida';
    await evaluate("sessionStorage.setItem('fragmentados_desc','Edição que será descartada');sincronizarPersonagem();CloudFichas.flush(estado.id)");
    await evaluate("Array.from(document.querySelectorAll('.fichas-sync button')).find(b=>b.textContent==='Ver pendências').click();Array.from(document.querySelectorAll('.fichas-dialog button')).find(b=>b.textContent==='Descartar edição local').click()");
    await wait("sessionStorage.getItem('fragmentados_desc')==='Versão online escolhida' && !Object.keys(localStorage).some(k=>k.startsWith('primordios_ficha_pendente:')&&k.endsWith(':'+estado.id))");
    assert.equal(characters.get(copyId).document.desc,'Versão online escolhida');
    console.log('OK: descarte explícito de conflito recarrega a versão online sem sobrescrevê-la.');

    await navigate('inventario.html');
    await evaluate("localStorage.setItem('primordios_personagens_importavel',JSON.stringify([{id:'original-legado',nomePersonagem:'Importada da cache',classe:'Guerreiro',nivel:1,pvMax:21,pv:9,pe:3,estadoCompleto:{classe:'Guerreiro'}}]))");
    const originalCache = await evaluate("localStorage.getItem('primordios_personagens_importavel')");
    const beforeImport = characters.size;
    for (let n=0;n<2;n++) {
      await evaluate("(()=>{abrirImportacaoFichas();const d=document.querySelector('dialog.fichas-dialog[open]');Array.from(d.querySelectorAll('label')).find(l=>l.textContent.includes('Importada da cache')).querySelector('input').checked=true;Array.from(d.querySelectorAll('button')).find(b=>b.textContent==='Importar selecionadas').click();})()");
      await wait("document.querySelector('dialog.fichas-dialog[open]')?.textContent.includes('1 de 1 fichas confirmadas')");
      await evaluate("document.querySelector('dialog.fichas-dialog[open]').close()");
    }
    assert.equal(characters.size,beforeImport+1);
    assert.equal(await evaluate("localStorage.getItem('primordios_personagens_importavel')"),originalCache);
    const imported = [...characters.values()].find(r=>r.document.nomePersonagem==='Importada da cache');
    assert.equal(imported.document.dados.fragmentados_pv,'9'); assert.equal(imported.document.dados.fragmentados_pvmax,'21');
    console.log('OK: importação seletiva confirma a cópia, migra recursos antigos, não duplica e mantém os originais.');

    await evaluate("window.PrimordiosSessao={};const frame=document.createElement('iframe');frame.id='previewTeste';frame.src='tela5.html?mesa=1&personagem='+"+JSON.stringify(createdId)+";document.body.append(frame)");
    await wait("document.getElementById('previewTeste').contentWindow.document.getElementById('pvAtual')&&document.getElementById('previewTeste').contentWindow.eval('estado.id')==="+JSON.stringify(createdId));
    assert.equal(await evaluate("document.getElementById('previewTeste').contentWindow.document.documentElement.classList.contains('ficha-embutida')"),true);
    assert.equal(await evaluate("document.getElementById('previewTeste').contentWindow._primordiosAudio.paused"),true);
    await evaluate("document.getElementById('previewTeste').contentWindow.eval(\"alterarPV(-1);CloudFichas.flush(estado.id)\")");
    assert.equal(characters.get(createdId).document.dados.fragmentados_pv,'12');
    await evaluate("document.getElementById('previewTeste').remove();delete window.PrimordiosSessao");
    console.log('OK: ficha embutida abre o personagem escolhido, salva edição online e não duplica áudio.');

    await evaluate("abrirDelete(getPersonagens().findIndex(p=>p.id==="+JSON.stringify(copyId)+"));confirmarDelete()");
    await wait("!getPersonagens().some(p=>p.id==="+JSON.stringify(copyId)+")");
    assert.equal(characters.get(copyId).deleted,true);
    assert.equal(await evaluate("CloudFichas.get("+JSON.stringify(copyId)+").then(()=>0,error=>error.status)"),404);
    console.log('OK: exclusão online remove a ficha e impede reabertura.');
  }
  await evaluate('PrimordiosAuth.sair()');
  await wait("location.pathname.endsWith('tela0.html')");
  assert.equal(await evaluate("localStorage.getItem('primordios_logado')"), null);
  assert.ok(!calls.some(call => /signup|recover/.test(call.path) || call.body.password));
  console.log('OK: alteração de nome preserva fichas; limpeza legada e logout; nenhum cadastro por senha ou envio SMTP.');

  configurationEnabled = false;
  await navigate('tela0.html');
  await wait("document.getElementById('loginErro').textContent.includes('não foi configurado')");
  assert.deepEqual(errors, []);
  console.log('OK: configuração ausente falha fechada; nenhuma exceção no navegador.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  socket?.close();
  if (browser && browser.exitCode === null) { browser.kill(); await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(3000)]); }
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  const resolved = path.resolve(profile);
  if (path.dirname(resolved) === tempRoot && path.basename(resolved).startsWith('primordios-auth-test-')) {
    try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
  }
});
