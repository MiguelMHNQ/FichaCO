// Blocos visuais; os cálculos e a persistência ficam nos módulos próprios.

function blocoIdentidadeFicha({fotoSalva,descSalva,info,bc,constHtml,isL2,layout}){
  return `
    <div class="ficha-bloco l2-identidade">
      <h4>Identidade</h4>
      <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
        <!-- coluna foto -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">
          <button type="button" class="foto-moldura" aria-label="${fotoSalva ? 'Trocar foto do personagem' : 'Colocar foto do personagem'}" title="Colocar foto" onclick="document.getElementById('fotoInput').click()">
            ${fotoSalva
              ? `<img src="${escaparHTML(fotoSalva)}" alt="Foto do personagem">`
              : `<span class="foto-moldura-vazia"><svg class="icone-linha" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="4"/></svg><span>COLOCAR FOTO</span></span>`}
          </button>
          <input id="fotoInput" type="file" accept="image/*" hidden onchange="carregarFoto(this)">
          ${fotoSalva ? `<button class="c-btn" style="width:auto;padding:0 8px;font-size:0.65rem;color:#ff4444;border-color:#ff444444;" onclick="removerFoto()">remover</button>` : ''}
        </div>
        <!-- coluna info básica -->
        <div style="flex:1;min-width:160px;">
          <div class="ficha-linha"><span>Nome</span><span><input value="${escaparHTML(estado.nomePersonagem || '')}" maxlength="30" style="background:transparent;border:none;border-bottom:1px solid #3a3550;color:var(--cor-texto);font-size:0.82rem;text-align:right;padding:0;outline:none;width:120px;font-family:'Georgia',serif;" oninput="estado.nomePersonagem=this.value.trim();salvarEstado();sincronizarPersonagem();"></span></div>
          <div class="ficha-linha"><span>Classe</span><span style="display:flex;align-items:center;gap:6px;">${escaparHTML(estado.classe)}<button onclick="abrirInfoClasse()" style="width:18px;height:18px;border-radius:50%;border:1px solid #3a3550;background:transparent;color:#666;font-family:'Georgia',serif;font-size:0.65rem;font-style:italic;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:border-color 0.2s,color 0.2s;flex-shrink:0;" onmouseover="this.style.borderColor='var(--cor-principal)';this.style.color='var(--cor-principal)'" onmouseout="this.style.borderColor='#3a3550';this.style.color='#666'">i</button></span></div>
          <div class="ficha-linha"><span>Raça</span><span>${escaparHTML(estado.raca || '—')}</span></div>
          <div class="ficha-linha"><span>Deslocamento</span><span style="font-size:0.78rem;">${_deslocamentoRaca(estado.raca)}</span></div>
          <div class="ficha-linha" style="align-items:center;">
            <span>Nível</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <button class="c-btn" onclick="fichaAlterarNivel(-1)">−</button>
              <span id="fichaNivel" style="font-size:1rem;min-width:20px;text-align:center;">${estado.nivel}</span>
              <button class="c-btn" onclick="fichaAlterarNivel(1)">+</button>
            </span>
          </div>
          <div class="ficha-linha"><span>Caminho</span><span>${escaparHTML(estado.caminho || '—')}</span></div>
          <div class="ficha-linha"><span>Bônus de Classe</span><span style="color:var(--cor-principal);">+${bc}</span></div>
        </div>
        <!-- coluna constâncias -->
        <div style="flex:1;min-width:160px;">
          <div style="font-size:0.65rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:6px;">CONSTÂNCIAS <span style="color:#555;font-size:0.6rem;">(BC: +${bc})</span></div>
          ${constHtml}
        </div>
        <!-- coluna proficiências + descrição -->
        <div style="flex:1;min-width:160px;">
          <div style="font-size:0.65rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:6px;">PROFICIÊNCIAS</div>
          <div id="fichaProficiencias"></div>
          <div style="font-size:0.65rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:6px;">DESCRIÇÃO</div>
          <textarea placeholder="Descreva seu personagem..." maxlength="400"
            style="width:100%;background:transparent;border:1px solid #2a2535;border-radius:3px;color:#aaa;font-family:'Georgia',serif;font-size:0.75rem;line-height:1.5;padding:6px 8px;resize:vertical;min-height:60px;outline:none;"
            oninput="sessionStorage.setItem('fragmentados_desc',this.value);sincronizarPersonagem()">${escaparHTML(descSalva)}</textarea>
        </div>
      </div>
    </div>`;

  // --- EXPERIÊNCIA ---
}

