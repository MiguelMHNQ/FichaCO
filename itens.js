// ===== ARMAS =====
const ARMAS = [
  // Adagas
  { nome: 'Adaga',                tipo: 'Adaga — CaC',    dano: '1d4 + For · Corte',      desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Mão' },
  { nome: 'Adaga Tortuosa',       tipo: 'Adaga — CaC',    dano: '1d4 + For · Perfurante',  desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Adaga de Duas Pontas', tipo: 'Adaga — CaC',    dano: '1d4 + For · Perfurante',  desc: 'Alcance 1,5m · Crítico 20/1d · Leve · 1 Mão | Passiva: ação bônus para segundo ataque (Reflexo ou Combate).' },
  { nome: 'Adaga Sardenta',       tipo: 'Adaga — CaC',    dano: '1d4/1d6 + For · Perfurante', desc: 'Alcance 1,5m · Crítico 20/1d · Leve · 1 Mão | Passiva: ao acertar, Força CD12 para retirar causando +1d6 perfurante.' },
  { nome: 'Adaga Balística',      tipo: 'Adaga — CaC',    dano: '1d4 + For · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Mão | Passiva: ao acertar, ação bônus para disparar munição de pistola (alcance 9m, +1d6 Balístico).' },
  // Manoplas
  { nome: 'Manopla de Ferro',     tipo: 'Manopla — CaC',  dano: '1d4 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Manopla Espinhenta',   tipo: 'Manopla — CaC',  dano: '1d6 + For · Perfurante',  desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Artilharia Manual',    tipo: 'Manopla — CaC',  dano: '1d6 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 20/1d · Pesada · 1 Mão | Passiva: explosão em linha de 3m causando 4d8 Fogo (turno completo + 100g pólvora para recarregar).' },
  { nome: 'Quebra Queixo',        tipo: 'Manopla — CaC',  dano: '1d4 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 20/2d · Leve · 1 Mão' },
  // Espadas
  { nome: 'Espada Curta',         tipo: 'Espada — CaC',   dano: '1d6 + For · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Mão' },
  { nome: 'Espada Longa',         tipo: 'Espada — CaC',   dano: '1d8/1d10 + For · Corte',  desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · Versátil' },
  { nome: 'Espada Grande',        tipo: 'Espada — CaC',   dano: '2d6 + For · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/1d · Pesada · 2 Mãos' },
  { nome: 'Florete',              tipo: 'Espada — CaC',   dano: '1d6 + Des · Perfurante',  desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Cimitarra',            tipo: 'Espada — CaC',   dano: '1d6 + For · Corte',       desc: 'Alcance 1,5m · Crítico 18-20/1d · Leve · 1 Mão' },
  { nome: 'Alfange',              tipo: 'Espada — CaC',   dano: '2d4 + For · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Mão' },
  { nome: 'Wakizashi',            tipo: 'Espada — CaC',   dano: '1d8 + Des · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Katana',               tipo: 'Espada — CaC',   dano: '1d10 + Des · Corte',      desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Mão' },
  // Discos
  { nome: 'Disco Laminado',       tipo: 'Disco — CaC/Ld', dano: '1d6 + Des · Corte',       desc: 'Alcance 1,5m · Crítico 20/1d · Leve · 1 Mão | Passiva: pode ser lançado em linha ou curva, volta para o lançador (Reação ou Ação Bônus CD15 Reflexos para pegar).' },
  // Foices
  { nome: 'Foice Curta',          tipo: 'Foice — CaC',    dano: '1d4 + For · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Mão' },
  { nome: 'Dupla Crescente',      tipo: 'Foice — CaC',    dano: '1d6 + Des · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 2 Mãos | Passiva: ao acertar, segundo ataque com Reflexos (ação bônus). Pode separar as lâminas.' },
  { nome: 'Foice',                tipo: 'Foice — CaC',    dano: '1d10 + For · Corte',      desc: 'Alcance 3m · Crítico 19-20/1d · Pesada · 2 Mãos' },
  { nome: 'Meia Lua',             tipo: 'Foice — CaC',    dano: '1d12 + For · Corte',      desc: 'Alcance 3m · Crítico 19-20/2d · Pesada · 2 Mãos' },
  // Arcos
  { nome: 'Arco Curto',           tipo: 'Arco — Ld',      dano: '1d6 + For · Perfurante',  desc: 'Alcance 9m · Crítico 19-20/1d · Leve · 2 Mãos' },
  { nome: 'Arco Longo',           tipo: 'Arco — Ld',      dano: '1d6 + For · Perfurante',  desc: 'Alcance 12m · Crítico 19-20/2d · Leve · 2 Mãos' },
  { nome: 'Arco de 4 Pontas',     tipo: 'Arco — Ld',      dano: '1d10 + For · Perfurante', desc: 'Alcance 15m · Crítico 19-20/2d · Pesada · 2 Mãos' },
  { nome: 'Arco Composto',        tipo: 'Arco — Ld',      dano: '1d10 + For · Perfurante', desc: 'Alcance 12m · Crítico 19-20/1d · Leve · 2 Mãos' },
  { nome: 'Arco Complexo',        tipo: 'Arco — Ld',      dano: '1d12 + For · Perfurante', desc: 'Alcance 18m · Crítico 19-20/2d · Pesada · 2 Mãos' },
  // Lanças
  { nome: 'Lança',                tipo: 'Lança — CaC',    dano: '1d6 + For · Perfurante',  desc: 'Alcance 3m · Crítico 18-20/2d · Leve · 2 Mãos' },
  { nome: 'Alabarda',             tipo: 'Lança — CaC',    dano: '1d10 + For · Perfurante', desc: 'Alcance 3m · Crítico 19-20/2d · Pesada · 2 Mãos' },
  // Bastões
  { nome: 'Bastão',               tipo: 'Bastão — CaC',   dano: '1d6 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 20/1d · Leve · 2 Mãos' },
  { nome: 'Bastão Acolchoado',    tipo: 'Bastão — CaC',   dano: '2 + For · Impacto',       desc: 'Alcance 1,5m · Crítico 20/1d · Leve · 2 Mãos' },
  { nome: 'Bastão de Guerra',     tipo: 'Bastão — CaC',   dano: '1d8 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 19-20/1d · Pesado · 2 Mãos | Passiva: ao acertar, segundo ataque com -2 de penalidade.' },
  { nome: 'Nunchaku',             tipo: 'Bastão — CaC',   dano: '1d6 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 18-20/1d · Leve · 2 Mãos | Passiva: +1 na próxima jogada de ataque ao acertar (reseta ao errar ou fim do turno).' },
  // Maças
  { nome: 'Maça',                 tipo: 'Maça — CaC',     dano: '1d8 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 18-20/1d · Leve · 1 Mão' },
  { nome: 'Maça Estrela',         tipo: 'Maça — CaC',     dano: '2d4 + For · Perfurante',  desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Mangual',              tipo: 'Maça — CaC',     dano: '1d8 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Mangual Pesado',       tipo: 'Maça — CaC',     dano: '1d12 + For · Perfurante', desc: 'Alcance 1,5m · Crítico 19-20/2d · Pesado · 2 Mãos' },
  { nome: 'Clava',                tipo: 'Maça — CaC',     dano: '1d6 + For · Perfurante',  desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Mão' },
  // Machados
  { nome: 'Machadinha',           tipo: 'Machado — CaC',  dano: '1d6 + For · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Machado Grande',       tipo: 'Machado — CaC',  dano: '1d12 + For · Corte',      desc: 'Alcance 1,5m · Crítico 19-20/2d · Pesado · 2 Mãos' },
  { nome: 'Machado de Guerra',    tipo: 'Machado — CaC',  dano: '1d12 + For · Corte',      desc: 'Alcance 1,5m · Crítico 19-20/3d · Pesado · 2 Mãos' },
  // Martelos
  { nome: 'Martelo de Guerra',    tipo: 'Martelo — CaC',  dano: '1d8 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 19-20/2d · Leve · 1 Mão' },
  { nome: 'Martelo',              tipo: 'Martelo — CaC',  dano: '1d6 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 18-20/2d · Leve · 1 Mão' },
  { nome: 'Marreta',              tipo: 'Martelo — CaC',  dano: '3d4 + For · Impacto',     desc: 'Alcance 1,5m · Crítico 20/2d · Pesada · 2 Mãos' },
  { nome: 'Marreta Impulsiva',    tipo: 'Martelo — CaC',  dano: '1d10 + For · Impacto',    desc: 'Alcance 1,5m · Crítico 19-20/2d · Pesada · 2 Mãos | Passiva: 1x a cada 3 turnos, ação livre para +1d8 Impacto.' },
  // Acategóricas
  { nome: 'Barbatanas Ferroadas', tipo: 'Acateg. — CaC',  dano: '1d6 + Des · Corte',       desc: 'Alcance 1,5m · Crítico 20/1d · Leve · 1 Mão | Passiva: ao acertar desarmado, segundo ataque com Destreza na mesma ação.' },
  { nome: 'Bota Laminada',        tipo: 'Acateg. — CaC',  dano: '1d4 + Des · Corte',       desc: 'Alcance 1,5m · Crítico 19-20/1d · Leve · 1 Pé' },
  { nome: 'Picareta',             tipo: 'Acateg. — CaC',  dano: '1d4 + For · Perfurante',  desc: 'Alcance 1,5m · Crítico 18-20/1d · Leve · 2 Mãos' },
  { nome: 'Tridente',             tipo: 'Acateg. — CaC',  dano: '1d8 + For · Perfurante',  desc: 'Alcance 1,5m · Crítico 19-20/2d · Pesada · 2 Mãos' },
];

// ===== ARMADURAS =====
const ARMADURAS = [
  { nome: 'Armadura de Couro',       tipo: 'Armadura — Leve',   dano: 'CA +2', desc: 'Leve e silenciosa. Oferece proteção básica sem comprometer a mobilidade.' },
  { nome: 'Cota de Malha',           tipo: 'Armadura — Média',  dano: 'CA +4', desc: 'Anéis de metal entrelaçados. Boa proteção contra cortes com peso moderado.' },
  { nome: 'Armadura de Placas',      tipo: 'Armadura — Pesada', dano: 'CA +8', desc: 'Proteção máxima em campo de batalha. Pesada, mas quase impenetrável a ataques físicos.' },
  { nome: 'Gibão Acolchoado',        tipo: 'Armadura — Leve',   dano: 'CA +1', desc: 'Camadas de tecido grosso. Proteção mínima, mas silenciosa e confortável.' },
  { nome: 'Peitoral de Bronze',      tipo: 'Armadura — Média',  dano: 'CA +3', desc: 'Placa frontal de bronze moldado. Proteção sólida com boa mobilidade nos flancos.' },
  { nome: 'Armadura de Escamas',     tipo: 'Armadura — Média',  dano: 'CA +4', desc: 'Escamas metálicas sobrepostas. Flexível como couro, resistente como metal.' },
  { nome: 'Manto das Sombras',       tipo: 'Armadura — Leve',   dano: 'CA +2', desc: 'Tecido encantado que absorve luz. Favorito de infiltradores e obscuros.' },
  { nome: 'Armadura Rúnica',         tipo: 'Armadura — Média',  dano: 'CA +5', desc: 'Gravada com runas de proteção. Concede resistência a um tipo de dano mágico.' },
  { nome: 'Escudo de Torre',         tipo: 'Escudo — Pesado',   dano: 'CA +3', desc: 'Escudo de corpo inteiro. Pode ser usado para cobrir aliados adjacentes.' },
  { nome: 'Armadura Espectral',      tipo: 'Armadura — Leve',   dano: 'CA +3', desc: 'Forjada com essência do vazio. Semitransparente e leve como névoa.' },
  { nome: 'Armadura de Couro Batido',tipo: 'Armadura — Leve',   dano: 'CA +3', desc: 'Couro endurecido por técnica artesanal de batimento. Mais resistente que o couro comum, sem perder a leveza.' },
];

// ===== ACESSÓRIOS =====
const ACESSORIOS = [
  { nome: 'Corredores ao Vento',      tipo: 'Acessório — Botas',     raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Reação', desc: 'Botas de couro escuro com detalhes prateados. Permitem um segundo salto no ar impulsionado por vento invisível. Útil para evitar quedas, atravessar vãos ou alterar trajetória.' },
  { nome: 'Passos Fantasma',          tipo: 'Acessório — Sapatilhas', raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Sapatilhas etéreas de tecido acinzentado. Concedem +5 em furtividade, eliminam sons ao se deslocar e permitem ignorar terreno difícil.' },
  { nome: 'Laço da Verdade',          tipo: 'Acessório — Laço',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Ação',    desc: 'Laço dourado leve como seda e firme como aço. Lançado sobre criatura a até 6m: se agarrada, fica compelida a dizer apenas verdades até o fim do próximo turno.' },
  { nome: 'Lente do Caminho',         tipo: 'Acessório — Monóculo',   raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Monóculo de cobre com lente azulada. Por 1 minuto revela trilhas ocultas, rastros mágicos e portas secretas a até 9m, mesmo magicamente ocultas.' },
  { nome: 'Óculos da Verdade',        tipo: 'Acessório — Óculos',     raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Óculos de lentes translúcidas. Por 1 minuto permitem ver através de ilusões, disfarces e perceber criaturas invisíveis no campo de visão.' },
  { nome: 'Coroa de Gêneros',         tipo: 'Acessório — Coroa',      raridade: 'Comum',   recarga: '', carga: null, acao: '', desc: 'Troca o gênero do usuário quando desejar. Ativo por 1 hora, não pode se destransformar. Concede +4 em Enganação, Atuação e Lábia enquanto ativo.' },
  { nome: 'Tiara do Conhecimento',    tipo: 'Acessório — Tiara',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Tiara prateada com cristal violeta. Por 1 minuto concede vantagem em Conhecimento, Religião, História e Arcano, e permite ler idiomas escritos desconhecidos.' },
  { nome: 'Capa Invisível',           tipo: 'Acessório — Capa',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Capa cinza que ondula como névoa. Torna o usuário invisível até realizar ação hostil. Invisível: sem ataques de oportunidade e ignora sensores visuais comuns.' },
  { nome: 'Luvas de Escalada',        tipo: 'Acessório — Luvas',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Luvas de couro com runas nas palmas. Por 1 minuto permitem escalar qualquer superfície, mesmo lisa ou vertical, sem testes e sem usar os pés.' },
  { nome: 'Anel de Coelho',           tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Reação',  desc: 'Anel de prata com entalhe de coelho. Dobra distância de salto ou permite mover até 3m como reação ao ser alvo de ataque ou armadilha.' },
  { nome: 'Anel de Ave',              tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Anel de ouro com pena gravada. Ao ativar, transforma o usuário em um pássaro de rank 0 que já conheça ou tenha visto.' },
  { nome: 'Colar de Aura Tortuosa',   tipo: 'Acessório — Colar',      raridade: 'Incomum', recarga: 'Descanso longo',  carga: 1, acao: 'Bônus',   desc: 'Pingente em espiral prateada. Aura distorcida: inimigos fazem teste de Vontade CD 15 (falha = Apavorado; sucesso = Amedrontado). +5 em Intimidação.' },
  { nome: 'Anel de Esqueleto',        tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Anel de ferro com crânio esculpido. Invoca mão esquelética translúcida por 1 minuto: pega objetos a até 3m e concede vantagem em um teste de Intimidação ou Persuasão.' },
  { nome: 'Anel de Invocar Familiar', tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso longo+', carga: 3, acao: 'Ação',    desc: 'Anel de bronze com símbolos de animais. Invoca familiar animal por 10 minutos. Auxilia em tarefas simples, envia mensagens e fornece bônus em vigilância.' },
  { nome: 'Olho do Além',             tipo: 'Acessório — Amuleto',    raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Amuleto com olho em pedra negra. Por 1 minuto permite enxergar espíritos e criaturas incórporas a até 9m, percebendo suas intenções básicas.' },
  { nome: 'Visão Extra-Planar',       tipo: 'Acessório — Amuleto',    raridade: 'Raro',    recarga: 'Descanso longo+', carga: 3, acao: 'Bônus',   desc: 'Amuleto de cristal translúcido. Por 1 minuto revela criaturas, objetos e portais em planos paralelos a até 12m. Facilita distinguir ilusões.' },
  { nome: 'Óculos da Segunda Vida',   tipo: 'Acessório — Óculos',     raridade: 'Raro',    recarga: 'Descanso longo+', carga: 1, acao: 'Reação',  desc: 'Óculos dourados que brilham à beira da morte. Ao cair a 0 PV, restaura automaticamente 1d10 + Modificador de Vontade em PV.' },
  { nome: 'Dados Coincidentes',       tipo: 'Acessório — Dados',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Par de dados de marfim envelhecido com símbolos arcanos em vez de números.' },
  { nome: 'Bússola Eterna',           tipo: 'Acessório — Bússola',    raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Bússola de bronze antigo. Aponta para o local que o usuário mais deseja encontrar no momento, desde que no mesmo plano e a poucos quilômetros.' },
];
