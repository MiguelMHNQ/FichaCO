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
    { nome: 'Apoiar', nivel: 1, desc: 'Concede vantagem no próximo teste de um alvo que possa lhe ver ou escutar.', acao: 'Ação Bônus' },
    { nome: 'Canção de Cura', nivel: 1, desc: 'Cura 1d6 + Carisma de PV a aliados em 4,5m ao redor. Só fecha ferimentos superficiais.', acao: 'Ação Padrão', evo: 'Nível 6: área expande para 6m e cura 2d6 + Carisma.' },
    { nome: 'Canção Barbica', nivel: 2, desc: 'Motiva um alvo que possa escutar, concedendo +1d4 do mesmo tipo de dano por 1 minuto.', acao: 'Ação Bônus', evo: 'Nível 3: +1d6 | Nível 6: +1d8 | Nível 9: +1d10 | Nível 11: +1d12' },
    { nome: 'Confusão Inimiga', nivel: 3, desc: 'Entoa sons desafinados. O alvo faz teste de Constituição contra sua CD; se falhar, recebe desvantagem em ataques até o próximo turno.', acao: 'Ação Padrão' },
    { nome: 'Impulso', nivel: 5, desc: 'Empurra alvos em 3m ao redor a 7,5m de distância. Teste de Constituição contra CD; se falhar, causa +1d8 trovejante. Se acertar algo sólido, +1d4 de impacto.', acao: 'Ação Padrão' },
    { nome: 'Inspirar Confiança', nivel: 7, desc: 'Uma vez por rodada, mesmo fora do turno, permite que um aliado que possa te ouvir role novamente uma jogada de ataque. Deve ficar com o segundo resultado.', acao: 'Passiva' },
    { nome: 'Ala de Segredos', nivel: 9, desc: 'Escolha uma habilidade inicial de outro caminho de Bardo, ou uma habilidade nível 1–4 de outra classe (exceto Aspectomante, Obscuro, Sonariante, Necromante e Feiticeiro).', acao: 'Ação Padrão', evo: 'Nível 13: pode pegar a segunda habilidade do caminho escolhido ou sua evolução.' },
    { nome: 'Impulsão Sonora', nivel: 12, desc: 'Causa 3 impulsões sonoras, movendo você e um aliado junto. Cada impulsão locomove 5m. Você ataca com vantagem; o aliado sem vantagem. Livre de ataque de oportunidade.', acao: 'Ação de Movimento' },
  ],
  caminhos: {
    'Bravura': {
      proficiencias: 'Vontade, Espadas Longas, Arcos Longos e Curtos',
      habs: [
        { nome: 'Ataque Extra', nivel: 6, desc: 'Ao acertar um ataque, pode atacar +1 vez com a mesma ação.', acao: 'Passiva', evo: 'Nível 9: +2 ataques | Nível 13: +3 ataques' },
        { nome: 'Contra Peso', nivel: 9, desc: 'Música que deixa o clima mais leve. Aliados que escutam têm vantagem contra Amedrontado, Apavorado ou Encantado por 1 minuto.', acao: 'Ação Padrão' },
        { nome: 'Sinfonia de Guerra', nivel: 13, desc: 'Ao entoar uma magia de Bardo, gaste 5 PE e ação bônus para realizar um ataque com sua arma.', acao: 'Passiva' },
        { nome: 'Vontade de Ferro', nivel: 17, desc: 'Por 1min30s a cada golpe acertado: aliados ganham +1 CA. A cada 3 golpes seus, alvos recebem +4 de dano adicional (máx. 3 acúmulos).', acao: 'Passiva' },
        { nome: 'Determinação Pranteada', nivel: 20, desc: 'Aliados que escutam ganham +8 de dano trovejante por 2 minutos. Aliados em estado de morrendo voltam com 1 PV; ao fim da música, retornam ao estado de morrendo.', acao: 'Ação Completa' },
      ]
    },
    'Pavor': {
      proficiencias: 'Intimidação',
      habs: [
        { nome: 'Fiddle', nivel: 6, desc: 'Ao acertar com arma, gaste PE para causar 1d8 psíquico. Teste de Vontade: falha = +1d4 psíquico + Amedrontado; passa = só dano adicional.', acao: 'Passiva' },
        { nome: 'Terror Contagiante', nivel: 9, desc: 'Ao causar Amedrontado, alvos adjacentes em 1,5m também fazem teste de resistência ou ficam amedrontados pelo mesmo tempo.', acao: 'Passiva' },
        { nome: 'Olhar Perturbador', nivel: 13, desc: 'Alvo a até 15m faz salvaguarda de Carisma: falha = Apavorado por 1 min + 3d6 psíquico + desvantagem em testes de Carisma; passa = só dano.', acao: 'Ação Padrão' },
        { nome: 'Medo Inabalável', nivel: 17, desc: '1x por descanso longo. Alvo que entenda e escute faz salvaguarda de Sabedoria: falha = obedece comandos por 1 min. A cada falha no reteste, +1 na CD.', acao: 'Passiva' },
        { nome: 'Prepúcio da Morte', nivel: 20, desc: 'Aura mortal em 12m. Salvaguarda de Carisma: falha = Paralisado por 30s; passa = 3d10 psíquico. Paralisado que receber ataque fica Apavorado.', acao: 'Ação Padrão' },
      ]
    },
    'Vigor': {
      proficiencias: 'Persuasão, Magias de Cura (regra de Mago)',
      habs: [
        { nome: 'Toque Acolhedor', nivel: 6, desc: 'Cura 1d8 + Persuasão a um aliado em 12m. Recupera feridas leves.', acao: 'Ação Padrão', evo: 'Nível 9: 2d8 | Nível 13: 3d8 | Nível 17: 4d8' },
        { nome: 'Ajuda Temporária', nivel: 9, desc: 'Concede 12 PV e 10 PE temporários a aliados que escutam (não acumulativo).', acao: 'Ação Bônus', evo: 'Nível 13: 16 PV / 14 PE | Nível 17: 28 PV / 26 PE' },
        { nome: 'Música de Ferro', nivel: 13, desc: 'Atribui Resistência = Persuasão + 2 a dano psíquico a alvos em 15m.', acao: 'Ação Padrão' },
        { nome: 'Orquestra Sinfônica', nivel: 17, desc: 'Cura 7d12 + Persuasão de PV e 5d8 de PE a todos em 22m. Fecha ferimentos graves.', acao: 'Turno Completo' },
      ]
    },
    'Perdição': {
      proficiencias: 'Intimidação',
      habs: [
        { nome: 'Onda Potente', nivel: 6, desc: 'Empurra alvos em 4,5m ao redor a 18m de distância, causando 2d8 trovejante.', acao: 'Ação Padrão' },
        { nome: 'Nota Aguda', nivel: 9, desc: 'Acorde agudo em área de 9m. Salvaguarda de Vigor: falha = 3d8 + Intimidação trovejante; passa = metade.', acao: 'Ação Padrão' },
        { nome: 'Ressonância Despedaçante', nivel: 13, desc: 'Vibração em ponto a 18m, raio 4,5m. Salvaguarda de Vigor: falha = 6d6 + Intimidação psíquico + caído; passa = só dano. Objetos frágeis recebem dobro.', acao: 'Ação Padrão' },
        { nome: 'Tremor Infundado', nivel: 17, desc: 'Onda sonora em 9m ao redor ou cone de 12m. Surge ruído do chão até 9m acima: 8d6 + Intimidação psíquico. Salvaguarda de Destreza: falha = dano total + jogado 9m acima; passa = metade + levantado 3m.', acao: 'Ação Padrão' },
        { nome: 'Dó Extermínio', nivel: 20, desc: 'Onda sonora em 22m: 8d10 + Intimidação trovejante. Teste de Constituição: falha = dano total + Atordoado 1 min; passa = metade + Surdo 1 min.', acao: 'Turno Completo' },
      ]
    },
    'Soneto': {
      proficiencias: 'Atuação, pode usar o mundo ao redor como instrumento',
      habs: [
        { nome: 'Rima Certeira', nivel: 6, desc: 'Quando aliado que escuta falhar em ataque, gaste reação + 2 PE para ele rolar novamente. Deve aceitar o segundo resultado.', acao: 'Passiva' },
        { nome: 'Via Sonora', nivel: 9, desc: 'Gaste ação de movimento para emitir onda sonora em 12m e se locomover junto a ela. Vantagem em ataques no mesmo turno.', acao: 'Ação de Movimento' },
        { nome: 'Sinfonia Cadenciada', nivel: 13, desc: 'Ao conjurar magia de Bardo com ação, gaste 5 PE + ação bônus para conceder segundo turno a aliado que escuta. Turno extra não pode conjurar magias.', acao: 'Passiva' },
        { nome: 'Refrão Persistente', nivel: 17, desc: '1x por descanso longo: habilidade que afeta múltiplos aliados dura o dobro, ou se for instantânea, repete no início do próximo turno sem custo.', acao: 'Passiva' },
        { nome: 'Canção Dominante', nivel: 20, desc: 'Alvos em 22m fazem teste de Vontade: falha = entram em dança rítmica por 2 min, só podendo imitar suas ações; ao fim entram em cansaço. Passa = perdem o turno.', acao: 'Ação Completa' },
      ]
    },
  }
};

