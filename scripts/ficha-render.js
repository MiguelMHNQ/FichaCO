// Coordena a montagem dos blocos e a atualização dos controles.


function renderFicha() {
  estado.nivel=Math.max(1,Math.min(100,Math.trunc(Number(estado.nivel)||1)));
  for(const map of ['constancias','racaEscolhas'])estado[map]=Object.fromEntries(Object.keys(criarEstadoInicial().constancias).map(k=>[k,Number.isFinite(Number(estado[map]?.[k]))?Number(estado[map][k]):0]));
  _carregarCores();
  normalizarAcessoriosEquipados();
  const c = document.getElementById('fichaConteudo');
  c.innerHTML = '';
  const layout = _layoutAtual();
  _aplicarClasseLayout();

  // --- IDENTIDADE ---
  const fotoSalva = sessionStorage.getItem('fragmentados_foto') || '';
  const descSalva = sessionStorage.getItem('fragmentados_desc') || '';
  const info = CLASSES_PREVIEW[estado.classe];
  const bc   = bonusDeClasse();
  const fixas = info ? (info.constanciasFixas || []) : [];
  const esc   = estado.constanciasEscolhidas || [];
  const map   = {};
  Object.entries(CONSTANCIAS_MAP).forEach(([a, lista]) => lista.forEach(cn => map[cn] = a));

  const constChecks = lerJSON(sessionStorage, 'fragmentados_const_checks', {});
  const constHtml = [...fixas, ...esc].map(cn => {
    const fixa      = fixas.includes(cn);
    const atribPai  = map[cn];
    const base      = atribPai ? (estado.constancias[atribPai] || 0) : 0;
    const racaB     = atribPai ? totalBonusRaca(atribPai) + bonusAcessorioConstancia(atribPai) : 0;
    const bonusAtrib = calcBonus(base + racaB);
    const checks    = Math.min(3,Math.max(0,Number(constChecks[cn])||0));
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1a1726;">
      <span style="font-size:0.78rem;color:var(--cor-texto);">${cn}
        <span style="font-size:0.6rem;color:${fixa ? 'color-mix(in srgb,var(--cor-principal) 53.33%,transparent)' : '#6688aa88'};">${fixa ? '(fixa)' : '(escolhida)'}</span>
        ${atribPai ? `<span style="font-size:0.6rem;color:#444;"> · ${atribPai}</span>` : ''}
      </span>
      <span id="ficha-const-${cn}" style="font-size:0.75rem;color:var(--cor-principal);font-weight:bold;">+${bonusAtrib + bc + checks}</span>
    </div>`;
  }).join('') || '<span style="font-size:0.75rem;color:#555;">Nenhuma</span>'


  const isL2 = layout === 2;
  c.innerHTML = [
    blocoIdentidadeFicha({fotoSalva,descSalva,info,bc,constHtml,isL2,layout}),
    blocoProgressoFicha(),
    blocoAtributosFicha(),
    blocoEquipamentosFicha(),
    blocoAcessoriosFicha(),
    blocoGrimorioFicha(),
    blocoVitalidadeFicha(),
    blocoHabilidadesFicha({info,bc}),
    blocoInventarioFicha()
  ].join('');

  const idsBlocos=['identidade','progresso','atributos','equipamentos','acessorios',...(estado.classe==='Mago'?['grimorio']:[]),'vitalidade',...(HABILIDADES[estado.classe]?['habilidades']:[]),'inventario'];
  [...c.children].forEach((bloco,i)=>bloco.dataset.bloco=idsBlocos[i]);

  Proficiencias.montar(document.getElementById('fichaProficiencias'),estado.classe,{onChange:()=>{salvarEstado();sincronizarPersonagem();}});
  carregarInventario();
  montarGrimorioFicha();
  _wrapLayout(layout);
  atualizarAnelEscamaUI();
  atualizarPuxaCorteUI();
  atualizarColarCuraUI();
  atualizarPedraReflexaoUI();
  atualizarCargasAcessorios();
  atualizarPVFicha();
  atualizarPEFicha();
  atualizarCAFicha();
  garantirHistoricoNiveis();
}
