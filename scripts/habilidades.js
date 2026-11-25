// ===== HABILIDADES =====
const HABILIDADES = {};

// Habilidades do Caminho da Espada (escolhíveis via popup, custo PCE)
const HABS_CAMINHO_ESPADA = [
  { nome: 'Proteção Laminar', desc: 'Com uma Ação Bônus, adiciona o bônus de classe à CA pelo resto do turno.', acao: 'Ação Bônus', pce: 1 },
  { nome: 'Quebrar Armadura', desc: 'Se acertar, diminui a CA do alvo em -2 por 30 segundos.', acao: 'Ação Padrão', pce: 1, evo: 'Cicatrizes Marcantes (+1 PCE): CA diminuída em -3 até 1 minuto.' },
  { nome: 'Desarmar Inimigo', desc: 'Ao causar dano total com sua arma, use sua reação para tentar desarmar o oponente. Salvaguarda de Força dele vs Destreza sua.', acao: 'Reação', pce: 1, evo: 'Desarme Estratégico (+1 PCE): ativa ao causar 80%+ do dado, usando Reflexos ou Combate.' },
  { nome: 'Corte Profundo', desc: 'Anula a resistência do alvo a dano de corte ou perfurante, se ele a possuir.', acao: 'Passiva', pce: 1 },
  { nome: 'Ponto Fixo', desc: '+3 na próxima jogada de ataque contra locais específicos.', acao: 'Ação Bônus', pce: 1, evo: 'Ponto Letal (+1 PCE): +5 no acerto e margem de crítico +1 contra locais específicos.' },
  { nome: 'Aparada', desc: 'Com sua reação, faça um teste de Combate contra o ataque do oponente. Se passar ou igualar, ambos recebem metade do dano.', acao: 'Reação', pce: 1, evo: 'Rebote (+1 PCE): se igualar ou passar, anula seu dano e o oponente recebe metade do que causou.' },
  { nome: 'Corte X', desc: 'Desfere 2 ataques contra o oponente em um corte em X, na mesma ação.', acao: 'Ação Padrão', pce: 1, evo: 'Corte Z (+1 PCE): 3 ataques | Corte W (+1 PCE): 4 ataques | Corte * (+1 PCE): 5 ataques.' },
];

// Artes da Espada (escolhíveis via popup nos níveis 7,9,12,15,18)
const ARTES_DA_ESPADA = [
  { nome: 'Bloqueio', desc: 'O bônus de bloquear aumenta em +2.' },
  { nome: 'Certeiro', desc: '+1 em seus ataques.' },
  { nome: 'Defesa', desc: '+1 em CA.' },
  { nome: 'Foco', desc: 'Acertos críticos causam +1 dado de dano extra.' },
  { nome: 'Letal', desc: 'A margem de crítico aumenta em +1.' },
  { nome: 'Latente', desc: 'Requer Potência e Corte Profundo. Ataques de corte se tornam perfurantes ou o contrário, à escolha.' },
  { nome: 'Ligão', desc: 'O bônus de esquiva aumenta em +2.' },
  { nome: 'Preciso', desc: '+2 em testes com sua espada fora de cenas de combate.' },
  { nome: 'Potência', desc: 'Seus ataques causam +2 de dano.' },
  { nome: 'Resistência', desc: '+2 em todos os testes de resistência.' },
];

HABILIDADES.Espadachim = {
  base: [
    { nome: 'Armamento Devoto', nivel: 1, desc: '+1 em testes de ataque e rolagens de dano com qualquer espada de proficiência.', acao: 'Passiva', evo: 'Nível 6: bônus aumenta para +2 em ataque e dano.' },
    { nome: 'Postura de Combate', nivel: 1, desc: 'Escolha uma postura até o início do próximo turno: Ofensiva (+2 dano), Defensiva (+2 CA) ou Fluída (+3m deslocamento).', acao: 'Ação Bônus' },
    { nome: 'Leitura de Movimento', nivel: 2, desc: 'Sempre que uma criatura errar você, recebe +1 cumulativo no próximo ataque contra ela. Máximo igual ao bônus de Sabedoria.', acao: 'Passiva' },
    { nome: 'Corte Acelerado', nivel: 3, desc: 'Gaste uma ação padrão e 2 PE para avançar 9m em linha reta e atingir um alvo. Os dois primeiros ataques corpo a corpo contra ele recebem +2 no teste de ataque.', acao: 'Ação Padrão' },
    { nome: 'Olho da Lâmina', nivel: 4, desc: 'Escolha um alvo. Até o início do seu próximo turno: ignora meia cobertura e bônus de escudo contra ele, e recebe +2 em ataques contra ele.', acao: 'Ação Bônus' },
    { nome: 'Caminho da Espada', nivel: 6, desc: 'Nos níveis 6, 10, 12, 14, 17 e 20 você pode escolher uma habilidade de espada. Habilidades iniciais custam 1 PCE, evoluções +1 PCE cada.', acao: 'Passiva', _especial: 'caminho_espada' },
    { nome: 'Domínio da Lâmina', nivel: 6, desc: 'Ao acertar um ataque, gaste o PE correspondente para: desnortear o alvo (-2 em acerto até o próximo turno); aplicar a manobra Empurrar usando Destreza; ou Recuar 1,5m sem provocar ataques de oportunidade.', acao: 'Passiva' },
    { nome: 'Arte da Espada', nivel: 7, desc: 'Escolha uma Arte da Espada. Novas artes nos níveis 9, 12, 15 e 18.', acao: 'Passiva', _especial: 'arte_espada' },
    { nome: 'Ritmo do Duelo', nivel: 8, desc: 'Ao acertar um alvo pela segunda vez consecutiva sem errar, recebe um marcador (máx 3). Ao atingir 3 marcadores, recupera 1 PCE.', acao: 'Passiva' },
    { nome: 'Aparada (Passiva)', nivel: 11, desc: 'Quando for atacado, gaste sua reação para fazer um corte no objeto, projétil ou inimigo a 3m de você. Se o dano causado for igual ou maior ao do atacante, anula o dano.', acao: 'Reação' },
    { nome: 'Zona de Controle', nivel: 13, desc: 'Inimigos em 3m provocam ataque de oportunidade ao se mover e não recebem bônus por flanquear você. Uma vez por rodada pode realizar um ataque de oportunidade sem gastar reação, gastando o PE necessário.', acao: 'Passiva' },
    { nome: 'Mil Cortes', nivel: 17, desc: 'Em raio de 4,5m, escolha até 5 inimigos para atacar simultaneamente, retornando ao centro após. Role um dado de acerto para cada alvo. Ao acertar 3 ou mais, recupera 1 PCE.', acao: 'Ação Padrão' },
    { nome: 'Mestre da Espada', nivel: 20, desc: 'Seus ataques ignoram resistências não mágicas. Com espada: margem de crítico +2, recupera 1 PE ao acertar um crítico e 1 PCE ao incapacitar um inimigo.', acao: 'Passiva' },
  ],
  caminhos: {}
};

