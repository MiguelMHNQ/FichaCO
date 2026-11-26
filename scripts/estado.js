// ===== ESTADO GLOBAL =====
function criarEstadoInicial() { return {
  id: null,
  persistido: false,
  revisaoNuvem: null,
  usuarioDono: null,
  ganhosNivel: {},
  personagem: null,
  classe: null,
  nivel: 1,
  caminho: null,
  raca: null,
  racaEscolhas: {},
  constancias: { Vigor: 0, Destreza: 0, Sabedoria: 0, 'Inteligência': 0, 'Força': 0, Carisma: 0 },
  constanciasEscolhidas: [],
  arma: null,
  armadura: null,
  acessorio: null,
  proficienciasGuerreiro: { conhecimentos: [], familiaridade: null },
  especializacaoArma: null,
  acessoriosEquipados: {},
  acessoriosCargas: {},
  talentos: [],
  truques: [],
  magiasGrimorio: [],
  grimorioInicializado: false,
  artesDaEspada: [],
  caminhoEspada: [],
  nomePersonagem: ''
}; }
const estado = criarEstadoInicial();

function lerJSON(storage, chave, padrao) {
  try { const valor = JSON.parse(storage.getItem(chave)); return valor ?? padrao; }
  catch { return padrao; }
}

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function obterPersonagens(usuario) {
  if (window.CloudFichas && lerJSON(localStorage, 'primordios_logado', null)?.online) return CloudFichas.list();
  const lista = lerJSON(localStorage, 'primordios_personagens_' + usuario, []);
  if (!Array.isArray(lista)) return [];
  let mudou = false;
  for (const p of lista) {
    if (!p || typeof p !== 'object') continue;
    if (!p.id) { p.id = crypto.randomUUID(); mudou = true; }
    if (p.estadoCompleto && p.estadoCompleto.id !== p.id) {
      p.estadoCompleto.id = p.id; p.estadoCompleto.usuarioDono = usuario; mudou = true;
    }
  }
  if (mudou && !gravarPersonagens(usuario, lista)) throw new Error('Não foi possível atualizar os identificadores dos personagens.');
  return lista.filter(p => p && typeof p === 'object');
}

function salvarEstado() {
  sessionStorage.setItem('fragmentados_estado', JSON.stringify(estado));
}

function carregarEstadoBase() {
  let salvo = sessionStorage.getItem('fragmentados_estado');
  const user = lerJSON(localStorage, 'primordios_logado', null);
  // Migra somente um personagem antigo que pertença à conta atual; nunca lê PV globais.
  if (!salvo && user?.usuario && !user.online) {
    const antigo = lerJSON(localStorage, 'fragmentados_estado', null);
    const lista = obterPersonagens(user.usuario);
    const p = antigo && lista.find(p => p.id === antigo.id || (!antigo.id && p.nomePersonagem === antigo.nomePersonagem && p.classe === antigo.classe));
    if (p) { restaurarDadosFicha(p); salvo = sessionStorage.getItem('fragmentados_estado'); }
  }
  if (!salvo) return false;
  const dados = lerJSON(sessionStorage, 'fragmentados_estado', null);
  if (!dados || (dados.usuarioDono && dados.usuarioDono !== user?.usuario)) { limparDadosFicha(); return false; }
  Object.assign(estado, criarEstadoInicial(), dados);
  if (!estado.id) {
    const p = user?.usuario && obterPersonagens(user.usuario).find(p => p.nomePersonagem === estado.nomePersonagem);
    estado.id = p?.id || crypto.randomUUID();
  }
  estado.usuarioDono = user?.usuario || null;
  if (!estado.ganhosNivel) estado.ganhosNivel = {};
  salvarEstado();
  if (!estado.constanciasEscolhidas) estado.constanciasEscolhidas = [];
  if (!estado.racaEscolhas) estado.racaEscolhas = {};
  if (!estado.truques) estado.truques = [];
  if (!estado.magiasGrimorio) estado.magiasGrimorio = [];
  if (typeof estado.grimorioInicializado !== 'boolean') estado.grimorioInicializado = false;
  if (!estado.artesDaEspada) estado.artesDaEspada = [];
  if (!estado.caminhoEspada) estado.caminhoEspada = [];
  if (!estado.acessoriosEquipados || typeof estado.acessoriosEquipados !== 'object') estado.acessoriosEquipados = {};
  if (!estado.acessoriosCargas || typeof estado.acessoriosCargas !== 'object') estado.acessoriosCargas = {};
  return true;
}

// ===== SALVAMENTO PERMANENTE DA FICHA =====
// A ficha aberta é isolada por aba; o registro permanente é isolado por conta e ID.
const CHAVES_FICHA = [
  'fragmentados_pvmax', 'fragmentados_pemax',
  'fragmentados_pv', 'fragmentados_pe',
  'fragmentados_ca', 'fragmentados_ca_ajuste', 'fragmentados_xp', 'fragmentados_pce',
  'fragmentados_pesomax', 'fragmentados_inventario', 'fragmentados_const_checks',
  'fragmentados_anel_escama_cargas', 'fragmentados_anel_escama_ativo',
  'fragmentados_puxa_corte_cargas', 'fragmentados_colar_cura_cargas',
  'fragmentados_pedra_reflexao_cargas'
];

// Junta tudo da ficha aberta (inventário, peso, checks, PV/PE/CA/XP...) num objeto só
function coletarDadosFicha() {
  const dados = {};
  CHAVES_FICHA.forEach(k => {
    const v = sessionStorage.getItem(k);
    if (v !== null) dados[k] = v;
  });
  return dados;
}

