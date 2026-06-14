// ===== ESTADO GLOBAL =====
const estado = {
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
  talentos: [],
  truques: [],
  artesDaEspada: [],
  caminhoEspada: [],
  nomePersonagem: ''
};

function salvarEstado() {
  sessionStorage.setItem('fragmentados_estado', JSON.stringify(estado));
}

function carregarEstadoBase() {
  const salvo = sessionStorage.getItem('fragmentados_estado');
  if (!salvo) return false;
  Object.assign(estado, JSON.parse(salvo));
  if (!estado.constanciasEscolhidas) estado.constanciasEscolhidas = [];
  if (!estado.racaEscolhas) estado.racaEscolhas = {};
  if (!estado.truques) estado.truques = [];
  if (!estado.artesDaEspada) estado.artesDaEspada = [];
  if (!estado.caminhoEspada) estado.caminhoEspada = [];
  return true;
}

function novoPersonagem() {
  Object.assign(estado, {
    personagem: null,
    classe: null,
    nivel: 1,
    caminho: null,
    raca: null,
    racaEscolhas: {},
    constancias: { Vigor: 0, Destreza: 0, Sabedoria: 0, 'Intelig\u00eancia': 0, 'For\u00e7a': 0, Carisma: 0 },
    constanciasEscolhidas: [],
    arma: null,
    armadura: null,
    acessorio: null,
    talentos: [],
    truques: [],
    nomePersonagem: ''
  });
  salvarEstado();
  window.location.href = 'tela1.html';
}

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

function calcBonus(pontos) { return pontos >= 2 ? Math.floor(pontos / 2) : 0; }

function pontosTotal() {
  let pts = 12;
  for (let n = 3; n <= estado.nivel; n += 2) pts += 2;
  return pts;
}

function limiteAtributo() {
  return estado.nivel === 1 ? 7 : 20;
}

function bonusDeClasse() {
  if (estado.nivel >= 15) return 5;
  if (estado.nivel >= 10) return 4;
  if (estado.nivel >= 5)  return 3;
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
    constanciasFixas: ['Combate', 'Constituição'],
    constanciasEscolha: ['Atletismo', 'Pontaria', 'Percepção', 'Sobrevivência', 'Acrobacia', 'Iniciativa'],
    constanciasEscolhaQtd: 2,
    armas: ['Armas simples', 'Espadas curtas', 'Espadas longas', 'Armas marciais', 'Arcos curtos'],
    armaduras: ['Leves', 'Médias', 'Pesadas'],
    especificacoes: 'Nenhuma',
    famosos: ['Darton o Estilhaçador', 'Maldivan a Muralha', 'Garruk Mão Vazia']
  },
  Obscuro: {
    desc: 'Mestre das sombras e das feras que habitam o vazio.',
    dadoVida: '1d8', dadoVidaNum: 8,
    vidaBase: 8, vidaAtributo: 'Vigor',
    vidaInicial: '8 + Vigor',
    vidaNivel: '1d8 (ou 5) + Vigor',
    energiaInicial: 'Atributo de Sabedoria + Atributo de Vigor',
    energiaNivel: 'Bônus de classe + Atributo de Sabedoria',
    energiaAtributos: ['Sabedoria', 'Destreza'],
    constanciasFixas: ['Furtividade', 'Conjurar'],
    constanciasEscolha: ['Percepção', 'Intuição', 'Investigação', 'Intimidação', 'Acrobacia', 'Reflexo'],
    constanciasEscolhaQtd: 2,
    armas: ['Armas simples', 'Espadas curtas', 'Adagas', 'Arcos curtos'],
    armaduras: ['Leves', 'Médias'],
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
    constanciasFixas: ['Combate', 'Reflexos'],
    constanciasEscolha: ['Acrobacia', 'Intuição', 'Percepção', 'Prestidigitação', 'Sobrevivência', 'Vontade'],
    constanciasEscolhaQtd: 2,
    armas: ['Armas simples', 'Qualquer tipo de espada'],
    armaduras: ['Leves', 'Médias'],
    especificacoes: 'O Espadachim possui Pontos de Conhecimento sobre Espadas (PCE), uma fonte de energia especial recuperada em qualquer descanso. Níveis 1–4: 2 PCE | 5–8: 5 | 9–12: 9 | 13–16: 11 | 17–20: 15.',
    famosos: ['-', '-', '-']
  },
  Bardo: {
    desc: 'Sua voz e sua música moldam o campo de batalha.',
    dadoVida: '1d8', dadoVidaNum: 8,
    vidaBase: 8, vidaAtributo: 'Vigor',
    vidaInicial: '8 + Vigor',
    vidaNivel: '1d8 (ou 5) + Vigor',
    energiaInicial: 'Atributo de Carisma + Atributo de Vigor',
    energiaNivel: 'Bônus de classe + Atributo de Carisma',
    energiaAtributos: ['Carisma', 'Sabedoria'],
    constanciasFixas: ['Atuação', 'Persuasão'],
    constanciasEscolha: ['Percepção', 'Intimidação', 'Enganação', 'Intuição', 'Medicina', 'Acrobacia'],
    constanciasEscolhaQtd: 2,
    armas: ['Armas simples', 'Espadas curtas', 'Arcos curtos', 'Arcos longos'],
    armaduras: ['Leves'],
    especificacoes: 'Um Bardo tem sua CD (Resistência mágica) igual a 8 + CS de Persuasão, utilizada quando uma magia necessita de teste de resistência.',
    famosos: ['Lyren Cordaclara', 'Belldona Vesper', 'Bren o Sussurro']
  }
};

