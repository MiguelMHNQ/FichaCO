/* TableTop: coordenadas do mundo independentes da câmera; recursos persistidos no IndexedDB. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('mesa'), ctx = canvas.getContext('2d');
  const clone = value => JSON.parse(JSON.stringify(value));
  let usuario, mapas, indice, mapa, db, chave, novoRascunho = false;
  let doc = { imagens: [], tracos: [] }, camera = { x: 0, y: 0, zoom: 1 };
  let ferramenta = 'select', selecionado = null, gesto = null, sujo = false, pronto = false;
  let historico = [], futuros = [], recursos = [], categoria = 'mapas', destinoUpload = 'mapa', revisao = 0;
  const cache = new Map();
  let avisoTimer;
  function avisar(texto) {
    $('aviso').textContent = texto; $('aviso').hidden = false;
    clearTimeout(avisoTimer); avisoTimer = setTimeout(() => $('aviso').hidden = true, 4500);
  }
  function marcar() { revisao++; sujo = true; $('estadoSalvo').textContent = 'Alterações não salvas'; }
  function snapshot() { return JSON.stringify(doc); }
  function registrar() { historico.push(snapshot()); if (historico.length > 40) historico.shift(); futuros = []; }
  function desfazer(refazer = false) {
    const origem = refazer ? futuros : historico, alvo = refazer ? historico : futuros;
    if (!origem.length) return;
    alvo.push(snapshot()); doc = JSON.parse(origem.pop()); selecionado = null; marcar(); propriedades(); desenhar();
  }
  function transacao(store, mode, acao) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode), req = acao(tx.objectStore(store));
      tx.oncomplete = () => resolve(req.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  }
  function imagem(src) {
    if (!cache.has(src)) {
      const img = new Image(); img.onload = desenhar; img.src = src; cache.set(src, img);
    }
    return cache.get(src);
  }
  function mundo(e) { return { x: (e.clientX - camera.x) / camera.zoom, y: (e.clientY - camera.y) / camera.zoom }; }
  function local(p, obj) {
    const a = -obj.rot * Math.PI / 180, dx = p.x - obj.x, dy = p.y - obj.y;
    return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
  }
  function atual() { return doc.imagens.find(i => i.id === selecionado); }
  function prepararCamadas() {
    if (!Array.isArray(doc.camadas)) {
      doc.camadas = [];
      for (const img of doc.imagens) { const id=crypto.randomUUID();doc.camadas.push({id,nome:img.nome||'Imagem',visivel:true});img.camadaId=id; }
      const id=crypto.randomUUID();doc.camadas.push({id,nome:'Desenhos',visivel:true});doc.tracos.forEach(t=>t.camadaId=id);
      doc.camadaAtiva=id;
    }
    if (!doc.camadas.some(c=>c.id===doc.camadaAtiva)) doc.camadaAtiva=doc.camadas.at(-1)?.id;
  }
  function camadaDe(item) { return doc.camadas?.find(c=>c.id===item?.camadaId); }
  function visivel(item) { return camadaDe(item)?.visivel!==false; }
  function bloqueado(item) { return item?.travada || camadaDe(item)?.travada; }
  let assinaturaCamadas='';
  function atualizarCamadas() {
    if ($('painelCamadas').hidden || !doc.camadas) return;
    const assinatura=JSON.stringify([doc.camadas,doc.camadaAtiva]);if(assinatura===assinaturaCamadas)return;assinaturaCamadas=assinatura;
    const lista=$('listaCamadas');lista.replaceChildren();
    [...doc.camadas].reverse().forEach((c,pos)=>{
      const linha=document.createElement('div');linha.className='camada'+(doc.camadaAtiva===c.id?' ativa':'');linha.draggable=true;linha.dataset.id=c.id;
      linha.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/primordios-camada',c.id);e.dataTransfer.effectAllowed='move';});
      linha.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';});
      linha.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/primordios-camada');if(id===c.id||!doc.camadas.some(l=>l.id===id))return;registrar();const movida=doc.camadas.find(l=>l.id===id);doc.camadas=doc.camadas.filter(l=>l.id!==id);doc.camadas.splice(doc.camadas.indexOf(c)+1,0,movida);marcar();desenhar();});
      const botao=(texto,titulo,acao)=>{const b=document.createElement('button');b.textContent=texto;b.title=titulo;b.setAttribute('aria-label',titulo);b.onclick=acao;return b;};
      const olho=botao(c.visivel===false?'◌':'◉',c.visivel===false?'Mostrar camada':'Ocultar camada',()=>{registrar();c.visivel=c.visivel===false;if(!c.visivel&&camadaDe(atual())===c)selecionado=null;marcar();propriedades();desenhar();});olho.dataset.action='visibilidade';olho.setAttribute('aria-pressed',c.visivel!==false);
      const nome=document.createElement('input');nome.value=c.nome;nome.maxLength=60;nome.setAttribute('aria-label','Nome da camada');nome.onfocus=()=>{doc.camadaAtiva=c.id;linha.classList.add('ativa');};nome.onchange=()=>{registrar();c.nome=nome.value.trim()||'Camada';doc.camadaAtiva=c.id;marcar();desenhar();};nome.ondragstart=e=>e.stopPropagation();
      const escolher=botao('▱','Selecionar camada',()=>{doc.camadaAtiva=c.id;const img=doc.imagens.filter(i=>i.camadaId===c.id).at(-1);selecionado=c.visivel!==false?img?.id||null:null;marcar();propriedades();desenhar();});escolher.dataset.action='selecionar';
      const cadeado=botao(c.travada?'🔒':'🔓',c.travada?'Destravar camada':'Travar camada',()=>{registrar();c.travada=!c.travada;marcar();propriedades();desenhar();});cadeado.dataset.action='travar';
      const acoes=document.createElement('div');acoes.className='camada-acoes';
      const subir=botao('↑','Subir camada',()=>moverCamada(c.id,1)),descer=botao('↓','Descer camada',()=>moverCamada(c.id,-1));subir.disabled=pos===0;descer.disabled=pos===doc.camadas.length-1;subir.dataset.action='subir';descer.dataset.action='descer';acoes.append(subir,descer);
      linha.append(olho,escolher,nome,cadeado,acoes);lista.append(linha);
    });
  }
  function moverCamada(id,delta) {const i=doc.camadas.findIndex(c=>c.id===id),j=i+delta;if(i<0||j<0||j>=doc.camadas.length)return;registrar();[doc.camadas[i],doc.camadas[j]]=[doc.camadas[j],doc.camadas[i]];marcar();desenhar();}
  function abrirCamadas(aberto) {$('painelCamadas').hidden=!aberto;$('organizar').setAttribute('aria-expanded',aberto);document.body.classList.toggle('organizando',aberto);atualizarCamadas();}
  $('organizar').onclick=()=>abrirCamadas($('painelCamadas').hidden);$('fecharCamadas').onclick=()=>abrirCamadas(false);
  $('novaCamada').onclick=()=>{if(!pronto)return;registrar();const c={id:crypto.randomUUID(),nome:'Camada '+(doc.camadas.length+1),visivel:true};doc.camadas.push(c);doc.camadaAtiva=c.id;selecionado=null;marcar();propriedades();desenhar();};
  function redimensionar() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; desenhar();
  }
  function pintarTraco(t) {
    ctx.strokeStyle = t.cor; ctx.fillStyle = t.cor; ctx.lineWidth = t.tamanho; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (t.tipo === 'pen') {
      t.pontos.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      if (t.pontos.length === 1) { ctx.arc(t.pontos[0].x, t.pontos[0].y, t.tamanho / 2, 0, Math.PI * 2); ctx.fill(); return; }
    } else {
      const a = t.pontos[0], b = t.pontos[t.pontos.length - 1];
      if (t.tipo === 'rect') ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y);
      else ctx.ellipse((a.x+b.x)/2, (a.y+b.y)/2, Math.abs(b.x-a.x)/2, Math.abs(b.y-a.y)/2, 0, 0, Math.PI*2);
      if (t.preencher) ctx.fill();
    }
    ctx.stroke();
  }
  function desenhar() {
    const dpr = devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#030305'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.save(); ctx.translate(camera.x, camera.y); ctx.scale(camera.zoom, camera.zoom);
    const esquerda = -camera.x/camera.zoom, topo = -camera.y/camera.zoom;
    const direita = esquerda + innerWidth/camera.zoom, baixo = topo + innerHeight/camera.zoom;
    const passo = camera.zoom < .3 ? 250 : 50;
    ctx.lineWidth = 1/camera.zoom; ctx.strokeStyle = '#ffffff14'; ctx.beginPath();
    for (let x = Math.floor(esquerda/passo)*passo; x < direita; x += passo) { ctx.moveTo(x, topo); ctx.lineTo(x, baixo); }
    for (let y = Math.floor(topo/passo)*passo; y < baixo; y += passo) { ctx.moveTo(esquerda, y); ctx.lineTo(direita, y); }
    ctx.stroke();
    for (const camada of doc.camadas || []) {
    if (camada.visivel===false) continue;
    for (const o of doc.imagens.filter(i=>i.camadaId===camada.id)) {
      const img = imagem(o.src); if (!img.complete || !img.naturalWidth) continue;
      ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.rot*Math.PI/180); ctx.drawImage(img,-o.w/2,-o.h/2,o.w,o.h); ctx.restore();
    }
    doc.tracos.filter(t=>t.camadaId===camada.id).forEach(pintarTraco);
    }
    const o = atual();
    if (o && visivel(o)) {
      ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.rot*Math.PI/180);
      ctx.strokeStyle = '#e4c46f'; ctx.fillStyle = '#111017'; ctx.lineWidth = 1.5/camera.zoom;
      ctx.strokeRect(-o.w/2,-o.h/2,o.w,o.h);
      ctx.font = `${16/camera.zoom}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e4c46f'; ctx.fillText(o.travada ? '🔒' : '🔓', o.w/2+18/camera.zoom, -o.h/2-18/camera.zoom);
      if (!bloqueado(o)) {
      ctx.fillStyle = '#111017';
      const s = 8/camera.zoom;
      for (const [x,y] of [[-1,-1],[1,-1],[1,1],[-1,1]]) { ctx.fillRect(x*o.w/2-s/2,y*o.h/2-s/2,s,s);ctx.strokeRect(x*o.w/2-s/2,y*o.h/2-s/2,s,s); }
      ctx.beginPath();ctx.moveTo(0,-o.h/2);ctx.lineTo(0,-o.h/2-28/camera.zoom);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-o.h/2-28/camera.zoom,6/camera.zoom,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore(); $('zoom').textContent = Math.round(camera.zoom*100)+'%';
    $('desfazer').disabled = !historico.length; $('refazer').disabled = !futuros.length;
    atualizarCamadas();
  }
  function propriedades() {
    const o = atual(); $('selecao').hidden = !o || !visivel(o);
    if (o) {
      $('largura').value = Math.round(o.w); $('altura').value = Math.round(o.h); $('rotacao').value = Math.round(o.rot);
      $('travar').textContent = o.travada ? '🔒 Destravar imagem' : '🔓 Travar imagem';
      $('travar').setAttribute('aria-pressed', !!o.travada);
      for (const id of ['largura','altura','rotacao','cortar','deletar','frente','travar']) $(id).disabled = !!bloqueado(o) && (id!=='travar'||!!camadaDe(o)?.travada);
    }
  }
  function travar() { const o = atual(); if (!o||camadaDe(o)?.travada) return; registrar(); o.travada = !o.travada; marcar(); propriedades(); desenhar(); }
  $('travar').onclick = travar;
  function tool(nome) {
    ferramenta = nome; canvas.style.cursor = nome === 'select' ? 'default' : 'crosshair';
    document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('ativo', b.dataset.tool === nome));
  }
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    if (!pronto || ![0,1,2].includes(e.button)) return;
    e.preventDefault(); canvas.focus(); canvas.setPointerCapture(e.pointerId);
    const p = mundo(e);
    if (e.button === 2 || e.button === 1) { gesto = { tipo:'pan', x:e.clientX, y:e.clientY, camera:{...camera} }; canvas.style.cursor='grabbing'; return; }
    if (ferramenta === 'eraser') { registrar(); gesto = {tipo:'eraser'}; apagar(p); return; }
    if (ferramenta !== 'select') {
      const c=doc.camadas.find(c=>c.id===doc.camadaAtiva);
      if(!c||c.visivel===false||c.travada){avisar('Escolha uma camada visível e destravada em Organizar para desenhar.');return;}
      registrar(); const traco = {camadaId:c.id,tipo:ferramenta,cor:$('cor').value,tamanho:+$('tamanho').value,preencher:$('preencher').checked,pontos:[p]};
      doc.tracos.push(traco); gesto = {tipo:'draw',traco}; marcar(); desenhar(); return;
    }
    const o = atual();
    if (o) {
      const l = local(p,o), tolerancia = 12/camera.zoom;
      if (Math.hypot(l.x-o.w/2-18/camera.zoom,l.y+o.h/2+18/camera.zoom) < tolerancia) { travar(); return; }
      if (!bloqueado(o)) {
      if (Math.hypot(l.x,l.y+o.h/2+28/camera.zoom) < tolerancia) { registrar(); gesto={tipo:'rotate',obj:o}; return; }
      for (const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
        if (Math.hypot(l.x-sx*o.w/2,l.y-sy*o.h/2) < tolerancia) { registrar(); gesto={tipo:'resize',obj:o,original:{...o},sx,sy}; return; }
      }
      }
    }
    const alvo = [...doc.camadas].reverse().filter(c=>c.visivel!==false).flatMap(c=>doc.imagens.filter(i=>i.camadaId===c.id).reverse()).find(o => {const l=local(p,o);return Math.abs(l.x)<=o.w/2 && Math.abs(l.y)<=o.h/2;});
    selecionado = alvo?.id || null;
    if(alvo)doc.camadaAtiva=alvo.camadaId;
    if (alvo && !bloqueado(alvo)) { registrar(); gesto={tipo:'move',obj:alvo,dx:p.x-alvo.x,dy:p.y-alvo.y}; }
    else { gesto={tipo:'pan',x:e.clientX,y:e.clientY,camera:{...camera}};canvas.style.cursor='grabbing'; }
    propriedades(); desenhar();
  });
  function distanciaSegmento(p,a,b) {
    const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  }
  function apagar(p) {
    const antes = doc.tracos.length;
    doc.tracos = doc.tracos.filter(t => {
      if(!visivel(t)||bloqueado(t)||t.camadaId!==doc.camadaAtiva)return true;
      let pontos=t.pontos;
      if(t.tipo==='rect'){const a=pontos[0],b=pontos.at(-1);pontos=[a,{x:b.x,y:a.y},b,{x:a.x,y:b.y},a];}
      if(t.tipo==='ellipse'){const a=pontos[0],b=pontos.at(-1);pontos=Array.from({length:65},(_,i)=>({x:(a.x+b.x)/2+Math.cos(i*Math.PI/32)*Math.abs(a.x-b.x)/2,y:(a.y+b.y)/2+Math.sin(i*Math.PI/32)*Math.abs(a.y-b.y)/2}));}
      const raio=(+$('tamanho').value+t.tamanho)/2+4/camera.zoom;
      return !pontos.some((a,i)=>distanciaSegmento(p,a,pontos[Math.max(0,i-1)])<raio);
    });
    if(antes!==doc.tracos.length){marcar();desenhar();}
  }
  canvas.addEventListener('pointermove', e => {
    if (!gesto) return; const p=mundo(e),g=gesto;
    if(g.tipo==='pan'){camera.x=g.camera.x+e.clientX-g.x;camera.y=g.camera.y+e.clientY-g.y;}
    else if(g.tipo==='draw'){if(g.traco.tipo==='pen')g.traco.pontos.push(p);else g.traco.pontos[1]=p;}
    else if(g.tipo==='eraser'){apagar(p);return;}
    else if(g.tipo==='move'){g.obj.x=p.x-g.dx;g.obj.y=p.y-g.dy;marcar();}
    else if(g.tipo==='rotate'){g.obj.rot=Math.atan2(p.y-g.obj.y,p.x-g.obj.x)*180/Math.PI+90;marcar();}
    else if(g.tipo==='resize'){
      const l=local(p,g.original),o=g.original;
      g.obj.w=Math.max(5,g.sx*l.x+o.w/2);g.obj.h=Math.max(5,g.sy*l.y+o.h/2);
      if(e.shiftKey)g.obj.h=g.obj.w*o.h/o.w;
      const dx=g.sx*(g.obj.w-o.w)/2,dy=g.sy*(g.obj.h-o.h)/2,a=o.rot*Math.PI/180;
      g.obj.x=o.x+dx*Math.cos(a)-dy*Math.sin(a);g.obj.y=o.y+dx*Math.sin(a)+dy*Math.cos(a);marcar();
    }
    propriedades(); desenhar();
  });
  function fimGesto(){gesto=null;canvas.style.cursor=ferramenta==='select'?'default':'crosshair';}
  canvas.addEventListener('pointerup',fimGesto);canvas.addEventListener('pointercancel',fimGesto);
  function zoom(fator,x=innerWidth/2,y=innerHeight/2){const p={x:(x-camera.x)/camera.zoom,y:(y-camera.y)/camera.zoom};camera.zoom=Math.max(.1,Math.min(4,camera.zoom*fator));camera.x=x-p.x*camera.zoom;camera.y=y-p.y*camera.zoom;desenhar();}
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001),e.clientX,e.clientY);},{passive:false});
  $('menos').onclick=()=>zoom(1/1.2);$('mais').onclick=()=>zoom(1.2);
  $('zoom').onclick=()=>{camera={x:innerWidth/2,y:innerHeight/2,zoom:1};desenhar();};
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>tool(b.dataset.tool));
  $('tamanho').oninput=()=>$('tamanhoValor').value=$('tamanho').value;
  $('desfazer').onclick=()=>desfazer();$('refazer').onclick=()=>desfazer(true);
  for(const [id,prop] of [['largura','w'],['altura','h'],['rotacao','rot']]) $(id).onchange=()=>{
    const o=atual(),n=+$(id).value;if(!o||bloqueado(o)||!Number.isFinite(n))return;
    registrar();o[prop]=prop==='rot'?n:Math.max(5,Math.min(20000,n));marcar();propriedades();desenhar();
  };
  function duplicar(){const o=atual();if(!o)return;registrar();const camada={id:crypto.randomUUID(),nome:(o.nome||'Imagem')+' (cópia)',visivel:true};doc.camadas.push(camada);doc.camadaAtiva=camada.id;const novo={...o,id:crypto.randomUUID(),camadaId:camada.id,travada:false,x:o.x+30,y:o.y+30};doc.imagens.push(novo);selecionado=novo.id;marcar();propriedades();desenhar();}
  function deletar(){if(!atual()||bloqueado(atual()))return;registrar();doc.imagens=doc.imagens.filter(o=>o.id!==selecionado);selecionado=null;marcar();propriedades();desenhar();}
  $('duplicar').onclick=duplicar;$('deletar').onclick=deletar;
  $('frente').onclick=()=>{const o=atual();if(!o||bloqueado(o))return;registrar();doc.imagens=doc.imagens.filter(i=>i!==o);doc.imagens.push(o);const c=camadaDe(o);doc.camadas=doc.camadas.filter(l=>l!==c);doc.camadas.push(c);marcar();desenhar();};
  function inserir(src,nome='Imagem') {
    const img=imagem(src);
    const adicionar=()=>{registrar();const camada={id:crypto.randomUUID(),nome,visivel:true};doc.camadas.push(camada);doc.camadaAtiva=camada.id;const escala=Math.min(1,600/Math.max(img.naturalWidth,img.naturalHeight));const o={id:crypto.randomUUID(),camadaId:camada.id,src,nome,x:(innerWidth/2-camera.x)/camera.zoom,y:(innerHeight/2-camera.y)/camera.zoom,w:img.naturalWidth*escala,h:img.naturalHeight*escala,rot:0};doc.imagens.push(o);selecionado=o.id;tool('select');marcar();propriedades();desenhar();};
    if(img.complete&&img.naturalWidth)adicionar();else img.addEventListener('load',adicionar,{once:true});
  }
  async function lerArquivo(file){
    if(!file.type.startsWith('image/'))throw new Error('Selecione um arquivo de imagem.');
    const url=URL.createObjectURL(file);
    try{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas'),s=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.max(1,Math.round(img.naturalWidth*s));c.height=Math.max(1,Math.round(img.naturalHeight*s));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/webp',.9);}finally{URL.revokeObjectURL(url);}
  }
  async function importar(files,paraBiblioteca=false){
    if(!pronto)return;
    for(const file of files){try{const src=await lerArquivo(file);if(paraBiblioteca){const recurso={id:crypto.randomUUID(),usuario:usuario.usuario,categoria,nome:file.name,src};await transacao('recursos','readwrite',s=>s.put(recurso));recursos.push(recurso);}else inserir(src,file.name);}catch(e){avisar('Não foi possível adicionar a imagem: '+e.message);}}
    if(paraBiblioteca)renderGaleria();
  }
  $('importar').onclick=()=>{destinoUpload='mapa';$('upload').click();};
  $('adicionarBiblioteca').onclick=()=>{destinoUpload='biblioteca';$('upload').click();};
  $('upload').onchange=async()=>{const arquivos=[...$('upload').files];$('upload').value='';await importar(arquivos,destinoUpload==='biblioteca');};
  let copiado=null;
  document.addEventListener('copy',e=>{if(editandoTexto()||!atual())return;copiado=clone(atual());e.clipboardData.setData('text/plain','primordios-imagem:'+copiado.id);e.preventDefault();avisar('Imagem copiada. Use Ctrl V para colar.');});
  document.addEventListener('paste',async e=>{
    if(editandoTexto()||document.querySelector('dialog[open]'))return;
    const files=[...(e.clipboardData?.items||[])].filter(i=>i.type.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean);
    if(files.length){e.preventDefault();await importar(files);}
    else if(copiado&&e.clipboardData.getData('text/plain')==='primordios-imagem:'+copiado.id){e.preventDefault();inserir(copiado.src,copiado.nome);}
  });
  canvas.addEventListener('dragover',e=>e.preventDefault());canvas.addEventListener('drop',e=>{e.preventDefault();importar([...e.dataTransfer.files]);});
  $('livro').onclick=()=>{const aberto=$('livro').parentElement.classList.toggle('aberto');$('livro').setAttribute('aria-expanded',aberto);};
  document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{categoria=b.dataset.category;$('categoriaTitulo').textContent=b.textContent.slice(2);renderGaleria();$('biblioteca').showModal();});
  function renderGaleria(){
    const galeria=$('galeria');galeria.replaceChildren();const lista=recursos.filter(r=>r.categoria===categoria);
    if(!lista.length){const p=document.createElement('p');p.textContent='Nenhuma imagem aqui ainda. Adicione suas primeiras fotos.';galeria.append(p);}
    for(const r of lista){const card=document.createElement('div');card.className='recurso';const btn=document.createElement('button'),img=document.createElement('img'),nome=document.createElement('span');img.src=r.src;img.alt=r.nome;nome.textContent=r.nome;btn.append(img,nome);btn.onclick=()=>{inserir(r.src,r.nome);$('biblioteca').close();};const del=document.createElement('button');del.className='remover';del.textContent='✕';del.title='Remover da biblioteca';del.onclick=async()=>{if(!confirm('Remover esta imagem da biblioteca? As cópias nos mapas serão mantidas.'))return;try{await transacao('recursos','readwrite',s=>s.delete(r.id));recursos=recursos.filter(i=>i.id!==r.id);renderGaleria();}catch{avisar('Não foi possível remover a imagem.');}};card.append(btn,del);galeria.append(card);}
  }
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});
  let crop=null,cropInicio=null,cropAlvo=null;
  const cc=$('canvasRecorte'),cx=cc.getContext('2d');
  function desenharRecorte(){const img=imagem(cropAlvo.src);cx.clearRect(0,0,cc.width,cc.height);cx.drawImage(img,0,0,cc.width,cc.height);if(crop){cx.fillStyle='#c9a84c33';cx.fillRect(crop.x,crop.y,crop.w,crop.h);cx.strokeStyle='#ffe098';cx.lineWidth=2;cx.strokeRect(crop.x,crop.y,crop.w,crop.h);}}
  $('cortar').onclick=()=>{const o=atual();if(!o)return;cropAlvo=o;crop=null;$('aplicarRecorte').disabled=true;const img=imagem(o.src),s=Math.min(1,620/img.naturalWidth,420/img.naturalHeight);cc.width=Math.round(img.naturalWidth*s);cc.height=Math.round(img.naturalHeight*s);desenharRecorte();$('recorte').showModal();};
  function pontoRecorte(e){const r=cc.getBoundingClientRect();return{x:Math.max(0,Math.min(cc.width,(e.clientX-r.left)*cc.width/r.width)),y:Math.max(0,Math.min(cc.height,(e.clientY-r.top)*cc.height/r.height))};}
  cc.onpointerdown=e=>{cropInicio=pontoRecorte(e);cc.setPointerCapture(e.pointerId);};
  cc.onpointermove=e=>{if(!cropInicio)return;const p=pontoRecorte(e);crop={x:Math.min(p.x,cropInicio.x),y:Math.min(p.y,cropInicio.y),w:Math.abs(p.x-cropInicio.x),h:Math.abs(p.y-cropInicio.y)};$('aplicarRecorte').disabled=crop.w<3||crop.h<3;desenharRecorte();};
  cc.onpointerup=cc.onpointercancel=()=>{cropInicio=null;};
  $('aplicarRecorte').onclick=()=>{if(!crop||crop.w<3||crop.h<3)return;const img=imagem(cropAlvo.src),sx=img.naturalWidth/cc.width,sy=img.naturalHeight/cc.height,c=document.createElement('canvas');c.width=Math.max(1,Math.round(crop.w*sx));c.height=Math.max(1,Math.round(crop.h*sy));c.getContext('2d').drawImage(img,crop.x*sx,crop.y*sy,crop.w*sx,crop.h*sy,0,0,c.width,c.height);registrar();const o=cropAlvo,dx=((crop.x+crop.w/2)/cc.width-.5)*o.w,dy=((crop.y+crop.h/2)/cc.height-.5)*o.h,a=o.rot*Math.PI/180;o.x+=dx*Math.cos(a)-dy*Math.sin(a);o.y+=dx*Math.sin(a)+dy*Math.cos(a);o.w*=crop.w/cc.width;o.h*=crop.h/cc.height;o.src=c.toDataURL('image/webp',.95);marcar();propriedades();desenhar();$('recorte').close();};
  $('arquivo').onclick=()=>{const aberto=$('arquivo').parentElement.classList.toggle('aberto');$('arquivo').setAttribute('aria-expanded',aberto);};
  $('nomeMapa').oninput=marcar;
  async function salvar(){
    if(!pronto)return false;
    const revisaoSalva = revisao;
    try{
      const registro={chave,usuario:usuario.usuario,doc:clone(doc),camera:{...camera},nome:$('nomeMapa').value.trim()||'Mapa sem nome'};
      await transacao('mapas','readwrite',s=>s.put(registro));
      const lista=JSON.parse(localStorage.getItem('primordios_mapas_'+usuario.usuario)||'[]');
      let alvo=lista.find(m=>m.id===mapa.id);
      if(!alvo){if(!novoRascunho)throw new Error('O mapa foi removido em outra aba.');alvo={...mapa};lista.push(alvo);}
      alvo.nome=registro.nome;alvo.data=new Date().toLocaleDateString('pt-BR');
      const thumb=document.createElement('canvas');thumb.width=240;thumb.height=135;thumb.getContext('2d').drawImage(canvas,0,0,240,135);alvo.thumb=thumb.toDataURL('image/webp',.65);
      localStorage.setItem('primordios_mapas_'+usuario.usuario,JSON.stringify(lista));
      novoRascunho=false;sessionStorage.removeItem('primordios_mapa_rascunho');sessionStorage.setItem('primordios_mapa_idx',String(lista.findIndex(m=>m.id===mapa.id)));
      sujo=revisao!==revisaoSalva;$('estadoSalvo').textContent=sujo?'Alterações não salvas':'Salvo neste navegador';return !sujo;
    }catch(e){avisar('Não foi possível salvar. '+e.message);return false;}
  }
  $('salvar').onclick=salvar;$('salvarSair').onclick=async()=>{if(await salvar())location.href='tabletop.html';};
  function sairSemSalvar(){sessionStorage.removeItem('primordios_mapa_rascunho');sujo=false;location.href='tabletop.html';}
  $('sair').onclick=()=>{if(!sujo){sairSemSalvar();return;}$('arquivo').parentElement.classList.remove('aberto');$('arquivo').setAttribute('aria-expanded','false');$('confirmarSaida').showModal();};
  $('sairSemSalvar').onclick=sairSemSalvar;
  window.addEventListener('beforeunload',e=>{if(sujo){e.preventDefault();e.returnValue='';}});
  function editandoTexto(){return ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;}
  document.addEventListener('keydown',e=>{
    if(!pronto)return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();salvar();return;}
    if(editandoTexto()||document.querySelector('dialog[open]'))return;
    const k=e.key.toLowerCase(),ctrl=e.ctrlKey||e.metaKey;
    if(ctrl&&k==='z'){e.preventDefault();desfazer(e.shiftKey);}
    else if(ctrl&&k==='y'){e.preventDefault();desfazer(true);}
    else if(ctrl&&k==='d'){e.preventDefault();duplicar();}
    else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deletar();}
    else if(e.key==='Escape'){selecionado=null;propriedades();desenhar();}
    else if(!ctrl&&{v:'select',b:'pen',e:'eraser',r:'rect',o:'ellipse'}[k])tool({v:'select',b:'pen',e:'eraser',r:'rect',o:'ellipse'}[k]);
  });
  window.addEventListener('resize',redimensionar);
  async function iniciar(){
    try{
      usuario=JSON.parse(localStorage.getItem('primordios_logado')||'null');if(!usuario?.usuario){location.replace('tela0.html');return;}
      mapas=JSON.parse(localStorage.getItem('primordios_mapas_'+usuario.usuario)||'[]');
      const raw=sessionStorage.getItem('primordios_mapa_idx');indice=raw===null?-1:Number(raw);mapa=mapas[indice];
      if(indice===-1){const rascunho=JSON.parse(sessionStorage.getItem('primordios_mapa_rascunho')||'null');if(rascunho?.usuario===usuario.usuario&&rascunho.mapa){mapa=rascunho.mapa;novoRascunho=true;}}
      if(!mapa){location.replace('tabletop.html');return;}
      if(!mapa.id){mapa.id=crypto.randomUUID();localStorage.setItem('primordios_mapas_'+usuario.usuario,JSON.stringify(mapas));}
      chave=JSON.stringify([usuario.usuario,mapa.id]);
      db=await new Promise((resolve,reject)=>{const req=indexedDB.open('primordios_tabletop',1);req.onupgradeneeded=()=>{req.result.createObjectStore('mapas',{keyPath:'chave'});req.result.createObjectStore('recursos',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
      const salvo=await transacao('mapas','readonly',s=>s.get(chave));
      if(salvo){doc=salvo.doc;camera=salvo.camera;}else camera={x:innerWidth/2,y:innerHeight/2,zoom:1};
      prepararCamadas();
      recursos=(await transacao('recursos','readonly',s=>s.getAll())).filter(r=>r.usuario===usuario.usuario);
      $('nomeMapa').value=salvo?.nome||mapa.nome;pronto=true;$('estadoSalvo').textContent=salvo?'Salvo neste navegador':'Novo mapa';redimensionar();
    }catch(e){$('estadoSalvo').textContent='Falha ao abrir';avisar('Não foi possível abrir o editor: '+e.message);}
  }
  iniciar();
})();