HABILIDADES.Bardo = {
  base: [
    { nome: 'Apoiar', nivel: 1, pe: 1, peEvolucao: 2, desc: 'Concede vantagem no próximo teste a um aliado dentro do Alcance do Som que possa ver ou ouvir você. Custos: 1 PE; evolução no nível 7 vira Reação de 2 PE, uma vez por rodada.', acao: 'Ação Bônus', evo: 'Nível 7: Inspirar Confiança — reação contra ataque errado do aliado.' },
    { nome: 'Canção de Cura', nivel: 1, pe: 2, peEvolucao: 4, desc: 'Cura 1d6 + Carisma em 4,5m ao redor por 2 PE. A cura é reduzida à metade abaixo da metade dos PV máximos.', acao: 'Ação Padrão', evo: 'Nível 6: 4 PE, área de 6m e 2d6 + Carisma.' },
    { nome: 'Canção Bárbica', nivel: 2, pe: 1, desc: 'Por 1 PE e 1 minuto, concede dano adicional ao primeiro acerto do aliado por turno: 2–4: +1d4; 5–8: +1d6; 9–12: +1d8; 13–16: +1d10; 17–20: +1d12.', acao: 'Ação Bônus' },
    { nome: 'Eclético', nivel: 3, pe: 2, desc: 'Antes de um teste de Constância, gaste 2 PE: Versatilidade soma seu Bônus de Classe se não tiver proficiência; ou Presença de Palco usa Atuação em Persuasão, Lábia, Enganação ou Intimidação.', acao: 'Passiva', ativavel: true },
    { nome: 'Impulso', nivel: 5, pe: 4, desc: 'Por 4 PE, criaturas em 3m fazem Constituição contra sua CD. Falha: 1d8 trovejante e empurrão de 7,5m; impacto em obstáculo causa 1d4. Sucesso: metade e sem empurrão.', acao: 'Ação Padrão' },
    { nome: 'Confusão Inimiga', nivel: 7, pe: 6, desc: 'Por 6 PE, até 2 criaturas no Alcance do Som fazem Constituição contra sua CD. Quem falhar fica em desvantagem em ataques até o fim do próximo turno.', acao: 'Ação Padrão' },
    { nome: 'Inspirar Confiança', nivel: 7, pe: 2, desc: 'Evolução de Apoiar: reação de 2 PE, uma vez por rodada, após um aliado errar um ataque. Ele repete a jogada e deve ficar com o segundo resultado.', acao: 'Reação', ativavel: true },
    { nome: 'Ala de Segredos', nivel: 9, desc: 'Escolha uma habilidade de nível 6 de outro Caminho de Bardo, pagando seu custo e usando sua CD. Evolução no nível 13: escolha outra habilidade, também podendo ser de nível 9.', acao: 'Passiva', evo: 'Nível 13: uma segunda habilidade de outro Caminho.' },
    { nome: 'Impulsão Sonora', nivel: 12, pe: 10, desc: 'Por 10 PE, você e 1 aliado a até 4,5m criam até 3 impulsões de 4,5m em linha reta sem ataques de oportunidade. Ataques com vantagem; aliado ataca sem vantagem.', acao: 'Ação de Movimento' },
  ],
  caminhos: {
    'Bravura': {
      proficiencias: 'Aptidão em Vontade; proficiência em Espadas Longas, Arcos Longos e Curtos',
      habs: [
        { nome: 'Ataque Extra', nivel: 6, desc: 'Se acertar um ataque com arma usando a Ação Padrão, pode atacar +1 vez com a mesma ação.', acao: 'Passiva', evo: 'Nível 13: 2 ataques extras.' },
        { nome: 'Contra Peso', nivel: 9, desc: 'Música que deixa o clima mais leve. Aliados que escutam têm vantagem contra Amedrontado, Apavorado ou Encantado por 1 minuto.', acao: 'Ação Padrão' },
        { nome: 'Sinfonia de Guerra', nivel: 13, desc: 'Ao entoar uma canção de Bardo com Ação Padrão, gaste 5 PE e sua ação bônus para atacar com sua arma.', acao: 'Passiva' },
        { nome: 'Vontade de Ferro', nivel: 17, desc: 'Por 16 PE e 6 turnos, aliados que veem ou ouvem você ganham +1 CA. Ao acertar um inimigo, o próximo ataque de cada aliado causa dano adicional igual ao seu modificador de Carisma.', acao: 'Ação Bônus' },
        { nome: 'Determinação Pranteada', nivel: 20, desc: 'Uma vez por descanso longo, por 1 minuto aliados que podem ouvir você causam +6 do mesmo tipo de seus ataques. Aliados Morrendo no início da ação voltam com 1 PV e retornam a Morrendo ao fim.', acao: 'Ação Completa' },
      ]
    },
    'Pavor': {
      proficiencias: 'Aptidão em Intimidação',
      habs: [
        { nome: 'Fiddle', nivel: 6, desc: 'Ao acertar com arma, gaste PE para causar 1d8 psíquico. Teste de Vontade: falha = +1d4 psíquico + Amedrontado; passa = só dano adicional.', acao: 'Passiva' },
        { nome: 'Terror Contagiante', nivel: 9, desc: 'Ao causar Amedrontado, alvos adjacentes em 1,5m também fazem teste de resistência ou ficam amedrontados pelo mesmo tempo.', acao: 'Passiva' },
        { nome: 'Olhar Perturbador', nivel: 13, desc: 'Alvo a até 15m faz salvaguarda de Carisma: falha = Apavorado por 1 min + 3d6 psíquico + desvantagem em testes de Carisma; passa = só dano.', acao: 'Ação Padrão' },
        { nome: 'Medo Inabalável', nivel: 17, desc: '1x por descanso longo. Alvo que entenda e escute faz salvaguarda de Sabedoria: falha = obedece comandos por 1 min. A cada falha no reteste, +1 na CD.', acao: 'Passiva' },
        { nome: 'Presságio da Morte', nivel: 20, desc: 'Uma vez por descanso longo, por 2 turnos. Inimigos em 12m fazem Carisma contra sua CD; falha: Paralisado por 2 turnos; sucesso: 3d10 psíquico sem condição. Dano quebra a paralisia e causa Apavorado até o fim.', acao: 'Ação Padrão' },
      ]
    },
    'Vigor': {
      proficiencias: 'Aptidão em Persuasão; Magias de Cura (regra de Mago)',
      habs: [
        { nome: 'Toque Acolhedor', nivel: 6, desc: 'Cura 1d8 + Persuasão a um aliado em 12m. Recupera feridas leves.', acao: 'Ação Padrão', evo: 'Nível 9: 2d8 | Nível 13: 3d8 | Nível 17: 4d8' },
        { nome: 'Ajuda Temporária', nivel: 9, desc: 'Por 8 PE, concede 12 PV Temporários e +3 no próximo teste de resistência a aliados que escutam. Não acumulativo. Nível 13: 16 PV; nível 17: 28 PV.', acao: 'Ação Bônus', evo: 'Nível 13: 16 PV Temporários | Nível 17: 28 PV Temporários' },
        { nome: 'Música de Ferro', nivel: 13, desc: 'Por 12 PE e 1 minuto, aliados em 15m recebem Resistência igual à sua Persuasão + 2 contra dano psíquico.', acao: 'Ação Padrão' },
        { nome: 'Orquestra Sinfônica', nivel: 17, desc: 'Uma vez por descanso longo, todos em 22m recuperam 7d12 + Persuasão PV e 5d8 PE.', acao: 'Ação Completa' },
      ]
    },
    'Perdição': {
      proficiencias: 'Aptidão em Intimidação',
      habs: [
        { nome: 'Onda Potente', nivel: 6, desc: 'Empurra alvos em 4,5m ao redor a 18m de distância, causando 2d8 trovejante.', acao: 'Ação Padrão' },
        { nome: 'Nota Aguda', nivel: 9, desc: 'Acorde agudo em área de 9m. Salvaguarda de Vigor: falha = 3d8 + Intimidação trovejante; passa = metade.', acao: 'Ação Padrão' },
        { nome: 'Ressonância Despedaçante', nivel: 13, desc: 'Por 12 PE, ponto a até 18m com raio de 4,5m faz Vigor contra sua CD: 6d6 + Intimidação trovejante; falha também deixa Caído. Objetos frágeis e estruturas recebem dobro.', acao: 'Ação Padrão' },
        { nome: 'Tremor Infundado', nivel: 17, desc: 'Por 16 PE, área de 9m no chão ou cone de 12m causa 8d6 + Intimidação trovejante. Destreza: falha = dano total e lançamento de 9m para cima; sucesso = metade e elevação de 3m.', acao: 'Ação Padrão' },
        { nome: 'Dó Extermínio', nivel: 20, desc: 'Uma vez por descanso longo, todos em 22m sofrem 8d10 + Intimidação trovejante. Falha: dano total e Atordoado por 2 turnos; sucesso: metade e Surdo por 1 minuto.', acao: 'Ação Completa' },
      ]
    },
    'Soneto': {
      proficiencias: 'Aptidão em Lábia; pode entoar sem instrumento com Alcance do Som de 9m',
      habs: [
        { nome: 'Rima Certeira', nivel: 6, desc: 'Reação de 2 PE quando um aliado que possa te ouvir falhar em uma salvaguarda. Ele repete o teste e deve aceitar o segundo resultado.', acao: 'Reação' },
        { nome: 'Via Sonora', nivel: 9, desc: 'Por 8 PE e uma ação de Movimento, crie uma onda até 12m ao redor e mova-se junto dela. Se atacar no mesmo turno, tem vantagem.', acao: 'Ação de Movimento' },
        { nome: 'Sinfonia Cadenciada', nivel: 13, desc: 'Ao conjurar uma canção de Bardo com Ação Padrão, gaste 5 PE e sua ação bônus. Um aliado pode usar sua reação imediatamente para atacar uma vez com arma ou se deslocar até metade do deslocamento.', acao: 'Ação Bônus' },
        { nome: 'Refrão Persistente', nivel: 17, desc: '1x por descanso longo: habilidade que afeta múltiplos aliados dura o dobro, ou se for instantânea, repete no início do próximo turno sem custo.', acao: 'Passiva' },
        { nome: 'Canção Dominante', nivel: 20, desc: 'Uma vez por descanso longo, inimigos em 22m que podem ouvir fazem Vontade contra sua CD por 1 minuto. Falha: só podem executar as mesmas ações que você ou sincronias musicais e ficam Cansados ao fim; sucesso: Desprevenidos até o início do próximo turno.', acao: 'Ação Completa' },
      ]
    },
  }
};

