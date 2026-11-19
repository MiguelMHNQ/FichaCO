// Aparências e modal usam o mesmo catálogo da ficha.
const APARENCIA_ARMAS = Object.fromEntries(ARMAS.map(a => [a.nome,a.descricaoVisual]));

function botaoHabilidadeArma(nome) {
  const arma = ARMAS.find(a => a.nome === nome);
  return arma?.habilidade ? `<button type="button" class="arma-habilidade-btn" data-habilidade-arma="${nome}">Habilidade</button>` : '';
}

// Delegação mantém os botões funcionais após pesquisas e mudanças de equipamento.
document.addEventListener('click', e => {
  const botao = e.target.closest('[data-habilidade-arma]');
  if (!botao) return;
  const arma = ARMAS.find(a => a.nome === botao.dataset.habilidadeArma);
  if (!arma?.habilidade) return;
  e.stopPropagation();
  let modal = document.getElementById('habilidadeArmaModal');
  if (!modal) {
    modal = document.createElement('dialog');
    modal.id = 'habilidadeArmaModal';
    modal.setAttribute('aria-labelledby', 'habilidadeArmaTitulo');
    modal.innerHTML = '<form method="dialog"><button class="arma-modal-fechar" aria-label="Fechar">✕</button></form><small>HABILIDADE</small><h2 id="habilidadeArmaTitulo"></h2><p id="habilidadeArmaTexto"></p>';
    modal.addEventListener('click', evento => { if (evento.target === modal) { const r = modal.getBoundingClientRect(); if (evento.clientX < r.left || evento.clientX > r.right || evento.clientY < r.top || evento.clientY > r.bottom) modal.close(); } });
    document.body.appendChild(modal);
  }
  // O livro preserva o texto completo da regra, quando disponível.
  const entrada = typeof LIVRO_ARMAS_EXTRA !== 'undefined' && LIVRO_ARMAS_EXTRA.find(r => r.titulo === arma.nome && !r.subtitulo);
  const texto = entrada ? entrada.texto.split('<br><br><em>Passiva:</em>')[1] : '';
  modal.querySelector('h2').textContent = arma.nome;
  modal.querySelector('p').textContent = texto || arma.habilidade;
  modal.showModal();
});