function blocoProgressoFicha(){
  const xpAtual     = parseInt(sessionStorage.getItem('fragmentados_xp') || '0');
  const xpNec       = XP_TABLE[estado.nivel] || 4000;

  const xpProgresso = progressoXP(xpAtual);
  return `
    <div class="ficha-bloco l2-experiencia">
      <h4>Experiência</h4>
      <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">
        <!-- controles XP -->
        <div style="flex:1;min-width:180px;">
          <div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:10px;">XP ATUAL</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <button class="c-btn" onclick="alterarXP(-10)">−</button>
            <span id="xpValor" style="font-size:1.4rem;color:var(--cor-texto);min-width:50px;text-align:center;">${xpAtual}</span>
            <button class="c-btn" onclick="alterarXP(10)">+</button>
          </div>
          <div style="font-size:0.7rem;color:#555;margin-bottom:10px;">Ajustar: <input id="xpInput" type="number" value="${xpAtual}" min="0" style="width:60px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="setXP(parseInt(this.value)||0)"></div>
          <div style="height:6px;background:#1a1726;border-radius:3px;overflow:hidden;margin-bottom:4px;">
            <div id="xpBarra" style="height:100%;width:${xpProgresso}%;background:var(--cor-principal);transition:width 0.3s;"></div>
          </div>
          <div id="xpContador" style="font-size:0.68rem;color:#555;">${estado.nivel >= 20 ? 'Nível máximo' : xpAtual + ' / ' + xpNec + ' XP'}</div>
        </div>
        <!-- tabela de níveis -->
        <div style="flex:2;min-width:200px;display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:0 12px;">
          ${XP_TABLE.slice(1).map((xp, i) => {
            const lv = i + 1;
            const xpParaProximo = lv < 20 ? XP_TABLE[lv] : null;
            return `<div id="xp-row-${lv}" style="display:flex;justify-content:space-between;font-size:0.72rem;padding:2px 0;border-bottom:1px solid #1a1726;color:${lv === estado.nivel ? 'var(--cor-principal)' : lv < estado.nivel ? '#555' : '#666'};font-weight:${lv === estado.nivel ? 'bold' : 'normal'};">
              <span>Lv ${String(lv).padStart(2,'0')}</span><span>${xpParaProximo !== null ? xpParaProximo : '—'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  // --- ATRIBUTOS ---
}

function blocoAtributosFicha(){
  const ptTotal = pontosTotal();
  const ptGasto = Object.values(estado.constancias).reduce((a,b) => a+b, 0);
  const ptLivre = ptTotal - ptGasto;
  let aHtml = `<div class="ficha-bloco" id="fichaAtributosBloco"><h4>Atributos</h4>`;
  if (ptLivre > 0) aHtml += `<div id="fichaPontosAviso" style="background:color-mix(in srgb,var(--cor-principal) 13.33%,transparent);border:1px solid color-mix(in srgb,var(--cor-principal) 33.33%,transparent);border-radius:3px;padding:8px 12px;margin-bottom:12px;font-size:0.78rem;color:var(--cor-principal);text-align:center;">✨ Você tem <strong>${ptLivre}</strong> ponto${ptLivre > 1 ? 's' : ''} para distribuir!</div>`;
  Object.entries(estado.constancias).forEach(([k, v]) => {
    const racaBonus = totalBonusRaca(k) + bonusAcessorioConstancia(k);
    const vTotal   = v + racaBonus;
    const bonus    = calcBonus(vTotal);
    const bonusStr = bonus === 0 ? '—' : '+' + bonus;
    aHtml += `<div class="ficha-linha" style="align-items:center;margin-bottom:14px;">
      <span style="cursor:pointer;font-size:0.82rem;" onclick="abrirConstancias('${k}',${vTotal})">${k} <span style="font-size:0.6rem;color:#555;">VER ▸</span></span>
      <span style="display:flex;align-items:center;gap:6px;">
        <button class="c-btn" onclick="fichaAlterarAtributo('${k}',-1)">−</button>
        <span style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid #3a3550;border-radius:3px;background:#1a1726;">
          <span id="fb-${k}" style="font-size:1.3rem;font-weight:bold;color:${bonus===0?'#555':'var(--cor-principal)'};text-shadow:${bonus===0?'none':'0 0 10px color-mix(in srgb,var(--cor-principal) 53.33%,transparent)'};">${bonusStr}</span>
          <span id="fa-${k}" style="position:absolute;top:2px;right:4px;font-size:0.6rem;color:#666;">${vTotal}</span>
          ${racaBonus > 0 ? `<span id="fr-${k}" style="position:absolute;bottom:2px;left:3px;font-size:0.55rem;color:#5599ff;line-height:1;">+${racaBonus}</span>` : ''}
        </span>
        <button class="c-btn" onclick="fichaAlterarAtributo('${k}',1)">+</button>
      </span>
    </div>`;
  });
  aHtml += `<div style="font-size:0.7rem;color:#555;text-align:right;margin-top:8px;border-top:1px solid #1a1726;padding-top:6px;">Pontos: <span id="fichaPtUsados">${ptGasto}</span> / ${ptTotal}</div></div>`;
  return aHtml;

  // --- EQUIPAMENTOS ---
}

function blocoEquipamentosFicha(){
  const slotHtml = (label, slot, lista, val) => {
    const item = lista.find(x => x.nome === val);
    let h = `<div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:4px;">${label}</div>`;
    h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">`;
    h += `<span style="font-size:0.85rem;color:var(--cor-texto);">${escaparHTML(val || '—')}</span>`;
    h += `<span style="display:flex;gap:4px;">`;
    h += `<button class="c-btn" style="width:auto;padding:0 8px;font-size:0.7rem;" onclick="abrirPopupEquip('${slot}')">trocar</button>`;
    if (val) h += `<button class="c-btn" style="width:auto;padding:0 8px;font-size:0.7rem;color:#ff4444;border-color:#ff444444;" onclick="limparEquip('${slot}')">&#x2715;</button>`;
    h += `</span></div>`;
    if (item) h += `<div style="font-size:0.72rem;color:#aaa;margin-bottom:10px;">${item.dano || ''}</div>`;
    if (item && slot === 'arma') h += `<div style="font-size:0.75rem;color:#888;line-height:1.7;">${item.descricaoVisual}</div>${botaoHabilidadeArma(item.nome)}`;
    if (item && slot === 'arma' && !item.dano.startsWith('—')) h += `<button class="c-btn" style="width:100%;margin-bottom:10px;color:var(--cor-principal);border-color:color-mix(in srgb,var(--cor-principal) 40.00%,transparent);" onclick="rolarAtaqueArma()">⚔ Atacar · rolar dano</button>`;
    else h += `<div style="margin-bottom:10px;"></div>`;
    return h;
  };
  return `<div class="ficha-bloco l2-equipamentos"><h4>Equipamentos</h4>
    <div class="l2-equip-slots">
      <div class="l2-equip-slot">${slotHtml('ARMA','arma',ARMAS,estado.arma)}</div>
      <div class="l2-equip-slot" style="border-left:1px solid #2a2535;padding-left:20px;">${slotHtml('ARMADURA','armadura',ARMADURAS,estado.armadura)}</div>
    </div>
  </div>`;
}

function blocoAcessoriosFicha(){
  return `<div class="ficha-bloco ficha-acessorios-equipados">
    <h4>Acessórios equipados</h4>
    <p class="acessorios-ajuda">Escolha um item em cada espaço. Os anéis ocupam um espaço de dedo cada.</p>
    ${renderRodaAcessorios()}
  </div>`;

  // --- VITALIDADE ---
}

function blocoVitalidadeFicha(){
  const pvMax  = parseInt(sessionStorage.getItem('fragmentados_pvmax')) || (() => { const v = calcularPV(); sessionStorage.setItem('fragmentados_pvmax', v); sessionStorage.setItem('fragmentados_pv', v); return v; })();
  const peMax  = parseInt(sessionStorage.getItem('fragmentados_pemax')) || (() => { const v = calcularPE(); sessionStorage.setItem('fragmentados_pemax', v); sessionStorage.setItem('fragmentados_pe', v); return v; })();
  const pvAtual = Number.isFinite(parseInt(sessionStorage.getItem('fragmentados_pv'))) ? parseInt(sessionStorage.getItem('fragmentados_pv')) : pvMax;
  const peAtual = Number.isFinite(parseInt(sessionStorage.getItem('fragmentados_pe'))) ? parseInt(sessionStorage.getItem('fragmentados_pe')) : peMax;
  const caAtual = atualizarCAFicha();
  const anelEscamaAtivo = sessionStorage.getItem('fragmentados_anel_escama_ativo') === 'true';
  if (sessionStorage.getItem('fragmentados_ca') === null) sessionStorage.setItem('fragmentados_ca', caAtual);
  return `
    <div class="ficha-bloco" style="min-width:220px;">
      <h4>Vitalidade</h4>
      <div style="margin-bottom:16px;">
        <div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:10px;">CLASSE DE ARMADURA</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="c-btn" onclick="alterarCA(-1)">−</button>
          <span id="caValor" style="font-size:1.6rem;color:var(--cor-texto);min-width:40px;text-align:center;">${caAtual + (anelEscamaAtivo ? 2 : 0)}</span>
          <button class="c-btn" onclick="alterarCA(1)">+</button>
        </div>
        <div style="font-size:0.7rem;color:#555;margin-top:6px;">Ajustar base: <input id="caAjuste" type="number" value="${caAtual}" min="1" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="definirCAFicha(this.value)"></div>
        <div id="anelEscamaCAInfo" style="font-size:0.7rem;color:#7ecfb3;margin-top:5px;${anelEscamaAtivo ? '' : 'display:none;'}">Anel ativo: +2 CA (total ${caAtual + 2})</div>
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:10px;">PONTOS DE VIDA</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="c-btn" onclick="alterarPV(-1)">−</button>
          <span id="pvAtual" style="font-size:1.6rem;color:var(--cor-texto);min-width:40px;text-align:center;">${pvAtual}</span>
          <button class="c-btn" onclick="alterarPV(1)">+</button>
          <span id="pvTemporarios" class="pv-temporarios" title="Pontos de vida temporários" aria-label="Pontos de vida temporários" hidden></span>
        </div>
        <div style="font-size:0.7rem;color:#555;margin-top:6px;">Máx: <input id="pvMax" type="number" value="${pvMax}" min="1" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="definirPVMaxFicha(this.value)"></div>
      </div>
      <div>
        <div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:10px;">${estado.classe === 'Mago' ? 'MANA' : 'PONTOS DE ENERGIA'}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="c-btn" onclick="alterarPE(-1)">−</button>
          <span id="peAtual" style="font-size:1.6rem;color:var(--cor-texto);min-width:40px;text-align:center;">${peAtual}</span>
          <button class="c-btn" onclick="alterarPE(1)">+</button>
          <span id="peTemporarios" class="pe-temporarios" title="${estado.classe==='Mago'?'Mana temporária':'Pontos de esforço temporários'}" aria-label="${estado.classe==='Mago'?'Mana temporária':'Pontos de esforço temporários'}" hidden></span>
        </div>
        <div style="font-size:0.7rem;color:#555;margin-top:6px;">Máx: <input id="peMax" type="number" value="${peMax}" min="1" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:#aaa;font-size:0.75rem;text-align:center;" onchange="definirPEMaxFicha(this.value)"></div>
      </div>
      ${estado.classe === 'Espadachim' ? (() => { const pceMax = calcularPCEMax(); const pceAtual = Math.min(pceMax, parseInt(sessionStorage.getItem('fragmentados_pce') ?? pceMax)); sessionStorage.setItem('fragmentados_pce', pceAtual); return `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #2a2535;"><div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin-bottom:10px;">PONTOS DE CONHECIMENTO DE ESPADA</div><div style="display:flex;align-items:center;gap:10px;"><button class="c-btn" onclick="alterarPCE(-1)">−</button><span id="pceAtual" style="font-size:1.6rem;color:var(--cor-texto);min-width:40px;text-align:center;">${pceAtual}</span><button class="c-btn" onclick="alterarPCE(1)">+</button></div><div style="font-size:0.7rem;color:#555;margin-top:6px;">Máx neste nível: <span style="color:var(--cor-principal);">${pceMax}</span></div></div>`; })() : ''}
    </div>`;

  // --- HABILIDADES ---
}

function blocoHabilidadesFicha({info,bc}){
  const dados = HABILIDADES[estado.classe];
  if (dados) {
    const renderHabFicha = h => {
      // Habilidade especial: Caminho da Espada
      if (h._especial === 'caminho_espada') {
        const slots = [6,10,12,14,17,20].filter(n => estado.nivel >= n).length;
        const escolhidas = estado.caminhoEspada || [];
        const badge = escolhidas.length < slots
          ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupCaminhoEspada(event)">⚔ Escolher Técnica (${escolhidas.length}/${slots})</span>`
          : `<span class="hab-badge hab-badge-talento" onclick="abrirPopupCaminhoEspada(event)">⚔ Técnicas (${escolhidas.length}/${slots})</span>`;
        return `<div class="ficha-hab-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span class="ficha-hab-nome">${h.nome} <span style="font-size:0.65rem;color:#555;">[Nv ${h.nivel}]</span></span>
            <span>${badge}</span>
          </div>
          <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}</div>
          ${escolhidas.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${escolhidas.map(n => `<span style="font-size:0.68rem;padding:2px 8px;border:1px solid color-mix(in srgb,var(--cor-principal) 26.67%,transparent);border-radius:2px;color:var(--cor-principal);">${escaparHTML(n)}</span>`).join('')}</div>` : ''}
        </div>`;
      }
      // Habilidade especial: Arte da Espada
      if (h._especial === 'arte_espada') {
        const niveis = [7,9,12,15,18].filter(n => estado.nivel >= n);
        const slots  = niveis.length;
        const escolhidas = estado.artesDaEspada || [];
        const badge = escolhidas.length < slots
          ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupArteEspada(event)">★ Escolher Arte (${escolhidas.length}/${slots})</span>`
          : `<span class="hab-badge hab-badge-talento" onclick="abrirPopupArteEspada(event)">★ Artes (${escolhidas.length}/${slots})</span>`;
        return `<div class="ficha-hab-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span class="ficha-hab-nome">${h.nome} <span style="font-size:0.65rem;color:#555;">[Nv ${h.nivel}]</span></span>
            <span>${badge}</span>
          </div>
          <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}</div>
          ${escolhidas.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${escolhidas.map(n => `<span style="font-size:0.68rem;padding:2px 8px;border:1px solid color-mix(in srgb,var(--cor-principal) 26.67%,transparent);border-radius:2px;color:var(--cor-principal);">${escaparHTML(n)}</span>`).join('')}</div>` : ''}
        </div>`;
      }
      const evoMatch = h.evo ? h.evo.match(/Nível (\d+):/g) : null;
      let nivelEvo = null;
      if (evoMatch) {
        const niveis = evoMatch.map(m => parseInt(m.match(/\d+/)[0])).filter(n => estado.nivel >= n);
        if (niveis.length) nivelEvo = Math.max(...niveis);
      }
      const evoHtml = nivelEvo && h.evo
        ? `<span style="color:var(--cor-principal);font-style:italic;font-size:0.74rem;"> ✦ ${h.evo.split('|').find(p => { const m = p.match(/Nível (\d+)/); return m && parseInt(m[1]) === nivelEvo; }) || h.evo.split('|').pop()}</span>`
        : '';
      // A evolução mais recente alcançada define a faixa de custo, não o nível do personagem.
      const recursoEnergia=nomeEnergiaClasse();
      const pe     = custoPE(nivelEvo || h.nivel);
      const podeUsar = h.acao !== 'Passiva' || h.ativavel === true;
      const peTag  = !podeUsar ? '' : `<span style="font-size:0.65rem;color:var(--cor-principal);border:1px solid color-mix(in srgb,var(--cor-principal) 26.67%,transparent);padding:1px 6px;border-radius:2px;margin-right:4px;">${pe} ${recursoEnergia}</span>`;
      const acaTag = `<span style="font-size:0.65rem;color:#666;border:1px solid #2a2535;padding:1px 6px;border-radius:2px;">${h.acao}</span>`;
      const usarTag = !podeUsar ? '' : `<button class="c-btn" style="width:auto;padding:1px 7px;font-size:0.65rem;margin-left:4px;" data-acao-nome="${escaparHTML(h.nome)}" data-acao-descricao="${escaparHTML(h.desc)}" onclick="gastarPE(${pe}, '${recursoEnergia}', this)" title="Gastar ${pe} ${recursoEnergia} ao usar esta habilidade">Usar</button>`;
      return `<div class="ficha-hab-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span class="ficha-hab-nome">${h.nome} <span style="font-size:0.65rem;color:#555;">[Nv ${h.nivel}]</span></span>
          <span>${peTag}${acaTag}${usarTag}</span>
        </div>
        <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}${evoHtml}</div>
      </div>`;
    };

    // Badge truques (entre caminho e talentos)
    const listaTruques = TRUQUES[estado.classe] || [];
    const truquesEscolhidos = estado.truques || [];
    const maxTruques = listaTruques.length > 0 ? (estado.nivel >= 5 ? 1 + Math.floor((Math.min(estado.nivel,17) - 5) / 4) : 0) : 0;
    const truqueBadge = listaTruques.length === 0 ? '' :
      truquesEscolhidos.length > 0
        ? `<span class="hab-badge hab-badge-talento" onclick="abrirPopupTruques()" title="Ver truques">◆ Truques (${truquesEscolhidos.length}/${maxTruques})</span>`
        : maxTruques > 0
          ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupTruques()">◆ Escolher Truque</span>`
          : `<span class="hab-badge hab-badge-bloqueado" title="Disponível no nível 5">◆ Nv 5</span>`;

    // Badge caminho (superior direito)
    const caminhos = Object.keys(dados.caminhos || {});
    const podeEscolherCaminho = estado.nivel >= 6 && !estado.caminho && caminhos.length > 0;
    const caminhoBadge = estado.caminho
      ? `<span class="hab-badge hab-badge-caminho" onclick="abrirPopupCaminho()" title="Caminho escolhido">⚔ ${escaparHTML(estado.caminho)}</span>`
      : podeEscolherCaminho
        ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupCaminho()">⚔ Escolher Caminho</span>`
        : `<span class="hab-badge hab-badge-bloqueado" title="Disponível no nível 6">⚔ Nv 6</span>`;

    // Badge talentos (superior esquerdo)
    const maxTalentos = slotsDisponiveis();
    const qtdTalentos = (estado.talentos || []).length;
    const talentoBadge = qtdTalentos > 0
      ? `<span class="hab-badge hab-badge-talento" onclick="abrirPopupTalentos()" title="Ver talentos">✦ Talentos (${qtdTalentos}/${maxTalentos})</span>`
      : maxTalentos > 0
        ? `<span class="hab-badge hab-badge-escolher" onclick="abrirPopupTalentos()">✦ Escolher Talento</span>`
        : `<span class="hab-badge hab-badge-bloqueado" title="Disponível no nível 5">✦ Nv 5</span>`;

    let habHtml = `<div class="ficha-bloco" style="flex:2;min-width:300px;position:relative;padding-top:14px;">
      <h4 style="text-align:center;margin-bottom:28px;">Habilidades${truqueBadge ? `<span style="margin-left:10px;">${truqueBadge}</span>` : ''}</h4>
      <div style="position:absolute;top:36px;left:24px;">${talentoBadge}</div>
      <div style="position:absolute;top:36px;right:24px;">${caminhoBadge}</div>`;
    // Seção Raça
    if (estado.raca && RACAS[estado.raca] && RACAS[estado.raca].habilidades.length > 0) {
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:#7ecfb3;margin:12px 0 6px;">RAÇA: ${escaparHTML(estado.raca.toUpperCase())}</div>`;
      RACAS[estado.raca].habilidades.forEach(h => {
        habHtml += `<div class="ficha-hab-item">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span class="ficha-hab-nome">${h.nome}</span>
            <span style="font-size:0.65rem;color:#7ecfb3;border:1px solid #7ecfb344;padding:1px 6px;border-radius:2px;background:#7ecfb322;">Raça</span>
          </div>
          <div style="font-size:0.78rem;color:#aaa;line-height:1.6;">${h.desc}</div>
        </div>`;
      });
    }
    dados.base.filter(h => estado.nivel >= h.nivel).forEach(h => { habHtml += renderHabFicha(h); });
    if (estado.caminho && dados.caminhos[estado.caminho]) {
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin:12px 0 6px;">CAMINHO: ${escaparHTML(estado.caminho.toUpperCase())}</div>`;
      dados.caminhos[estado.caminho].habs.filter(h => estado.nivel >= h.nivel).forEach(h => { habHtml += renderHabFicha(h); });
    }
    if (truquesEscolhidos.length > 0) {
      const listaTruquesRender = TRUQUES[estado.classe] || [];
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:#7ecfb3;margin:12px 0 6px;">TRUQUES</div>`;
      truquesEscolhidos.forEach(nome => {
        const t = listaTruquesRender.find(x => x.nome === nome);
        if (!t) return;
        const evoAtiva = t.evo && estado.nivel >= (t.evoNivel || 99);
        const evoHtml = evoAtiva ? `<span style="color:#7ecfb3;font-style:italic;font-size:0.74rem;"> ⇑ ${t.evo}</span>` : '';
        habHtml += `<div class="ficha-hab-item"><span class="ficha-hab-nome" style="color:#7ecfb3;">${t.nome}</span> — <span style="font-size:0.78rem;color:#aaa;">${t.desc}</span>${evoHtml}</div>`;
      });
    }
    if (estado.talentos && estado.talentos.length > 0) {
      const listaTalentos = obterListaTalentos();
      habHtml += `<div style="font-size:0.7rem;letter-spacing:2px;color:var(--cor-principal);margin:12px 0 6px;">TALENTOS</div>`;
      estado.talentos.forEach(nome => {
        const t = resolverTalento(nome);
        if (!t) return;
        const evoAtiva = t.evo && estado.nivel >= (t.evoNivel || 10);
        habHtml += `<div class="ficha-hab-item"><span class="ficha-hab-nome">${t.nome}</span> — ${t.desc}${evoAtiva ? `<span style="color:var(--cor-principal);font-style:italic;font-size:0.74rem;"> ❆ ${t.evo}</span>` : ''}</div>`;
      });
    }
    habHtml += '</div>';
    return habHtml;
  }

  // --- INVENTÁRIO ---
  return '';
}

function blocoInventarioFicha(){
  return `
    <div class="ficha-bloco" style="flex:2;min-width:300px;">
      <h4>Inventário</h4>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:0.75rem;color:#aaa;">Peso total: <span id="pesoTotal" style="color:var(--cor-principal);">0</span> / <input id="pesoMax" type="number" value="${7*(estado.constancias['Força']+5)}" min="0" style="width:50px;background:transparent;border:none;border-bottom:1px solid #3a3550;color:var(--cor-principal);font-size:0.75rem;text-align:center;" oninput="atualizarPeso()"> kg</div>
        <button class="c-btn" style="width:auto;padding:0 10px;font-size:0.75rem;" onclick="adicionarItem()">+ Item</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:0.68rem;color:#555;letter-spacing:1px;margin-bottom:6px;padding:0 4px;">
        <span>ITEM</span><span style="text-align:center;">QTD</span><span style="text-align:center;">PESO</span><span></span>
      </div>
      <div id="inventarioLista"></div>
    </div>`;

}