HABILIDADES.Mago = {
  base: [
    { nome: 'Grimório Arcano', nivel: 1, desc: 'Seu grimório comporta Arcanismo + nível magias anotadas. Você só pode conjurar magias transcritas e traduzidas nele; transcrever uma magia leva 2 horas menos seu bônus de Arcanismo.', acao: 'Passiva' },
    { nome: 'Conjuração Arcana', nivel: 1, desc: 'Começa com três magias de volume 1. Para conjurar uma magia, leia-a no grimório. Seu dano mágico pode somar seu modificador de Inteligência.', acao: 'Passiva' },
    { nome: 'Magias Controladas', nivel: 1, desc: 'Pode manter magias controladas guardadas até um limite de 1 + modificador de Inteligência e lançar uma delas usando uma ação bônus.', acao: 'Passiva' },
  ],
  caminhos: {
    'Caminho do Colecionador': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Conhecimento Ampliado', nivel: 6, desc: 'Aprende uma magia adicional de um volume ao qual já tenha acesso. Pode escolher outra magia nos níveis 9, 12, 17 e 20.', acao: 'Passiva' },
        { nome: 'Grimório Aprimorado', nivel: 9, desc: 'A durabilidade do grimório aumenta em 6 + seu bônus de classe.', acao: 'Passiva' },
        { nome: 'Favoritismo Pessoal', nivel: 13, desc: 'Recebe +5 na CD para testes de resistência de suas magias.', acao: 'Passiva' },
        { nome: 'Anular Magia', nivel: 17, desc: 'Contra magia ou efeito mágico que permita um teste de resistência para reduzir dano à metade: ao passar, não sofre dano; ao falhar, sofre apenas metade. Também anula condições e danos adicionais que seriam ignorados ao passar no teste.', acao: 'Passiva' },
        { nome: 'Coleção Absoluta', nivel: 20, desc: 'Enquanto estiver com o grimório, aprende e pode usar todas as magias dos volumes 1 a 4, pagando seus custos normalmente.', acao: 'Passiva' },
      ]
    },
    'Caminho do Necromante': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Servos Mortos-Vivos', nivel: 6, desc: 'Recebe a magia Ressuscitar Mortos; se já a possuir, seu custo é reduzido em 2 Mana. Ao conjurá-la, escolha um benefício: criar um servo adicional a partir de uma pilha de ossos ou restos; aumentar os PV do servo em 2 + seu nível de Mago; ou conceder +2 à Defesa e à Constituição do servo (o bônus aumenta para +4 no nível 12). Se escolher outro benefício, ele também vale para ambos os servos.', acao: 'Passiva' },
        { nome: 'Ceifador Energético', nivel: 9, desc: 'Ao finalizar uma criatura, por qualquer meio, recupera PV ou Mana em quantidade igual ao seu nível + modificador de Inteligência. A recuperação não pode exceder os limites máximos seus ou da criatura. Não funciona contra mortos-vivos ou maquinário.', acao: 'Passiva' },
        { nome: 'Mortos Superiores', nivel: 13, desc: 'Ao conjurar Ressuscitar Mortos, escolha dois benefícios em vez de um. Adiciona à lista: +4,5m a todos os deslocamentos do servo; bônus igual ao seu bônus de classe em testes de duas constâncias à sua escolha; ou +1d12 de dano corpo a corpo (aumenta para +2d10 no nível 18).', acao: 'Passiva' },
        { nome: 'Ceifador Perfeito', nivel: 17, desc: 'Ceifador Energético também pode afetar um servo morto-vivo seu a até 6m. Se houver mais de um servo na área, escolha qual será afetado; os limites de recuperação continuam valendo.', acao: 'Passiva' },
        { nome: 'Aniquilador Necrótico', nivel: 20, desc: 'Com uma ação completa e 20 Mana, toque uma criatura a até 1,5m. Ela faz um teste de Constituição contra sua CD; se falhar, sofre 7d10 + 20 de dano necrótico e Decomposição. Se passar, sofre metade do dano e evita a condição. Ignora resistências; se reduzir a criatura a 0 PV, ela morre imediatamente, sem salvaguardas contra a morte.', acao: 'Ação Completa' },
      ]
    },
    'Especialista Arcano — Elemental': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Especialidade Mágica — Elemental', nivel: 6, desc: 'Escolhe o tipo Elemental. Suas magias desse tipo recebem +2 na CD para testes de resistência e custam 2 Mana a menos.', acao: 'Passiva' },
      ]
    },
    'Especialista Arcano — Orgânica': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Especialidade Mágica — Orgânica', nivel: 6, desc: 'Escolhe o tipo Orgânica. Suas magias desse tipo recebem +2 na CD para testes de resistência e custam 2 Mana a menos.', acao: 'Passiva' },
      ]
    },
    'Especialista Arcano — Mística': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Especialidade Mágica — Mística', nivel: 6, desc: 'Escolhe o tipo Mística. Suas magias desse tipo recebem +2 na CD para testes de resistência e custam 2 Mana a menos.', acao: 'Passiva' },
      ]
    },
  }
};

