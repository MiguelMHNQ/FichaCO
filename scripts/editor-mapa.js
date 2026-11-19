/* TableTop: coordenadas do mundo independentes da câmera; recursos persistidos no IndexedDB. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('mesa'), ctx = canvas.getContext('2d');
  const clone = value => JSON.parse(JSON.stringify(value));
  let usuario, mapas, indice, mapa, db, chave, novoRascunho = false;
  const codigoSessao=new URLSearchParams(location.search).get('sessao');
  let sessao=null;
  let doc = { imagens: [], tracos: [] }, camera = { x: 0, y: 0, zoom: 1 };
  let ferramenta = 'select', selecionado = null, gesto = null, sujo = false, pronto = false;
  let historico = [], futuros = [], recursos = [], categoria = 'mapas', destinoUpload = 'mapa', revisao = 0;
  let inicioToque=null,acoesMesa=null,visaoMesa=null;
  const cache = new CacheRecursosMapa(),pendentesImagem=new Set();
  const TAMANHO_GRADE=50;
  let layoutOculto=false;
  const reguasRemotas=new Map();
  const regua=new ReguaMapa(()=>camera,()=>doc.escalaMetros||1.5,texto=>{if($('reguaDistancia').textContent!==texto)$('reguaDistancia').textContent=texto;});
  function abrirRegua(aberto){if(aberto)fecharPaineisMoveis('regua');$('painelRegua').hidden=!aberto;$('abrirRegua').setAttribute('aria-expanded',aberto);}
  $('abrirRegua').onclick=()=>{abrirGrade(false);abrirRegua($('painelRegua').hidden);};
  regua.aoMedir=()=>sessao?.measurement({pontos:regua.pontos,percurso:regua.percurso,distancia:regua.distancia()});
  $('reguaEscala').onchange=()=>{const valor=+$('reguaEscala').value;if(!pronto||!Number.isFinite(valor)||valor<.1||valor>1000){$('reguaEscala').value=doc.escalaMetros||1.5;return;}registrar();doc.escalaMetros=valor;marcar();regua.desenhar();};
  function definirLayoutOculto(oculto){layoutOculto=oculto;document.body.classList.toggle('layout-oculto',oculto);$('mostrarLayout').hidden=!oculto;abrirGrade(false);abrirRegua(false);try{localStorage.setItem('primordios_layout_oculto_'+usuario.usuario,String(oculto));}catch{}desenhar();}
  $('ocultarLayout').onclick=()=>definirLayoutOculto(true);$('mostrarLayout').onclick=()=>definirLayoutOculto(false);
  function prepararGrade() {
    const g=doc.grade || {};
    doc.grade={frente:g.frente===true,transparencia:Number.isFinite(g.transparencia)?Math.max(0,Math.min(100,g.transparencia)):92,ima:g.ima===true};
  }
  function atualizarGradeUI() {
    prepararGrade();$('gradePosicao').value=doc.grade.frente?'frente':'atras';
    $('gradeTransparencia').value=doc.grade.transparencia;$('gradeTransparenciaValor').value=doc.grade.transparencia+'%';
    $('gradeIma').checked=doc.grade.ima;
  }
  function abrirGrade(aberto) { if(aberto)fecharPaineisMoveis('grade');$('painelGrade').hidden=!aberto;$('abrirGrade').setAttribute('aria-expanded',aberto); }
  function fecharPaineisMoveis(exceto){
    if(!matchMedia('(max-width:720px), (pointer:coarse) and (max-height:500px)').matches)return;
    if(exceto!=='grade')abrirGrade(false);if(exceto!=='regua')abrirRegua(false);if(exceto!=='camadas')abrirCamadas(false);
    $('selecao').classList.remove('propriedades-abertas');$('alternarPropriedades').setAttribute('aria-expanded','false');
  }
  $('abrirGrade').onclick=()=>{abrirRegua(false);abrirGrade($('painelGrade').hidden);};
  document.addEventListener('click',e=>{if(!$('painelGrade').contains(e.target)&&!$('abrirGrade').contains(e.target))abrirGrade(false);if(!$('painelRegua').contains(e.target)&&!$('abrirRegua').contains(e.target))abrirRegua(false);});
  $('gradePosicao').onchange=()=>{if(!pronto)return;registrar();doc.grade.frente=$('gradePosicao').value==='frente';marcar();desenhar();};
  let arrastandoTransparencia=false;
  $('gradeTransparencia').oninput=()=>{if(!pronto)return;if(!arrastandoTransparencia){registrar();arrastandoTransparencia=true;}doc.grade.transparencia=+$('gradeTransparencia').value;$('gradeTransparenciaValor').value=doc.grade.transparencia+'%';marcar();desenhar();};
  $('gradeTransparencia').onchange=$('gradeTransparencia').onblur=()=>arrastandoTransparencia=false;
  $('gradeIma').onchange=()=>{if(!pronto)return;registrar();doc.grade.ima=$('gradeIma').checked;marcar();desenhar();};
  function encaixarGrade(valor) {
    const alvo=(Math.round(valor/TAMANHO_GRADE-.5)+.5)*TAMANHO_GRADE;
    return Math.abs(valor-alvo)<=Math.min(TAMANHO_GRADE/6,8/camera.zoom)?alvo:valor;
  }
  const laser = new PonteiroLaser(() => camera, () => $('laserCor').value);
  function chaveCorLaser() { return 'primordios_laser_cor_' + (usuario?.usuario || 'visitante'); }
  $('laserCor').oninput = () => { try { localStorage.setItem(chaveCorLaser(),$('laserCor').value); } catch {} };
  const iconeCadeado = fechado => fechado ? "<svg class=\"icone-linha\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4M12 14v3\"/></svg>" : "<svg class=\"icone-linha\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 8 0M12 14v3\"/></svg>";
  function proporcaoOriginal(o) { const img=imagem(o.src); return img.naturalWidth && img.naturalHeight ? img.naturalWidth/img.naturalHeight : o.w/o.h; }
  function dimensionar(o,valor,eixo) { const r=proporcaoOriginal(o); const minW=Math.max(5,5*r),maxW=Math.min(20000,20000*r); o.w=Math.max(minW,Math.min(maxW,eixo==='h'?valor*r:valor));o.h=o.w/r; }
  let avisoTimer;
  function avisar(texto) {
    $('aviso').textContent = texto; $('aviso').hidden = false;
    clearTimeout(avisoTimer); avisoTimer = setTimeout(() => $('aviso').hidden = true, 4500);
  }
  function marcar() { revisao++; sujo = true; $('estadoSalvo').textContent = 'Alterações não salvas'; sessao?.edit(); }
  function snapshot() { return JSON.stringify(doc); }
  function limitarHistorico(lista){let size=lista.reduce((n,s)=>n+s.length,0);while(lista.length>1&&(lista.length>40||size>16*1024*1024))size-=lista.shift().length;}
  function registrar() { const antes=snapshot();if(inicioToque&&!inicioToque.snapshot)inicioToque.snapshot=antes;historico.push(antes); limitarHistorico(historico); futuros = []; }
  function desfazer(refazer = false) {
    const origem = refazer ? futuros : historico, alvo = refazer ? historico : futuros;
    if (!origem.length) return;
    alvo.push(snapshot());limitarHistorico(alvo); doc = JSON.parse(origem.pop()); selecionado = null;atualizarGradeUI();$('reguaEscala').value=doc.escalaMetros||1.5;regua.limpar(); marcar(); propriedades(); desenhar();
  }
  function transacao(store, mode, acao) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode), req = acao(tx.objectStore(store));
      tx.oncomplete = () => resolve(req.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  }
  function imagem(src) {
    if (!cache.has(src)) {
      if(MapaAnimado.tipo(src)){
        const media=MapaAnimado.criar(src,()=>codigoSessao&&/^\d{6}\//.test(src)?sessao.assetUrl(src):Promise.resolve(src),()=>{desenhar();animar();},e=>{pendentesImagem.delete(src);avisar(e.message);});cache.set(src,media);return media;
      }
      const img = new Image(); img.onload = desenhar; cache.set(src, img);
      if(codigoSessao&&/^\d{6}\//.test(src)){
        img.crossOrigin='anonymous';
        const carregar=force=>sessao?.assetUrl(src,force).then(url=>{img.src=url;}).catch(()=>{});
        img.onerror=()=>{if(!img.dataset.tentou){img.dataset.tentou='1';carregar(true);}};carregar(false);
      }else img.src = src;
    }
    const media=cache.get(src);if(media.animado&&media.complete)animar();return media;
  }
  let quadroAnimado=null,ultimoQuadro=0;
  function animar(){if(quadroAnimado!==null)return;quadroAnimado=requestAnimationFrame(atualizarAnimacoes);}
  function atualizarAnimacoes(now){
    quadroAnimado=null;let existe=false;
    if(now-ultimoQuadro<1000/30){animar();return;}ultimoQuadro=now;
    for(const [src,media] of cache){if(!media.animado)continue;
      const presente=doc.imagens.some(o=>o.src===src);
      const active=!document.hidden&&(doc.imagens.some(o=>o.src===src&&visivel(o))||(cropAlvo?.src===src&&$('recorte').open));
      existe ||= active&&media.complete;
      try{media.update(now,active);}catch(e){cache.delete(src);avisar(e.message);}
      if(!presente&&media.complete&&!pendentesImagem.has(src))cache.delete(src);
    }
    if(existe&&!document.hidden){desenhar();animar();}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const media of cache.values())media.update?.(performance.now(),false);}else animar();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(quadroAnimado);cache.clear();});
  window.addEventListener('pageshow',event=>{if(event.persisted){redimensionar();animar();}});
  function limiteAnimacao(src){const tipo=MapaAnimado.tipo(src);if(tipo&&doc.imagens.filter(o=>MapaAnimado.tipo(o.src)===tipo).length>=(tipo==='gif'?4:2)){avisar(tipo==='gif'?'Limite de 4 GIFs por mapa.':'Limite de 2 vídeos por mapa.');return false;}return true;}
  function mundo(e) { return { x: (e.clientX - camera.x) / camera.zoom, y: (e.clientY - camera.y) / camera.zoom }; }
  function local(p, obj) {
    const a = -obj.rot * Math.PI / 180, dx = p.x - obj.x, dy = p.y - obj.y;
    return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
  }
  function atual() { return doc.imagens.find(i => i.id === selecionado); }
  function prepararCamadas() {
    if(codigoSessao&&Array.isArray(doc.camadas)&&!doc.camadas.length){doc.camadaAtiva=null;return;}
    if (!Array.isArray(doc.camadas)) {
      const id=crypto.randomUUID();doc.camadas=[{id,nome:'Camada 1',visivel:true}];
      [...doc.imagens,...doc.tracos].forEach(item=>item.camadaId=id);doc.camadaAtiva=id;
    }
    if(!doc.camadas.length)doc.camadas.push({id:crypto.randomUUID(),nome:'Camada 1',visivel:true});
    if (!doc.camadas.some(c=>c.id===doc.camadaAtiva)) doc.camadaAtiva=doc.camadas.at(-1)?.id;
    for(const item of [...doc.imagens,...doc.tracos]){item.id ||= crypto.randomUUID();if(!doc.camadas.some(c=>c.id===item.camadaId))item.camadaId=doc.camadaAtiva;}
  }
  function camadaDe(item) { return doc.camadas?.find(c=>c.id===item?.camadaId); }
  function visivel(item) { return item?.visivel!==false && camadaDe(item)?.visivel!==false && (!visaoMesa||item.token!==true||visaoMesa.canSee(item)); }
  function bloqueado(item) { return item?.travada || camadaDe(item)?.travada || (codigoSessao&&!sessao?.manager&&(doc.imagens.includes(item)?item.token!==true:item?.authorId!==sessao?.me?.userId)); }
  let assinaturaCamadas='';
  function atualizarCamadas() {
    if ($('painelCamadas').hidden || !doc.camadas) return;
    const assinatura=JSON.stringify([doc.camadas,doc.camadaAtiva,selecionado,...[...doc.imagens,...doc.tracos].map(i=>[i.id,i.camadaId,i.visivel,i.nome,i.tipo,i.travada])]);if(assinatura===assinaturaCamadas)return;assinaturaCamadas=assinatura;
    const lista=$('listaCamadas');lista.replaceChildren();
    [...doc.camadas].reverse().forEach((c,pos)=>{
      const linha=document.createElement('div');linha.className='camada'+(doc.camadaAtiva===c.id?' ativa':'');linha.draggable=true;linha.dataset.id=c.id;
      linha.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/primordios-camada',c.id);e.dataTransfer.effectAllowed='move';});
      linha.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';});
      linha.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/primordios-camada');if(id===c.id||!doc.camadas.some(l=>l.id===id))return;registrar();const movida=doc.camadas.find(l=>l.id===id);doc.camadas=doc.camadas.filter(l=>l.id!==id);doc.camadas.splice(doc.camadas.indexOf(c)+1,0,movida);marcar();desenhar();});
      const botao=(texto,titulo,acao)=>{const b=document.createElement('button');b.textContent=texto;b.title=titulo;b.setAttribute('aria-label',titulo);b.onclick=acao;return b;};
      const olho=botao(c.visivel===false?'◌':'◉',c.visivel===false?'Mostrar camada':'Ocultar camada',()=>{registrar();c.visivel=c.visivel===false;if(!c.visivel&&camadaDe(atual())===c)selecionado=null;marcar();propriedades();desenhar();});olho.dataset.action='visibilidade';olho.setAttribute('aria-pressed',c.visivel!==false);
      const nome=document.createElement('input');nome.value=c.nome;nome.maxLength=60;nome.setAttribute('aria-label','Nome da camada');nome.onfocus=()=>{doc.camadaAtiva=c.id;linha.classList.add('ativa');};nome.onchange=()=>{registrar();c.nome=nome.value.trim()||'Camada';doc.camadaAtiva=c.id;marcar();desenhar();};nome.ondragstart=e=>e.stopPropagation();
      const escolher=botao('▱','Selecionar camada',()=>{doc.camadaAtiva=c.id;const img=doc.imagens.filter(i=>i.camadaId===c.id&&visivel(i)).at(-1);selecionado=c.visivel!==false?img?.id||null:null;marcar();propriedades();desenhar();});escolher.dataset.action='selecionar';
      const cadeado=botao(c.travada?'🔒':'🔓',c.travada?'Destravar camada':'Travar camada',()=>{registrar();c.travada=!c.travada;marcar();propriedades();desenhar();});cadeado.innerHTML=iconeCadeado(c.travada);cadeado.dataset.action='travar';
      const acoes=document.createElement('div');acoes.className='camada-acoes';
      const subir=botao('↑','Subir camada',()=>moverCamada(c.id,1)),descer=botao('↓','Descer camada',()=>moverCamada(c.id,-1));subir.disabled=pos===0;descer.disabled=pos===doc.camadas.length-1;subir.dataset.action='subir';descer.dataset.action='descer';acoes.append(subir,descer);
      linha.append(olho,escolher,nome,cadeado,acoes);
      const grupo=document.createElement('div');grupo.className='grupo-camada';grupo.append(linha);lista.append(grupo);
      const itens=[...doc.imagens.filter(i=>i.camadaId===c.id),...doc.tracos.filter(t=>t.camadaId===c.id)];
      const conteudo=document.createElement('details');conteudo.className='camada-conteudo';conteudo.open=c.aberta!==false;
      conteudo.ontoggle=()=>{c.aberta=conteudo.open;};
      const resumo=document.createElement('summary');resumo.textContent=`${itens.length} ${itens.length===1?'item':'itens'}`;conteudo.append(resumo);
      for(const item of itens){
        const ehImagem=doc.imagens.includes(item),rotulo=item.nome||({pen:'Lápis',rect:'Retângulo',ellipse:'Elipse'}[item.tipo]||'Desenho');
        const row=document.createElement('div');row.className='camada-item'+(selecionado===item.id?' selecionado':'');row.dataset.itemId=item.id;
        const ver=botao(item.visivel===false?'◌':'◉',item.visivel===false?'Mostrar item':'Ocultar item',()=>{registrar();item.visivel=item.visivel===false;if(!visivel(item)&&selecionado===item.id)selecionado=null;marcar();propriedades();desenhar();});
        ver.dataset.action='visibilidade-item';ver.setAttribute('aria-pressed',item.visivel!==false);
        const selecionar=botao((ehImagem?'▧ ':'✎ ')+rotulo,'Selecionar '+rotulo,()=>{doc.camadaAtiva=c.id;selecionado=ehImagem&&visivel(item)?item.id:null;propriedades();desenhar();});selecionar.className='camada-item-nome';if(item.nome)selecionar.dataset.i18nSkip='';
        const destino=document.createElement('select');destino.setAttribute('aria-label','Mover '+rotulo+' para camada');destino.title='Mover para camada';destino.dataset.action='mover-item';destino.disabled=!!bloqueado(item);
        for(const camada of doc.camadas){const opcao=document.createElement('option');opcao.value=camada.id;opcao.textContent=camada.nome;opcao.dataset.i18nSkip='';opcao.disabled=!!camada.travada&&camada.id!==c.id;destino.append(opcao);}destino.value=c.id;
        destino.onchange=()=>{const alvo=doc.camadas.find(l=>l.id===destino.value);if(!alvo||alvo.travada||bloqueado(item))return;registrar();item.camadaId=alvo.id;doc.camadaAtiva=alvo.id;if(!visivel(item))selecionado=null;marcar();propriedades();desenhar();};
        row.append(ver,selecionar,destino);conteudo.append(row);
      }
      grupo.append(conteudo);
    });
  }
  function moverCamada(id,delta) {const i=doc.camadas.findIndex(c=>c.id===id),j=i+delta;if(i<0||j<0||j>=doc.camadas.length)return;registrar();[doc.camadas[i],doc.camadas[j]]=[doc.camadas[j],doc.camadas[i]];marcar();desenhar();}
  function abrirCamadas(aberto) {if(aberto)fecharPaineisMoveis('camadas');$('painelCamadas').hidden=!aberto;$('organizar').setAttribute('aria-expanded',aberto);document.body.classList.toggle('organizando',aberto);atualizarCamadas();}
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
  function desenharGrade() {
    const transparencia=doc.grade?.transparencia??92;if(transparencia>=100)return;
    const esquerda = -camera.x/camera.zoom, topo = -camera.y/camera.zoom;
    const direita = esquerda + innerWidth/camera.zoom, baixo = topo + innerHeight/camera.zoom;
    const passo = TAMANHO_GRADE;
    ctx.save();ctx.globalAlpha=1-transparencia/100;
    ctx.lineWidth = 1/camera.zoom; ctx.strokeStyle = document.body.classList.contains('tema-claro') ? '#51442c' : '#ffffff'; ctx.beginPath();
    for (let x = Math.floor(esquerda/passo)*passo; x < direita; x += passo) { ctx.moveTo(x, topo); ctx.lineTo(x, baixo); }
    for (let y = Math.floor(topo/passo)*passo; y < baixo; y += passo) { ctx.moveTo(esquerda, y); ctx.lineTo(direita, y); }
    ctx.stroke();ctx.restore();
  }
  function desenhar() {
    cache.manter(new Set([...pendentesImagem,...doc.imagens.flatMap(o=>[o.src,o.srcSeg].filter(Boolean))]));
    const dpr = devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = document.body.classList.contains('tema-claro') ? '#eeeae2' : '#030305'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.save(); ctx.translate(camera.x, camera.y); ctx.scale(camera.zoom, camera.zoom);
    if(!doc.grade?.frente)desenharGrade();
    for (const camada of doc.camadas || []) {
    if (camada.visivel===false) continue;
    for (const o of doc.imagens.filter(i=>i.camadaId===camada.id&&visivel(i))) {
      const img = imagem(o.src); if (!img.complete || !img.naturalWidth) continue;
      ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.rot*Math.PI/180);
      if(o.recorte){const r=o.recorte;if(r.forma==='circulo'){ctx.beginPath();ctx.ellipse(0,0,o.w/2,o.h/2,0,0,Math.PI*2);ctx.clip();}ctx.drawImage(img,r.x*img.naturalWidth,r.y*img.naturalHeight,r.w*img.naturalWidth,r.h*img.naturalHeight,-o.w/2,-o.h/2,o.w,o.h);}else ctx.drawImage(img,-o.w/2,-o.h/2,o.w,o.h);ctx.restore();
    }
    doc.tracos.filter(t=>t.camadaId===camada.id&&visivel(t)).forEach(pintarTraco);
    }
    if(doc.grade?.frente)desenharGrade();
    const o = atual();
    if (o && visivel(o) && !layoutOculto && !visaoMesa?.preview()) {
      ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.rot*Math.PI/180);
      ctx.strokeStyle = '#e4c46f'; ctx.fillStyle = '#111017'; ctx.lineWidth = 1.5/camera.zoom;
      ctx.strokeRect(-o.w/2,-o.h/2,o.w,o.h);
      ctx.font = `${16/camera.zoom}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e4c46f'; ctx.save();ctx.translate(o.w/2+18/camera.zoom,-o.h/2-18/camera.zoom);ctx.scale(1/camera.zoom,1/camera.zoom);ctx.strokeStyle='#b18a3e';ctx.lineWidth=1.6;ctx.strokeRect(-6,-1,12,10);ctx.beginPath();ctx.arc(0,-1,4,Math.PI,0);if(o.travada)ctx.lineTo(4,0);ctx.stroke();ctx.restore();
      if (!bloqueado(o)) {
      ctx.fillStyle = '#111017';
      const s = 8/camera.zoom;
      for (const [x,y] of [[-1,-1],[1,-1],[1,1],[-1,1]]) { ctx.fillRect(x*o.w/2-s/2,y*o.h/2-s/2,s,s);ctx.strokeRect(x*o.w/2-s/2,y*o.h/2-s/2,s,s); }
      ctx.beginPath();ctx.moveTo(0,-o.h/2);ctx.lineTo(0,-o.h/2-28/camera.zoom);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-o.h/2-28/camera.zoom,6/camera.zoom,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
      ctx.restore();
    }
    acoesMesa?.paint(ctx);
    visaoMesa?.paint(ctx);
    ctx.restore();const zoomLabel=Math.round(camera.zoom*100)+'%';if($('zoom').textContent!==zoomLabel)$('zoom').textContent=zoomLabel;
    $('desfazer').disabled = !historico.length; $('refazer').disabled = !futuros.length;
    atualizarCamadas();
    regua.desenhar();
    if(cropAlvo&&$('recorte').open)desenharRecorte();
    for(const remote of reguasRemotas.values())remote.desenhar();
  }
  function propriedades() {
    acoesMesa?.update();
    visaoMesa?.update();
    const o = atual(); $('selecao').hidden = !o || !visivel(o);
    if (o) {
      $('imagemToken').checked=o.token===true;$('imagemTokenLabel').hidden=!!codigoSessao&&!sessao?.manager;
      $('largura').value = Math.round(o.w); $('altura').value = Math.round(o.h); $('rotacao').value = Math.round(o.rot);
      $('travar').innerHTML = iconeCadeado(o.travada) + (o.travada ? ' Destravar imagem' : ' Travar imagem');
      $('proporcao').setAttribute('aria-pressed',!!o.proporcional);
      $('travar').setAttribute('aria-pressed', !!o.travada);
      for (const id of ['largura','altura','rotacao','cortar','deletar','frente','travar','proporcao']) $(id).disabled = !!bloqueado(o) && (id!=='travar'||!!camadaDe(o)?.travada);
      if(codigoSessao&&!sessao?.manager)for(const id of ['cortar','deletar','frente','travar'])$(id).disabled=true;
    }
  }
  function travar() { if(codigoSessao&&!sessao?.manager)return;const o = atual(); if (!o||camadaDe(o)?.travada) return; registrar(); o.travada = !o.travada; marcar(); propriedades(); desenhar(); }
  $('travar').onclick = travar;
  $('imagemToken').onchange=()=>{const o=atual();if(!o||(codigoSessao&&!sessao?.manager))return;registrar();o.token=$('imagemToken').checked;marcar();propriedades();desenhar();};
  $('proporcao').onclick=()=>{const o=atual();if(!o||bloqueado(o))return;registrar();o.proporcional=!o.proporcional;if(o.proporcional)dimensionar(o,o.w,'w');marcar();propriedades();desenhar();};
  function tool(nome) {
    visaoMesa?.onToolChange();

    fimGesto();
    laser.limpar();
    regua.limpar();
    ferramenta = nome; canvas.style.cursor = ['select','movement'].includes(nome) ? 'default' : 'crosshair';
    const desenhando=['pen','rect','ellipse'].includes(nome);
    $('controlesDesenho').hidden=!desenhando;
    $('laserCorControle').hidden = nome !== 'laser'||!!codigoSessao;
    $('opcoesDesenho').hidden=!desenhando&&$('laserCorControle').hidden;
    const header=document.querySelector('.ferramentas');header.classList.toggle('opcoes-abertas',!$('opcoesDesenho').hidden);
    $('opcoesFerramentas').setAttribute('aria-expanded',!$('opcoesDesenho').hidden);
    $('opcoesFerramentas').hidden=!matchMedia('(max-width:720px), (pointer:coarse) and (max-height:500px)').matches||$('opcoesDesenho').hidden;
    document.querySelectorAll('[data-tool]').forEach(b => { const ativo=b.dataset.pencil?desenhando:b.dataset.tool===nome;b.classList.toggle('ativo',ativo);b.setAttribute('aria-pressed',ativo); });
  }
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  function cancelarParaNavegar(){
    acoesMesa?.cancelTouch();visaoMesa?.cancel();
    const g=gesto,antes=inicioToque?.snapshot&&JSON.parse(inicioToque.snapshot);
    if(antes){
      if(g?.obj){const old=antes.imagens.find(i=>i.id===g.obj.id),keys=g.tipo==='move'?['x','y']:g.tipo==='rotate'?['rot']:['x','y','w','h'];if(old)for(const key of keys)g.obj[key]=old[key];sessao?.preview(g.obj);}
      if(!g&&atual()){const old=antes.imagens.find(i=>i.id===selecionado);if(old)atual().travada=old.travada;}
      if(g?.traco)doc.tracos=doc.tracos.filter(t=>t.id!==g.traco.id);
      if(g?.tipo==='eraser')for(const [i,old] of antes.tracos.entries())if(inicioToque.apagados?.has(old.id)&&!doc.tracos.some(t=>t.id===old.id)){const next=antes.tracos.slice(i+1).find(t=>doc.tracos.some(atual=>atual.id===t.id));doc.tracos.splice(next?doc.tracos.findIndex(t=>t.id===next.id):doc.tracos.length,0,old);}
      historico=inicioToque.historico;futuros=inicioToque.futuros;sujo=inicioToque.sujo;revisao++;
      $('estadoSalvo').textContent=inicioToque.status;
    }
    if(g?.tipo==='move')g.trajeto=[];fimGesto();laser.limpar();regua.limpar();propriedades();desenhar();
  }
  new NavegacaoToqueMapa(canvas,{
    camera:()=>camera,aplicar:value=>{camera=value;desenhar();},cancelar:cancelarParaNavegar,
    iniciar:()=>{inicioToque={historico:[...historico],futuros:[...futuros],sujo,status:window.PrimordiosI18n?.original($('estadoSalvo'))||$('estadoSalvo').textContent};},
    fim:()=>{inicioToque=null;}
  });
  canvas.addEventListener('pointerdown', e => {
    if (!pronto || ![0,1,2].includes(e.button)) return;
    e.preventDefault(); canvas.focus(); canvas.setPointerCapture(e.pointerId);
    const p = mundo(e);
    if(!acoesMesa?.active()&&visaoMesa?.down(e,p))return;
    if(e.button===0&&acoesMesa?.down(e,p))return;
    if (e.button === 2 || e.button === 1) { laser.soltar();gesto = { tipo:'pan', x:e.clientX, y:e.clientY, camera:{...camera} }; canvas.style.cursor='grabbing'; return; }
    if (ferramenta === 'laser') { gesto={tipo:'laser'};laser.iniciar(p);sessao?.laser(p);return; }
    if (ferramenta === 'measure') { regua.iniciar(p);gesto={tipo:'measure'};return; }
    if (ferramenta === 'eraser') { registrar(); gesto = {tipo:'eraser'}; apagar(p); return; }
    if (!['select','movement'].includes(ferramenta)) {
      const c=doc.camadas.find(c=>c.id===doc.camadaAtiva);
      if(!c||c.visivel===false||c.travada){avisar('Escolha uma camada visível e destravada em Organizar para desenhar.');return;}
      registrar(); const traco = {id:crypto.randomUUID(),camadaId:c.id,tipo:ferramenta,cor:$('cor').value,tamanho:+$('tamanho').value,preencher:$('preencher').checked,pontos:[p]};
      if(codigoSessao)traco.authorId=sessao?.me?.userId;
      doc.tracos.push(traco); gesto = {tipo:'draw',traco}; marcar(); desenhar(); return;
    }
    const o = atual();
    if (o && ferramenta!=='movement') {
      const l = local(p,o), tolerancia = (e.pointerType==='touch'?22:12)/camera.zoom;
      if (Math.hypot(l.x-o.w/2-18/camera.zoom,l.y+o.h/2+18/camera.zoom) < tolerancia) { travar(); return; }
      if (!bloqueado(o)) {
      if (Math.hypot(l.x,l.y+o.h/2+28/camera.zoom) < tolerancia) { registrar(); gesto={tipo:'rotate',obj:o}; return; }
      for (const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
        if (Math.hypot(l.x-sx*o.w/2,l.y-sy*o.h/2) < tolerancia) { registrar(); gesto={tipo:'resize',obj:o,original:{...o},sx,sy}; return; }
      }
      }
    }
    const alvo = [...doc.camadas].reverse().filter(c=>c.visivel!==false).flatMap(c=>doc.imagens.filter(i=>i.camadaId===c.id&&visivel(i)).reverse()).find(o => {const l=local(p,o);return Math.abs(l.x)<=o.w/2 && Math.abs(l.y)<=o.h/2;});
    selecionado = alvo?.id || null;
    if(alvo)doc.camadaAtiva=alvo.camadaId;
    if (alvo && !bloqueado(alvo)) { registrar(); gesto={tipo:'move',obj:alvo,dx:p.x-alvo.x,dy:p.y-alvo.y,trajeto:[{x:alvo.x,y:alvo.y}]};if(ferramenta==='movement')regua.iniciar({x:alvo.x,y:alvo.y},true); }
    else { gesto={tipo:'pan',x:e.clientX,y:e.clientY,camera:{...camera}};canvas.style.cursor='grabbing'; }
    propriedades(); desenhar();
  });
  function distanciaSegmento(p,a,b) {
    const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  }
  function apagar(p) {
    const antigos=doc.tracos;
    const antes = doc.tracos.length;
    doc.tracos = doc.tracos.filter(t => {
      if(!visivel(t)||bloqueado(t)||t.camadaId!==doc.camadaAtiva)return true;
      let pontos=t.pontos;
      if(t.tipo==='rect'){const a=pontos[0],b=pontos.at(-1);pontos=[a,{x:b.x,y:a.y},b,{x:a.x,y:b.y},a];}
      if(t.tipo==='ellipse'){const a=pontos[0],b=pontos.at(-1);pontos=Array.from({length:65},(_,i)=>({x:(a.x+b.x)/2+Math.cos(i*Math.PI/32)*Math.abs(a.x-b.x)/2,y:(a.y+b.y)/2+Math.sin(i*Math.PI/32)*Math.abs(a.y-b.y)/2}));}
      const raio=(+$('tamanho').value+t.tamanho)/2+4/camera.zoom;
      return !pontos.some((a,i)=>distanciaSegmento(p,a,pontos[Math.max(0,i-1)])<raio);
    });
    if(antes!==doc.tracos.length){if(inicioToque){inicioToque.apagados ||= new Set();for(const old of antigos)if(!doc.tracos.some(t=>t.id===old.id))inicioToque.apagados.add(old.id);}marcar();desenhar();}
  }
  canvas.addEventListener('pointermove', e => {
    if (!gesto) return; const p=mundo(e),g=gesto;
    if(g.tipo==='laser'){laser.mover(p);sessao?.laser(p);return;}
    if(g.tipo==='measure'){regua.mover(p);return;}
    if(g.tipo==='pan'){camera.x=g.camera.x+e.clientX-g.x;camera.y=g.camera.y+e.clientY-g.y;}
    else if(g.tipo==='draw'){if(g.traco.tipo==='pen')g.traco.pontos.push(p);else g.traco.pontos[1]=p;}
    else if(g.tipo==='eraser'){apagar(p);return;}
    else if(g.tipo==='move'){const x=p.x-g.dx,y=p.y-g.dy,next={x:doc.grade?.ima&&!e.altKey?encaixarGrade(x):x,y:doc.grade?.ima&&!e.altKey?encaixarGrade(y):y},position=g.obj.token?GeometriaVisao.tokenMovement(g.obj,next,doc.visao||GeometriaVisao.emptyVision()):next;g.obj.x=position.x;g.obj.y=position.y;
      if(g.obj.token){const path=g.trajeto;if(path.length>1&&!GeometriaVisao.tokenMovement({...g.obj,...path[path.length-2]},position,doc.visao||GeometriaVisao.emptyVision()).blocked)path[path.length-1]={x:position.x,y:position.y};else if(path.length<2048)path.push({x:position.x,y:position.y});else{Object.assign(g.obj,path.at(-1));}}
      if(ferramenta==='movement')regua.mover({x:g.obj.x,y:g.obj.y});marcar();}
    else if(g.tipo==='rotate'){g.obj.rot=Math.atan2(p.y-g.obj.y,p.x-g.obj.x)*180/Math.PI+90;marcar();}
    else if(g.tipo==='resize'){
      const l=local(p,g.original),o=g.original;
      g.obj.w=Math.max(5,g.sx*l.x+o.w/2);g.obj.h=Math.max(5,g.sy*l.y+o.h/2);
      if(g.obj.proporcional)dimensionar(g.obj,g.obj.w,'w');else if(e.shiftKey)g.obj.h=g.obj.w*o.h/o.w;
      const dx=g.sx*(g.obj.w-o.w)/2,dy=g.sy*(g.obj.h-o.h)/2,a=o.rot*Math.PI/180;
      g.obj.x=o.x+dx*Math.cos(a)-dy*Math.sin(a);g.obj.y=o.y+dx*Math.sin(a)+dy*Math.cos(a);marcar();
    }
    if(g.obj&&codigoSessao)sessao?.preview(g.obj);
    propriedades(); desenhar();
  });
  function fimGesto(){if(gesto?.tipo==='move'&&gesto.obj.token&&gesto.trajeto?.length>1)sessao?.recordMovement(gesto.obj.id,gesto.trajeto);if(gesto?.tipo==='laser'){laser.soltar();sessao?.laser(null);}gesto=null;canvas.style.cursor=['select','movement'].includes(ferramenta)?'default':'crosshair';if(codigoSessao)sessao?.edit();}
  canvas.addEventListener('pointerup',fimGesto);canvas.addEventListener('pointercancel',fimGesto);
  canvas.addEventListener('lostpointercapture',fimGesto);
  window.addEventListener('blur',()=>{fimGesto();laser.limpar();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){fimGesto();laser.limpar();}});
  function zoom(fator,x=innerWidth/2,y=innerHeight/2){const p={x:(x-camera.x)/camera.zoom,y:(y-camera.y)/camera.zoom};camera.zoom=Math.max(.1,Math.min(4,camera.zoom*fator));camera.x=x-p.x*camera.zoom;camera.y=y-p.y*camera.zoom;desenhar();}
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001),e.clientX,e.clientY);},{passive:false});
  $('menos').onclick=()=>zoom(1/1.2);$('mais').onclick=()=>zoom(1.2);
  function centralizar(restaurarZoom=false){fimGesto();laser.limpar();camera={x:innerWidth/2,y:innerHeight/2,zoom:restaurarZoom?1:camera.zoom};desenhar();}
  $('centralizar').onclick=()=>centralizar();
  $('zoom').onclick=()=>centralizar(true);
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>tool(b.dataset.tool));
  $('tamanho').oninput=()=>$('tamanhoValor').value=$('tamanho').value;
  $('desfazer').onclick=()=>desfazer();$('refazer').onclick=()=>desfazer(true);
  for(const [id,prop] of [['largura','w'],['altura','h'],['rotacao','rot']]) $(id).onchange=()=>{
    const o=atual(),n=+$(id).value;if(!o||bloqueado(o)||!Number.isFinite(n))return;
    registrar();if(o.proporcional&&prop!=='rot')dimensionar(o,n,prop);else o[prop]=prop==='rot'?n:Math.max(5,Math.min(20000,n));marcar();propriedades();desenhar();
  };
  function duplicar(){if(codigoSessao&&!sessao?.manager)return;const o=atual();if(!o||bloqueado(o)||!limiteAnimacao(o.src))return;registrar();const novo={...o,id:crypto.randomUUID(),travada:false,x:o.x+30,y:o.y+30};doc.imagens.push(novo);selecionado=novo.id;marcar();propriedades();desenhar();}
  function deletar(){if(codigoSessao&&!sessao?.manager)return;if(!atual()||bloqueado(atual()))return;registrar();doc.imagens=doc.imagens.filter(o=>o.id!==selecionado);selecionado=null;marcar();propriedades();desenhar();}
  $('duplicar').onclick=duplicar;$('deletar').onclick=deletar;
  $('frente').onclick=()=>{if(codigoSessao&&!sessao?.manager)return;const o=atual();if(!o||bloqueado(o))return;registrar();doc.imagens=doc.imagens.filter(i=>i!==o);doc.imagens.push(o);marcar();desenhar();};
  function inserir(src,nome='Imagem',camadaId=doc.camadaAtiva,token=false) {
    if(codigoSessao&&!sessao?.manager)return;
    if(!limiteAnimacao(src))return;
    pendentesImagem.add(src);
    const img=imagem(src);
    const adicionar=()=>{
      pendentesImagem.delete(src);
      if(!limiteAnimacao(src))return;
      const camada=doc.camadas.find(c=>c.id===camadaId);
      if(!camada||camada.visivel===false||camada.travada){avisar('Escolha uma camada visível e destravada em Organizar para adicionar imagens.');return;}
      registrar();const escala=Math.min(1,600/Math.max(img.naturalWidth,img.naturalHeight));
      const o={id:crypto.randomUUID(),camadaId:camada.id,src,nome,token,x:(innerWidth/2-camera.x)/camera.zoom,y:(innerHeight/2-camera.y)/camera.zoom,w:img.naturalWidth*escala,h:img.naturalHeight*escala,rot:0};
      doc.imagens.push(o);selecionado=o.id;tool('select');marcar();propriedades();desenhar();animar();
    };
    if(img.complete&&img.naturalWidth)adicionar();else {img.addEventListener('load',adicionar,{once:true});img.addEventListener('error',()=>pendentesImagem.delete(src),{once:true});}
  }
  async function lerArquivo(file){
    const animated=await MapaAnimado.importar(file);if(animated)return animated;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Use PNG, JPEG, WebP, GIF, MP4 ou WebM.');
    if(file.size>20*1024*1024)throw new Error('Imagem: máximo de 20 MB.');
    const url=URL.createObjectURL(file);
    try{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas'),s=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.max(1,Math.round(img.naturalWidth*s));c.height=Math.max(1,Math.round(img.naturalHeight*s));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/webp',.9);}finally{URL.revokeObjectURL(url);}
  }
  async function importar(files,paraBiblioteca=false){
    if(codigoSessao&&!sessao?.manager)return;
    if(!pronto)return;
    const camadaId=doc.camadaAtiva;
    for(const file of files){try{const src=await lerArquivo(file);if(paraBiblioteca){const recurso={id:crypto.randomUUID(),usuario:usuario.usuario,categoria,nome:file.name,src};await transacao('recursos','readwrite',s=>s.put(recurso));recursos.push(recurso);}else inserir(src,file.name,camadaId);}catch(e){avisar('Não foi possível adicionar a imagem: '+e.message);}}
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
  function fecharBibliotecaMenu(){const menu=$('livro').parentElement;menu.classList.remove('aberto');$('livro').setAttribute('aria-expanded','false');}
  $('fecharCategorias').onclick=()=>{fecharBibliotecaMenu();$('livro').focus();};
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.livro'))fecharBibliotecaMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharBibliotecaMenu();});
  $('livro').onclick=()=>{const aberto=$('livro').parentElement.classList.toggle('aberto');$('livro').setAttribute('aria-expanded',aberto);};
  document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{fecharBibliotecaMenu();categoria=b.dataset.category;$('categoriaTitulo').textContent=b.textContent.slice(2);renderGaleria();$('biblioteca').showModal();});
  function renderGaleria(){
    const galeria=$('galeria');galeria.replaceChildren();const lista=recursos.filter(r=>r.categoria===categoria);
    if(!lista.length){const p=document.createElement('p');p.textContent='Nenhuma imagem aqui ainda. Adicione suas primeiras fotos.';galeria.append(p);}
    for(const r of lista){const card=document.createElement('div');card.className='recurso';const btn=document.createElement('button'),img=document.createElement(MapaAnimado.tipo(r.src)==='video'?'span':'img'),nome=document.createElement('span');if(img.tagName==='IMG'){img.src=r.src;img.alt=r.nome;}else{img.textContent='▷';img.style.cssText='display:grid;place-items:center;width:100%;height:90px;font-size:36px';}nome.textContent=r.nome;btn.append(img,nome);btn.onclick=()=>{inserir(r.src,r.nome,doc.camadaAtiva,['tokens','personagens','montarias'].includes(r.categoria));$('biblioteca').close();};const del=document.createElement('button');del.className='remover';del.textContent='✕';del.title='Remover da biblioteca';del.onclick=async()=>{if(!confirm('Remover esta imagem da biblioteca? As cópias nos mapas serão mantidas.'))return;try{await transacao('recursos','readwrite',s=>s.delete(r.id));recursos=recursos.filter(i=>i.id!==r.id);renderGaleria();}catch{avisar('Não foi possível remover a imagem.');}};card.append(btn,del);galeria.append(card);}
  }
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});
  let crop=null,cropGesto=null,cropAlvo=null,cropForma='quadrado';
  const cc=$('canvasRecorte'),cx=cc.getContext('2d');
  function caminhoRecorte(contexto, area=crop) {
    if(cropForma==='circulo')contexto.arc(area.x+area.w/2,area.y+area.h/2,area.w/2,0,Math.PI*2);
    else contexto.rect(area.x,area.y,area.w,area.h);
  }
  function alcasRecorte() {
    return [{lado:'cima',x:crop.x+crop.w/2,y:crop.y},{lado:'direita',x:crop.x+crop.w,y:crop.y+crop.h/2},
      {lado:'baixo',x:crop.x+crop.w/2,y:crop.y+crop.h},{lado:'esquerda',x:crop.x,y:crop.y+crop.h/2}];
  }
  function desenharRecorte(){
    if(!cropAlvo||!crop)return;
    const img=imagem(cropAlvo.src);cx.clearRect(0,0,cc.width,cc.height);cx.drawImage(img,0,0,cc.width,cc.height);
    cx.save();cx.fillStyle='#080810aa';cx.beginPath();cx.rect(0,0,cc.width,cc.height);
    if(cropForma==='circulo')cx.moveTo(crop.x+crop.w,crop.y+crop.h/2);
    caminhoRecorte(cx);cx.fill('evenodd');
    cx.strokeStyle='#ffe098';cx.lineWidth=2;cx.setLineDash([6,5]);cx.beginPath();caminhoRecorte(cx);cx.stroke();
    cx.setLineDash([]);cx.fillStyle='#fff9df';
    const escala=cc.width/(cc.getBoundingClientRect().width||cc.width);
    for(const a of alcasRecorte()){cx.beginPath();cx.ellipse(a.x,a.y,7*escala,5*escala,a.lado==='cima'||a.lado==='baixo'?0:Math.PI/2,0,Math.PI*2);cx.fill();cx.stroke();}
    cx.restore();
  }
  function formatoRecorte(forma){
    cropForma=forma;
    for(const [id,valor] of [['recorteQuadrado','quadrado'],['recorteCirculo','circulo']]){const ativo=forma===valor;$(id).classList.toggle('ativo',ativo);$(id).setAttribute('aria-pressed',ativo);}
    desenharRecorte();
  }
  $('recorteQuadrado').onclick=()=>formatoRecorte('quadrado');$('recorteCirculo').onclick=()=>formatoRecorte('circulo');
  $('cortar').onclick=()=>{
    const o=atual();if(!o||bloqueado(o))return;
    if(MapaAnimado.tipo(o.src)==='video'){avisar('O recorte de animações não está disponível. Você pode redimensionar mantendo a proporção.');return;}
    const img=imagem(o.src);if(!img.complete||!img.naturalWidth){avisar('Aguarde a imagem carregar para recortar.');return;}
    cropAlvo=o;cropGesto=null;
    const escala=Math.min(1,620/img.naturalWidth,420/img.naturalHeight);cc.width=Math.max(1,Math.round(img.naturalWidth*escala));cc.height=Math.max(1,Math.round(img.naturalHeight*escala));
    const lado=Math.min(cc.width,cc.height)*.8;crop={x:(cc.width-lado)/2,y:(cc.height-lado)/2,w:lado,h:lado};
    if(o.recorte)crop={x:o.recorte.x*cc.width,y:o.recorte.y*cc.height,w:o.recorte.w*cc.width,h:o.recorte.h*cc.height};
    $('aplicarRecorte').disabled=false;$('recorte').showModal();formatoRecorte(o.recorte?.forma||'quadrado');cc.focus();animar();
  };
  function pontoRecorte(e){const r=cc.getBoundingClientRect();return{x:Math.max(0,Math.min(cc.width,(e.clientX-r.left)*cc.width/r.width)),y:Math.max(0,Math.min(cc.height,(e.clientY-r.top)*cc.height/r.height))};}
  function moverRecorte(x,y){crop.x=Math.max(0,Math.min(cc.width-crop.w,x));crop.y=Math.max(0,Math.min(cc.height-crop.h,y));}
  function redimensionarRecorte(lado,p,original){
    const centroX=original.x+original.w/2,centroY=original.y+original.h/2;
    let tamanho,maximo;
    if(lado==='direita'||lado==='esquerda'){
      tamanho=lado==='direita'?p.x-original.x:original.x+original.w-p.x;
      maximo=Math.min(lado==='direita'?cc.width-original.x:original.x+original.w,centroY*2,(cc.height-centroY)*2);
    }else{
      tamanho=lado==='baixo'?p.y-original.y:original.y+original.h-p.y;
      maximo=Math.min(lado==='baixo'?cc.height-original.y:original.y+original.h,centroX*2,(cc.width-centroX)*2);
    }
    tamanho=Math.max(Math.min(12,maximo),Math.min(maximo,tamanho));
    crop.w=crop.h=tamanho;
    crop.x=lado==='direita'?original.x:lado==='esquerda'?original.x+original.w-tamanho:centroX-tamanho/2;
    crop.y=lado==='baixo'?original.y:lado==='cima'?original.y+original.h-tamanho:centroY-tamanho/2;
  }
  cc.onpointerdown=e=>{
    if(!crop||e.button!==0)return;
    const p=pontoRecorte(e),tolerancia=12*cc.width/cc.getBoundingClientRect().width;
    const alca=alcasRecorte().find(a=>Math.hypot(p.x-a.x,p.y-a.y)<=tolerancia);
    if(!alca && !(p.x>=crop.x&&p.x<=crop.x+crop.w&&p.y>=crop.y&&p.y<=crop.y+crop.h))return;
    e.preventDefault();cc.focus();cc.setPointerCapture(e.pointerId);cropGesto={p,original:{...crop},lado:alca?.lado,id:e.pointerId};
  };
  cc.onpointermove=e=>{
    const p=pontoRecorte(e);
    if(!cropGesto){if(!crop)return;const a=alcasRecorte().find(a=>Math.hypot(p.x-a.x,p.y-a.y)<12*cc.width/cc.getBoundingClientRect().width);cc.style.cursor=a?(a.lado==='cima'||a.lado==='baixo'?'ns-resize':'ew-resize'):'move';return;}
    if(e.pointerId!==cropGesto.id)return;
    if(cropGesto.lado)redimensionarRecorte(cropGesto.lado,p,cropGesto.original);
    else moverRecorte(cropGesto.original.x+p.x-cropGesto.p.x,cropGesto.original.y+p.y-cropGesto.p.y);
    desenharRecorte();
  };
  cc.onpointerup=cc.onpointercancel=cc.onlostpointercapture=()=>{cropGesto=null;};
  cc.onkeydown=e=>{
    if(!crop)return;const passo=e.shiftKey?10:2,delta={ArrowLeft:[-passo,0],ArrowRight:[passo,0],ArrowUp:[0,-passo],ArrowDown:[0,passo]}[e.key];
    if(delta){e.preventDefault();moverRecorte(crop.x+delta[0],crop.y+delta[1]);desenharRecorte();}
    else if(['+','=','-'].includes(e.key)){e.preventDefault();redimensionarRecorte('direita',{x:crop.x+crop.w+(e.key==='-'?-passo:passo)},{...crop});desenharRecorte();}
  };
  $('recorte').addEventListener('close',()=>{cropGesto=null;cropAlvo=null;crop=null;});
  $('aplicarRecorte').onclick=()=>{
    if(!crop||!cropAlvo||bloqueado(cropAlvo))return;
    if(MapaAnimado.tipo(cropAlvo.src)==='gif'){
      const o=cropAlvo,old=o.recorte||{x:0,y:0,w:1,h:1},next={x:crop.x/cc.width,y:crop.y/cc.height,w:crop.w/cc.width,h:crop.h/cc.height,forma:cropForma};
      const fullW=o.w/old.w,fullH=o.h/old.h,dx=(next.x+next.w/2-old.x-old.w/2)*fullW,dy=(next.y+next.h/2-old.y-old.h/2)*fullH,a=o.rot*Math.PI/180;
      registrar();o.x+=dx*Math.cos(a)-dy*Math.sin(a);o.y+=dx*Math.sin(a)+dy*Math.cos(a);o.w=Math.max(1,fullW*next.w);o.h=Math.max(1,fullH*next.h);o.recorte=next;
      marcar();propriedades();desenhar();$('recorte').close();return;
    }
    const img=imagem(cropAlvo.src),sx=img.naturalWidth/cc.width,sy=img.naturalHeight/cc.height,c=document.createElement('canvas');
    c.width=c.height=Math.max(1,Math.round(crop.w*sx));const contexto=c.getContext('2d');
    if(cropForma==='circulo'){contexto.beginPath();contexto.arc(c.width/2,c.height/2,c.width/2,0,Math.PI*2);contexto.clip();}
    contexto.drawImage(img,crop.x*sx,crop.y*sy,crop.w*sx,crop.h*sy,0,0,c.width,c.height);
    registrar();const o=cropAlvo,dx=((crop.x+crop.w/2)/cc.width-.5)*o.w,dy=((crop.y+crop.h/2)/cc.height-.5)*o.h,a=o.rot*Math.PI/180;
    o.x+=dx*Math.cos(a)-dy*Math.sin(a);o.y+=dx*Math.sin(a)+dy*Math.cos(a);
    o.w=o.h=Math.min(o.w*crop.w/cc.width,o.h*crop.h/cc.height);o.src=c.toDataURL('image/webp',.95);
    marcar();propriedades();desenhar();$('recorte').close();
  };

  $('arquivo').onclick=()=>{const aberto=$('arquivo').parentElement.classList.toggle('aberto');$('arquivo').setAttribute('aria-expanded',aberto);};
  $('nomeMapa').oninput=marcar;
  async function salvar(){
    if(!pronto)return false;
    if(codigoSessao){await sessao?.flush();return !sujo;}
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
    else if(e.key==='Escape'){abrirGrade(false);abrirRegua(false);fimGesto();laser.limpar();regua.limpar();selecionado=null;propriedades();desenhar();}
    else if(!ctrl&&k==='h'){e.preventDefault();definirLayoutOculto(!layoutOculto);}
    else if(!ctrl&&k==='m')tool(e.shiftKey?'movement':'measure');
    else if(e.key==='Home'){e.preventDefault();centralizar();}
    else if(!ctrl&&{v:'select',b:'pen',e:'eraser',r:'rect',o:'ellipse',l:'laser'}[k])tool({v:'select',b:'pen',e:'eraser',r:'rect',o:'ellipse',l:'laser'}[k]);
  });
  window.addEventListener('resize',redimensionar);
  window.addEventListener('primordios:preferencias',desenhar);
  function iniciarVisao(client){
    visaoMesa=criarVisaoDaSessao(client,{scene:()=>doc,camera:()=>camera,selected:atual,draw:desenhar,notice:avisar,selectTool:()=>tool('select')});
    document.body.classList.add('mesa-visao');canvas.addEventListener('pointermove',e=>visaoMesa.move(e,mundo(e)));canvas.addEventListener('pointerup',e=>visaoMesa.up(e,mundo(e)));canvas.addEventListener('pointercancel',e=>visaoMesa.up(e,mundo(e)));
  }
  function clienteVisaoLocal(){return {manager:true,get state(){return {scene:doc};},flush:async()=>{},mutate:async operations=>{
    const next=clone(doc);for(const op of operations){if(op.type==='put'&&op.kind==='imagens'){const image=next.imagens.find(i=>i.id===op.id);if(!image)throw Error('Imagem indisponível.');image.luz=VisaoMapa.validateLight(op.value.luz);}else next.visao=VisaoMapa.applyVisionOperation(next.visao,op.type,op.id,op.value);}
    if(next.imagens.filter(i=>i.luz?.ativa).length>24)throw Error('Use até 24 luzes ativas no mapa.');registrar();doc=next;marcar();propriedades();desenhar();return {scene:doc};
  }};}
  async function iniciar(){
    try{
      if(window.PrimordiosAuth&&!await PrimordiosAuth.ready)return;
      usuario=JSON.parse(localStorage.getItem('primordios_logado')||'null');if(!usuario?.usuario){location.replace('tela0.html');return;}
      if(codigoSessao){
        if(!/^\d{6}$/.test(codigoSessao)){location.replace('tabletop.html');return;}
        db=await abrirBancoMapas();recursos=(await transacao('recursos','readonly',s=>s.getAll())).filter(r=>r.usuario===usuario.usuario);
        camera={x:innerWidth/2,y:innerHeight/2,zoom:1};
        const remotos=new Map();
        sessao=await iniciarSessaoMesa(codigoSessao,{
          capture:()=>({doc:clone(doc),nome:$('nomeMapa').value}),busy:()=>!!gesto,camera:()=>camera,
          status:texto=>{$('estadoSalvo').textContent=texto;},notice:avisar,
          clean:()=>{sujo=false;},
          apply:state=>{const ativa=doc.camadaAtiva;doc=clone(state.scene);
            // Uma confirmação pode substituir o documento durante outro gesto.
            // Manter o gesto ligado aos objetos da cena atual, e não à cópia anterior.
            if(gesto?.obj){const next=doc.imagens.find(i=>i.id===gesto.obj.id);if(next)gesto.obj=next;else gesto=null;}
            if(gesto?.traco){const next=doc.tracos.find(t=>t.id===gesto.traco.id);if(next)gesto.traco=next;else gesto=null;}
            doc.camadaAtiva=doc.camadas.some(c=>c.id===ativa)?ativa:doc.camadas.find(c=>c.visivel!==false)?.id;prepararCamadas();atualizarGradeUI();$('reguaEscala').value=doc.escalaMetros;$('nomeMapa').value=doc.nome;selecionado=doc.imagens.some(i=>i.id===selecionado)?selecionado:null;propriedades();desenhar();},
          role:client=>{sessao ||= client;document.body.classList.toggle('sessao-player',!client.manager);$('nomeMapa').readOnly=!client.manager;for(const id of ['gradePosicao','gradeTransparencia','gradeIma','reguaEscala'])$(id).disabled=!client.manager;if(client.me)$('laserCor').value=client.me.color;},
          remoteLaser:(id,point)=>{let remoto=remotos.get(id);if(!point){remoto?.pointer.soltar();clearTimeout(remoto?.timer);return;}if(!remoto){const info={color:point.color};remoto={info,pointer:new PonteiroLaser(()=>camera,()=>info.color)};remotos.set(id,remoto);}remoto.info.color=point.color;remoto.pointer.mover(point);clearTimeout(remoto.timer);remoto.timer=setTimeout(()=>remoto.pointer.soltar(),900);},
          measurement:(id,data)=>{let r=reguasRemotas.get(id);if(!data){clearTimeout(r?.expirar);r?.canvas.remove();reguasRemotas.delete(id);return;}if(!r){r=new ReguaMapa(()=>camera,()=>doc.escalaMetros||1.5,()=>{});r.canvas.dataset.member=id;reguasRemotas.set(id,r);}r.cor=data.color;r.pontos=data.pontos;r.distanciaRemota=data.distancia;clearTimeout(r.expirar);r.expirar=setTimeout(()=>{r.canvas.remove();reguasRemotas.delete(id);},30000);r.desenhar();},
          preview:point=>{if(gesto)return;const img=doc.imagens.find(i=>i.id===point.id);if(!img)return;if(img.token&&Number.isFinite(point.x)&&Number.isFinite(point.y)){const position=GeometriaVisao.tokenMovement(img,point,doc.visao||GeometriaVisao.emptyVision());point={...point,x:position.x,y:position.y};}for(const key of ['x','y','w','h','rot'])if(Number.isFinite(point[key])&&Math.abs(point[key])<1e6)img[key]=point[key];desenhar();},
          clearImages:()=>{cache.clear();desenhar();}
        });
        iniciarVisao(sessao);
        acoesMesa=criarAcoesDaSessao(sessao,{scene:()=>doc,camera:()=>camera,selected:atual,draw:desenhar,notice:avisar});
        canvas.addEventListener('pointermove',e=>acoesMesa.move(e,mundo(e)));canvas.addEventListener('pointerup',e=>acoesMesa.up(e));canvas.addEventListener('pointercancel',()=>acoesMesa.cancelTouch());
        pronto=true;document.body.classList.add('sessao-online');definirLayoutOculto(localStorage.getItem('primordios_layout_oculto_'+usuario.usuario)==='true');redimensionar();return;
      }
      const corLaser=localStorage.getItem(chaveCorLaser());if(/^#[\da-f]{6}$/i.test(corLaser))$('laserCor').value=corLaser;
      mapas=JSON.parse(localStorage.getItem('primordios_mapas_'+usuario.usuario)||'[]');
      const raw=sessionStorage.getItem('primordios_mapa_idx');indice=raw===null?-1:Number(raw);mapa=mapas[indice];
      if(indice===-1){const rascunho=JSON.parse(sessionStorage.getItem('primordios_mapa_rascunho')||'null');if(rascunho?.usuario===usuario.usuario&&rascunho.mapa){mapa=rascunho.mapa;novoRascunho=true;}}
      if(!mapa){location.replace('tabletop.html');return;}
      if(!mapa.id){mapa.id=crypto.randomUUID();localStorage.setItem('primordios_mapas_'+usuario.usuario,JSON.stringify(mapas));}
      chave=JSON.stringify([usuario.usuario,mapa.id]);
      db=await abrirBancoMapas();
      const salvo=await transacao('mapas','readonly',s=>s.get(chave));
      if(salvo){doc=salvo.doc;camera=salvo.camera;}else camera={x:innerWidth/2,y:innerHeight/2,zoom:1};
      prepararCamadas();
      atualizarGradeUI();
      doc.escalaMetros=Number.isFinite(doc.escalaMetros)&&doc.escalaMetros>=.1&&doc.escalaMetros<=1000?doc.escalaMetros:1.5;$('reguaEscala').value=doc.escalaMetros;
      recursos=(await transacao('recursos','readonly',s=>s.getAll())).filter(r=>r.usuario===usuario.usuario);
      $('nomeMapa').value=salvo?.nome||mapa.nome;iniciarVisao(clienteVisaoLocal());pronto=true;definirLayoutOculto(localStorage.getItem('primordios_layout_oculto_'+usuario.usuario)==='true');$('estadoSalvo').textContent=salvo?'Salvo neste navegador':'Novo mapa';redimensionar();
    }catch(e){$('estadoSalvo').textContent='Falha ao abrir';avisar('Não foi possível abrir o editor: '+e.message);}
  }
  iniciarInterfaceMovelMesa({fecharPaineis:()=>{abrirGrade(false);abrirRegua(false);abrirCamadas(false);}});
  iniciar();
})();