// Devolve um personagem salvo para a "ficha aberta" (apaga antes o que sobrou de outro personagem)
function restaurarDadosFicha(p) {
  const guardar = (k, v) => {
    try { sessionStorage.setItem(k, v); } catch (e) { console.warn('Não consegui carregar', k, e); }
  };
  limparDadosFicha();
  // personagens salvos antes desta atualização só têm os campos antigos
  const dados = p.dados || {
    fragmentados_pvmax: p.pvMax, fragmentados_pemax: p.peMax,
    fragmentados_pv: p.pv,       fragmentados_pe: p.pe,
    fragmentados_ca: p.ca,       fragmentados_xp: p.xp
  };
  Object.entries(dados).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') guardar(k, v);
  });
  if (p.foto) guardar('fragmentados_foto', p.foto);
  if (p.desc) guardar('fragmentados_desc', p.desc);
  const estadoSalvo = p.estadoCompleto || {};
  guardar('fragmentados_estado', JSON.stringify({
    ...estadoSalvo,
    id: p.id || estadoSalvo.id || crypto.randomUUID(),
    persistido: true,
    usuarioDono: lerJSON(localStorage, 'primordios_logado', null)?.usuario || null,
    magiasGrimorio: Array.isArray(estadoSalvo.magiasGrimorio) ? estadoSalvo.magiasGrimorio : [],
    grimorioInicializado: Boolean(estadoSalvo.grimorioInicializado)
  }));
}

// Grava a lista de personagens avisando se o navegador ficar sem espaço
function gravarPersonagens(usuario, lista) {
  if (window.CloudFichas && lerJSON(localStorage, 'primordios_logado', null)?.online) return false;
  try {
    localStorage.setItem('primordios_personagens_' + usuario, JSON.stringify(lista));
    return true;
  } catch (e) {
    console.error('Falha ao salvar personagens:', e);
    if (!window._avisouSemEspaco) {
      window._avisouSemEspaco = true;
      alert('⚠ Não consegui salvar: o navegador está sem espaço. Tente usar uma foto menor ou apagar personagens antigos.');
    }
    return false;
  }
}

function novoPersonagem() {
  limparDadosFicha();
  Object.assign(estado, criarEstadoInicial(), {id:crypto.randomUUID(), usuarioDono:lerJSON(localStorage,'primordios_logado',null)?.usuario || null});
  salvarEstado();
  window.location.href = 'tela1.html';
}

function limparDadosFicha() {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const chave = sessionStorage.key(i);
    if (chave?.startsWith('fragmentados_')) sessionStorage.removeItem(chave);
  }
}

function salvarFichaAtual() {
  const user = lerJSON(localStorage, 'primordios_logado', null);
  if (!user?.usuario || !estado.nomePersonagem || !estado.classe || (estado.usuarioDono && estado.usuarioDono !== user.usuario)) return false;
  estado.id ||= crypto.randomUUID(); estado.usuarioDono = user.usuario;
  const lista = obterPersonagens(user.usuario);
  const idx = lista.findIndex(p => p.id === estado.id);
  if (idx < 0 && estado.persistido) return false; // Não ressuscita personagens excluídos em outra aba.
  estado.persistido = true;
  const registro = {
    id:estado.id, nomePersonagem:estado.nomePersonagem, classe:estado.classe, nivel:estado.nivel,
    foto:sessionStorage.getItem('fragmentados_foto') || '', desc:sessionStorage.getItem('fragmentados_desc') || '',
    dados:coletarDadosFicha(), estadoCompleto:JSON.parse(JSON.stringify(estado))
  };
  if (window.CloudFichas && user.online) {
    const result = CloudFichas.queue(registro); if (!result) estado.persistido = idx >= 0;
    salvarEstado(); return result;
  }
  if (idx < 0) lista.push(registro); else lista[idx] = {...lista[idx], ...registro};
  if (!gravarPersonagens(user.usuario, lista)) { estado.persistido = idx >= 0; return false; }
  salvarEstado(); return true;
}

window.addEventListener('primordios:ficha-salva', event => {
  if (estado.id === event.detail.id) { estado.revisaoNuvem = event.detail.version; salvarEstado(); }
});
window.addEventListener('primordios:ficha-copiada', event => {
  if (estado.id !== event.detail.original) return;
  restaurarDadosFicha(event.detail.record); carregarEstadoBase();
  if (typeof renderFicha === 'function') renderFicha();
});
window.addEventListener('primordios:ficha-recarregar', event => {
  if (estado.id !== event.detail.id) return;
  if (!event.detail.record) { limparDadosFicha(); location.replace('inventario.html'); return; }
  restaurarDadosFicha(event.detail.record); carregarEstadoBase();
  if (typeof renderFicha === 'function') renderFicha();
});

// ===== CONSTANTES COMPARTILHADAS =====
const CONSTANCIAS = ['Vigor','Destreza','Sabedoria','Inteligência','Força','Carisma'];

const CONSTANCIAS_MAP = {
  Carisma:       ['Persuasão','Lábia','Enganação','Vontade','Atuação','Intimidação'],
  Destreza:      ['Reflexo','Acrobacia','Iniciativa','Pontaria','Furtividade','Prestidigitação'],
  'Força':        ['Combate','Atletismo'],
  'Inteligência': ['Investigação','Natureza','Arcanismo','História'],
  Sabedoria:     ['Conjurar','Medicina','Percepção','Intuição','Sobrevivência'],
  Vigor:         ['Constituição']
};

function nomeEnergiaClasse(classe=estado.classe){return classe==='Mago'?'Mana':'PE';}

function calcBonus(pontos) { return pontos >= 2 ? Math.floor(pontos / 2) : 0; }

function pontosTotal() {
  let pts = 12;
  for (let n = 3; n <= estado.nivel; n += 2) pts += 2;
  return pts;
}

function limiteAtributo() {
  return estado.nivel === 1 ? 7 : 20;
}