HABILIDADES.Obscuro = {
  base: [
    { nome: 'Manto Vivo', nivel: 1, desc: 'Usa uma Ação Bônus e PE para moldar sua sombra viva em um Molde ativo. O primeiro Molde da cena custa 2 PE; trocar de Molde custa 1 PE. Apenas um Molde normal fica ativo por vez. Começa com 2 Moldes à escolha: Arma, Membro, Manto ou Vínculo.', acao: 'Ação Bônus' },
    { nome: 'Olhos das Sombras', nivel: 1, desc: 'Enxerga em escuridão não-mágica e mágica como se fosse penumbra, até 18m.', acao: 'Passiva' },
    { nome: 'Molde de Arma', nivel: 1, desc: 'Sua sombra copia perfeitamente uma arma ou munição já empunhada, usando dados originais com o bônus de Sabedoria. Tem 10 + sua CS de Conjurar em PV e pode ser arremessada até 9m, retornando ao fim do ataque.', acao: 'Ação Bônus', evo: 'Nível 3: uma vez por turno, no primeiro acerto, gaste 2 PE para aplicar Enfraquecido até seu próximo turno. Nível 14: +2 em ataques e dano, +2 de CA física e Corte Intangível contra resistência necrótica e bônus de Armadura/Escudo.' },
    { nome: 'Molde de Membro', nivel: 1, desc: 'Estende braços e pernas sombrias em até 3m. Manipula objetos à distância e pode realizar ataques corpo a corpo em fendas próximas ao alvo.', acao: 'Ação Bônus', evo: 'Nível 9: o alcance sobe para 9m. Como reação sem custo, intercepta um ataque físico contra você ou aliado a até 3m com 1d20 + Conjurar contra o teste do atacante; em igualdade ou vitória, o dano cai pela metade.' },
    { nome: 'Molde de Manto', nivel: 1, desc: 'Veste seu corpo com roupas, máscaras e adornos sombrios. Concede +2 + seu bônus de Carisma em Enganação e Atuação; coberto e em ambiente escuro, +8 em Furtividade.', acao: 'Ação Bônus', evo: 'Nível 9: ataques à distância contra você têm desvantagem. Uma vez por descanso curto, pode usar sua reação para ficar Fortemente Obscurecido até o início do seu próximo turno.' },
    { nome: 'Molde de Vínculo', nivel: 1, desc: 'Liga sua sombra à sombra de uma criatura ou objeto a até 9m. A ligação tem PV igual à sua CS de Conjurar e permite rastrear direção e distância exatas; Puxar ou Prender custa ação bônus e 2 PE.', acao: 'Ação Padrão', evo: 'Nível 14: alcance sobe para 18m e o Molde pode prender 2 alvos ao mesmo tempo, permitindo 1 efeito por turno.' },
    { nome: 'Corrosão Sombria', nivel: 2, desc: 'Uma vez por turno, ao acertar seu Molde de Arma em alvo em penumbra ou escuridão, causa dano necrótico adicional conforme o nível: 2–4 +1d6, 5–8 +2d6, 9–12 +3d6, 13–16 +4d6, 17–19 +5d6, 20 +6d6.', acao: 'Passiva' },
    { nome: 'Entendimento Oculto', nivel: 5, desc: 'Escolha seu Caminho e 1 truque da lista de Truques do Obscuro. Escolhe novamente nos níveis 9, 13 e 17, totalizando 4 truques.', acao: 'Passiva' },
    { nome: 'Molde de Duplo', nivel: 7, desc: 'Cria um clone de sombra adjacente com CA 10, PV igual ao bônus de Sabedoria, deslocamento 9m e imunidade a condições. Você troca de lugar com ele com ação bônus ou reação. Limite de 1 em campo e exclusivo.', acao: 'Ação Bônus', evo: 'Nível 15: cria uma Sombra Residual visível no alcance; enquanto existir, após um acerto seu com Molde de Arma ela replica o ataque causando metade do dano.' },
    { nome: 'Manipulação Alheia', nivel: 9, desc: 'Transforma a sombra visível de outra criatura ou objeto em uma extensão física por 1 turno. Uma vez, usando Sabedoria como Força, realiza Agarrar, Derrubar, Empurrar ou Puxar contra alvo a até 3m da sombra.', acao: 'Ação Padrão', custo: '8 PE' },
    { nome: 'Santuário Sombrio', nivel: 12, desc: 'Cria uma redoma de 15m de diâmetro por 4 turnos. Só você enxergar lá dentro, seus Moldes ficam invisíveis e ganham Vantagem; inimigos ficam Desprevenidos (-2 CA) e cegos. Pode encerrá-la como ação livre.', acao: 'Ação Padrão', custo: '10 PE' },
  ],
  caminhos: {
    'Moldador das Sombras': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Fragmentos Sombrios', nivel: 6, desc: 'Cada acerto aloja 1 fragmento gratuitamente; o mesmo acerto pode gastar 1 PE para implantar até mais 2, máximo 3 por alvo. Detonar custa 1 PE por fragmento e causa dano necrótico com escala por nível, dobrado no escuro, além de -3m de deslocamento até o próximo turno.', acao: 'Livre / Ação Bônus' },
        { nome: 'Além do Vazio', nivel: 9, desc: 'Por 3 rodadas e 1x por Descanso Longo, vira Umbra Pura: seu Manto Vivo troca Moldes sem ação bônus e pode manter 2 Moldes normais. Recebe +2 de Defesa e 1 ataque adicional ao Atacar. Corrosão concede PV temporários iguais ao dano; críticos estendem ou reduzem a duração; ao terminar, teste de Vontade CD 16 ou perde 2 rodadas atacando aliados.', acao: 'Ação Bônus' },
        { nome: 'Segunda Pele', nivel: 13, desc: 'Quando atingido por ataque físico ou mágico, como reação custa 3 PE e reduz o dano em dobro do seu bônus de Conjurar. Pode usar até 2 vezes por rodada; a segunda exige 2 Moldes ativos.', acao: 'Reação', custo: '3 PE' },
        { nome: 'Reflexo Sombrio', nivel: 17, desc: 'Na primeira vez que acertar com Molde de Arma no turno, pode gastar 6 PE para marcar o alvo com uma cópia latente. Ela ataca no início do turno seguinte dele, causa apenas o dano da arma original e desaparece.', acao: 'Passiva', custo: '6 PE' },
        { nome: 'Rei das Sombras', nivel: 20, desc: '1x por turno, pode fazer um ataque do Molde de Arma surgir de qualquer sombra a até 9m do alvo. 1x por rodada, quando atingido, uma cópia sombria recebe o golpe e desaparece em uma sombra a até 9m.', acao: 'Passiva' },
      ]
    },
    'Senhor das Feras Sombrias': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Arsenal de Sombras', nivel: 6, desc: 'Captura sombras de inimigos caídos exclusivamente neste caminho. Mantém em campo feras iguais ao bônus de Sabedoria e um arsenal igual à CS de Conjurar. Feras podem ficar a até 6 × Conjurar metros.', acao: 'Passiva' },
        { nome: 'Capturar', nivel: 6, desc: 'Ação Padrão ou ritual pós-combate sem custo de PE contra a sombra de inimigo caído de ND até seu nível + bônus de classe. Teste de Conjurar contra Vontade, com tentativas iguais ao bônus de Sabedoria.', acao: 'Ação Padrão', custo: '0 PE' },
        { nome: 'Sumonar', nivel: 6, desc: 'Manifesta uma fera do arsenal a até 4,5m por ação padrão. Custa 2 PE multiplicados pela categoria da sombra e exige Conjurar CD 10 + custo. Pode ser ancorada a um aliado.', acao: 'Ação Padrão' },
        { nome: 'Marca do Comandante', nivel: 6, desc: 'Ao acertar um inimigo com Molde de Arma, o próximo ataque de qualquer fera contra o alvo ganha Vantagem e +1d6 necrótico.', acao: 'Livre (1x por turno)' },
        { nome: 'Devoção do Abismo', nivel: 9, desc: 'Quando uma fera seria destruída, gaste 3 PE e ela sobrevive com 1 PV. O dano excedente volta para você como dano psíquico e ela contra-ataca causando o dobro do dano normal.', acao: 'Reação', custo: '3 PE' },
        { nome: 'Matilha Implacável', nivel: 13, desc: 'Feras ganham bônus de acerto e dano igual ao bônus de Sabedoria. Você e uma fera ameaçando o mesmo alvo impõem -2 CA a ele contra a fera, que ignora resistência a dano físico.', acao: 'Passiva' },
        { nome: 'Quimera Sombria', nivel: 17, desc: 'Funde 2 feras invocadas em uma monstruosidade até o fim do combate. Soma PV atuais, combina habilidades e ataques e ganha 2 Ações Padrões por turno. O rank é o maior entre as duas.', acao: 'Ação Completa', uso: '1x por Descanso Longo' },
        { nome: 'Despertar do Monarca', nivel: 20, desc: 'Invoca até 4 feras do arsenal em espaços desocupados a até 15m por 3 turnos, sem PE ou limite de invocação. São imunes a controle e cada ataque acertado cura metade do dano causado em seus PV.', acao: 'Ação Completa', uso: '1x por Descanso Longo' },
      ]
    },
  }
};