HABILIDADES.Obscuro = {
  base: [
    { nome: 'Capturar', nivel: 1, desc: 'Aprisiona a sombra de um inimigo caído (ND ≤ seu Nível + Bônus de Classe). Teste de Conjurar vs Vontade da criatura. Se ganhar, ela vira sua serva. PV da fera: [Afinidade x10 + Sabedoria x5 + Rank x10 + Vigor da criatura].', acao: 'Ação Padrão', evo: 'Nível 11: pode capturar inimigos vivos com 10% ou menos de PV. Disputa muda para Sabedoria vs Inteligência.' },
    { nome: 'Sumonar', nivel: 1, desc: 'Invoca uma fera capturada em espaço desocupado a até 4,5m. Custa 1 PE + ND da criatura. Teste de Conjurar (CD 8 + ND). Pode ancorá-la a um aliado com um comando.', acao: 'Ação Padrão', evo: 'Nível 11: gastando +2 PE e Ação de Movimento, invoca uma segunda fera no mesmo turno.' },
    { nome: 'Olhos das Sombras', nivel: 2, desc: 'Enxerga em escuridão não-mágica e mágica como se fosse penumbra, até 18m.', acao: 'Passiva' },
    { nome: 'Arma de Sombras', nivel: 3, desc: 'Forja uma cópia de escuridão de qualquer arma já empunhada. Mesmo dano base, mas usa bônus de Sabedoria. Possui 10 PV + Constância de Conjurar. Uma vez por turno, no primeiro acerto, gaste 2 PE para aplicar Enfraquecido até o próximo turno.', acao: 'Ação Bônus', evo: 'Nível 14: funde a arma com uma fera (ela dorme). Ganha +2 em ataques e dano, +2 CA física e Corte Intangível — ignora resistências necróticas e bônus de Armadura/Escudo.' },
    { nome: 'Entendimento Oculto', nivel: 5, desc: 'Escolha 1 truque da lista de truques de Obscuro. Repete a cada 4 níveis até o nível 20.', acao: 'Passiva' },
    { nome: 'Sombreamento', nivel: 7, desc: 'Cria um clone (CA 10, 1 PV, deslocamento 9m, imune a condições). Com Ação Bônus ou Reação, troca de lugar com a arma ou com o clone (clone some). Limite de 1 em campo.', acao: 'Ação Bônus', evo: 'Nível 15: até 4 clones simultâneos. Ativa Legião Vazia: inimigos que atacam você rolam 1d4/1d5; se não acertarem o número correto, acertam um clone que absorve e explode causando 3d6 necrótico.' },
    { nome: 'Santuário Sombrio', nivel: 9, desc: 'Cria redoma de 15m de diâmetro por até 5 minutos (requer Foco). Só você enxerga dentro. Suas sombras ficam invisíveis com Vantagem. Inimigos ficam Desprevenidos (-2 CA), cegos e com Desvantagem. Dano sofrido exige Salvaguarda de Vontade CD 15 ou o tempo cai 30s.', acao: 'Ação Padrão' },
    { nome: 'Caminho pelas Sombras', nivel: 12, desc: 'Torna-se intangível para viajar até 30m entre sombras visíveis. Ao reduzir inimigo a 0 PV, pode usar Reação para mergulhar nas sombras, ficando intangível e invisível até o início do próximo turno.', acao: 'Ação Padrão / Reação' },
  ],
  caminhos: {
    'Moldador das Sombras': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Fragmentos Sombrios', nivel: 6, desc: 'Cada acerto com Arma de Sombras aloja 1 fragmento (gaste 1 PE para mais, limite 3 por alvo). Ao detonar: 1d6 necrótico por fragmento (2d6 no escuro) e corta deslocamento em -3m até o próximo turno.', acao: 'Livre / Ação Bônus' },
        { nome: 'Além do Vazio', nivel: 9, desc: 'Consome até 2 feras ativas. Por fera absorvida: +1 ataque extra, PV temporários iguais ao dano necrótico causado, +1 CA e imunidade a restrições de deslocamento. Dura 3 turnos. 1x por Descanso Longo.', acao: 'Ação Bônus', evo: 'Nível 17: dura 6 turnos, consome até 4 feras, imune a Paralisado/Agarrado/Amedrontado. Com 2+ feras: +1 Ação Padrão adicional.' },
        { nome: 'Mestre da Lâmina Sombria', nivel: 13, desc: 'Ao acertar com Arma de Sombras, gaste 2 PE para que a lâmina atinja outro inimigo próximo com o mesmo dano. Se ambos estiverem no escuro, recupera 1d6 + Sabedoria de PE.', acao: 'Livre (1x por turno)' },
        { nome: 'Obliterarção Sombria', nivel: 17, desc: 'Detona até 3 sombras condensadas em raio de 10,5m ou linha de 13,5m. Causa 2d20 por sombra. Salvaguarda de Destreza: passa = metade. Alvos ficam Enfraquecidos por 2 turnos. Feras usadas dormem por 4 turnos.', acao: 'Ação Completa' },
        { nome: 'Rei das Sombras', nivel: 20, desc: 'No escuro/penumbra: +2 CA e Resistência a dano necrótico e psíquico. 1x por turno, duplica um ataque da Arma de Sombras. 1x por Descanso Longo, ativa Além do Vazio no poder máximo sem absorver sombras e sem risco de perder o controle.', acao: 'Passiva' },
      ]
    },
    'Senhor das Feras Sombrias': {
      proficiencias: 'Nenhuma adicional',
      habs: [
        { nome: 'Marca do Comandante', nivel: 6, desc: 'Ao acertar um inimigo com Arma de Sombras, o próximo ataque de qualquer Fera Sombria contra esse alvo ganha Vantagem e +1d6 necrótico extra.', acao: 'Livre (1x por turno)' },
        { nome: 'Devocão do Abismo', nivel: 9, desc: 'Quando uma fera sua for destruída, gaste 3 PE: ela sobrevive com 1 PV, o dano excedente vai para você como Psíquico, e ela realiza um Contra-Ataque imediato causando o dobro do dano.', acao: 'Reação' },
        { nome: 'Matilha Implacável', nivel: 13, desc: 'Feras ganham bônus em acerto e dano igual ao seu bônus de Sabedoria. Se você e uma fera flanquearem o mesmo alvo, ele sofre -2 CA contra a fera e ela ignora resistências a dano físico.', acao: 'Passiva' },
        { nome: 'Quimera Sombria', nivel: 17, desc: 'Funde 2 feras invocadas numa monstruosidade única. Soma os PVs, adquire habilidades de ambas e possui 2 Ações Padrões por turno. Nível de Afinidade = média das duas. 1x por Descanso Longo.', acao: 'Ação Completa' },
        { nome: 'Despertar do Monarca', nivel: 20, desc: 'Invoca até 4 Feras Sombrias instantaneamente sem custo de PE ou limite. Por 3 turnos as feras entram em frenesi: não falham em testes de Afinidade, são imunes a controle mental e todos os ataques acertados curam você em metade do dano causado. 1x por Descanso Longo.', acao: 'Ação Completa' },
      ]
    },
  }
};