function bonusDeClasse(nivel = estado.nivel) {
  if (nivel >= 15) return 5;
  if (nivel >= 10) return 4;
  if (nivel >= 5)  return 3;
  return 2;
}

function custoPE(nivelHab) {
  if (nivelHab <= 2)  return 1;
  if (nivelHab <= 4)  return 2;
  if (nivelHab <= 6)  return 4;
  if (nivelHab <= 8)  return 6;
  if (nivelHab <= 10) return 8;
  if (nivelHab <= 12) return 10;
  if (nivelHab <= 14) return 12;
  if (nivelHab <= 16) return 14;
  if (nivelHab <= 18) return 16;
  return 20;
}

function slotsDisponiveis() {
  if (estado.nivel >= 15) return 3;
  if (estado.nivel >= 10) return 2;
  if (estado.nivel >= 5)  return 1;
  return 0;
}

// ===== DADOS DAS CLASSES =====
const CLASSES_PREVIEW = {
  Guerreiro: {
    desc: 'Um combatente nato, forjado em batalha.',
    dadoVida: '1d10', dadoVidaNum: 10,
    vidaBase: 10, vidaAtributo: 'Vigor',
    vidaInicial: '10 + Vigor',
    vidaNivel: '1d10 (ou 6) + Vigor',
    energiaInicial: 'Atributo de Força + Atributo de Vigor',
    energiaNivel: 'Bônus de classe + Atributo de Vigor',
    energiaAtributos: ['Força', 'Vigor'],
    energiaNivelAtributo: 'Vigor',
    constanciasFixas: ['Combate', 'Constituição'],
    constanciasEscolha: ['Atletismo', 'Pontaria', 'Percepção', 'Sobrevivência', 'Acrobacia', 'Iniciativa'],
    constanciasEscolhaQtd: 2,
    conhecimento: ["Escolha duas categorias entre Espadas Leves, Machados Pesados, Martelos Pesados, Lanças Leves e Maças Leves.","Arco Curto (Arma Específica)"],
    familiaridade: ["Escolha uma categoria de peso diferente, pertencente a uma das duas famílias de armas selecionadas."],
    armaduras: ["Leves","Médias","Pesadas"],
    especificacoes: 'Nenhuma',
    famosos: ['Darton o Estilhaçador', 'Maldivan a Muralha', 'Garruk Mão Vazia']
  },
  Obscuro: {
    desc: 'Molda uma sombra viva em armas, membros, mantos, vínculos e duplicações.',
    dadoVida: '1d8', dadoVidaNum: 8,
    vidaBase: 8, vidaAtributo: 'Vigor',
    vidaInicial: '8 + Vigor',
    vidaNivel: '1d8 (ou 5) + Vigor',
    energiaInicial: 'Sabedoria + Destreza',
    energiaNivel: 'Bônus de classe + Sabedoria',
    energiaAtributos: ['Sabedoria', 'Destreza'],
    energiaNivelAtributo: 'Sabedoria',
    constanciasFixas: ['Furtividade', 'Conjurar'],
    constanciasEscolha: ['Investigação', 'Reflexo', 'Pontaria', 'Intuição', 'Prestidigitação', 'Combate', 'Percepção', 'Acrobacia'],
    constanciasEscolhaQtd: 2,
    conhecimento: ["Adagas Leves","Espada Curta (Arma Específica)","Arco Curto (Arma Específica)"],
    familiaridade: ["Espadas Leves","Besta de Mão (Arma Específica)"],
    armaduras: ["Leves"],
    especificacoes: 'Nenhuma',
    famosos: ['Seraphine Umbra', 'Vael o Vazio', 'Serin a Silenciosa']
  },
  Espadachim: {
    desc: 'Um artista da lâmina. Lê o movimento inimigo e responde com precisão cirúrgica.',
    dadoVida: '1d10', dadoVidaNum: 10,
    vidaBase: 10, vidaAtributo: 'Vigor',
    vidaInicial: '10 + Vigor',
    vidaNivel: '1d10 (ou 6) + Vigor',
    energiaInicial: 'Atributo de Sabedoria + Atributo de Destreza',
    energiaNivel: 'Bônus de Classe + Atributo de Destreza',
    energiaAtributos: ['Sabedoria', 'Destreza'],
    energiaNivelAtributo: 'Destreza',
    constanciasFixas: ['Combate', 'Reflexos'],
    constanciasEscolha: ['Acrobacia', 'Intuição', 'Percepção', 'Prestidigitação', 'Sobrevivência', 'Vontade'],
    constanciasEscolhaQtd: 2,
    conhecimento: ["Espadas (Geral)"],
    familiaridade: ["Adagas Leves"],
    armaduras: ["Leves","Médias"],
    especificacoes: 'O Espadachim possui Pontos de Conhecimento sobre Espadas (PCE), uma fonte de energia especial recuperada em qualquer descanso. Níveis 1–4: 2 PCE | 5–8: 5 | 9–12: 9 | 13–16: 11 | 17–20: 15.',
    famosos: ['-', '-', '-']
  },
  Bardo: {
    desc: 'Pessoas faladeiras, ótimas em desenrolar conversas e boa companhia para momentos complicados.',
    dadoVida: '1d8', dadoVidaNum: 8,
    vidaBase: 8, vidaAtributo: 'Vigor',
    vidaInicial: '8 + Vigor',
    vidaNivel: '1d8 (ou 5) + Vigor',
    energiaInicial: 'Atributo de Carisma + Atributo de Sabedoria',
    energiaNivel: 'Bônus de classe + Atributo de Carisma',
    energiaAtributos: ['Carisma', 'Sabedoria'],
    energiaNivelAtributo: 'Carisma',
    constanciasFixas: ['Atuação'],
    constanciasEscolha: ['Persuasão','Lábia','Enganação','Vontade','Intimidação','Reflexo','Acrobacia','Iniciativa','Pontaria','Furtividade','Prestidigitação','Combate','Atletismo','Investigação','Natureza','Arcanismo','História','Conjurar','Medicina','Percepção','Intuição','Sobrevivência','Constituição'],
    constanciasEscolhaQtd: 3,
    conhecimento: ["Armas simples","Espadas curtas","Rapier"],
    familiaridade: ["Adagas Leves"],
    armaduras: ["Leves"],
    especificacoes: 'CD do Bardo: 8 + CS de Atuação + Bônus de Classe, usada quando uma canção exigir teste de resistência. Instrumento Musical: você começa com 1 instrumento à sua escolha e precisa dele em mãos para entoar canções. O tipo do instrumento define o Alcance do Som: Percussão — tambor, pandeiro ou chocalho — 15 m; Sopro — flauta, ocarina ou trompa — 12 m; Cordas — violão, bandolim, harpa ou violino — 9 m. Quando uma canção fala em alvos que possam te ouvir e não traz alcance próprio, vale esse alcance. Itens que aumentam o alcance do som somam a ele, como o Amplificador estenosante. O Caminho do Soneto dispensa o instrumento.',
    famosos: ['Lyren Cordaclara', 'Belldona Vesper', 'Bren o Sussurro']
  },
  Mago: {
    desc: 'Um estudioso arcano que transforma conhecimento e um grimório pessoal em poder mágico.',
    dadoVida: '1d6', dadoVidaNum: 6,
    vidaBase: 6, vidaAtributo: 'Vigor',
    vidaInicial: '6 + Vigor',
    vidaNivel: '1d6 (ou 4) + Vigor',
    energiaInicial: 'Atributo de Sabedoria + Atributo de Inteligência',
    energiaNivel: 'Bônus de classe + Arcanismo',
    energiaAtributos: ['Sabedoria', 'Inteligência'],
    energiaNivelConstancia: 'Arcanismo',
    constanciasFixas: ['Arcanismo', 'História'],
    constanciasEscolha: ['Conjurar', 'Enganação', 'Furtividade', 'Intuição', 'Medicina', 'Natureza', 'Reflexo'],
    constanciasEscolhaQtd: 2,
    conhecimento: ["Adaga (Arma Específica)","Bastão (Arma Específica)"],
    familiaridade: ["Demais Adagas Leves"],
    armaduras: ["Leves"],
    especificacoes: 'Começa com um grimório e escolhe 3 magias de volume 1. O limite de magias anotadas é Arcanismo + nível. Só pode conjurar magias transcritas e traduzidas no grimório; transcrever uma magia leva 2 horas menos o bônus de Arcanismo. Magias controladas podem ser guardadas: limite de 1 + modificador de Inteligência, lançando até uma por ação bônus. Dano mágico pode somar Inteligência.',
    famosos: []
  },
  Druida: {
    desc: 'Cultiva Sementes que crescem durante o combate e transformam natureza, aliados e feras em poder vivo.',
    dadoVida: '1d8', dadoVidaNum: 8,
    vidaBase: 8, vidaAtributo: 'Vigor',
    vidaInicial: '8 + Vigor',
    vidaNivel: '1d8 (ou 5) + Vigor',
    energiaInicial: 'Sabedoria + Inteligência',
    energiaNivel: 'Bônus de classe + Sabedoria',
    energiaAtributos: ['Sabedoria', 'Inteligência'],
    energiaNivelAtributo: 'Sabedoria',
    constanciasFixas: ['Natureza', 'Medicina'],
    constanciasEscolha: ['Acrobacia', 'Intuição', 'Percepção', 'Conjurar', 'Sobrevivência', 'Arcanismo'],
    constanciasEscolhaQtd: 2,
    conhecimento: ['Armas simples'],
    familiaridade: [],
    armaduras: ['Leves', 'Armadura de Madeira (sem metal)'],
    especificacoes: 'CD de Druida: 8 + CS de Natureza + Bônus de Classe. Usa Natureza no lugar de Arcanismo em ataques mágicos e na CD das magias naturais.',
    famosos: []
  },
  Artífice: {
    desc: 'Quem monta mecanismos a partir de Núcleos e Cascas, alternando engenhocas entre turnos pelo ritmo do Rodízio.',
    dadoVida: '1d8', dadoVidaNum: 8,
    vidaBase: 8, vidaAtributo: 'Vigor',
    vidaInicial: '8 + Vigor',
    vidaNivel: '1d8 (ou 5) + Vigor',
    energiaInicial: 'Inteligência + Destreza',
    energiaNivel: 'Bônus de classe + Inteligência',
    energiaAtributos: ['Inteligência', 'Destreza'],
    energiaNivelAtributo: 'Inteligência',
    constanciasFixas: ['Investigação', 'Prestidigitação'],
    constanciasEscolha: ['Arcanismo', 'História', 'Atletismo', 'Pontaria', 'Reflexo', 'Percepção', 'Natureza'],
    constanciasEscolhaQtd: 2,
    conhecimento: ['Armas simples', 'Bestas leves', 'Armas Tecnológicas'],
    familiaridade: [],
    armaduras: ['Leves', 'Médias'],
    especificacoes: 'CD de Artífice: 8 + CS de Investigação + Bônus de Classe. Ataques de Engenho: 1d20 + Investigação. Investigação é a Aptidão da classe. O Aparato começa com Encaixes iguais ao Bônus de Classe.',
    famosos: []
  },
  Cozinheiro: {
    desc: 'Uma boa aventura precisa de um bom acompanhamento. Combina facas de precisão com temperos e porções capazes de sustentar seus aliados.',
    dadoVida: '1d8', dadoVidaNum: 8,
    vidaBase: 8, vidaAtributo: 'Vigor',
    vidaInicial: '8 + Vigor',
    vidaNivel: '1d8 (ou 5) + Vigor',
    energiaInicial: 'Sabedoria + Destreza',
    energiaNivel: 'Bônus de classe + Destreza',
    energiaAtributos: ['Sabedoria', 'Destreza'],
    energiaNivelAtributo: 'Destreza',
    constanciasFixas: ['Combate', 'Natureza', 'Sobrevivência'],
    constanciasEscolha: ['Medicina', 'Percepção', 'Reflexo', 'Prestidigitação', 'Atletismo', 'Constituição'],
    constanciasEscolhaQtd: 1,
    conhecimento: ['Armas simples', 'Facas (Adagas, Neko-te e Sai)', 'Aptidão em Sobrevivência'],
    familiaridade: [],
    armaduras: ['Leves'],
    especificacoes: 'CD de Cozinheiro: 8 + CS de Sobrevivência + Bônus de Classe. Você começa com 1 série de treino em Sobrevivência.',
    famosos: []
  }
};