// ===== RAÇAS =====
const RACAS = {
  'Humanos': {
    descricao: 'Adaptáveis e determinados, os humanos prosperam em qualquer ambiente. Adultos aos 18–20 anos, vivem até ~80.',
    bonusAtributos: { escolha: 2 },
    habilidades: [
      { nome: 'Treinamento', desc: 'Proficiência em uma constância adicional à escolha.', acao: 'Passiva' },
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
      { nome: 'Perceptíveis a Tudo', desc: 'Proficiência em Percepção.', acao: 'Passiva' },
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
      { nome: 'Tradição do Ofício', desc: 'Treinado em uma ferramenta de ofício e uma Constância de Sabedoria à escolha.', acao: 'Passiva' },
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
      { nome: 'Charme', desc: 'Proficiência em Enganação, Persuasão, Intimidação e Lábia com Bônus de Classe.', acao: 'Passiva' },
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
  Obscuro: {
    secoes: [
      {
        titulo: 'MECÂNICAS DE SOMBRAS',
        itens: [
          { label: 'Área das feras', valor: '6 × Conjurar metros do dono' },
          { label: 'Feras em campo', valor: 'Igual ao bônus de Sabedoria' },
          { label: 'Arsenal (acúmulo)', valor: 'Igual à constância de Conjurar' },
        ]
      },
      {
        titulo: 'CORROSÃO SOMBRIA',
        texto: 'Gatilho: 1x por turno, ao acertar um ataque com Vantagem. As sombras corroem o alvo causando dano necrótico adicional:',
        tabela: [
          ['Nível 1–4', '+1d6'], ['Nível 5–8', '+2d6'], ['Nível 9–12', '+3d6'],
          ['Nível 13–16', '+4d6'], ['Nível 17–19', '+5d6'], ['Nível 20', '+6d6'],
        ]
      },
      {
        titulo: 'SOMBRAS — REGRAS',
        itens: [
          { label: 'Habilidades', valor: 'Mesmas da criatura quando estava viva (magias, dano, PE)' },
          { label: 'Fraqueza', valor: 'Dobro de dano contra radiante' },
          { label: 'Vida inicial', valor: 'Afinidade×10 + Bônus Sabedoria×5 + Rank×10 + Vigor da criatura' },
          { label: 'Consciência', valor: 'Possuem memórias próprias; podem desobedecer a depender do nível de afinidade' },
        ]
      },
      {
        titulo: 'RANQUES',
        tabela: [
          ['Ranque', 'Bônus', 'Nível/ND'],
          ['—', '+0', '—'],
          ['Vulto', '+15', '1–4'],
          ['Elite', '+30', '5–9'],
          ['Campeão', '+50', '10–14'],
          ['Lenda', '+100', '15–19'],
          ['Calamidade', '+120', '20+'],
        ],
        textoExtra: 'Os nomes dos ranques podem ser alterados a critério do jogador e do mestre.'
      },
      {
        titulo: 'CONSUMIR ALMAS',
        texto: 'Uma sombra pode consumir almas, gerando efeitos ao dono:',
        lista: [
          'Nível 1+ / Rank 1+: Regenera 1d8 PV (pode ser temporário).',
          'Nível 5+ / Rank 3+: Regenera 1d12 PV (pode ser temp.) e +1 Afinidade.',
          'Nível 10+ / Rank 8+: Regenera 2d10 PV (pode ser temp.) e +2 Afinidade.',
          'Nível 13+ / Rank 12+: Regenera 2d12 PV, +1 valor em 1 Constância e +3 Afinidade.',
          'Nível 16+ / Rank 16+: +3d10 PV máximo, +2 em 2 Constâncias, 1 habilidade da criatura e +5 Afinidade.',
        ]
      },
      {
        titulo: 'AFINIDADE',
        texto: 'Começa em 1 ao capturar. Nível 1 exige 15 pontos; cada nível seguinte exige +2 (Nível 2 = 17, Nível 3 = 19…). Máximo: nível 15. É possível atingir valores negativos.',
        itens: [
          { label: 'Alimentar (descanso)', valor: '1 PE ou 2 PV gastos = +1 Afinidade (máx. 3/dia por sombra)' },
          { label: 'Banquete (matar chefe)', valor: 'Sombra come a alma = +3 Afinidade direto' },
          { label: 'Penalidade (destruída)', valor: '−2 Afinidade toda vez que for destruída em combate' },
        ]
      },
      {
        titulo: 'NÍVEIS DE AFINIDADE',
        tabela: [
          ['Nível', 'Pontos', 'Ganho'],
          ['1', '5', 'Status base da criatura capturada'],
          ['2', '6', '+1d10 PV Máximo'],
          ['3', '7', '+2d10 PV e +1 em duas Constâncias'],
          ['4', '8', '—'],
          ['5', '9', 'Sintonia: invoca com Ação Bônus; obediência absoluta'],
          ['6', '10', '+1 em duas Constâncias'],
          ['7', '11', '—'],
          ['8', '12', '—'],
          ['9', '13', 'Despertar Predatório: dobra dados de dano base; ataques tornam-se necróticos'],
          ['10', '14', '+2d10 PV'],
          ['11', '15', '—'],
          ['12', '16', '+2 em duas Constâncias'],
          ['13', '17', '—'],
          ['14', '18', '—'],
          ['15 (MÁX)', '—', 'Eclipse Negro: 1x/dia, embutir sombra própria — aura escuridão 9m, +20 PV temp., resistência física, ataque extra, imunidade a paralisado/congelado/amedrontado/enfeitiçado/apavorado. Dura 1 min ou até ser derrotada.'],
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