HABILIDADES.Guerreiro = {
  base: [
    { nome: 'Controle', nivel: 1, desc: 'Você respira fundo e foca na precisão do golpe. Concede +2 no próximo ataque com arma neste turno e +2 nas reações de Bloquear por 1 minuto. (Custo: 3 PE)', acao: 'Ação Bônus', evo: 'Nível 9: bônus em Bloquear sobe para +4 | Nível 11: +6' },
    { nome: 'Entrada Explosiva', nivel: 1, desc: 'Desloca-se até 4,5m em direção a um inimigo sem provocar ataques de oportunidade. Se acertar um ataque corpo a corpo neste turno, ganha PV Temporários igual ao Modificador de Constituição até o fim do combate. (Custo: 2 PE)', acao: 'Ação Bônus' },
    { nome: 'Ataque Preciso', nivel: 2, desc: 'Ao acertar um ataque, pode gastar PE para causar +1d6 de dano adicional neste golpe. Não cumulativo com Pancada Potente.', acao: 'Nenhuma (ativada ao acertar)', evo: 'Nível 3: +1d8 | Nível 6: +1d10 | Nível 9: +2d6 | Nível 11: +4d4' },
    { nome: 'Pancada Potente', nivel: 3, desc: 'Ao acertar um ataque corpo a corpo, pode gastar PE para adicionar +5 de dano fixo. Não cumulativo com Ataque Preciso.', acao: 'Nenhuma (ativada ao acertar)', evo: 'Nível 7: +8 | Nível 11: +9' },
    { nome: 'Ataque Extra', nivel: 5, desc: 'Gastando PE, ao acertar um ataque pode atacar +1 vez com a mesma ação.', acao: 'Passiva', evo: 'Nível 9: +2 ataques | Nível 15: +3 ataques' },
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
    {
      nome: 'Sussurro pela Parede',
      desc: 'Toque uma parede ou superfície escura e grave uma mensagem de até 10 palavras, audível apenas para quem encostar ali, uma única vez.',
      evo: 'Nível 7: Vincule a mensagem a uma criatura específica. Apenas ela ouvirá, com um eco sombrio na sua voz.',
      evoNivel: 7
    },
    {
      nome: 'Passo Falso',
      desc: 'Ataque com a Arma de Sombras. Se acertar, causa dano normal e solta fumaça densa no ponto de impacto, impedindo o alvo de realizar Ataques de Oportunidade contra você até o fim do seu turno.',
      evo: 'Nível 12: A fumaça distrai o inimigo. O próximo aliado que atacar esse alvo antes do seu próximo turno ganha +2 na rolagem de acerto.',
      evoNivel: 12
    },
    {
      nome: 'Palavra Oculta',
      desc: 'Comunique-se com suas sombras via ações livres. Elas podem ver sua visão e escutar ao redor enquanto não estiverem em campo.',
      evo: 'Nível 12: Cria laço sensorial maior. Fora de campo, uma sombra pode ajudar em um teste (Reflexos, História, Natureza, Sobrevivência ou Percepção) contribuindo com seu atributo. Cada sombra usável 1x por descanso longo.',
      evoNivel: 12
    },
    {
      nome: 'Passagem',
      desc: 'Abra uma porta de até 50cm de diâmetro em sua sombra para guardar objetos, armas e itens. Capacidade: 2 + Sabedoria m³.',
      evo: 'Nível 7: Caixa com 3 + Sabedoria m³, porta de 1m. | Nível 12: Caixa com 4 + Sabedoria m³, porta de 1,5m.',
      evoNivel: 7
    },
    {
      nome: 'Conexão Direta',
      desc: 'Ao tocar a sombra de um alvo (direta ou indiretamente), estabelece uma conexão mental. Conversas só são escutadas pelos conectados.',
      evo: 'Nível 12: Conexões ilimitadas. Ao usar em inimigo (tocando a sombra ou via Arma de Sombras), aplica Marca da Ruína: +1d6 necrótico em todo dano seu ou das feras contra ele, e você sabe sua localização exata mesmo invisível ou com cobertura total.',
      evoNivel: 12
    },
    {
      nome: 'Soldados',
      desc: '1x por descanso longo: cria até 3 criaturas de sombra (15cm, 1 PV, +1 em todos atributos, carrega 5kg cada). Duram 10 min ou até sair da área das suas sombras.',
      evo: 'Nível 12: Até 5 criaturas. Você vê a visão delas, fala e escuta por elas. +18m de área de deslocamento delas.',
      evoNivel: 12
    },
    {
      nome: 'Penumbra',
      desc: '1x por descanso longo: molda sombra ao redor do corpo por 5 min (roupas, máscaras, penteados — moldes pretos pequenos). Gaste 2 PE para +1 min cumulativo. +3 em Enganção e Atuação.',
      evo: 'Nível 12: Designs complexos em cinza e preto. +5 em Enganção e Atuação. Cobertura total: +8 em Furtividade no escuro.',
      evoNivel: 12
    },
    {
      nome: 'Extensão',
      desc: 'Ação Bônus: estende braços e pernas com sombra em +1,5m por 1 min. Pode erguer itens (peso igual ao seu limite, mesma Destreza). Gaste 2 PE para +30s cumulativos.',
      evo: 'Nível 12: Ataques corp a corpo saem de fendas dimensionais coladas no inimigo. Alcance +4,5m. Inimigos sofrem -2 nas reações de Esquiva e Bloqueio contra você. Duração: 2 min.',
      evoNivel: 12
    },
  ]
};