HABILIDADES.Druida = {
  base: [
    { nome: 'Chamado da Natureza', nivel: 1, desc: 'Comunica-se instintivamente com plantas e animais e fala Primordial. Evolução no nível 4: faz perguntas simples a pequenos espíritos da natureza.', acao: 'Passiva', evo: 'Nível 4: pode perguntar a espíritos de florestas, rios e pedras, que respondem brevemente.' },
    { nome: 'Magia Natural', nivel: 1, desc: 'Usa magias de Flora, Água, Terra e Essência e gasta PE no lugar de Mana. Conhece 2 magias de Volume 1 e usa Natureza no lugar de Arcanismo em ataques mágicos e CDs. Aprende +1 magia nos níveis 3, 6, 9 e 12, podendo subir o volume máximo. Pode trocar 1 magia conhecida por outra do mesmo volume após um descanso longo.', acao: 'Passiva' },
    { nome: 'Sementes', nivel: 1, pe: 1, desc: 'Ação Bônus, 1 PE, alcance 6m. Carrega Natureza, mínimo 2 Sementes, e recupera todas após descanso curto ou longo. Plante até 3 Sementes simultâneas em um ponto ou criatura disposta. Elas passam de Semente a Broto e Flor no início dos seus próximos turnos e duram 4 turnos. Espinheira cria terreno difícil e dano/agarramento; Folhagem concede cobertura parcial e cura aliados; Esporos revelam ocultos e enfraquecem inimigos.', acao: 'Ação Bônus', evo: 'Cultivar (Interlúdio): recebe +2 Sementes extras até o próximo Interlúdio.' },
    { nome: 'Toque Revitalizante', nivel: 2, desc: 'Ação Bônus e toque em criatura orgânica: cura 1d4 + Sabedoria em PV, uma vez por rodada. Custos: 2 PE (níveis 2–4), 3 PE (5–8), 4 PE (9–11) e 5 PE (12+). Não funciona em mortos-vivos ou construtos.', acao: 'Ação Bônus', evo: 'Dado sobe para 1d6 no nível 3, 1d8 no 5, 1d10 no 9 e 1d12 no 12.' },
    { nome: 'Benção Natural', nivel: 3, desc: 'Escolha 1 benefício enquanto estiver a até 12m de área viva, solo fértil, água natural ou uma Semente: Pele de Casca (RD 3 elementar), Seiva Vital (cura 1d4 a cada 2 turnos), Raízes Atentas (+3 Iniciativa e sensação de criaturas no solo), ou Camuflagem Verde (+3 Furtividade e sem rastros). Pode trocar em descanso longo.', acao: 'Passiva', evo: 'Nível 9: escolhe um segundo benefício e Seiva Vital cura 1d6.' },
    { nome: 'Companheiro Animal', nivel: 5, desc: 'No Interlúdio, firma um Laço com um animal natural de ND até metade do seu nível, arredondado para cima. Teste de Sobrevivência ou Natureza contra 10 + 2 × ND; comida preparada favorita concede +2. A fera age no seu turno, obedece comandos simples e pode hospedar suas Sementes. Soma seu Bônus de Classe ao ataque e Sabedoria ao dano.', acao: 'Interlúdio', evo: 'Nível 12: a fera ganha +10 PV máximos e pode hospedar 2 Sementes.' },
    { nome: 'Transformação Feral', nivel: 7, pe: 6, desc: 'Ação Bônus, 6 PE, 4 turnos. Escolha 2 Traços: Garras (1d8 cortante e crítico 19–20), Presas (1d6 perfurante e agarrar com Sabedoria), Couro Grosso (+2 CA e RD 2 físico), Patas Velozes (+4,5m), Membrana (queda controlada), Sentidos Apurados (visão no escuro 12m e +3 em Percepção/Sobrevivência), Nadadeiras (natação terrestre e respiração aquática) ou Espinhos (1d6 perfurante a quem atacar você corpo a corpo). Não conjura magias, mas planta Sementes e usa Toque.', acao: 'Ação Bônus', evo: 'Nível 12: escolhe 3 Traços, dura 6 turnos e custa 10 PE.' },
    { nome: 'Fruto Maduro', nivel: 9, desc: 'Livre, uma vez por turno, ao lado de uma Semente sua em Flor: colhe 1 Espinheira, Folhagem ou Esporos, até o limite de Natureza de Frutos. Espinheira explode e causa seu dado de Semente; Folhagem cura 2d8 + Sabedoria; Esporos deixam a criatura Desprevenida. Dá-se ou arremessa-se como ação bônus até 6m. Cultivar pode gerar 1d4 Frutos à escolha. Frutos são ingredientes nobres (+2).', acao: 'Livre / Ação Bônus', evo: 'Frutos duram até o próximo Interlúdio.' },
    { nome: 'Bosque Vivo', nivel: 12, pe: 10, desc: 'Ação Padrão, 10 PE, área circular de 15m por 4 turnos, 1 vez por descanso curto. Inimigos enfrentam terreno difícil; no início do seu turno todas as suas Sementes avançam 1 estágio; planta 1 Semente por turno como ação livre; aliados curam 1d6 no início do turno deles. Termina se você sair da área ou ficar inconsciente.', acao: 'Ação Padrão' },
  ],
  caminhos: {
    'Micélio': {
      proficiencias: 'Rede de suporte, mobilidade e cura entre Sementes.',
      habs: [
        { nome: 'Rede de Fios', nivel: 6, pe: 2, desc: 'Ação de Movimento, 1 vez por turno. Teleporta-se para um espaço livre ao lado de uma Semente sua a até 12m, sem provocar ataques de oportunidade.', acao: 'Ação de Movimento' },
        { nome: 'Pulso do Micélio', nivel: 9, pe: 8, desc: 'Ação Padrão. Aliados a até 3m de qualquer Semente sua recuperam 2d8 + Sabedoria PV e perdem 1 condição leve à sua escolha: Cegueira, Surdez, Enfraquecido ou Desprevenido.', acao: 'Ação Padrão' },
        { nome: 'Elos Vivos', nivel: 13, pe: 4, desc: 'Reação quando aliado a até 6m de uma Semente sua sofrer dano. Divide o dano igualmente entre ele e até 2 aliados próximos a outras Sementes suas. O dano total não diminui.', acao: 'Reação' },
        { nome: 'Caminho Profundo', nivel: 17, pe: 16, desc: 'Ação Padrão, 1 vez por descanso curto. Você e até 4 aliados a até 3m de uma Semente teleportam-se ao lado de outra Semente sua a até 36m da primeira.', acao: 'Ação Padrão', uso: '1x por descanso curto' },
        { nome: 'Organismo Único', nivel: 20, desc: 'Ação Completa, 1 vez por descanso longo, 3 turnos. Aliados a até 15m de uma Semente recebem RD 5 contra todo dano, ignoram terreno difícil e recuperam 3d8 PV no início do turno. Todas as suas Sementes passam diretamente para Flor.', acao: 'Ação Completa', uso: '1x por descanso longo' },
      ]
    },
    'Enxame': {
      proficiencias: 'Insetos, controle de área e dano perfurante.',
      habs: [
        { nome: 'Nuvem de Insetos', nivel: 6, pe: 4, desc: 'Ação Padrão, 9m, cubo de 3m por 3 turnos. Criaturas fazem Destreza contra sua CD ao entrar uma vez por turno e no início do turno: falha causa 2d6 perfurante, sucesso metade. Ataques à distância contra quem está fora e visão através da nuvem têm desvantagem. Move-se com ação de movimento até 6m.', acao: 'Ação Padrão' },
        { nome: 'Peçonha', nivel: 9, desc: 'Passiva, 1 vez por turno. Quando causar dano a uma criatura dentro de seu Enxame, ela faz Constituição contra sua CD; falha fica Envenenada por 3 turnos. Pode manter 2 Enxames simultaneamente.', acao: 'Passiva' },
        { nome: 'Colmeia', nivel: 13, pe: 12, desc: 'Ação Padrão, 12m, objeto de 1,5m com CA 12 e 40 PV por 4 turnos. No seu turno, inimigos em 3m fazem Destreza contra sua CD e sofrem 3d6 perfurante ou metade. Aliados na área recebem cobertura parcial.', acao: 'Ação Padrão' },
        { nome: 'Praga', nivel: 17, pe: 16, desc: 'Ação Padrão, círculo de 9m de raio por 3 turnos. No início do turno de cada inimigo, Constituição contra sua CD: falha sofre 5d6 perfurante, sucesso metade e fica Cego enquanto estiver na nuvem.', acao: 'Ação Padrão' },
        { nome: 'Rainha do Enxame', nivel: 20, desc: 'Ação Completa, 1 vez por descanso longo, 3 turnos. Seu corpo vira insetos: RD 8 físico, voo 12m e área de 3m. Inimigos adjacentes no início do turno fazem Constituição: falha sofre 4d8, sucesso metade. Não conjura nem usa Toque.', acao: 'Ação Completa', uso: '1x por descanso longo' },
      ]
    },
    'Caçada': {
      proficiencias: 'Marca, instinto predador e transformação feral.',
      habs: [
        { nome: 'Presa', nivel: 6, pe: 2, desc: 'Ação Bônus, alcance 18m, até o fim do combate. Marca uma criatura e sabe direção e distância dela. Uma vez por turno, o primeiro ataque que acertar causa dano extra igual a 1 dado de Semente.', acao: 'Ação Bônus' },
        { nome: 'Instinto Adquirido', nivel: 9, desc: 'Ao derrotar sua Presa, escolha uma característica natural dela. O mestre transforma-a em Traço e você pode escolhê-lo na Transformação Feral até o próximo Interlúdio. Guarda apenas 1 Traço adquirido por vez.', acao: 'Passiva' },
        { nome: 'Matança em Cadeia', nivel: 13, desc: 'Passiva, 1 vez por turno. Ao reduzir uma criatura a 0 PV com Transformação Feral ativa, mova-se até 4,5m sem provocar ataques de oportunidade e faça 1 ataque contra outra criatura, tudo sem gastar ação.', acao: 'Passiva' },
        { nome: 'Predador Alfa', nivel: 17, desc: 'Na Transformação Feral pode escolher 4 Traços. Contra sua Presa, a margem de crítico aumenta em 1 e você faz 1 ataque adicional por turno.', acao: 'Passiva' },
        { nome: 'Besta Primordial', nivel: 20, desc: 'Ação Completa, 1 vez por descanso longo, 3 turnos. Assume forma primordial Grande, ganha +2 CA e RD 5 e seus ataques desarmados causam +2d8. Ao reduzir sua Presa a 0 PV na forma, recebe 15 PV temporários.', acao: 'Ação Completa', uso: '1x por descanso longo' },
      ]
    }
  }
};

