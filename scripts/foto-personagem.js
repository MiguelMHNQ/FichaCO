// Recorte quadrado: a área inteira da prévia corresponde à moldura da ficha.
(() => {
  const TAMANHO = 500;
  let imagem = null, url = null, zoom = 1, dx = 0, dy = 0, gesto = null, geracao = 0;
  let modal, canvas, slider, erro, aplicar;
  function criarModal() {
    if (modal) return;
    modal = document.createElement('dialog');
    modal.id = 'recorteFoto'; modal.setAttribute('aria-labelledby','recorteFotoTitulo');
    modal.innerHTML = `<button type="button" class="foto-recorte-fechar" aria-label="Fechar recorte">✕</button>
      <p class="foto-recorte-legenda">RETRATO DO PERSONAGEM</p><h2 id="recorteFotoTitulo">Ajustar foto</h2>
      <p class="foto-recorte-ajuda">Arraste a imagem e ajuste o zoom. O quadrado mostra como ela ficará na moldura.</p>
      <div class="foto-recorte-area"><canvas id="recorteFotoCanvas" width="500" height="500" tabindex="0" aria-label="Prévia do recorte. Arraste ou use as setas para posicionar a foto."></canvas><div class="foto-recorte-guias" aria-hidden="true"></div></div>
      <label class="foto-recorte-zoom" for="recorteFotoZoom">Zoom <input id="recorteFotoZoom" type="range" min="1" max="4" step="0.01" value="1"><output id="recorteFotoZoomValor">100%</output></label>
      <p id="recorteFotoErro" role="status"></p>
      <div class="foto-recorte-acoes"><button type="button" id="recorteFotoCentralizar">Centralizar</button><button type="button" id="recorteFotoCancelar">Cancelar</button><button type="button" id="recorteFotoAplicar" disabled>Usar foto</button></div>`;
    document.body.appendChild(modal);
    canvas = modal.querySelector('canvas'); slider = modal.querySelector('input');
    erro = modal.querySelector('#recorteFotoErro'); aplicar = modal.querySelector('#recorteFotoAplicar');
    modal.querySelector('.foto-recorte-fechar').onclick = () => modal.close();
    modal.querySelector('#recorteFotoCancelar').onclick = () => modal.close();
    modal.querySelector('#recorteFotoCentralizar').onclick = () => { zoom=1;dx=dy=0;slider.value='1';desenhar(); };
    modal.addEventListener('close', () => { if(modal.open)return;geracao++;imagem=null;gesto=null;if(url)URL.revokeObjectURL(url);url=null; });
    modal.addEventListener('click', e => { if(e.target!==modal)return;const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close(); });
    slider.addEventListener('input', () => {
      const novo = Number(slider.value); dx*=novo/zoom;dy*=novo/zoom;zoom=novo;desenhar();
    });
    canvas.addEventListener('pointerdown', e => {
      if(!imagem || e.button!==0)return;e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);
      gesto={x:e.clientX,y:e.clientY,dx,dy,id:e.pointerId};
    });
    canvas.addEventListener('pointermove', e => {
      if(!gesto || e.pointerId!==gesto.id)return;
      const r=canvas.getBoundingClientRect();dx=gesto.dx+(e.clientX-gesto.x)*TAMANHO/r.width;dy=gesto.dy+(e.clientY-gesto.y)*TAMANHO/r.height;desenhar();
    });
    canvas.addEventListener('pointerup',()=>gesto=null);canvas.addEventListener('pointercancel',()=>gesto=null);
    canvas.addEventListener('keydown', e => {
      const passos={ArrowLeft:[10,0],ArrowRight:[-10,0],ArrowUp:[0,10],ArrowDown:[0,-10]};
      if(!imagem || !passos[e.key])return;e.preventDefault();dx+=passos[e.key][0];dy+=passos[e.key][1];desenhar();
    });
    aplicar.onclick = salvar;
  }
  function desenhar() {
    if(!imagem)return;
    const escala=Math.max(TAMANHO/imagem.naturalWidth,TAMANHO/imagem.naturalHeight)*zoom;
    const w=imagem.naturalWidth*escala,h=imagem.naturalHeight*escala;
    dx=Math.max(-(w-TAMANHO)/2,Math.min((w-TAMANHO)/2,dx));
    dy=Math.max(-(h-TAMANHO)/2,Math.min((h-TAMANHO)/2,dy));
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,TAMANHO,TAMANHO);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(imagem,(TAMANHO-w)/2+dx,(TAMANHO-h)/2+dy,w,h);
    modal.querySelector('output').textContent=Math.round(zoom*100)+'%';
  }
  async function salvar() {
    if(!imagem)return;
    const anterior=sessionStorage.getItem('fragmentados_foto');
    aplicar.disabled=true;erro.textContent='';
    try {
      const foto=canvas.toDataURL('image/webp',.88);
      sessionStorage.setItem('fragmentados_foto',foto);
      if(!sincronizarPersonagem())throw new Error('Não foi possível salvar a foto no personagem. Verifique o espaço disponível no navegador.');
      modal.close();renderFicha();
    } catch(e) {
      try { if(anterior===null)sessionStorage.removeItem('fragmentados_foto');else sessionStorage.setItem('fragmentados_foto',anterior); } catch {}
      erro.textContent=e.message || 'Não foi possível salvar a foto.';aplicar.disabled=false;
    }
  }
  window.carregarFoto = async input => {
    const arquivo=input.files?.[0];input.value='';if(!arquivo)return;
    criarModal();if(modal.open)modal.close();
    // O evento close pode ser entregue depois de showModal; aguarda a limpeza anterior.
    await new Promise(resolve=>setTimeout(resolve,0));
    const versao=++geracao;imagem=null;gesto=null;zoom=1;dx=dy=0;slider.value='1';aplicar.disabled=true;
    canvas.getContext('2d').clearRect(0,0,TAMANHO,TAMANHO);erro.textContent='Carregando imagem…';modal.showModal();
    if(!arquivo.type.startsWith('image/')){erro.textContent='Escolha um arquivo de imagem.';return;}
    try {
      url=URL.createObjectURL(arquivo);const nova=new Image();nova.src=url;await nova.decode();
      if(versao!==geracao || !modal.open)return;
      imagem=nova;desenhar();aplicar.disabled=false;erro.textContent='';canvas.focus();
    } catch { if(versao===geracao)erro.textContent='Não consegui abrir essa imagem. Tente outro arquivo.'; }
  };
})();