const TALENTOS_GERAIS = [
  { nome: 'Alerta', desc: 'Vantagem em testes de Iniciativa e não provoca ataques de oportunidade.' },
  { nome: 'Casca Grossa', desc: 'Ao escolher, ganha PV igual a 2 × seu nível. Além disso, redução a todo tipo de dano igual ao seu bônus de Vigor.' },
  { nome: 'Combatente Letal', desc: 'Escolha um tipo de arma (corpo a corpo, à distância ou de fogo). Recebe +2 em testes de ataque e rolagens de dano com o tipo escolhido.' },
  { nome: 'Confronto em Duelo', desc: 'Após atingir o mesmo alvo duas vezes com ataques corpo a corpo, recebe +2 em testes de ataque contra esse alvo até trocar de alvo ou ele morrer.', evo: 'Além do efeito básico, recebe +3 em rolagens de dano contra o alvo específico.', evoNivel: 10 },
  { nome: 'Corredor Resiliente', desc: '+3m em seu deslocamento e +1 em CA contra ataques de oportunidade.', evo: 'Bônus aumenta para +6m de deslocamento e +2 em CA contra ataques de oportunidade.', evoNivel: 10 },
  { nome: 'Desempenho Ligeiro', desc: 'Você recebe uma ação de movimento adicional por turno.' },
  { nome: 'Empunhadura Dupla', desc: 'Se tiver duas armas corpo a corpo de uma mão, e pelo menos uma for leve, pode atacar com ambas gastando a mesma ação.' },
  { nome: 'Empunhadura Pesada', desc: 'Ao acertar com arma corpo a corpo pesada, pode gastar 2 PE para derrubar o alvo (condição Caído).' },
  { nome: 'Energético', desc: 'Ao escolher, ganha PE igual a 2 × seu nível. A cada nível seguinte, recebe +2 PE adicionais no total.' },
  { nome: 'Fugitivo Esperto', desc: 'Ao sofrer ataque que reduza sua vida a menos da metade, gaste sua Reação para mover até 4,5m sem provocar ataques de oportunidade e fazer teste de Furtividade instantâneo para se esconder.' },
  { nome: 'Nova Tentativa', desc: 'Sempre que tirar 1 em um teste, pode gastar 2 PE para refazer o teste. Deve aceitar o novo resultado.' },
  { nome: 'Reação Adicional', desc: 'Você recebe uma reação especial por turno.' },
  { nome: 'Versatilidade', desc: 'Escolha um atributo entre Carisma, Inteligência ou Sabedoria. Sempre que fizer um teste com esse atributo como base, pode gastar 2 PE para receber +1d4 no resultado.' },
];