HABILIDADES.Guerreiro = {
  base: [
    { nome: 'Controle', nivel: 1, desc: 'Você respira fundo e foca na precisão do golpe. Concede +2 no próximo ataque com arma neste turno e +2 nas reações de Bloquear por 1 minuto. (Custo: 3 PE)', acao: 'Ação Bônus', evo: 'Nível 9: bônus em Bloquear sobe para +4 | Nível 11: +6' },
    { nome: 'Entrada Explosiva', nivel: 1, desc: 'Desloca-se até 4,5m em direção a um inimigo sem provocar ataques de oportunidade. Se acertar um ataque corpo a corpo neste turno, ganha PV Temporários igual ao Modificador de Constituição até o fim do combate. (Custo: 2 PE)', acao: 'Ação Bônus' },
    { nome: 'Ataque Preciso', nivel: 2, desc: 'Ao acertar um ataque, pode gastar PE para causar +1d6 de dano adicional neste golpe. Não cumulativo com Pancada Potente.', acao: 'Nenhuma (ativada ao acertar)', evo: 'Nível 3: +1d8 | Nível 6: +1d10 | Nível 9: +2d6 | Nível 11: +4d4' },
    { nome: 'Pancada Potente', nivel: 3, desc: 'Ao acertar um ataque corpo a corpo, pode gastar PE para adicionar +5 de dano fixo. Não cumulativo com Ataque Preciso.', acao: 'Nenhuma (ativada ao acertar)', evo: 'Nível 7: +8 | Nível 11: +9' },
    { nome: 'Ataque Extra', nivel: 5, desc: 'Gastando PE, ao acertar um ataque pode atacar +1 vez com a mesma ação.', acao: 'Passiva', ativavel: true, evo: 'Nível 9: +2 ataques | Nível 15: +3 ataques' },
    { nome: 'Bônus Coerente', nivel: 7, desc: '1x por Descanso Curto: realiza 1 Ação Bônus adicional em qualquer momento do seu turno, ultrapassando o limite normal do sistema.', acao: 'Passiva', evo: 'Nível 13: 3 usos por Descanso Longo (máx. 1 uso por turno).' },
    { nome: 'Contra-partida', nivel: 9, desc: 'Gastando PE de uma habilidade de nível 9, 1x por Descanso Longo: realiza uma Ação Padrão adicional no seu turno atual. Não reinicia deslocamento nem concede Ações Bônus ou Reações extras.', acao: 'Nenhuma (ativada no seu turno)' },
    { nome: 'Instinto Nato', nivel: 12, desc: 'Ao sofrer dano de um ataque: reduz o dano em Nível + Força e pode mover-se até 1,5m sem provocar ataques de oportunidade após esse ataque.', acao: 'Reação' },
  ],
  caminhos: {
    'Capitão': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Talento Nato', nivel: 6, desc: 'Escolha um Talento adicional da categoria de Guerreiro. Um capitão deve estar sempre preparado.', acao: 'Passiva' },
        { nome: 'Avanço Primário', nivel: 9, desc: 'Em iniciativa você ganha +5.', acao: 'Passiva', evo: 'Nível 12: +8 | Nível 16: pode escolher sua posição na ordem do turno na primeira rodada.' },
        { nome: 'Revigorar', nivel: 13, desc: 'Cura 2d6 + Constituição de PV. Usável 1x por batalha.', acao: 'Ação Bônus', evo: 'Nível 15: 2d8 + Constituição | Nível 17: 2d10 + Constituição' },
        { nome: 'Barricada de Ferro', nivel: 17, desc: 'Se impõe na frente de batalha chamando a atenção dos inimigos. Aliados com turno antes do seu ganham +2 CA. Encerra se você ficar desacordado ou fora de cena.', acao: 'Passiva' },
        { nome: 'Grito de Guerra', nivel: 20, desc: 'Aliados que escutam recebem Vantagem em todas as rolagens de ataque e +5 no dano por 1 minuto (4 turnos). Não acumulativo.', acao: 'Ação Padrão' },
      ]
    },
    'Desordem': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Movimento Inesperado', nivel: 6, desc: 'Uma vez por turno, após realizar uma ação de ataque, move até 1,5m sem gastar deslocamento e sem provocar ataques de oportunidade. Criaturas não recebem bônus por flanquear você.', acao: 'Passiva' },
        { nome: 'Agente Caótico', nivel: 9, desc: 'Ao acertar um ataque, gastando PE, escolha um efeito: empurrar o alvo 1,5m; trocar de posição com o alvo; reduzir o deslocamento do alvo pela metade até o próximo turno; ou receber +1,5m de deslocamento até o fim do turno.', acao: 'Passiva' },
        { nome: 'Ritmo Quebrado', nivel: 13, desc: 'Uma vez por turno, quando uma criatura errar um ataque contra você, escolha: mover-se 1,5m; empurrar o atacante 1,5m (tamanho médio ou menor); receber +2 no próximo ataque contra ele; ou impedir que ele realize Ataques de Oportunidade até o próximo turno. Pode ainda declarar contra-atacar ou bloquear após o resultado do dado.', acao: 'Passiva' },
        { nome: 'Colapso da Formação', nivel: 17, desc: 'Por 3 turnos: aliados em até 6m não podem ser flanqueados nem receber ataques de oportunidade; inimigos em até 6m não recebem bônus não-mágicos de aliados; a cada ataque acertado, pode mover o alvo 1,5m.', acao: 'Ação Completa' },
        { nome: 'Efeito Borboleta', nivel: 20, desc: 'Por 1 minuto: aliados em até 9m movem 1,5m sem provocar ataques de oportunidade quando um inimigo os errar; uma criatura perde a Reação por um turno caso erre você; um aliado em até 9m pode fazer um ataque de oportunidade imediato quando você acertar um ataque.', acao: 'Ação Completa' },
      ]
    },
    'Impacto': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Comungando de Guerrilha', nivel: 6, desc: 'Escolha um estilo de luta. Caso já possua um, pode evoluí-lo em 2 níveis.', acao: 'Passiva' },
        { nome: 'Estrondo', nivel: 9, desc: 'Proeza muscular: arremessa o alvo 4,5m causando 3d6 + Força de dano. Se ele colidir com uma superfície sólida, cria um tremor em área de 3m — +2d6 para quem estiver a 1,5m e +1d6 para quem estiver a 3m, além de aplicar Desprevenido por um turno a quem estiver na área.', acao: 'Ação Padrão' },
        { nome: 'Ataque Focado', nivel: 13, desc: 'Ao acertar dois ataques consecutivos no mesmo oponente, entra em "Foco Letal": o terceiro ataque em diante contra esse alvo recebe +2 no acerto e +1d6 de dano extra. Encerra ao errar, atacar alvo diferente ou se distanciar voluntariamente.', acao: 'Nenhuma (ativada no seu turno)' },
        { nome: 'Finalização Esmagadora', nivel: 17, desc: 'Uma vez por turno, após dois ou mais ataques consecutivos acertados no mesmo alvo (com Foco Letal ativo), pode gastar PE para que o próximo golpe cause +3d8 de dano adicional de impacto e arremesse o alvo 3m, aplicando a condição Derrubado.', acao: 'Nenhuma (ativada no seu turno)' },
        { nome: 'Epicentro', nivel: 20, desc: 'Por 3 turnos: fica imune às condições Derrubado, Empurrado e Agarrado. Todo ataque corpo a corpo acertado ignora resistências a dano físico do alvo e reduz o deslocamento dele pela metade no próximo turno.', acao: 'Ação Padrão' },
      ]
    },
  }
};

