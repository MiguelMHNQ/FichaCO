const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function verificarMobile({send,evaluate,esperar,sleep,origin,profile,errors}){
  const viewport=async(width=390,height=844)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});};
  const touch=async(type,points=[])=>{await send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y}))});await sleep(40);};
  const tap=async(selector)=>{const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await touch('touchStart',[[1,p.x,p.y]]);await touch('touchEnd');};
  const map=()=>evaluate(`new Promise(resolve=>{const r=indexedDB.open('primordios_tabletop');r.onsuccess=()=>{const db=r.result,q=db.transaction('mapas').objectStore('mapas').getAll();q.onsuccess=()=>{resolve(q.result[0]);db.close();};};})`);
  const save=async()=>{await evaluate(`document.getElementById('salvar').click()`);await esperar(`document.getElementById('estadoSalvo').textContent==='Salvo neste navegador'`);};
  const shot=async(name)=>{const r=await send('Page.captureScreenshot',{format:'png'}),file=path.join(profile,name+'.png');fs.writeFileSync(file,Buffer.from(r.data,'base64'));console.log(file);};
  await send('Page.enable');await viewport();
  await send('Page.navigate',{url:origin+'/pages/editor-mapa.html'});await esperar(`document.getElementById('estadoSalvo')?.textContent==='Novo mapa'`);await sleep(80);
  assert.ok(await evaluate(`document.querySelector('.ferramentas').getBoundingClientRect().height<90`));
  assert.equal(await evaluate(`opcoesDesenho.hidden`),true);await evaluate(`document.querySelector('[data-tool=pen]').click()`);assert.equal(await evaluate(`opcoesFerramentas.getAttribute('aria-expanded')`),'true');await tap('#opcoesFerramentas');assert.equal(await evaluate(`opcoesFerramentas.getAttribute('aria-expanded')`),'false');await evaluate(`document.querySelector('[data-tool=select]').click()`);assert.equal(await evaluate(`opcoesDesenho.hidden`),true);
  await save();const before=await map();await evaluate(`document.querySelector('[data-tool=pen]').click()`);
  await touch('touchStart',[[1,100,350]]);await touch('touchStart',[[1,100,350],[2,200,350]]);await touch('touchMove',[[1,80,350],[2,240,350]]);
  await touch('touchEnd',[[1,80,350]]);await touch('touchMove',[[1,90,360]]);await touch('touchEnd');await save();const zoomed=await map();
  assert.equal(zoomed.doc.tracos.length,0,'Pinça não deixa um desenho');assert.ok(Math.abs(zoomed.camera.zoom-1.6)<.01);
  assert.ok(Math.abs((160-zoomed.camera.x)/zoomed.camera.zoom-(150-before.camera.x)/before.camera.zoom)<.01,'Âncora do zoom');
  await touch('touchStart',[[1,100,400]]);await touch('touchMove',[[1,160,440]]);await touch('touchEnd');await save();assert.equal((await map()).doc.tracos.length,1);
  await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=c.height=80;c.getContext('2d').fillRect(0,0,80,80);const b=await new Promise(r=>c.toBlob(r)),dt=new DataTransfer();dt.items.add(new File([b],'toque.png',{type:'image/png'}));upload.files=dt.files;await upload.onchange();})()`);
  await esperar(`!document.getElementById('selecao').hidden`);await save();const tokenBefore=(await map()).doc.imagens[0];
  await touch('touchStart',[[1,195,422]]);await touch('touchMove',[[1,205,427]]);await touch('touchStart',[[1,205,427],[2,305,427]]);await touch('touchMove',[[1,195,427],[2,315,427]]);await touch('touchEnd');await save();
  assert.deepEqual((await map()).doc.imagens[0],tokenBefore,'Pinça cancela o movimento incidental da imagem');
  await tap('#alternarPropriedades');assert.equal(await evaluate(`alternarPropriedades.getAttribute('aria-expanded')`),'true');assert.ok(await evaluate(`parseFloat(getComputedStyle(largura).fontSize)>=16`));await tap('#alternarPropriedades');
  await evaluate(`document.querySelector('[data-tool=measure]').click()`);await touch('touchStart',[[1,100,500]]);await touch('touchMove',[[1,200,500]]);await touch('touchEnd');
  const cam=(await map()).camera;assert.ok(Math.abs(await evaluate(`parseFloat(reguaDistancia.textContent.replace(',','.'))`)-3/cam.zoom)<.02);
  await touch('touchStart',[[1,100,500]]);await touch('touchStart',[[1,100,500],[2,200,500]]);await touch('touchCancel');await touch('touchStart',[[1,100,500]]);await touch('touchMove',[[1,200,500]]);await touch('touchEnd');
  await shot('mesa-mobile');
  for(const [width,height] of [[320,740],[390,844],[844,390]]){
    await viewport(width,height);await sleep(80);assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));
    assert.ok(await evaluate(`(()=>{const r=document.querySelector('.rodape').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})()`));
    assert.ok(await evaluate(`document.querySelector('.ferramentas').getBoundingClientRect().height<90`));
  }
  await viewport();await evaluate(`sessionStorage.setItem('fragmentados_estado',JSON.stringify({classe:'Guerreiro',raca:'Humano',nivel:1,nomePersonagem:'Mobile'}));localStorage.setItem('fragmentados_layout_num','1');localStorage.removeItem('fragmentados_layout')`);
  for(const page of ['livro.html','tela5.html']){await send('Page.navigate',{url:origin+'/pages/'+page});await esperar(`document.readyState==='complete'`);for(const width of [320,390]){await viewport(width,844);await sleep(80);assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),page+' cabe em '+width);}}
  assert.ok(await evaluate(`document.querySelector('.ficha-bloco').getBoundingClientRect().width>300`),'Blocos ocupam a largura disponível');
  await evaluate(`toggleModoEdicao();document.querySelector('[data-bloco=identidade] .bloco-edit-handle').scrollIntoView({block:'center'})`);
  await shot('ficha-mobile-edicao');
  await evaluate(`document.querySelector('[data-bloco=identidade] .bloco-ordem[aria-label="Descer bloco"]').click()`);await esperar(`fichaConteudo.firstElementChild.dataset.bloco==='progresso'`);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('fragmentados_layout'))[0].bloco`),'progresso');
  await evaluate(`const first=document.querySelector('[data-bloco=progresso]');scrollTo(0,first.getBoundingClientRect().top+scrollY-fichaEditToolbar.getBoundingClientRect().height-20)`);await sleep(1200);
  // Atualiza a região de hit-test do compositor headless após scrollTo e reordenação.
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:200,y:300,deltaX:0,deltaY:1});await sleep(200);
  const source=await evaluate(`(()=>{const r=document.querySelector('[data-bloco=progresso] .bloco-edit-handle').getBoundingClientRect();return{x:r.left+25,y:r.top+22};})()`);
  const target=await evaluate(`(()=>{const r=document.querySelector('[data-bloco=identidade]').getBoundingClientRect();return{x:r.left+40,y:r.top+80};})()`);
  await send('Page.bringToFront');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:source.x,y:source.y});await sleep(150);await touch('touchStart',[[1,source.x,source.y]]);await esperar(`_gestoBloco?.tipo==='sort'`);await touch('touchMove',[[1,target.x,target.y]]);await touch('touchEnd');assert.equal(await evaluate(`fichaConteudo.firstElementChild.dataset.bloco`),'identidade','Arrasto ordena os blocos por toque');
  await evaluate(`trocarLayout(3);document.querySelector('.ficha-viewport').scrollIntoView({block:'center'});document.querySelector('.ficha-viewport').scrollTop=0;document.querySelector('.ficha-viewport').scrollLeft=0`);await sleep(80);
  const handle=await evaluate(`(()=>{const r=document.querySelector('[data-bloco=identidade] .bloco-edit-handle').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await touch('touchStart',[[1,handle.x,handle.y]]);await touch('touchMove',[[1,handle.x+35,handle.y+25]]);await touch('touchEnd');assert.equal(await evaluate(`parseInt(document.querySelector('[data-bloco=identidade]').style.left)`),35);assert.equal(await evaluate(`parseInt(document.querySelector('[data-bloco=identidade]').style.top)`),25);
  await evaluate(`(()=>{const b=document.querySelector('[data-bloco=identidade]'),v=document.querySelector('.ficha-viewport');v.scrollTop=Math.max(0,b.offsetTop+b.offsetHeight-v.clientHeight+20);})()`);await sleep(80);
  const resize=await evaluate(`(()=>{const b=document.querySelector('[data-bloco=identidade]'),r=b.querySelector('.rh-se').getBoundingClientRect();return{x:r.left+22,y:r.top+22,w:b.offsetWidth,h:b.offsetHeight};})()`);
  await touch('touchStart',[[1,resize.x,resize.y]]);await touch('touchMove',[[1,resize.x+15,resize.y+15]]);await touch('touchEnd');assert.ok(await evaluate(`document.querySelector('[data-bloco=identidade]').offsetWidth`)>resize.w);
  const epoch=await evaluate('performance.timeOrigin');await send('Page.reload');await esperar(`performance.timeOrigin!==${epoch}&&!!document.getElementById('pvAtual')`);assert.equal(await evaluate(`parseInt(document.querySelector('[data-bloco=identidade]').style.left)`),35);assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));
  await shot('ficha-mobile');assert.deepEqual(errors,[]);
  console.log('OK: 320/390 px e paisagem, toque real, pinça ancorada sem desenhos/movimentos incidentais, cancelamento, régua, painéis, alvos, ordem persistida, arrasto/resize de blocos e layout livre rolável.');
};