// ===== TALENTOS =====
const TALENTOS = {
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
    { nome: 'Coral Potente', desc: 'Escolha duas constâncias com proficiência. Você e aliados a até 4,5m recebem +2 em testes feitos à base dessas constâncias.' },
    { nome: 'Versatilidade', desc: 'Aprenda um talento de outra classe (exceto Aspectomante, Sonoriante, Obscuro, Feitiçeiro e Mago).' },
    { nome: 'Interrompendo Roteiro', desc: 'Habilidades que utilizam ação bônus agora podem ser utilizadas fora do seu turno.' },
  ],
  Obscuro: [
    { nome: 'Lâminas Vivas', desc: 'Arma de Sombras pode ser criada junto com um ataque como parte da mesma ação. O primeiro ataque da primeira rodada de combate ganha Vantagem.' },
    { nome: 'Sombras Ligadas', desc: 'Quando você ou uma sombra/fera sofre dano, pode gastar 1 reação para dividir o dano igualmente entre até 2 outras sombras/feras em campo (não reduz o total, mas evita morte instantânea).' },
    { nome: 'Afeição Comum', desc: 'Ao receber ganho de vida permanente para suas feras, elas ganham +1d4 de PV máximo adicional.', evo: 'As feras ganham +1d6 de PV (nível 10) e +1d10 de PV (nível 15).', evoNivel: 10 },
    { nome: 'Impulso do Predador', desc: 'Após um Acerto Crítico ou reduzir inimigo a 0 PV no seu turno, pode usar Ação Bônus para realizar um ataque corpo a corpo adicional contra qualquer alvo ao alcance.' },
    { nome: 'Golpe Oculto', desc: 'Sempre que atingir um alvo que não notou sua presença, recupera passivamente 1d4 de PE.' },
    { nome: 'Corte do Vazio', desc: 'Margem de ameaça para Acerto Crítico com Arma de Sombras aumenta em +1 (crita no 19-20). Em Acertos Críticos, rola +1 dado de dano extra da arma.' },
    { nome: 'Sacrifício Tático', desc: 'Com Ação Bônus, destrói voluntariamente uma fera invocada: recupera 3 PE e limpa instantaneamente uma condição negativa (Envenenado, Sangrando ou Atordoado).' },
    { nome: 'Lâmina Inominável', desc: 'Ao atingir inimigo com Arma de Sombras, se ele tentar se afastar no próximo turno, deslocamento é reduzido à metade e sofre 2d6 de dano necrótico automático.' },
    { nome: 'Troca Fantasmagórica', desc: 'Ao usar Sombreamento, inimigos a até 3m do ponto de origem fazem Salvaguarda de Vigor ou ficam Cegos até o fim do próximo turno deles.' },
  ],
};