// ===== RAÇAS =====
const RACAS = {
  'Humanos': {
    descricao: 'Adaptáveis e determinados, os humanos prosperam em qualquer ambiente. Adultos aos 18–20 anos, vivem até ~80.',
    bonusAtributos: { escolha: 2 },
    habilidades: [
      { nome: 'Treinamento', desc: 'Aptidão em uma constância adicional à escolha.', acao: 'Passiva' },
      { nome: 'Determinação', desc: 'Possuem o talento Nova Tentativa por padrão, sem gastar slot de talento.', acao: 'Passiva' },
    ],
    info: '+1 em 2 atributos à escolha · Deslocamento 9m · Idiomas: Comum + 1'
  },
  'Aarakocra': {
    descricao: 'Seres alados de 1,20m a 1,60m, vivem até ~60 anos. Ligeiros e adaptados ao céu.',
    bonusAtributos: { fixo: { 'Destreza': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Voo Natural', desc: 'Wingspan de até 2,40m. Deslocamento de voo 15m.', acao: 'Passiva' },
      { nome: 'Armas Naturais', desc: 'Garras e bico — 1d4 + modificador de dano Perfurante.', acao: 'Passiva' },
      { nome: 'Preparados para Reagir', desc: 'Pode usar Recuar como ação bônus.', acao: 'Ação Bônus' },
    ],
    info: '+1 Destreza · +1 Sabedoria · Voo 15m · Armas Naturais 1d4'
  },
  'Elfos': {
    descricao: 'Seres longevos de 1,50m a 1,80m, vivem até ~1200 anos. Graciosos e perceptivos.',
    bonusAtributos: { fixo: { 'Destreza': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Perceptíveis a Tudo', desc: 'Aptidão em Percepção.', acao: 'Passiva' },
      { nome: 'Imune ao Sono', desc: 'Meditam em vez de dormir (metade do tempo). Imunes a efeitos de soníferos.', acao: 'Passiva' },
      { nome: 'Vantagem Mágica', desc: 'Vantagem em testes de resistência contra controle mental.', acao: 'Passiva' },
    ],
    info: '+1 Destreza · +1 Sabedoria · Deslocamento 9m · Imune a soníferos'
  },
  'Tabaxi': {
    descricao: 'Felinos ágeis de 1,50m a 2,10m, vivem até ~100 anos. Velozes e instintivos.',
    bonusAtributos: { fixo: { 'Carisma': 1, 'Destreza': 1 } },
    habilidades: [
      { nome: 'Armas Naturais', desc: 'Garras e mordida — 1d4 + modificador de dano Cortante.', acao: 'Passiva' },
      { nome: 'Salto de Felino', desc: 'Pula até 4,5m sem impulso.', acao: 'Passiva' },
      { nome: 'Adrenalina da Caça', desc: 'Gaste 2 PE: +6m em todas as formas de deslocamento por 1 minuto.', acao: 'Ação Bônus' },
    ],
    info: '+1 Carisma · +1 Destreza · Deslocamento 12m (escalada 9m) · Armas Naturais 1d4'
  },
  'Tiefling': {
    descricao: 'De herança infernal, vivem até ~180 anos. Possuem chifres, cauda e resistência ao fogo.',
    bonusAtributos: { fixo: { 'Carisma': 1, 'Inteligência': 1 } },
    habilidades: [
      { nome: 'Destaque Infernal', desc: 'Uma magia de 1° volume à escolha ligada ao ambiente infernal.', acao: 'Passiva' },
      { nome: 'Resistência Infernal', desc: 'Resistência a dano Queimante.', acao: 'Passiva' },
      { nome: 'Visão no Escuro', desc: 'Enxerga em escuridão não-mágica como se fosse penumbra, até 18m.', acao: 'Passiva' },
      { nome: 'Sagração', desc: 'Vulnerabilidade a dano Radiante.', acao: 'Passiva' },
    ],
    info: '+1 Carisma · +1 Inteligência · Visão no Escuro 18m · Resistência Queimante'
  },
  'Inseticídio': {
    descricao: 'Criaturas insectóides de 1,50m a 1,80m, adultos aos 6–8 anos, vivem até ~60. Possuem 4 braços.',
    bonusAtributos: { fixo: { 'Destreza': 1 } },
    habilidades: [
      { nome: 'Multifuncional', desc: '4 braços — facilita interação com múltiplos itens simultaneamente.', acao: 'Passiva' },
      { nome: 'Visão no Escuro', desc: 'Enxerga em escuridão não-mágica como se fosse penumbra, até 12m.', acao: 'Passiva' },
      { nome: 'Armas Naturais', desc: '1d4 + modificador de dano Cortante.', acao: 'Passiva' },
      { nome: 'Instinto de Colmeia', desc: 'Comunicação telepática com outros Inseticídios em até 12m.', acao: 'Passiva' },
    ],
    info: '+1 Destreza · Visão no Escuro 12m · 4 braços · Sub-raças: Hércules / Phleoides / Imbuído'
  },
  'Metamorfo': {
    descricao: 'Seres de corpo flexível que podem alterar sua forma. Vivem até ~70 anos.',
    bonusAtributos: { fixo: { 'Carisma': 1, 'Destreza': 1 } },
    habilidades: [
      { nome: 'Corpo Flexível', desc: 'Passa por espaços de até 30cm sem penalidade (não funciona com armadura média ou pesada).', acao: 'Passiva' },
      { nome: 'Metamorfose', desc: 'Simples (ação bônus, ±30cm de altura, 2 PE) ou Complexa (ação padrão, cópia completa de ser já visto — não altera voz nem ficha).', acao: 'Ação Bônus / Padrão' },
    ],
    info: '+1 Carisma · +1 Destreza · Deslocamento 9m · Metamorfose (2 PE)'
  },
  'Gigante': {
    descricao: 'Colossos de 2,70m a 4,00m pesando 250–400kg. Força bruta e presença imponente.',
    bonusAtributos: { fixo: { 'Força': 1, 'Vigor': 1 } },
    habilidades: [
      { nome: 'Força Bruta', desc: 'Ergue, empurra ou arrasta o dobro do peso normal.', acao: 'Passiva' },
      { nome: 'Pés Firmes', desc: 'Vantagem contra ser empurrado ou derrubado.', acao: 'Passiva' },
      { nome: 'Mãos Grandes', desc: 'Usa armas de duas mãos com uma só mão, se tiver proficiência.', acao: 'Passiva' },
    ],
    info: '+1 Força · +1 Vigor · Deslocamento 10,5m · Ignora obstáculos <1m'
  },
  'Celestial': {
    descricao: 'Seres espirituais longevos, vivem até ~2000 anos. Podem enxergar além do plano material.',
    bonusAtributos: { fixo: { 'Inteligência': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Visão Comum-Planar', desc: 'Enxerga espíritos e entidades invisíveis para mortais comuns.', acao: 'Passiva' },
      { nome: 'Corpo Espiritual', desc: '1x por descanso longo: por 1 minuto, corpo intangível — flutua, atravessa superfícies, invisível para quem não vê o plano espiritual.', acao: 'Ação Padrão' },
      { nome: 'Conceito Comum', desc: 'Herda um diferencial racial de um dos pais.', acao: 'Passiva' },
    ],
    info: '+1 Inteligência · +1 Sabedoria · Voo 12m · Corpo Espiritual (1x/descanso longo)'
  },
  'Draconato': {
    descricao: 'Descendentes de dragões de 1,80m a 2,10m pesando 100–140kg. Presença majestosa.',
    bonusAtributos: { fixo: { 'Força': 1, 'Vigor': 1 } },
    habilidades: [
      { nome: 'Sopro Dracônico', desc: '1x por descanso curto: cone 4,5m ou linha 9m — 2d6 elemental (tipo por linhagem). Sobe para 3d6 no nível 5, 4d6 no 10, 5d6 no 15.', acao: 'Ação Padrão' },
      { nome: 'Resistência Dracônica', desc: 'Resistência ao mesmo tipo de dano do sopro.', acao: 'Passiva' },
      { nome: 'Presença Majestosa', desc: 'Vantagem em Intimidação contra criaturas de tamanho igual ou menor.', acao: 'Passiva' },
    ],
    info: '+1 Força · +1 Vigor · Deslocamento 9m · Sopro Dracônico (1x/descanso curto)'
  },
  'Orcs': {
    descricao: 'Guerreiros robustos de 1,90m a 2,30m, adultos aos 12 anos, vivem até ~70. Instinto de combate.',
    bonusAtributos: { fixo: { 'Força': 1, 'Vigor': 1 } },
    habilidades: [
      { nome: 'Fúria Instintiva', desc: '1x por descanso curto: ao sofrer dano, usa reação para atacar o agressor corpo a corpo.', acao: 'Reação' },
      { nome: 'Resistência Implacável', desc: '1x por descanso longo: se cair a 0 PV sem morrer imediatamente, volta com 1 PV.', acao: 'Passiva' },
    ],
    info: '+1 Força · +1 Vigor · Deslocamento 9m · Fúria Instintiva · Resistência Implacável'
  },
  'Ogros': {
    descricao: 'Criaturas massivas de 2,4m a 3m pesando 200–350kg. Regeneram-se com facilidade.',
    bonusAtributos: { fixo: { 'Força': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Golpe Esmagador', desc: '+1 de dano em ataques corpo a corpo com armas.', acao: 'Passiva' },
      { nome: 'Regeneração Lenta', desc: 'Ao rolar dados de vida num descanso curto, sempre recupera o valor máximo do dado.', acao: 'Passiva' },
    ],
    info: '+1 Força · +1 Sabedoria · Deslocamento 9m · Ignora penalidades de lama/neve'
  },
  'Gnomos': {
    descricao: 'Pequenos inventores de 0,60m a 1m pesando 20–30kg. Adultos aos 40, vivem até ~250 anos.',
    bonusAtributos: { fixo: { 'Inteligência': 1, 'Destreza': 1 } },
    habilidades: [
      { nome: 'Mente Ágil', desc: 'Vantagem em testes de resistência contra ilusões, encantamentos e efeitos mentais.', acao: 'Passiva' },
      { nome: 'Engenhosidade Natural', desc: '1x por descanso curto: vantagem em teste de Inteligência mesmo sem proficiência usando objeto improvisado.', acao: 'Passiva' },
      { nome: 'Pequeno e Escorregadio', desc: 'Move-se pelo espaço de criaturas maiores. Vantagem em Furtividade e +2 em reações de esquiva.', acao: 'Passiva' },
    ],
    info: '+1 Inteligência · +1 Destreza · Deslocamento 7,5m · Mente Ágil'
  },
  'Anões': {
    descricao: 'Forjados pela pedra, de 1,20m a 1,50m pesando 60–90kg. Longevos e inabaláveis, vivem até ~700 anos.',
    bonusAtributos: { fixo: { 'Vigor': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Resistência Rochosa', desc: 'Reduz em 1 o dano físico não mágico recebido.', acao: 'Passiva' },
      { nome: 'Tradição do Ofício', desc: 'Proficiência em uma ferramenta de ofício e aptidão em uma Constância de Sabedoria à escolha.', acao: 'Passiva' },
      { nome: 'Postura Inabalável', desc: 'Vantagem em testes para resistir a ser derrubado, empurrado ou deslocado (com os pés no chão).', acao: 'Passiva' },
    ],
    info: '+1 Vigor · +1 Sabedoria · Deslocamento 7,5m · RD 1 físico · Ignora penalidades de armadura pesada'
  },
  'Aquárions': {
    descricao: 'Seres aquáticos de 1,40m a 2,10m. Adaptados à vida submersa e em terra.',
    bonusAtributos: { fixo: { 'Destreza': 1, 'Inteligência': 1 } },
    habilidades: [
      { nome: 'Barbatanas e Nadadeira', desc: 'Deslocamento na água dobrado (18m).', acao: 'Passiva' },
      { nome: 'Guelras', desc: 'Respira debaixo dágua sem equipamento.', acao: 'Passiva' },
      { nome: 'Mordida', desc: '1d6 de dano perfurante.', acao: 'Passiva' },
    ],
    info: '+1 Destreza · +1 Inteligência · Deslocamento 9m / 18m (água) · Respira sob água'
  },
  'Lopinos': {
    descricao: 'Criaturas ágeis de 1,50m a 1,70m pesando 40–60kg. Reflexos instintivos e sentidos aguçados.',
    bonusAtributos: { fixo: { 'Destreza': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Reflexos Instintivos', desc: 'Vantagem em reações de esquiva.', acao: 'Passiva' },
      { nome: 'Movimento Sutil', desc: 'Vantagem para se mover silenciosamente e evitar armadilhas de solo.', acao: 'Passiva' },
      { nome: 'Sentidos Aguçados', desc: 'Vantagem em testes de sentidos. Até 9m, inimigos não têm vantagem por invisibilidade.', acao: 'Passiva' },
    ],
    info: '+1 Destreza · +1 Sabedoria · Deslocamento 10,5m · Salto 3m horizontal'
  },
  'Fadas': {
    descricao: 'Seres minúsculos de 5cm a 20cm com asas luminosas. Podem alterar seu tamanho.',
    bonusAtributos: { fixo: { 'Inteligência': 1 }, escolha: 1 },
    habilidades: [
      { nome: 'Asas', desc: 'Emanam brilho de 1,5m ao redor. Podem ser camufladas voluntariamente.', acao: 'Passiva' },
      { nome: 'Manipulação de Altura', desc: '1x por dia: altera o tamanho entre minúsculo, pequeno e médio.', acao: 'Ação Padrão' },
    ],
    info: '+1 Inteligência · +1 à escolha · Voo 12m · Deslocamento 9m'
  },
  'Vampiros': {
    descricao: 'Mortos-vivos sedutos de 1,60m a 1,90m. Sede de sangue e poderes sombrios.',
    bonusAtributos: { fixo: { 'Força': 1, 'Destreza': 1 } },
    habilidades: [
      { nome: 'Forma Vampírica', desc: '1x por dia: por turnos = bônus de Sabedoria. +4 Força, +2 Destreza, -3 Inteligência.', acao: 'Ação Padrão' },
      { nome: 'Mordida', desc: '1d4 perfurante + tentativa de drenar sangue (1d8).', acao: 'Passiva' },
      { nome: 'Charme', desc: 'Aptidão em Enganação, Persuasão, Intimidação e Lábia com Bônus de Classe.', acao: 'Passiva' },
      { nome: 'Resistência Vampírica', desc: 'Dano necrótico e veneno reduzidos pelo bônus de Constituição.', acao: 'Passiva' },
    ],
    info: '+1 Força · +1 Destreza · Voo 15m · Fraquezas: luz solar, madeira no coração'
  },
  'Medusas': {
    descricao: 'Seres de 1,60m a 1,80m com serpentes no lugar do cabelo. Petrificam quem as encaram.',
    bonusAtributos: { fixo: { 'Carisma': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Serpentes Vigilantes', desc: 'Vantagem contra ataques surpresa. Imune a veneno e petrificação.', acao: 'Passiva' },
      { nome: 'Presença Intimidadora', desc: 'Vantagem em Intimidação.', acao: 'Passiva' },
      { nome: 'Petrificação', desc: 'Quem olhar diretamente faz Destreza CD 11 + Inteligência ou fica petrificado.', acao: 'Passiva' },
    ],
    info: '+1 Carisma · +1 Sabedoria · Deslocamento 7,5m · Petrificação por olhar direto'
  },
  'Anjos': {
    descricao: 'Seres divinos de 1,70m a 2,20m. Devem cumprir seus mandamentos ou se tornam Anjos Caídos.',
    bonusAtributos: { fixo: { 'Carisma': 1, 'Sabedoria': 1 } },
    habilidades: [
      { nome: 'Luz Interior', desc: '1x por descanso longo: aura luminosa por 1 minuto. Criaturas sombrias têm desvantagem dentro dela. Aliados próximos ganham +1 contra medo.', acao: 'Ação Padrão' },
      { nome: 'Toque Purificador', desc: '1x por descanso curto: remove uma condição negativa leve de aliado tocado.', acao: 'Ação Padrão' },
      { nome: 'Resistência Divina', desc: 'Resistência 2 a dano radiante e mágico profano.', acao: 'Passiva' },
    ],
    info: '+1 Carisma · +1 Sabedoria · Voo 9m · Luz Interior · Toque Purificador'
  },
};

// ===== INFORMAÇÕES EXTRAS POR CLASSE =====
const CLASSES_INFO_EXTRA = {
  Artífice: {
    secoes: [
      {
        titulo: 'DANO E ENCAIXES',
        tabela: [
          ['Nível', 'Engenho', 'Campo', 'Custo', 'Encaixes'],
          ['1–4', '2d6', '1d6', '2 PE', '2'],
          ['5–8', '3d6', '2d6', '3 PE', '3'],
          ['9–12', '4d6', '3d6', '4 PE', '4'],
          ['13–16', '5d6', '4d6', '5 PE', '5'],
          ['17–20', '6d6', '5d6', '6 PE', '5'],
        ]
      },
      {
        titulo: 'NÚCLEOS',
        lista: [
          'Ígneo — Queimante; falha deixa Queimando (baixo).',
          'Gélido — Congelante; falha reduz deslocamento em 3m até o fim do próximo turno.',
          'Voltaico — Eletrizante; falha perde Reação até o início do próximo turno.',
          'Cinético — Impacto; falha empurra 3m e fica Caído ao atingir obstáculo.',
          'Protetor — aliados recebem PV temporários; não causa dano.'
        ]
      },
      {
        titulo: 'CASCAS',
        lista: [
          'Disparo — ação padrão, 12m, ataque 1d20 + Investigação.',
          'Mina — ação bônus, 6m, detona em área de 3m.',
          'Campo — ação padrão, 9m, esfera de 3m por 3 turnos.'
        ]
      }
    ]
  },
  Obscuro: {
    secoes: [
      {
        titulo: 'MANTO VIVO',
        itens: [
          { label: 'Primeiro Molde da cena', valor: '2 PE' },
          { label: 'Trocar de Molde', valor: '1 PE' },
          { label: 'Molde inicial', valor: '2 Moldes à escolha' },
          { label: 'Molde fixo', valor: 'Duplo no nível 7' },
        ]
      },
      {
        titulo: 'CORROSÃO SOMBRIA',
        texto: 'Uma vez por turno, ao acertar Molde de Arma em alvo em penumbra ou escuridão:',
        tabela: [
          ['Nível 1–4', '+1d6'], ['Nível 5–8', '+2d6'], ['Nível 9–12', '+3d6'],
          ['Nível 13–16', '+4d6'], ['Nível 17–19', '+5d6'], ['Nível 20', '+6d6'],
        ]
      },
      {
        titulo: 'MOLDES',
        itens: [
          { label: 'Arma', valor: 'Copia arma ou munição já empunhada; usa Sabedoria e 10 + CS de Conjurar em PV' },
          { label: 'Membro', valor: 'Alcance inicial de 3m para manipulação e ataques dimensionais' },
          { label: 'Manto', valor: '+2 + Carisma em Enganação e Atuação; bônus de Furtividade no escuro coberto' },
          { label: 'Vínculo', valor: 'Puxar ou prender alvo a até 9m por 2 PE' },
          { label: 'Duplo', valor: 'Clone exclusivo com troca de posição e limite de 1 em campo' },
        ]
      },
      {
        titulo: 'SENHOR DAS FERAS SOMBRIAS',
        tabela: [
          ['Ranque', 'Nível/ND', 'Captura'],
          ['Vulto', '1–4', '1× custo de invocação'],
          ['Elite', '5–9', '2× custo de invocação'],
          ['Campeão', '10–14', '3× custo de invocação'],
          ['Lenda', '15–19', '4× custo de invocação'],
          ['Calamidade', '20+', '5× custo de invocação'],
        ],
        textoExtra: 'A quantidade em campo é igual ao bônus de Sabedoria; o arsenal é igual à CS de Conjurar.'
      },
      {
        titulo: 'CONSUMO DE ALMAS',
        lista: [
          'Vulto: regenera 1d8 PV.',
          'Elite: regenera 1d12 PV.',
          'Campeão: regenera 2d10 PV e +10 PV máximo permanente.',
          'Lenda: regenera 2d12 PV, +1 em uma Constância e +20 PV máximo permanente.',
          'Calamidade: dono ganha +3d10 PV máximo, a fera ganha +2 em duas Constâncias e uma habilidade principal da criatura consumida.',
        ]
      },
    ]
  }
};

// Retorna os bônus de atributo fixos da raça atual
function bonusFixoRaca() {
  const r = RACAS[estado.raca];
  if (!r || !r.bonusAtributos) return {};
  return r.bonusAtributos.fixo || {};
}

// Retorna os bônus escolhidos pelo jogador para raças com escolha livre
function bonusEscolhaRaca() {
  return estado.racaEscolhas || {};
}

// Retorna o total de bônus raciais para um atributo (fixo + escolha)
function totalBonusRaca(attr) {
  const fixo = bonusFixoRaca()[attr] || 0;
  const escolha = bonusEscolhaRaca()[attr] || 0;
  return fixo + escolha;
}

// Quantos pontos livres a raça dá para distribuir
function qtdEscolhaRaca() {
  const r = RACAS[estado.raca];
  if (!r || !r.bonusAtributos || !r.bonusAtributos.escolha) return 0;
  return r.bonusAtributos.escolha;
}
