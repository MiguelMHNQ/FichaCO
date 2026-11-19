// Consulta do livro, grimório e consumo de recursos ao conjurar.


function obterMagiaDoLivro(nome) {
  return obterListaMagiasDoLivro().find(magia => magia.titulo === nome) || null;
}

let catalogoMagiasFicha=null;
function obterListaMagiasDoLivro() {
  if(catalogoMagiasFicha)return catalogoMagiasFicha;
  const unicas=new Map();
  for(const volume of [LIVRO_MAGIAS_V1,LIVRO_MAGIAS_V2,LIVRO_MAGIAS_V3,LIVRO_MAGIAS_V4,LIVRO_MAGIAS_V5,LIVRO_MAGIAS_V6,LIVRO_MAGIAS_V7,LIVRO_MAGIAS_V8,LIVRO_MAGIAS_V9]){
    let elemento='Outras';
    for(const magia of volume){if(magia.subtitulo){elemento=magia.titulo.split('—').pop().trim().replace(/^(Elemental|Orgânico|Místico)\s+/, '');continue;}
      if(/livro-tag-nivel">Vol\.\s*\d+/.test(magia.texto)&&!unicas.has(magia.titulo))unicas.set(magia.titulo,{...magia,elemento});
    }
  }
  catalogoMagiasFicha=[...unicas.values()];return catalogoMagiasFicha;
}

function capacidadeGrimorio() {
  const checks = lerJSON(sessionStorage, 'fragmentados_const_checks', {});
  const arcanismo = calcBonus((estado.constancias['Inteligência'] || 0) + totalBonusRaca('Inteligência'))
    + bonusDeClasse() + (checks.Arcanismo || 0);
  return Math.max(0, estado.nivel + arcanismo);
}

function adicionarMagiaGrimorio(nome) {
  if(estado.classe!=='Mago'||!obterMagiaDoLivro(nome))return;
  estado.magiasGrimorio ||= [];
  if(estado.magiasGrimorio.includes(nome)||estado.magiasGrimorio.length>=capacidadeGrimorio())return;
  estado.magiasGrimorio.push(nome);salvarEstado();sincronizarPersonagem();selecionarMagiaDoGrimorio(nome);atualizarCatalogoGrimorio();
}
function removerMagiaGrimorio(indice){
  if(estado.classe!=='Mago'||!Array.isArray(estado.magiasGrimorio)||!Number.isInteger(indice)||indice<0||indice>=estado.magiasGrimorio.length)return;
  estado.magiasGrimorio.splice(indice,1);salvarEstado();sincronizarPersonagem();montarGrimorioFicha();atualizarCatalogoGrimorio();
}

function custoManaMagia(magia) {
  const volume = magia.texto.match(/livro-tag-nivel">Vol\.\s*(\d+)/);
  if (!volume) return /livro-tag-nivel">Truque/i.test(magia.texto) ? 0 : null;
  return [0, 2, 4, 6, 10, 14, 18, 24, 30, 36][parseInt(volume[1], 10)] ?? null;
}

function conjurarMagiaDoGrimorio(indice) {
  const nome = estado.magiasGrimorio?.[indice];
  const magia = nome && obterMagiaDoLivro(nome);
  if (estado.classe !== 'Mago' || !magia) {
    alert('Não foi possível encontrar esta magia no grimório.');
    return;
  }

  const custo = custoManaMagia(magia);
  if (custo === null) {
    alert(`Não foi possível identificar o custo de ${nome}.`);
    return;
  }
  const usaPV = /Usa PV em vez de PE/i.test(magia.texto);
  const gastoConcluido = custo === 0 || (usaPV ? gastarPV(custo) : gastarPE(custo, 'Mana'));
  if (!gastoConcluido) return;
  mostrarConjuracaoGrimorio(custo,usaPV?'PV':'Mana');
}