// ===== TRUQUES =====
const TRUQUES = {
  Obscuro: [
    { nome: 'Sussuro na parede', desc: 'Esconde uma mensagem na sombra de uma superfície. Qualquer criatura que tocar essa sombra pode ouvir a mensagem.' },
    { nome: 'Olhar pela Sombra', desc: 'Observa através da sombra de um objeto ou criatura dentro do alcance, desde que exista sombra contínua entre você e ela.' },
    { nome: 'Passagem', desc: 'Abre uma porta moldável de até 50cm de diâmetro em sua sombra. Coloca objetos e itens em uma caixa com limite de 2 + Sabedoria em metros cúbicos.' },
    { nome: 'Sussurro Umbral', desc: 'Sussurra através da sombra de aliado disposto a até 30m cuja sombra já tenha sido vista. Só vocês dois ouvem e não pode ser interceptado por meios não-mágicos.' },
    { nome: 'Véu de Escuridão', desc: 'Como ação bônus, apaga ou escurece uma pequena fonte de luz não-mágica a até 9m, ou reduz pela metade a intensidade de uma fonte maior por 1 minuto.' },
    { nome: 'Ecoar nas Sombras', desc: 'Em escuridão total, percebe vibração e movimento como se enxergasse criaturas se movendo a até 4,5m, ignorando a necessidade de visão.' },
  ]
};

const TALENTOS_GERAIS = [
  { nome: 'Alerta', desc: 'Vantagem em testes de Iniciativa e não provoca ataques de oportunidade.' },
  { nome: 'Casca Grossa', desc: 'Ao escolher, recebe aumento de PV igual a 2 × seu nível. Recebe redução a dano físico (Corte, Perfuração e Impacto) igual ao bônus de Vigor.' },
  { nome: 'Combatente Letal', desc: 'Escolha um tipo de arma (corpo a corpo, à distância ou de fogo). Recebe +2 em testes de ataque e rolagens de dano com o tipo escolhido.' },
  { nome: 'Confronto em Duelo', desc: 'Após atingir o mesmo alvo duas vezes com ataques corpo a corpo, recebe +2 em testes de ataque contra esse alvo até trocar de alvo ou ele morrer.', evo: 'Além do efeito básico, recebe +3 em rolagens de dano contra o alvo específico.', evoNivel: 10 },
  { nome: 'Corredor Resiliente', desc: '+3m em seu deslocamento e +1 em CA contra ataques de oportunidade.', evo: 'Bônus aumenta para +6m de deslocamento e +2 em CA contra ataques de oportunidade.', evoNivel: 10 },
  { nome: 'Desempenho Ligeiro', desc: 'Você recebe uma ação de movimento adicional por turno.' },
  { nome: 'Empunhadura Dupla', desc: 'Se tiver duas armas corpo a corpo de uma mão, e pelo menos uma for leve, pode atacar com ambas gastando a mesma ação.' },
  { nome: 'Foco Arcano', desc: 'Escolha uma linha de magia entre Elemental, Orgânica ou Mística. A CD das magias dessa linha aumenta em +1 e o custo em Mana diminui em 1, mínimo 1. Substitui Empunhadura Pesada.' },
  { nome: 'Energético', desc: 'Ao escolher, ganha PE igual a 2 × seu nível. A cada nível seguinte, recebe +2 PE adicionais no total.' },
  { nome: 'Fugitivo Esperto', desc: 'Ao sofrer ataque que reduza sua vida a menos da metade, gaste sua Reação para mover até 4,5m sem provocar ataques de oportunidade e fazer teste de Furtividade instantâneo para se esconder.' },
  { nome: 'Nova Tentativa', desc: 'Sempre que tirar 1 em um teste, pode gastar 2 PE para refazer o teste. Deve aceitar o novo resultado.' },
  { nome: 'Reação Adicional', desc: 'Você recebe uma reação especial por turno.' },
  { nome: 'Versatilidade de Atributo', desc: 'Escolha um atributo entre Carisma, Inteligência ou Sabedoria. Sempre que fizer um teste com esse atributo como base, pode gastar 2 PE para receber +1d4 no resultado.' },
];

// ===== TALENTOS =====
const TALENTOS = {
  Druida: [
    { nome: 'Jardineiro de Bolso', desc: 'Carrega +2 Sementes. A primeira Semente que plantar em cada combate não custa PE.' },
    { nome: 'Estufa', desc: 'Uma vez por combate, uma Semente que plantar nasce já como Broto.' },
    { nome: 'Raiz Profunda', desc: 'Suas Sementes duram até o fim da cena, em vez de 4 turnos.' },
    { nome: 'Semente Dupla', desc: 'Pagando 2 PE adicionais, planta 2 Sementes do mesmo tipo na mesma ação.' },
    { nome: 'Veneno de Estufa', desc: 'Frutos de Espinheira também Envenenam o alvo por 1 turno, salvo se ele passar em Constituição contra sua CD.' },
    { nome: 'Casca Dura', desc: 'Restrito à Transformação Feral: Couro Grosso passa a dar +3 CA e RD 3, e você não fica Cansado ao fim da transformação.' },
    { nome: 'Laço Forte', desc: 'Restrito ao Companheiro Animal: enxerga pelos olhos da fera sem gastar ação e ela soma seu bônus de Natureza em Reflexos e Iniciativa.' },
    { nome: 'Toque Constante', desc: 'Toque Revitalizante pode ser usado como Reação por 2 PE adicionais e seu alcance passa a ser 6m.' },
  ],
  Espadachim: [
    { nome: 'Contra Perfeito', desc: 'Quando realizar um contra-ataque em combate, você recebe +2 no teste de ataque e rolagem de dano.' },
    { nome: 'Defesa Compacta', desc: 'Enquanto empunhar apenas uma arma, sem escudo ou arma adicional, recebe +2 em CA.' },
    { nome: 'Derrubar Compostura', desc: 'Ao acertar um ataque crítico com espada, reduz a CA do alvo em -1 por 1 turno. Acumulável até -3.' },
    { nome: 'Erro Previsto', desc: '1x por turno, ao errar um ataque corpo a corpo com espada, ganha +1 no próximo ataque contra o mesmo alvo. Acumulável até +3, encerra ao acertar.' },
    { nome: 'Estilo Toripuru', desc: 'Pode empunhar 3 espadas simultaneamente sem desvantagens. Ao acertar com uma delas, gaste 5 PE para realizar um ataque adicional com a terceira espada.' },
    { nome: 'Foco em Combate', desc: 'Se você acertar um inimigo e não for acertado até o início do seu próximo turno, ganha +2 na rolagem de dano do próximo ataque.' },
    { nome: 'Postura Inabalável', desc: 'Se não usar sua ação de movimento no turno, ganha +2 em CA no próximo turno.' },
    { nome: 'Promessa Secreta', desc: 'Gaste 2 PE para refazer um teste de resistência de Força, Destreza ou Vigor. Não pode ser usado em salvaguardas contra a Morte.' },
    { nome: 'Golpe Decisivo', desc: 'Ao reduzir o PV de um inimigo a 0 ou nocauteá-lo, recupera 1 PCE.' },
  ],
  Guerreiro: [
    { nome: 'Avanço Descomunal', desc: 'Se você correr pelo menos 6m em linha reta até seu inimigo antes de um ataque corpo a corpo, causa +2d6 no primeiro ataque contra ele.' },
    { nome: 'Fúria Adormecida', desc: 'Quando ficar com menos da metade dos PV, ganha +2 em testes de ataque e rolagens de dano corpo a corpo. Vantagem contra efeitos de medo nesse estado.' },
    { nome: 'Resistir à Dor', desc: 'Ao entrar em estado de Morrendo, pode fazer teste de Constituição (CD 20 + 5 por teste no mesmo combate). Se passar, encerra Morrendo e volta com 1d10 PV.' },
    { nome: 'Armamento Pesado', desc: 'Escolha um tipo de arma corpo a corpo. Recebe +3 em rolagens de dano com armas desse tipo.', evo: 'Seus ataques com o tipo escolhido ignoram 2 pontos de resistência do alvo. O bônus de dano aumenta para +4.', evoNivel: 10 },
    { nome: 'Potência Muscular', desc: 'Você consegue empunhar armas de duas mãos com apenas uma mão, sem sofrer penalidades.' },
    { nome: 'Imparável', desc: 'Uma vez por descanso longo, na primeira vez que entra em Morrendo, sai da condição e volta com PV igual a 2 × sua Constituição.', evo: 'Além do efeito básico, recebe vantagem em testes de Constituição feitos após levantar por 2 rodadas (não se aplica a salvaguardas contra a morte).', evoNivel: 10 },
    { nome: 'Defesa Concentrada', desc: 'Ao empunhar escudo, recebe +2 em CA e +1 em bloqueios.', evo: 'Os bônus aumentam para +3 em CA e +2 em bloqueios.', evoNivel: 10 },
    { nome: 'Bloqueio de Ferro', desc: 'Quando realiza um bloqueio bem-sucedido, recupera 2 PE (limitado pelo total de PE).' },
  ],
  Bardo: [
    { nome: 'Solo Musical', desc: 'Se não usar ação de movimento no turno, ganha +2 em CD no próximo turno (acumula até +4).', evo: 'O limite acumulativo aumenta para +8. Ao atingir +8, os bônus são resetados no turno seguinte.', evoNivel: 10 },
    { nome: 'Tema de Batalha', desc: 'Canção Bárbica concede +2 em testes de ataque ao alvo pela duração.', evo: 'O bônus aumenta para +3 em testes de ataque.', evoNivel: 10 },
    { nome: 'Remix de Cura', desc: 'Canção de Cura recebe +1d6 PV para os alvos na área.', evo: 'O dado adicional muda para +1d8 PV.', evoNivel: 10 },
    { nome: 'Caixa de Som', desc: 'Habilidades que afetam área recebem +3m de área de efeito.', evo: 'O bônus aumenta para +4,5m de área de efeito.', evoNivel: 10 },
    { nome: 'Coral Potente', desc: 'Escolha duas constâncias com aptidão. Você e aliados a até 4,5m recebem +2 em testes feitos à base dessas constâncias.' },
    { nome: 'Versatilidade', desc: 'Aprenda um talento de outra classe (exceto Aspectomante, Sonoriante, Obscuro, Feitiçeiro e Mago).' },
    { nome: 'Interrompendo Roteiro', desc: 'Habilidades que utilizam ação bônus agora podem ser utilizadas fora do seu turno.' },
  ],
  Obscuro: [
    { nome: 'Fio do Vazio', desc: 'Enquanto Molde de Arma estiver ativo, margem de Acerto Crítico sobe em +1. Sempre que causar Acerto Crítico com ele, role +1 dado de dano extra do mesmo tipo da arma.' },
    { nome: 'Lâmina Insaciável', desc: 'Quando Molde de Arma reduzir criatura a 0 PV, recupera 1d6 PE. Uma vez por turno.' },
    { nome: 'Braço Longo', desc: 'Molde de Membro ganha +3m de alcance, cumulativo com a evolução do nível 9. Uma vez por turno, ao acertar ataque corpo a corpo através dele, realiza uma manobra de Manipulação Alheia sem custo adicional de ação.' },
    { nome: 'Passo Sombrio', desc: 'Enquanto estiver em penumbra ou escuridão, terreno difícil não reduz seu deslocamento.' },
    { nome: 'Véu Perene', desc: 'Os bônus de Enganação, Atuação e Furtividade do Molde de Manto permanecem ativos por 1 rodada após desfazer o Molde ou trocar para outro.' },
    { nome: 'Fio que Prende', desc: 'Sempre que Puxar ou Prender obtiver sucesso pelo Molde de Vínculo, o alvo fica Enfraquecido até o fim do próximo turno.' },
    { nome: 'Duplo Autônomo', desc: 'O clone do Molde de Duplo pode permanecer em campo após você trocar de posição com ele.' },
    { nome: 'Visão Compartilhada', desc: 'Enquanto Molde de Duplo estiver em campo, enxerga pelos olhos dele sem gastar ação.' },
    { nome: 'Troca Fluida', desc: 'Uma vez por turno, a primeira troca de Molde não custa PE.' },
    { nome: 'Mão Estranha', desc: 'Manipulação Alheia pode ser usada como reação por 3 PE adicionais e seu alcance aumenta para 18m.' },
    { nome: 'Sombras Ligadas', desc: 'Restrito ao Senhor das Feras Sombrias. Ao sofrer dano você ou uma sombra/fera, gaste 1 reação para dividir o dano igualmente entre até 2 outras sombras/feras em campo. Não reduz o dano total.' },
    { nome: 'Afeição Comum', desc: 'Restrito ao Senhor das Feras Sombrias. Feras que recebem ganho permanente de PV recebem +1d4 PV máximo adicional; evolução para +1d6 e depois +1d10.' },
  ],
  Mago: [
    { nome: 'Performance Mestre', desc: 'Ao acertar um ataque mágico, pode utilizar um truque na mesma ação.' },
    { nome: 'Nerd Mágico', desc: 'Descobre rapidamente pelo menos um detalhe de uma magia que veja. Recebe +3 em testes de Arcanismo para identificar magias, objetos, estruturas ou portadores de magia.' },
    { nome: 'Reserva Mental', desc: 'Possui cargas iguais ao modificador de Inteligência. Como ação bônus, gaste uma carga para recuperar 1d6 + Inteligência de Mana. Recupera as cargas em descanso longo.' },
    { nome: 'Mente Arcana', desc: 'Se não usar a ação de movimento no turno, recebe +2 em ataques mágicos até o fim do turno.' },
    { nome: 'Magia Silenciosa', desc: '+4 em Arcanismo para esconder a execução ou os rastros de suas magias.' },
    { nome: 'Mira Arcana', desc: 'Gaste 2 Mana para aumentar o alcance de uma magia em uma etapa; ataques mágicos ignoram penalidades de cobertura parcial.' },
    { nome: 'Auxílio Mágico', desc: 'Toque um aliado e gaste 2 Mana para conceder +1d8 em testes baseados em Inteligência por 10 minutos.' },
    { nome: 'Continuidade Paciente', desc: 'Pode guardar duas magias controladas adicionais.' },
    { nome: 'Controle Manual', desc: '+2 nos ataques de magias controladas.' },
    { nome: 'Magia Empilhada', desc: 'Uma vez por turno, ao lançar uma magia, pode lançar outra de volume 3 ou menor e do mesmo elemento na mesma ação, pagando o dobro da Mana original.' },
    { nome: 'Tiro Acumulado', desc: 'Pode lançar até duas magias guardadas usando uma ação bônus.' },
    { nome: 'Presença Mágica', desc: 'Enxerga rastros e auras mágicas através de até 1m de barreira sólida e recebe +4 em testes de Inteligência para identificá-los.' },
  ],
};
