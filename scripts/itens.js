// ===== ARMAS =====
// Fonte única de estatísticas, aparência e habilidades. As strings da interface são derivadas.
const ARMAS = [
  {
    "nome": "Adaga",
    "categoria": "Adaga",
    "categoriaLivro": "Adagas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Lâmina curta de dois gumes, ponta afilada e guarda discreta. O cabo de couro escuro termina em um pomo de ferro polido.",
    "habilidade": ""
  },
  {
    "nome": "Adaga Tortuosa",
    "categoria": "Adaga",
    "categoriaLivro": "Adagas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma lâmina estreita serpenteia em curvas irregulares, como uma língua de metal. O cabo retorcido acompanha o desenho do aço.",
    "habilidade": ""
  },
  {
    "nome": "Adaga de Duas Pontas",
    "categoria": "Adaga",
    "categoriaLivro": "Adagas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Duas lâminas opostas saem de uma empunhadura central revestida de couro. As pontas simétricas lembram uma pequena lança dupla.",
    "habilidade": " Você pode gastar uma ação bônus para realizar mais um ataque, podendo escolher entre um teste usando Reflexo ou um teste usando Combate, de CA inimiga."
  },
  {
    "nome": "Adaga Sardenta",
    "categoria": "Adaga",
    "categoriaLivro": "Adagas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4/1d6 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Lâmina espessa salpicada de manchas acobreadas, com pequenas farpas voltadas para a guarda. O cabo tem sulcos fundos para os dedos.",
    "habilidade": " Quando realizar um ataque com sucesso, você pode realizar um teste de Força CD 12 para retirá-la. Conseguindo, causa 1d6 + Força de dano perfurante adicional."
  },
  {
    "nome": "Adaga Balística",
    "categoria": "Adaga",
    "categoriaLivro": "Adagas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma adaga de aço escurecido com um pequeno cano embutido junto à lâmina. Rebites, um gatilho curto e a culatra exposta dão ao punho um aspecto mecânico.",
    "habilidade": " Ao acertar o ataque no inimigo, pode usar ação bônus para acionar um mecanismo que projeta uma munição de pistola previamente carregada (alcance 9m, +1d6 Balístico). Se preferir apenas atirar, requer teste de Pontaria e recarregar com ação de movimento."
  },
  {
    "nome": "Manopla de Ferro",
    "categoria": "Manopla",
    "categoriaLivro": "Manoplas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Placas de ferro articuladas cobrem os dedos e o dorso da mão. Sobre os nós dos dedos, uma barra lisa de metal contrasta com o forro de couro gasto.",
    "habilidade": ""
  },
  {
    "nome": "Manopla Espinhenta",
    "categoria": "Manopla",
    "categoriaLivro": "Manoplas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma luva de couro grosso reforçada com placas escuras. Espigões curtos e cônicos se projetam sobre cada nó dos dedos.",
    "habilidade": ""
  },
  {
    "nome": "Artilharia Manual",
    "categoria": "Manopla",
    "categoriaLivro": "Manoplas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/1d",
      "peso": "Pesada",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma manopla volumosa de aço e latão envolve a mão e parte do antebraço. Um cano largo ocupa o dorso, cercado de abraçadeiras, parafusos e marcas de fuligem.",
    "habilidade": " Recarregável com pólvora. Com ação bônus, faz sinais de mãos com o punho apontado para frente — ela abre compartimentos e causa uma explosão em linha reta de 3m causando 4d8 de dano de Fogo. Para recarregar: turno completo + 100g de pólvora."
  },
  {
    "nome": "Quebra Queixo",
    "categoria": "Manopla",
    "categoriaLivro": "Manoplas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma peça compacta de metal com quatro aros para os dedos e uma crista grossa sobre os nós. Pequenos amassados interrompem seu acabamento fosco.",
    "habilidade": ""
  },
  {
    "nome": "Espada Curta",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Espada de lâmina reta e compacta, com sulco central e guarda simples em cruz. A empunhadura curta é envolta em tiras de couro.",
    "habilidade": ""
  },
  {
    "nome": "Espada Longa",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8/1d10 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "Versátil"
    },
    "descricaoVisual": "Lâmina reta e alongada, afinando gradualmente até a ponta. Uma guarda em cruz e um punho comprido de couro equilibram sua silhueta sóbria.",
    "habilidade": ""
  },
  {
    "nome": "Espada Grande",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d6 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma extensa lâmina de dois gumes se ergue sobre uma guarda larga. O punho acomoda as duas mãos e termina em um pomo pesado e facetado.",
    "habilidade": ""
  },
  {
    "nome": "Florete",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + Des",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Lâmina longa, fina e pontiaguda, quase uma linha de prata. Uma guarda arredondada envolve a mão com delicados arcos de metal.",
    "habilidade": ""
  },
  {
    "nome": "Cimitarra",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "18-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Lâmina curva de um só gume, alargando perto da ponta. A guarda dourada se curva sobre os dedos e o cabo termina em uma pequena voluta.",
    "habilidade": ""
  },
  {
    "nome": "Alfange",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d4 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma lâmina larga e curva, de dorso espesso e ponta oblíqua. O punho curto de madeira escura se encaixa em uma guarda robusta de latão.",
    "habilidade": ""
  },
  {
    "nome": "Wakizashi",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Espada curta de curvatura suave e brilho acetinado. A guarda circular e o cabo trançado formam um conjunto discreto junto à bainha laqueada.",
    "habilidade": ""
  },
  {
    "nome": "Katana",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Lâmina longa de curvatura contínua, com uma linha ondulada junto ao fio. O cabo comprido tem cordões cruzados e uma guarda redonda de ferro escuro.",
    "habilidade": ""
  },
  {
    "nome": "Disco Laminado",
    "categoria": "Disco",
    "categoriaLivro": "Discos",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Um aro de aço achatado com borda externa afiada e centro aberto. Ranhuras finas percorrem o metal, e uma faixa interna de couro marca a área de pegada.",
    "habilidade": " Pode ser usado corpo a corpo ou lançado em linha reta ou curva, acertando inimigos na trajetória (Destreza vs CA). O inimigo pode tentar interceptá-lo. Para pegar na volta: Reação ou Ação Bônus (CD 15 de Reflexos)."
  },
  {
    "nome": "Foice Curta",
    "categoria": "Foice",
    "categoriaLivro": "Foices",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma lâmina em gancho sai de um cabo curto de madeira. O aço escuro tem o fio claro voltado para dentro da curva.",
    "habilidade": ""
  },
  {
    "nome": "Dupla Crescente",
    "categoria": "Foice",
    "categoriaLivro": "Foices",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Duas lâminas em meia-lua coroam as extremidades de um cabo dividido por um encaixe central. Anéis metálicos e couro trançado destacam a junção das duas peças.",
    "habilidade": " Acertando o primeiro ataque, pode tentar realizar um segundo ataque com Reflexos usando ação bônus. Pode usar ação bônus para desprender as duas lâminas."
  },
  {
    "nome": "Foice",
    "categoria": "Foice",
    "categoriaLivro": "Foices",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + For",
      "tipo": "Corte",
      "alcance": "3m",
      "critico": "19-20/1d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma longa haste de madeira sustenta uma lâmina curva que se projeta para o lado. Abraçadeiras de ferro reforçam a união entre o cabo e o aço.",
    "habilidade": ""
  },
  {
    "nome": "Meia Lua",
    "categoria": "Foice",
    "categoriaLivro": "Foices",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d12 + For",
      "tipo": "Corte",
      "alcance": "3m",
      "critico": "19-20/2d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma enorme lâmina em crescente ocupa a ponta de uma haste escura. Seu arco amplo e contínuo lembra uma lua prateada presa por um suporte de ferro.",
    "habilidade": ""
  },
  {
    "nome": "Arco Curto",
    "categoria": "Arco",
    "categoriaLivro": "Arcos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d6 + For",
      "tipo": "Perfurante",
      "alcance": "9m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Arco compacto de madeira castanha, com braços suaves e empunhadura envolta em couro. A corda clara contrasta com os veios escuros da madeira.",
    "habilidade": ""
  },
  {
    "nome": "Arco Longo",
    "categoria": "Arco",
    "categoriaLivro": "Arcos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d6 + For",
      "tipo": "Perfurante",
      "alcance": "12m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma peça alta e esguia de madeira flexível, quase da altura de uma pessoa. Os braços afilados terminam em pequenas ponteiras de chifre.",
    "habilidade": ""
  },
  {
    "nome": "Arco de 4 Pontas",
    "categoria": "Arco",
    "categoriaLivro": "Arcos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d10 + For",
      "tipo": "Perfurante",
      "alcance": "15m",
      "critico": "19-20/2d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Quatro braços curvos se abrem em pares ao redor de uma empunhadura reforçada. Cordas cruzadas e ponteiras metálicas desenham uma silhueta incomum e simétrica.",
    "habilidade": ""
  },
  {
    "nome": "Arco Composto",
    "categoria": "Arco",
    "categoriaLivro": "Arcos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d10 + For",
      "tipo": "Perfurante",
      "alcance": "12m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Camadas de madeira, chifre e tendão formam braços recurvados. O centro é revestido de couro, com pequenas placas de osso junto às extremidades.",
    "habilidade": ""
  },
  {
    "nome": "Arco Complexo",
    "categoria": "Arco",
    "categoriaLivro": "Arcos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d12 + For",
      "tipo": "Perfurante",
      "alcance": "18m",
      "critico": "19-20/2d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Um arco de estrutura robusta, com braços segmentados, pequenas roldanas e cabos de tensão aparentes. Madeira escura e metal escovado compõem um desenho intrincado.",
    "habilidade": ""
  },
  {
    "nome": "Lança",
    "categoria": "Lança",
    "categoriaLivro": "Lanças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Perfurante",
      "alcance": "3m",
      "critico": "18-20/2d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma ponta de aço em forma de folha prolonga uma haste lisa de madeira. Uma braçadeira envolve a base da lâmina e uma ponteira metálica fecha a outra extremidade.",
    "habilidade": ""
  },
  {
    "nome": "Alabarda",
    "categoria": "Lança",
    "categoriaLivro": "Lanças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + For",
      "tipo": "Perfurante",
      "alcance": "3m",
      "critico": "19-20/2d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma haste comprida reúne uma ponta de lança, uma lâmina larga de machado e um gancho traseiro. Rebites escuros prendem a cabeça de aço à madeira.",
    "habilidade": ""
  },
  {
    "nome": "Bastão",
    "categoria": "Bastão",
    "categoriaLivro": "Bastões",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/1d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Haste reta de madeira densa, polida pelo uso. As extremidades são arredondadas e o centro exibe uma faixa de couro trançado.",
    "habilidade": ""
  },
  {
    "nome": "Bastão Acolchoado",
    "categoria": "Bastão",
    "categoriaLivro": "Bastões",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/1d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Um bastão de madeira coberto por camadas de tecido e couro costurado. As pontas arredondadas são mais grossas, formando almofadas firmes.",
    "habilidade": ""
  },
  {
    "nome": "Bastão de Guerra",
    "categoria": "Bastão",
    "categoriaLivro": "Bastões",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Pesado",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Bastão espesso com as extremidades revestidas por virolas de ferro. Faixas metálicas interrompem a madeira escura e deixam o centro livre para a pegada.",
    "habilidade": " Ao acertar com um ataque corpo a corpo, você pode realizar um segundo ataque com -2 de penalidade no acerto."
  },
  {
    "nome": "Nunchaku",
    "categoria": "Bastão",
    "categoriaLivro": "Bastões",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "18-20/1d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Dois segmentos curtos de madeira envernizada unidos por uma corrente de elos escuros. Ponteiras de metal protegem os encaixes e as extremidades.",
    "habilidade": " Sempre que acertar um ataque corpo a corpo, você recebe +1 na próxima jogada de ataque com ele. Reseta ao fim do turno ou quando errar."
  },
  {
    "nome": "Maça",
    "categoria": "Maça",
    "categoriaLivro": "Maças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "18-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Um cabo de couro sustenta uma cabeça de ferro dividida em aletas grossas. O metal fosco tem bordas claras onde o uso removeu o acabamento.",
    "habilidade": ""
  },
  {
    "nome": "Maça Estrela",
    "categoria": "Maça",
    "categoriaLivro": "Maças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d4 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma esfera de aço coberta por pontas cônicas ocupa a extremidade de um cabo curto. A cabeça lembra uma estrela irregular de metal escurecido.",
    "habilidade": ""
  },
  {
    "nome": "Mangual",
    "categoria": "Maça",
    "categoriaLivro": "Maças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma corrente curta liga um cabo de madeira a uma esfera de ferro. Os elos largos e a argola de fixação ficam inteiramente expostos.",
    "habilidade": ""
  },
  {
    "nome": "Mangual Pesado",
    "categoria": "Maça",
    "categoriaLivro": "Maças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d12 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Pesado",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma grande esfera cravejada de espigões pende de uma corrente espessa. O cabo alongado leva duas faixas de couro e reforços de ferro nos encaixes.",
    "habilidade": ""
  },
  {
    "nome": "Clava",
    "categoria": "Maça",
    "categoriaLivro": "Maças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma peça de madeira nodosa, estreita no punho e grossa na ponta. Pregos e lascas de ferro se projetam da cabeça irregular.",
    "habilidade": ""
  },
  {
    "nome": "Machadinha",
    "categoria": "Machado",
    "categoriaLivro": "Machados",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma pequena cabeça de aço de fio curvo se encaixa em um cabo curto. A madeira clara traz um cordão de couro junto à base.",
    "habilidade": ""
  },
  {
    "nome": "Machado Grande",
    "categoria": "Machado",
    "categoriaLivro": "Machados",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d12 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Pesado",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma lâmina ampla em forma de cunha domina a ponta de um cabo comprido. O aço bruto preserva marcas de forja junto ao encaixe.",
    "habilidade": ""
  },
  {
    "nome": "Machado de Guerra",
    "categoria": "Machado",
    "categoriaLivro": "Machados",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d12 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/3d",
      "peso": "Pesado",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Cabeça de aço com lâmina larga e um esporão no lado oposto. Uma haste reforçada por tiras de ferro termina em um pomo pesado.",
    "habilidade": ""
  },
  {
    "nome": "Martelo de Guerra",
    "categoria": "Martelo",
    "categoriaLivro": "Martelos",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma cabeça compacta de aço combina uma face quadrada e um bico traseiro. O cabo escuro tem guarda pequena e empunhadura de couro.",
    "habilidade": ""
  },
  {
    "nome": "Martelo",
    "categoria": "Martelo",
    "categoriaLivro": "Martelos",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "18-20/2d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Cabeça maciça de ferro com faces planas e cantos gastos. Um cabo de madeira simples atravessa o encaixe central e termina numa tira de couro.",
    "habilidade": ""
  },
  {
    "nome": "Marreta",
    "categoria": "Martelo",
    "categoriaLivro": "Martelos",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "3d4 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/2d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Um grande bloco de metal de faces largas ocupa a ponta de uma haste grossa. O cabo longo tem duas áreas de pegada marcadas por couro escurecido.",
    "habilidade": ""
  },
  {
    "nome": "Marreta Impulsiva",
    "categoria": "Martelo",
    "categoriaLivro": "Martelos",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma marreta de aço com cilindros de latão presos atrás da cabeça. Válvulas, tubos curtos e uma aba articulada destacam seu mecanismo pressurizado.",
    "habilidade": " Uma vez a cada 3 turnos, você pode ativar com ação livre uma aba pressurizada na marreta, causando +1d8 de dano de Impacto."
  },
  {
    "nome": "Barbatanas Ferroadas",
    "categoria": "Acateg.",
    "categoriaLivro": "Acategóricas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "20/1d",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Duas lâminas de ferro sobrepostas acompanham o antebraço como barbatanas. Correias largas prendem uma base de couro sob as bordas metálicas.",
    "habilidade": " Duas lâminas de ferro sobrepostas sobre o antebraço. Quando realizar ataques desarmados e acertá-los, você pode realizar o teste de ataque com Destreza novamente na mesma ação para atacar com essas lâminas."
  },
  {
    "nome": "Bota Laminada",
    "categoria": "Acateg.",
    "categoriaLivro": "Acategóricas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d",
      "peso": "Leve",
      "uso": "1 Pé"
    },
    "descricaoVisual": "Uma bota de couro reforçado com uma lâmina estreita acompanhando a lateral da sola. Placas sobre a ponta e o calcanhar completam o desenho.",
    "habilidade": ""
  },
  {
    "nome": "Picareta",
    "categoria": "Acateg.",
    "categoriaLivro": "Acategóricas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "18-20/1d",
      "peso": "Leve",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma cabeça de ferro comprida e pontiaguda atravessa o topo de um cabo de madeira. Uma ponta é estreita e a outra termina em uma borda achatada.",
    "habilidade": ""
  },
  {
    "nome": "Tridente",
    "categoria": "Acateg.",
    "categoriaLivro": "Acategóricas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/2d",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Três pontas de aço surgem de uma peça única na extremidade de uma haste longa. A ponta central é ligeiramente maior, e as laterais se curvam para fora.",
    "habilidade": ""
  },
  {
    "nome": "Ferroada",
    "categoria": "Adaga",
    "categoriaLivro": "Adagas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d6 + Des",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "20/3d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Adaga de ponta longa e estreita, com núcleo de diamante lapidado e empunhadura compacta. Sua silhueta lembra um ferrão de inseto.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Sai",
    "categoria": "Adaga",
    "categoriaLivro": "Adagas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19-20/1d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma haste de aço pontiaguda entre dois dentes laterais curvos. O punho curto é envolto em cordão escuro.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Neko-te",
    "categoria": "Manopla",
    "categoriaLivro": "Manoplas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d4",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Pequenas garras de aço curvadas se encaixam sobre as pontas dos dedos, presas por aros finos e tiras de couro.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Shuriken",
    "categoria": "Disco",
    "categoriaLivro": "Discos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d4 + Des",
      "tipo": "Corte",
      "alcance": "9m",
      "critico": "19-20/1d4",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Estrela achatada de aço escuro, com pontas triangulares e um pequeno orifício central. Cada braço termina em um fio prateado.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Guilhotina",
    "categoria": "Foice",
    "categoriaLivro": "Foices",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d8",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Foice de execução de cabo longo, com lâmina larga e arqueada de opala leitosa. As bordas facetadas refletem pequenos arcos de luz, como um crescente sobre a haste.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Lança-Foguete",
    "categoria": "Lança",
    "categoriaLivro": "Lanças",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "20/1d10",
      "peso": "Pesada",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma ponta cônica de aço coroa uma haste curta reforçada. Aletas e um cilindro metálico traseiro dão à lança a aparência de um projétil.",
    "habilidade": " Se o portador lançar a arma e acertar, o alvo faz teste de Força (CD 12). Em falha, é empurrado 1,5m. Se estiver contra parede ou obstáculo, recebe +1d4 de dano de Impacto. O alcance de arremesso não foi definido.",
    "nova": true
  },
  {
    "nome": "Vara-Relâmpago",
    "categoria": "Bastão",
    "categoriaLivro": "Bastões",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d10 + For",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "20/3d10",
      "peso": "Pesada",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Vara de metal escuro terminada em uma ponta bifurcada. Veios de cobre descem até o punho isolado por couro grosso.",
    "habilidade": " Com 20 natural, o alvo faz teste de Constituição (CD 14); em falha, fica atordoado até o final do próximo turno.",
    "nova": true
  },
  {
    "nome": "Dente de Dragão",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Corte",
      "alcance": "3m",
      "critico": "20/1d8",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Espada colossal de lâmina larga e irregular, moldada de um dente de dragão antigo e reforçada por uma espinha de metal escuro. O cabo alongado acompanha seu porte monstruoso.",
    "habilidade": " Inércia colossal: se o portador se deslocar mais de 1,5m antes de atacar no turno, recebe −2 na rolagem de ataque com o Dente de Dragão até o fim desse turno.",
    "nova": true
  },
  {
    "nome": "Káita",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d10 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "20/1d10",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma grande espada de diamante negro, com lâmina longa e opaca e reflexos violáceos discretos. Seu fio parece absorver a luz.",
    "habilidade": " Golpe comprometido: se errar um ataque com a Káita, qualquer outro ataque feito com ela no mesmo turno terá desvantagem. A penalidade termina no final desse turno.",
    "nova": true
  },
  {
    "nome": "Espada de Duas Lâminas",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For (principal) / 1d8 + For (secundária)",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d8 por ataque",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Duas lâminas longas e opostas nascem de uma empunhadura central. Guardas baixas e anéis de ferro delimitam o espaço para as duas mãos.",
    "habilidade": " Ao usar as duas lâminas no mesmo turno, sofre −2 no ataque. Se acertar os dois ataques, o alvo sofre −1 na CA até o início do próximo turno do portador.",
    "nova": true
  },
  {
    "nome": "Espada Táurica",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d8",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Lâmina larga com ombros salientes e guarda curva em forma de chifres. Um pomo de bronze com cabeça de touro encerra o punho comprido.",
    "habilidade": " Se sair 8 natural em qualquer dado de dano, o alvo faz teste de Constituição (CD 12). Em falha, tem desvantagem no próximo ataque corpo a corpo até o fim do turno seguinte. Máximo 1 vez por turno.",
    "nova": true
  },
  {
    "nome": "Montante Cinético",
    "categoria": "Espada",
    "categoriaLivro": "Espadas",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d6 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19-20/1d6",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma grande lâmina sem fio aparente, com núcleo segmentado e contrapesos de metal. Trilhos e anéis concêntricos percorrem sua espinha.",
    "habilidade": " Uma vez a cada 3 turnos, pode carregar energia. No próximo ataque corpo a corpo que acertar, causa +2d6 de dano cinético e o alvo faz teste de Constituição (CD 15). O efeito da falha não foi definido. Se errar, perde a carga; só pode tentar carregar novamente após 3 turnos.",
    "nova": true
  },
  {
    "nome": "Machado Táurico",
    "categoria": "Machado",
    "categoriaLivro": "Machados",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d8",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma cabeça de aço com duas lâminas curvas lembra os chifres de um touro. O cabo grosso tem anéis de bronze e couro avermelhado.",
    "habilidade": " Em acerto crítico, o alvo faz teste de Constituição (CD 13). Em falha, fica atordoado até o início do próximo turno. Criaturas Grandes ou maiores têm vantagem no teste. O efeito pode afetar o mesmo alvo apenas 1 vez por combate.",
    "nova": true
  },
  {
    "nome": "Machado Ogro",
    "categoria": "Machado",
    "categoriaLivro": "Machados",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19-20/1d8",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Um bloco de ferro grosseiramente afiado forma a lâmina, preso por rebites enormes a um cabo de madeira nodosa. Marcas de martelo cobrem suas faces.",
    "habilidade": " Em acerto crítico, o alvo faz teste de Constituição (CD 14). Em falha, é arremessado 16m e sofre dano adicional igual ao modificador de Força. Criaturas Grandes ou maiores têm vantagem no teste, mas ainda sofrem metade do dano adicional e são arremessadas 13m.",
    "nova": true
  },
  {
    "nome": "Treme-Terra",
    "categoria": "Martelo",
    "categoriaLivro": "Martelos",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/2d8",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Martelo gigantesco de cabeça retangular revestida por placas sobrepostas de platina. Um núcleo de pedra escura aparece entre frisos que lembram rachaduras no solo.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Marreta Estilhaçadora",
    "categoria": "Martelo",
    "categoriaLivro": "Martelos",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/1d10",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma cabeça de aço de faces serrilhadas se prende a um cabo comprido. Cunhas e pequenas saliências irregulares recobrem a superfície do metal.",
    "habilidade": " Em acerto crítico contra criatura, causa +1d6 de dano. Contra objetos ou estruturas, causa dano triplo, além de quebrar ou danificar armamento/proteção atingidos, como escudos. O critério para quebrar equipamentos depende de regra do mestre.",
    "nova": true
  },
  {
    "nome": "Besta Pesada",
    "categoria": "Besta",
    "categoriaLivro": "Bestas e balestras",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d12 + Des",
      "tipo": "Perfurante",
      "alcance": "24m",
      "critico": "20/1d12",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Besta de coronha larga e arco de aço espesso, com estribo frontal e manivela lateral. Uma canaleta funda percorre o corpo de madeira.",
    "habilidade": " Se você não se mover durante seu turno, recebe +1 no ataque com a Besta Pesada nesse turno.",
    "nova": true
  },
  {
    "nome": "Balestra",
    "categoria": "Besta",
    "categoriaLivro": "Bestas e balestras",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d12 + Des",
      "tipo": "Perfurante",
      "alcance": "30m",
      "critico": "19-20/1d12",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma arma de coronha alongada e braços metálicos largos. Engrenagens expostas e um trilho reforçado acompanham sua estrutura de madeira escura.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Besta de Mão",
    "categoria": "Besta",
    "categoriaLivro": "Bestas e balestras",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d6 + Des",
      "tipo": "Perfurante",
      "alcance": "9m",
      "critico": "19-20/1d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma besta compacta, com punho de madeira curvo e pequenos braços de aço. O gatilho fica protegido por um aro de latão.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Besta Leve de Repetição",
    "categoria": "Besta",
    "categoriaLivro": "Bestas e balestras",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d10 + Des",
      "tipo": "Perfurante",
      "alcance": "18m",
      "critico": "19-20/1d10",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Besta de madeira clara com um carregador estreito sobre o trilho. Uma alavanca lateral acompanha a coronha e conecta pequenas engrenagens.",
    "habilidade": " Após 6 disparos, exige ação padrão para recarregar. Se não se mover durante o turno, pode realizar 1 disparo adicional com ação bônus. Esse disparo causa 1d6 de dano e pode causar crítico.",
    "nova": true
  },
  {
    "nome": "Besta Pesada de Repetição",
    "categoria": "Besta",
    "categoriaLivro": "Bestas e balestras",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d12 + Des",
      "tipo": "Perfurante",
      "alcance": "24m",
      "critico": "19-20/1d12",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma besta larga, de braços espessos e carregador superior de metal. Duas hastes reforçam a coronha ao redor de um mecanismo de alavanca robusto.",
    "habilidade": " Após 6 disparos, exige ação padrão para recarregar. Se não se mover durante o turno, pode realizar 1 disparo adicional com ação bônus. Esse disparo causa 1d10 de dano e pode causar crítico.",
    "nova": true
  },
  {
    "nome": "Arcabuz",
    "categoria": "Arma de fogo",
    "categoriaLivro": "Armas de fogo",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "3d4",
      "tipo": "Balístico",
      "alcance": "18m",
      "critico": "19-20/1d4",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Um cano longo de ferro se apoia em uma coronha simples de madeira. O mecanismo de mecha fica exposto junto à culatra escurecida pela pólvora.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Mosquete",
    "categoria": "Arma de fogo",
    "categoriaLivro": "Armas de fogo",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "2d8 + Des",
      "tipo": "Balístico",
      "alcance": "24m",
      "critico": "19-20/1d8",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Arma de cano comprido e estreito, presa à coronha por abraçadeiras de latão. Uma vareta fina repousa sob o cano e o fecho tem acabamento escuro.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Pistola",
    "categoria": "Arma de fogo",
    "categoriaLivro": "Armas de fogo",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "2d6 + Des",
      "tipo": "Balístico",
      "alcance": "12m",
      "critico": "19-20/1d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Um cano curto de aço sobre uma empunhadura curva de madeira. O guarda-mato e as pequenas peças do fecho são de latão polido.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Pistola Fecho-de-roda",
    "categoria": "Arma de fogo",
    "categoriaLivro": "Armas de fogo",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "2d6 + Des",
      "tipo": "Balístico",
      "alcance": "12m",
      "critico": "19-20/1d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma pistola de punho escuro com uma roda dentada aparente junto à culatra. Parafusos e uma pequena garra metálica cercam o mecanismo circular.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Pistola de Tambor",
    "categoria": "Arma de fogo",
    "categoriaLivro": "Armas de fogo",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "2d6 + Des",
      "tipo": "Balístico",
      "alcance": "12m",
      "critico": "19-20/1d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Pistola de cano grosso com um tambor perfurado entre o punho e a culatra. Pequenos sulcos e um cão saliente completam a estrutura de aço.",
    "habilidade": " Uma vez por turno, após acertar um ataque, rola 1d4. Se o resultado for 4, faz 1 disparo adicional gratuito no mesmo alvo, mas esse disparo não pode causar crítico.",
    "nova": true
  },
  {
    "nome": "Balista",
    "categoria": "Arma de cerco",
    "categoriaLivro": "Armas de cerco",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "5d8 + Des",
      "tipo": "Perfurante",
      "alcance": "90m",
      "critico": "20/1d8",
      "peso": "Pesada",
      "uso": "2 Mãos (arma fixa)"
    },
    "descricaoVisual": "Um enorme arco horizontal repousa sobre um cavalete de madeira reforçado. Cabos grossos, catracas e um trilho largo cercam a haste do virote.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Canhão",
    "categoria": "Arma de cerco",
    "categoriaLivro": "Armas de cerco",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "5d12",
      "tipo": "Impacto",
      "alcance": "120m",
      "critico": "20/1d12 (acerto direto)",
      "peso": "Pesada",
      "uso": "2 Mãos (arma fixa)"
    },
    "descricaoVisual": "Um tubo maciço de ferro escurecido se apoia em uma carreta de rodas largas. A boca espessa e os aros de reforço preservam manchas de fuligem.",
    "habilidade": " Requer 3 turnos para recarregar. A explosão de choque atinge raio de 10m. Inimigos na área fazem teste de Constituição (CD 18): falha = 5d12 de dano e ficam caídos; sucesso = metade do dano, sem cair. Estruturas na área recebem dano dobrado e podem ser destruídas. O crítico se aplica apenas ao acerto direto.",
    "nova": true
  },
  {
    "nome": "Trabuco de Flecha",
    "categoria": "Arma de cerco",
    "categoriaLivro": "Armas de cerco",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "10d4 + Des",
      "tipo": "Perfurante",
      "alcance": "30m",
      "critico": "20/1d4",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma arma larga de madeira e metal reúne vários trilhos paralelos para flechas. A coronha espessa contrasta com o conjunto de bocas estreitas na frente.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Barril de Pólvora",
    "categoria": "Explosivo",
    "categoriaLivro": "Explosivos e armas de área",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "12d6",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "— (explosão em área)",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Um barril de aduelas escuras cercadas por aros de ferro. Grãos de pólvora marcam a tampa, fechada por um pequeno tampão de madeira.",
    "habilidade": " Efeito: Fogo e esmagamento. Explosivo de cenário; o acionamento e a área da explosão não foram definidos.",
    "nova": true
  },
  {
    "nome": "Granada",
    "categoria": "Explosivo",
    "categoriaLivro": "Explosivos e armas de área",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "4d6",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "— (explosão em área)",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma esfera grossa de ferro, dividida por sulcos e fechada por um tampão superior. Um pequeno cordão sai da abertura entre as peças.",
    "habilidade": " Efeito: dano de Fogo. O raio de explosão não foi definido.",
    "nova": true
  },
  {
    "nome": "Granada Sônica",
    "categoria": "Explosivo",
    "categoriaLivro": "Explosivos e armas de área",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "—",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "—",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma cápsula metálica redonda com aberturas concêntricas e um anel de cobre. O interior abriga um pequeno disco de cristal.",
    "habilidade": " Efeito: Sônico. O dano e o efeito mecânico não foram definidos.",
    "nova": true
  },
  {
    "nome": "Bazuca",
    "categoria": "Explosivo",
    "categoriaLivro": "Explosivos e armas de área",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "10d8",
      "tipo": "Impacto",
      "alcance": "30m",
      "critico": "20/1d8 (acerto direto)",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Um tubo comprido de metal com boca larga, apoio de ombro e empunhaduras inferiores. Uma mira simples se ergue ao lado do cano.",
    "habilidade": " Explosão de Fogo. O ponto de impacto explode em raio de 3m. Criaturas na área fazem teste de Destreza (CD 15): falha = ficam caídas; sucesso = mantêm o equilíbrio. Requer uma rodada inteira para recarregar. O crítico se aplica apenas ao acerto direto.",
    "nova": true
  },
  {
    "nome": "Funda",
    "categoria": "Arremesso",
    "categoriaLivro": "Arremesso e funda",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d4 + Des",
      "tipo": "Impacto",
      "alcance": "15m",
      "critico": "20/1d4",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma pequena bolsa de couro ligada a duas tiras compridas de corda trançada. Um laço de dedo encerra uma das pontas.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Boleadeira",
    "categoria": "Arremesso",
    "categoriaLivro": "Arremesso e funda",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d4 + Des",
      "tipo": "Impacto",
      "alcance": "9m",
      "critico": "20/1d4",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Cordas grossas convergem em um nó central e terminam em pesos arredondados revestidos de couro escuro.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Corrente com Cravos",
    "categoria": "Corrente",
    "categoriaLivro": "Correntes e armas flexíveis",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d4 + For",
      "tipo": "Corte",
      "alcance": "3m",
      "critico": "20/1d4",
      "peso": "Pesada",
      "uso": "2 Mãos"
    },
    "descricaoVisual": "Uma corrente longa de elos espessos, intercalados por cravos curtos. As extremidades possuem áreas de pegada envoltas em couro.",
    "habilidade": " Enquanto empunha a Corrente com Cravos, alcança inimigos até 1,5m além do alcance normal. Inimigos que entrarem nesse alcance provocam ataque de oportunidade, mesmo que apenas o atravessem. O alcance de 3m exibido já inclui esse aumento.",
    "nova": true
  },
  {
    "nome": "Escudo Leve",
    "categoria": "Escudo de combate",
    "categoriaLivro": "Escudos de combate",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/1d4",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Escudo pequeno de madeira com borda fina de ferro e umbo central arredondado. Uma alça de couro atravessa a face interna.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Escudo Pesado",
    "categoria": "Escudo de combate",
    "categoriaLivro": "Escudos de combate",
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "20/1d6",
      "peso": "Pesada",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma placa larga de metal ligeiramente abaulada, com rebites grossos e borda reforçada. Duas correias escuras acompanham a empunhadura interna.",
    "habilidade": "",
    "nova": true
  },
  {
    "nome": "Ácido",
    "categoria": "Alquímico",
    "categoriaLivro": "Alquímicos e consumíveis ofensivos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "2d4",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "20/1d4",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Um frasco espesso de vidro esverdeado, fechado por rolha e lacre. O líquido translúcido deixa manchas opacas nas paredes internas.",
    "habilidade": " Efeito: dano de Ácido.",
    "nova": true
  },
  {
    "nome": "Água Benta",
    "categoria": "Alquímico",
    "categoriaLivro": "Alquímicos e consumíveis ofensivos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "2d6",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "20/1d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma ampola de vidro claro com água límpida, gargalo envolto por fio prateado e um pequeno símbolo sagrado no lacre.",
    "habilidade": " Efeito: Sagrado/especial. Causa +2d6 de dano em monstros mortos-vivos.",
    "nova": true
  },
  {
    "nome": "Fogo Alquímico",
    "categoria": "Alquímico",
    "categoriaLivro": "Alquímicos e consumíveis ofensivos",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d6",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "20/1d6",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Um frasco de cerâmica com gargalo estreito e lacre de cera vermelha. Um líquido âmbar e viscoso aparece pela pequena abertura de vidro lateral.",
    "habilidade": " Efeito: dano de Fogo.",
    "nova": true
  },
  {
    "nome": "Bolsa de Cola",
    "categoria": "Contenção",
    "categoriaLivro": "Itens de contenção",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "—",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "—",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma bolsa de couro encerado, de costuras grossas e fecho apertado. Resíduos pegajosos e amarelados marcam suas bordas.",
    "habilidade": " Item de contenção. A consequência mecânica da cola não foi definida.",
    "nova": true
  },
  {
    "nome": "Rede",
    "categoria": "Contenção",
    "categoriaLivro": "Itens de contenção",
    "dadosLivro": {
      "modo": "Ld",
      "dano": "—",
      "tipo": "Impacto",
      "alcance": "3m",
      "critico": "—",
      "peso": "Leve",
      "uso": "1 Mão"
    },
    "descricaoVisual": "Uma malha larga de corda resistente, com pequenos pesos de metal distribuídos pela borda e um cordão mais grosso no contorno.",
    "habilidade": " Item de contenção. O efeito de imobilização/contenção não foi definido.",
    "nova": true
  }
];
const ARMAS_MAGICAS = [
  {
    "nome": "Maracutaya",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Lendário",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "18+ / 1d",
      "peso": "2,8 kg (Média)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma arma de uma mão conhecida como Maracutaya, envolta por uma distorção sutil do ambiente.",
    "habilidade": "Ativa (Inverter o mundo): Recarga: descanso curto. Ação padrão. Até 2 alvos no seu campo de visão fazem salvaguarda de Sabedoria CD 17. Quem falhar, por 2 turnos, tem desvantagem em ataques que exijam teste e em testes de Percepção e Reflexo, deslocamento reduzido à metade e não pode fazer ataques de oportunidade. Sempre que tentar atacar uma criatura hostil, rola 1d4: com 1, acerta um aliado próximo por engano. O alvo refaz a salvaguarda no início de cada turno dele; você pode encerrar o efeito quando quiser."
  },
  {
    "nome": "Cubo mágico",
    "categoria": "Arma mágica",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Acategóricas",
    "raridade": "Épico",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "17+ / 2d",
      "peso": "0,3 kg",
      "uso": "1 mão"
    },
    "descricaoVisual": "Um pequeno cubo mágico cujas faces revelam efeitos de cores diferentes.",
    "habilidade": "Passiva (Lançar o cubo): Recarga: descanso curto. 3 cargas. Ação padrão. Cada lançamento gasta 1 carga e gera um efeito aleatório pela face virada para cima (role 1d6). Depois dos 3 lançamentos, resolver o cubo exige 1 ação completa e só pode ser feito fora de combate. 1 Vermelho: explosão em 1,5m de raio, 2d8 de dano trovejante (Reflexos CD 15 para metade). 2 Azul: o alvo acertado faz Constituição CD 15. Falha: fica Imóvel por 1 turno (congelado) e sofre 2d6 de dano congelante. Sucesso: só o dano. 3 Amarelo: raios caem em 3m ao redor do cubo, 3d4 de dano elétrico (Reflexos CD 15 para metade). 4 Roxo: o cubo vira uma esfera de energia e voa contra o alvo (teste de ataque), causando 3d6 de dano psíquico. 5 Preto: alvos em 3m fazem Reflexos CD 15. Falha: flutuam 3m e ficam Desprevenidos e Imóveis até o início do próximo turno deles. Sucesso: nada acontece. 6 Branco: o alvo troca de lugar com um alvo aleatório em até 6m ao redor do cubo."
  },
  {
    "nome": "Marreta gravitacional",
    "categoria": "Martelo",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Martelos",
    "raridade": "Épico",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19+ / 2d",
      "peso": "10 kg (Pesado)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Uma marreta pesada concentra um núcleo de força gravitacional.",
    "habilidade": "Ativa: Recarga: descanso curto. 1 uso. Ação livre ao acertar um golpe ou bater a marreta no chão. Todos num raio de 3m do ponto de impacto fazem Vigor CD 16. Falha: são puxados até o centro, ficam Caídos e sofrem 2d6 de dano psíquico. Sucesso: ficam onde estão e sofrem 1d6 de dano psíquico pela pressão."
  },
  {
    "nome": "Lua de sangue",
    "categoria": "Foice",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Foices",
    "raridade": "Lendário",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d6 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 2d",
      "peso": "5,4 kg (Média)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Uma foice de lâmina curva, marcada por uma lua rubra que se intensifica com o sangue.",
    "habilidade": "Passiva: Para cada inimigo derrotado no mesmo combate, acumula 1 ponto de lua cheia (máximo 3). Para cada ponto: +2 no dano total da arma, +0,5m de alcance e o dano passa a ser Sangramento. Ativa (Modo Lua Cheia): 1 vez por combate. Ao atingir 3 pontos, entra no Modo Lua Cheia por 3 turnos: ganha +1 ataque adicional por turno com ação bônus, que causa apenas os dados da arma; seus críticos causam Sangramento (1d6 por 2 turnos); e você recupera 1d4 PV sempre que causar dano crítico."
  },
  {
    "nome": "Martelo relâmpago",
    "categoria": "Martelo",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Martelos",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + For",
      "tipo": "Impacto + Eletrizante",
      "alcance": "1,5m",
      "critico": "19+ / 2d",
      "peso": "7 kg (Pesado)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Um martelo pesado percorre-se de descargas elétricas ao golpear.",
    "habilidade": "Ativa: Recarga: descanso curto. Ação livre ao acertar um inimigo ou bater o martelo no chão. Um raio celestial se espalha em 3m ao redor do ponto de impacto. Inimigos na área fazem Destreza CD 14. Falha: 2d6 de dano eletrizante, perdem a reação e têm deslocamento reduzido à metade até o fim do próximo turno. Sucesso: metade do dano e nenhum efeito. Durante uma tempestade real ou mágica, a área sobe para 4,5m e o dano para 3d6."
  },
  {
    "nome": "Lâmina eco",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Super raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma lâmina que vibra e deixa ondas de eco no ar.",
    "habilidade": "Passiva (Onda de eco): Recarga: descanso curto. 3 cargas. Ao acertar um ataque corpo a corpo, gaste 1 carga para liberar uma onda cortante em linha reta de até 9m, que atravessa inimigos, paredes e objetos leves. Inimigos na linha fazem Destreza CD 15. Falha: 2d6 de dano sônico e Surdez por 1 turno. Sucesso: metade do dano. Ativa (Ressonância): Recarga: descanso longo. Ação padrão. Concentra a ressonância por 1 turno e dispara uma onda em cone de 9m. Inimigos na área fazem Constituição CD 16. Falha: 4d6 de dano sônico e perdem a reação até o próximo turno. Sucesso: metade do dano."
  },
  {
    "nome": "Kensorazu",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Épico",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + For",
      "tipo": "Corte + Arcano",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2,5 kg (Média)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma espada arcana que rebate magias de alvo único contra seus conjuradores.",
    "habilidade": "Passiva (Defletor): Recarga: descanso longo. 2 cargas. Reação. Quando for alvo de uma magia de alvo único, gaste 1 carga e faça um teste de Reflexos contra a CD da magia. Sucesso: a magia é refletida de volta ao conjurador, com os mesmos valores. Fracasso: a magia ainda acerta, mas o efeito é reduzido pela metade."
  },
  {
    "nome": "Leve picadinha",
    "categoria": "Adaga",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Adagas",
    "raridade": "Épico",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d4 + Des",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "0,5 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma agulha-seringa encantada, preparada para curar aliados ou injetar toxinas.",
    "habilidade": "Passiva (Seringa): Recarga: descanso médio. 3 cargas. Ao acertar um aliado ou a si mesmo, gaste 1 carga para injetar uma mistura química avançada: cura 3d4 + Sabedoria e remove uma condição debilitante (Envenenado, Paralisado, Cego ou Sangramento). Ao acertar um inimigo, gaste 1 carga para injetar uma toxina: Constituição CD 15. Falha: não pode usar reações nem ações bônus por 1 turno. Sucesso: desvantagem em testes de Constituição por 1 turno. Ativa (Última dose): Recarga: descanso longo. Ação completa. Apenas 1 uso por batalha. Levanta um aliado a 0 PV com 1d8 + Sabedoria PV, remove todas as condições negativas dele e dá +2 em todos os testes por 1 turno. Não funciona em quem já morreu."
  },
  {
    "nome": "Katana Espiral",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Épico",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma katana cuja lâmina espiralada conduz o sangue dos alvos.",
    "habilidade": "Passiva: Cada vez que causar dano a uma criatura viva, o alvo sofre Sangramento (1d6 por 3 turnos) e você extrai uma porção do sangue dela. Enquanto um alvo sangra, 1 vez por turno, com uma ação bônus, escolha: lançar o sangue até 6m em outro inimigo (1d8 de dano perfurante mágico, sem ataque; Destreza CD 15 para evitar) ou prender o alvo (Força CD 15, ou fica Imóvel até o início do seu próximo turno). Ativa: Recarga: descanso longo. Com um giro da lâmina, todo o sangue derramado nos últimos 3 turnos numa área de 9m se levanta e envolve até 3 inimigos à sua escolha. Eles fazem Constituição CD 16. Falha: 4d8 de dano perfurante interno e ficam Imóveis por 1 turno. Sucesso: metade do dano e deslocamento reduzido à metade."
  },
  {
    "nome": "Lâmina do horizonte negro",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Relíquia",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d8 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "18+ / 2d",
      "peso": "2,4 kg (Média)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma lâmina escura libera cortes de energia e sussurros arcanos.",
    "habilidade": "Passiva: Você pode usar Vigor em vez de Força nos ataques e no dano com esta arma. Sempre que causar dano com ela, causa dano adicional igual à metade do seu nível (máximo +5). Ativa 1 (Corte Mágico): Recarga: descanso longo. 3 cargas. Ação padrão. Libera uma onda de energia em linha reta de 12m por 1,5m de largura. Os alvos na linha fazem Destreza CD 18. Falha: 5d8 de dano cortante. Sucesso: metade do dano. Ativa 2 (Sussurros): Recarga: descanso longo. Ação bônus. Só pode ser usada depois de gastar as 3 cargas do Corte Mágico. Duração: 3 turnos. Recupera 2 cargas do Corte Mágico, ganha +2 no acerto e no dano, +3m de deslocamento e não provoca ataques de oportunidade. Uma vez por turno, pode usar o Corte Mágico com ação bônus. Ao final da duração, mesmo que não esteja empunhando a espada, sofre 2d10 de dano psíquico (ignora resistências) e fica Exausto."
  },
  {
    "nome": "Lâmina tempestade congelada",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Super raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d10 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma lâmina congelada envolta por uma tempestade de gelo.",
    "habilidade": "Passiva: 1 vez por turno, ao acertar um inimigo, ele faz Constituição CD 15 ou tem o deslocamento reduzido à metade por 2 turnos. Se o deslocamento dele já estiver reduzido, falhar no teste o deixa Imóvel por 1 turno. Ativa (Dragão de gelo): Recarga: descanso longo. Libera um dragão de gelo em linha reta de 18m por 1,5m. Alvos na linha fazem Destreza CD 16. Falha: 5d8 de dano congelante e ficam Imóveis por 1 turno. Sucesso: metade do dano."
  },
  {
    "nome": "Lâmina Fragmentada",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "1,5 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma espada que se fragmenta em pétalas cortantes quando atinge o alvo.",
    "habilidade": "Passiva: Ao acertar um ataque, a lâmina se fragmenta em pétalas cortantes. Role 1d4: esse número de pétalas atinge inimigos a até 6m (podem ser alvos diferentes), cada uma causando 1d4 de dano cortante, sem teste de ataque e sem aplicar efeitos de acerto. Ativa (Milhares de pétalas): Recarga: descanso longo. Ao soltar a espada, ela flutua por 2 turnos e libera milhares de pétalas. No início de cada turno do portador, todos os inimigos em 6m fazem Destreza CD 15. Falha: 3d6 de dano cortante. Sucesso: metade do dano."
  },
  {
    "nome": "Espada rosa sangrenta",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2 kg (Média)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma espada de tom rosado conjura uma lâmina de energia ou uma barreira vermelha.",
    "habilidade": "Passiva: A cada 3 turnos, escolha um efeito. Lâmina vermelha: solta uma lâmina de energia a até 12m, causando 2d8 de dano cortante (Destreza CD 14 para metade). Barreira vermelha: cria uma barreira sobre você ou um aliado a até 6m, que absorve até 20 + seu nível de dano e dura 3 turnos ou até quebrar."
  },
  {
    "nome": "Agulha da vingança",
    "categoria": "Adaga",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Adagas",
    "raridade": "Super raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + Des",
      "tipo": "Perfurante",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "1,3 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma agulha fina e veloz que recompensa ataques repetidos contra o mesmo alvo.",
    "habilidade": "Passiva: Se acertar a mesma criatura duas vezes (em turnos seguidos ou no mesmo turno) ou acertar um contra-ataque, esse ataque dobra os dados de dano da arma (bônus fixos não dobram), 1 vez por turno. A contagem reinicia se errar ou atacar outro alvo. Enquanto estiver empunhando apenas esta arma, você tem vantagem em testes de Furtividade e +2 em Iniciativa."
  },
  {
    "nome": "Dupla sombra divina",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Épico",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + Sab",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2 kg cada (Leve)",
      "uso": "1 mão cada"
    },
    "descricaoVisual": "Duas lâminas complementares, uma longa e outra curta, ligadas por um tema de sombra divina.",
    "habilidade": "Duas armas: espada (1d8 + Sab) e espada curta (1d6 + Sab). Descrição: duas lâminas que, em conjunto, se dão muito bem; exigem grande autoconhecimento. Passiva 1: Ao atingir com um ataque, pode gastar 1 PE para causar +1d6 de dano necrótico (máximo 1 vez por turno). Passiva 2: Enquanto empunhar as duas lâminas, pode realizar um ataque adicional com a outra lâmina como parte da mesma ação de ataque, sem precisar do talento Empunhadura Dupla. Passiva 3: Recarga: descanso longo. Ao cair a 0 PV, mantém-se de pé com 1 PV e recebe +2 de CA até o fim do próximo turno."
  },
  {
    "nome": "GomuTengo",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + Des",
      "tipo": "Perfurante + Corte",
      "alcance": "4,5m",
      "critico": "19+ / 1d",
      "peso": "2 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma lâmina que se estende num piscar de olhos para atacar de longe.",
    "habilidade": "Passiva: A lâmina se estende num piscar de olhos. Seus ataques corpo a corpo com ela alcançam até 4,5m. Além disso, o inimigo sofre -1 na CD das reações para esquivar ou se defender de ataques dessa arma, pois a velocidade do golpe é difícil de acompanhar."
  },
  {
    "nome": "Lâmina flamejante",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Tesouro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d10 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 2d",
      "peso": "5 kg (Média)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Uma espada envolta em chamas místicas que se acumulam a cada golpe.",
    "habilidade": "Passiva: A cada golpe bem-sucedido, o alvo sofre 1d6 de dano de fogo no início de cada turno dele durante 2 turnos (acumulativo até 3 vezes). Maldição (Explosão solar): Se a arma for selada ou tirada do portador enquanto ele estiver vivo, explode numa tempestade solar, causando 6d8 de dano de fogo num raio de 9m (Destreza CD 18 para metade)."
  },
  {
    "nome": "Garras do Rei Pantera",
    "categoria": "Adaga",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Adagas",
    "raridade": "Épico",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "18+ / 1d",
      "peso": "1,5 kg (Leve)",
      "uso": "1 mão cada"
    },
    "descricaoVisual": "Um par de adagas em forma de garras, feito para perseguir inimigos feridos.",
    "habilidade": "Passiva: Estando com as duas adagas empunhadas, ao atacar um inimigo ferido (abaixo da vida máxima), causa +1d8 de dano adicional, 1 vez por turno. Se o inimigo for abatido, recupera 5 PV. Ao acertar um ataque corpo a corpo, 1 vez por turno, pode se mover até 3m sem provocar ataques de oportunidade. Se estiver com menos da metade da própria vida, o movimento sobe para 4,5m e o dano adicional contra feridos passa para +2d6."
  },
  {
    "nome": "Círculos ecoantes",
    "categoria": "Disco",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Discos",
    "raridade": "Super raro",
    "magica": true,
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d8 + Int",
      "tipo": "Arcano",
      "alcance": "12m",
      "critico": "19+ / 1d",
      "peso": "1 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Discos arcanos ricocheteiam entre alvos e deixam círculos de energia no ar.",
    "habilidade": "Passiva: Ao atingir um inimigo com esta arma, 1 vez por turno, o disco ricocheteia para até 2 alvos adicionais num raio de 6m, causando metade do dano inicial em cada um. Se só houver um alvo, o disco volta e atinge o mesmo inimigo de novo, causando metade do dano. Ativa: Recarga: descanso longo. Arremessa os discos, que se multiplicam em espiral. Todos os inimigos num cone de 9m fazem Destreza CD 15. Falha: 4d8 de dano arcano. Sucesso: metade do dano."
  },
  {
    "nome": "Punhos Extremos",
    "categoria": "Manopla",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Manoplas",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "Variável",
      "dano": "1d8 + For",
      "tipo": "Impacto (manopla) e Arcano (projétil)",
      "alcance": "1,5m (manopla) e 12m (projétil)",
      "critico": "19+ / 1d",
      "peso": "2 kg (Média)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Manoplas que disparam projéteis mágicos depois de um golpe corpo a corpo.",
    "habilidade": "Passiva: Após fazer um ataque corpo a corpo com a manopla, pode disparar um projétil mágico como ação bônus (1d8 + Des, sem custo de munição). Se causar dano com os dois ataques no mesmo turno, o inimigo fica Desprevenido (-2 CA) até o início do seu próximo turno."
  },
  {
    "nome": "Arcada Tempestuosa",
    "categoria": "Arco",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Arcos",
    "raridade": "Lendário",
    "magica": true,
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d12 + For",
      "tipo": "Perfurante",
      "alcance": "18m",
      "critico": "19+ / 2d",
      "peso": "2,3 kg (Média)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Um arco que convoca uma nuvem de flechas elétricas sobre o alvo.",
    "habilidade": "Passiva (Chuva de flechas): 3 cargas; recarrega 1 carga por hora. Ao acertar uma flecha no alvo, gaste 1 carga para formar uma nuvem acima dele e fazer chover flechas elétricas num raio de 4,5m do ponto de impacto. Os alvos fazem Destreza CD 17. Falha: 3d6 de dano elétrico mais 3d6 de dano perfurante. Sucesso: metade do dano."
  },
  {
    "nome": "Corta planar",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Super raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d6 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "18+ / 1d",
      "peso": "7 kg (Pesado)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Uma espada capaz de atingir criaturas em planos sobrepostos ao material.",
    "habilidade": "Passiva: A Corta Planar permite atingir criaturas em qualquer plano sobreposto ao plano material (Plano das Sombras, planos espirituais, criaturas parcialmente banidas ou incorpóreas). Defesas ligadas ao plano, como resistência, imunidade, camuflagem ou intangibilidade por existirem em outro plano, não protegem contra esta arma. Além disso, causa +2d6 de dano cortante a criaturas extraplanares (como demônios, anjos, espectros ou viajantes dimensionais)."
  },
  {
    "nome": "Luva de almas",
    "categoria": "Manopla",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Manoplas",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Impacto",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "1,5 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma luva espiritual que rompe proteções físicas e mágicas.",
    "habilidade": "Passiva: A Luva de Almas ignora o RD físico de criaturas cuja essência esteja ligada ao espiritual, extraplanar ou mágico (como mortos-vivos, elementais, aberrações, construtos e espectros). Sempre que acerta uma criatura com resistência mágica ou física, ela sofre -1 de CA contra ataques físicos do portador até o fim do próximo turno dele (cumulativo, máximo -3)."
  },
  {
    "nome": "Faca Real",
    "categoria": "Adaga",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Adagas",
    "raridade": "Relíquia",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d6 + Des",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 2d",
      "peso": "1,5 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma faca que acumula determinação com os ferimentos do portador.",
    "habilidade": "Passiva: Quando o portador perde PV por uma fonte externa, acumula 1 carga de Determinação (máximo 5 e só 1 carga por rodada). Para cada carga, os ataques com a Faca Real causam +1d4 de dano psíquico. As cargas desaparecem 1 minuto depois do combate. Ativa (Determinado): Recarga: 1 vez por combate. Ao atingir 5 cargas, entra em estado Determinado por 3 turnos: ataques ignoram o RD do alvo, reflexos se apuram (+3 em esquivas), ataques passam de corte para psíquico e o crítico da arma sobe para 3d. Com uma ação bônus, 1 vez por turno, faz um corte flutuante em até 3 alvos a até 9m: cada um sofre 2d6 de dano psíquico (Destreza CD 16 para metade)."
  },
  {
    "nome": "Abocanhador",
    "categoria": "Machado",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Machados",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d12 + For",
      "tipo": "Corte + Perfurante",
      "alcance": "1,5m",
      "critico": "19+ / 2d",
      "peso": "7 kg (Pesado)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Um machado vivo que morde alvos feridos e se alimenta dos inimigos derrotados.",
    "habilidade": "Passiva: 1 vez por turno, ao acertar um inimigo, causa +1d4 de dano perfurante, como se mordesse o alvo. Se o inimigo estiver com menos da metade da vida máxima, o dano extra sobe para +1d6 e o machado o prende por um instante, reduzindo o deslocamento dele à metade até o próximo turno. Para cada inimigo derrotado, concede ao portador 5 PV temporários (máximo 15 por combate)."
  },
  {
    "nome": "Balanceador",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2 kg (Média)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma espada que equaliza atributos e resistências entre seu portador e o alvo.",
    "habilidade": "Passiva: Ao atingir um inimigo, 1 vez a cada 2 turnos, o alvo faz Vigor CD 15. Falha: o Balanceador equaliza os atributos entre você e o alvo até o fim do próximo turno dele. Ambos usam o menor modificador entre os dois para ataques e testes de resistência, e ambos sofrem dano como se tivessem a menor resistência entre vocês (se um tem resistência e o outro não, os dois ficam sem). Não afeta criaturas inorgânicas ou sem mente."
  },
  {
    "nome": "Sangue Maksu",
    "categoria": "Arco",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Arcos",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "Ld",
      "dano": "1d10 + Des",
      "tipo": "Perfurante",
      "alcance": "12m",
      "critico": "19+ / 1d",
      "peso": "1,5 kg (Leve)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Um arco cujos projéteis se ligam ao sangue e às feridas do alvo.",
    "habilidade": "Passiva: Para cada 25% da vida máxima perdida pelo inimigo, causa +1d4 de dano adicional (máximo +3d4). Se o inimigo estiver sangrando, o dano adicional ignora resistências. Além disso, 1 vez por combate, se você estiver com menos de 25% da sua vida máxima, o arco dispara duas flechas com um só ataque."
  },
  {
    "nome": "Espada do céu invertido",
    "categoria": "Espada",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Espadas",
    "raridade": "Super raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "2d4 + For",
      "tipo": "Corte",
      "alcance": "1,5m",
      "critico": "18+ / 1d",
      "peso": "1 kg (Leve)",
      "uso": "1 mão"
    },
    "descricaoVisual": "Uma espada que enfraquece progressivamente a defesa dos inimigos.",
    "habilidade": "Passiva: Sempre que o total dos dados de dano de um acerto for 7 ou mais, o inimigo perde 1 de CA. O efeito é cumulativo, até -5 de CA, e dura até o fim do combate."
  },
  {
    "nome": "Bastão Triplo",
    "categoria": "Bastão",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Bastões",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "CaC",
      "dano": "1d8 + 1d6 + For",
      "tipo": "Impacto + Psíquico",
      "alcance": "1,5m",
      "critico": "19+ / 1d",
      "peso": "2,5 kg (Média)",
      "uso": "2 mãos"
    },
    "descricaoVisual": "Um bastão que atinge simultaneamente corpo, mente e instinto.",
    "habilidade": "Passiva: Cada ataque bem-sucedido acerta em três pontos simultâneos: corpo, mente e instinto. O dano psíquico não é reduzido por resistência física. Se o inimigo estiver Atordoado, Amedrontado ou Apavorado, o dano psíquico é dobrado."
  },
  {
    "nome": "Livro Parceiro",
    "categoria": "Arma mágica",
    "categoriaLivro": "Armas mágicas",
    "categoriaProficiencia": "Acategóricas",
    "raridade": "Raro",
    "magica": true,
    "dadosLivro": {
      "modo": "Ld",
      "dano": "—",
      "tipo": "Mágico",
      "alcance": "—",
      "critico": "—",
      "peso": "1 kg (Leve)",
      "uso": "Flutua ao lado do portador"
    },
    "descricaoVisual": "Um livro mágico que flutua ao lado do portador e auxilia na conjuração.",
    "habilidade": "Passiva: O livro flutua ao lado do usuário, permitindo conjurar magias com uma das mãos livres ou sem precisar segurá-lo diretamente. Depois do 3º turno de um combate, a próxima magia que causar dano ganha +1d6 de dano mágico do mesmo tipo (1 vez por combate)."
  }
];
ARMAS.push(...ARMAS_MAGICAS);
ARMAS.forEach(arma => {
  const d = arma.dadosLivro;
  arma.tipo = arma.categoria + ' — ' + d.modo;
  arma.dano = d.dano + ' · ' + d.tipo;
  arma.desc = 'Alcance ' + d.alcance + ' · Crítico ' + d.critico + ' · ' + d.peso + ' · ' + d.uso + (arma.raridade ? ' · Mágica · ' + arma.raridade : '');
});

function analisarDanoArma(formula) {
  const dados = [...formula.matchAll(/(\d+)d(\d+)/gi)].flatMap(([, quantidade, lados]) => Array(Number(quantidade)).fill(Number(lados)));
  const atributos = [...formula.matchAll(/\+\s*(For|Des|Int|Sab|Vig)\b/gi)].map(([, atributo]) => ({
    For: 'Força',
    Des: 'Destreza',
    Int: 'Inteligência',
    Sab: 'Sabedoria',
    Vig: 'Vigor'
  })[atributo]);
  const fixo = dados.length ? 0 : Number(formula.match(/^\s*(\d+)/)?.[1] || 0);
  return { dados, atributos, fixo };
}

// ===== ARMADURAS =====
const ARMADURAS = [
  { nome: 'Armadura de Couro',       tipo: 'Armadura — Leve',   dano: 'CA +2', desc: 'Leve e silenciosa. Oferece proteção básica sem comprometer a mobilidade.' },
  { nome: 'Cota de Malha',           tipo: 'Armadura — Média',  dano: 'CA +4', desc: 'Anéis de metal entrelaçados. Boa proteção contra cortes com peso moderado.' },
  { nome: 'Armadura de Placas',      tipo: 'Armadura — Pesada', dano: 'CA +4', desc: 'Proteção máxima em campo de batalha. Pesada, mas quase impenetrável a ataques físicos.' },
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
// Imagens opcionais: acrescente imagem: 'assets/images/acessorios/arquivo.webp' ao item.
function categoriaAcessorio(item) {
  const tipo = (item.tipo || '').split(' — ').pop().trim();
  return ({Anel:'Anéis','Dedo falso':'Dedos falsos',Colar:'Colares',Amuleto:'Amuletos',Capa:'Capas',Manto:'Mantos',Coroa:'Coroas',Tiara:'Tiaras','Monóculo':'Monóculos',Bolsa:'Bolsas','Bússola':'Bússolas',Bracelete:'Braceletes','Laço':'Laços'})[tipo] || tipo;
}

const ACESSORIOS = [
  { nome: 'Botas Aladas',             tipo: 'Acessório — Botas',     raridade: 'Raro',    recarga: '—', carga: null, acao: 'Passiva', desc: 'Uma bota leve de couro com asas curtas nas laterais. Ao usá-la, seu deslocamento e sua distância de salto ganham +3m.' },
  { nome: 'Corredores ao Vento',      tipo: 'Acessório — Botas',     raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Reação', desc: 'Botas de couro escuro com detalhes prateados. Permitem um segundo salto no ar impulsionado por vento invisível. Útil para evitar quedas, atravessar vãos ou alterar trajetória.' },
  { nome: 'Passos Fantasma',          tipo: 'Acessório — Sapatilhas', raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Sapatilhas etéreas de tecido acinzentado. Concedem +5 em furtividade, eliminam sons ao se deslocar e permitem ignorar terreno difícil.' },
  { nome: 'Laço da Verdade',          tipo: 'Acessório — Laço',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Ação',    desc: 'Laço dourado leve como seda e firme como aço. Lançado sobre criatura a até 6m: se agarrada, fica compelida a dizer apenas verdades até o fim do próximo turno.' },
  { nome: 'Lente do Caminho',         tipo: 'Acessório — Monóculo',   raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Monóculo de cobre com lente azulada. Por 1 minuto revela trilhas ocultas, rastros mágicos e portas secretas a até 9m, mesmo magicamente ocultas.' },
  { nome: 'Óculos da Verdade',        tipo: 'Acessório — Óculos',     raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Óculos de lentes translúcidas. Por 1 minuto permitem ver através de ilusões, disfarces e perceber criaturas invisíveis no campo de visão.' },
  { nome: 'Coroa de Gêneros',         tipo: 'Acessório — Coroa',      raridade: 'Comum',   recarga: '—', carga: null, acao: 'Livre', desc: 'Troca o gênero do usuário no momento que desejar, ganhando +2 em Enganação, Atuação e Lábia enquanto ativa. Fica ativa por 1 hora, não pode ser desfeita antes disso e adapta sua roupa, mantendo seu símbolo.' },
  { nome: 'Tiara do Conhecimento',    tipo: 'Acessório — Tiara',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus', desc: 'Uma tiara prateada com um cristal violeta. Por 1 minuto, ganha vantagem em História, Arcanismo, Natureza e Investigação e entende idiomas escritos desconhecidos como se estivesse lendo em sua língua nativa.' },
  { nome: 'Capa Invisível',           tipo: 'Acessório — Capa',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Uma capa longa de tecido cinza opaco. Torna o usuário invisível por 1 minuto ou até realizar uma ação hostil. Enquanto invisível, não provoca ataques de oportunidade e ignora sensores visuais comuns.' },
  { nome: 'Luvas de Escalada',        tipo: 'Acessório — Luvas',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Luvas de couro com runas nas palmas. Por 1 minuto permitem escalar qualquer superfície, mesmo lisa ou vertical, sem testes e sem usar os pés.' },
  { nome: 'Anel de Coelho',           tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Reação',  desc: 'Anel de prata com entalhe de coelho. Dobra distância de salto ou permite mover até 3m como reação ao ser alvo de ataque ou armadilha.' },
  { nome: 'Anel de Adrenalina',       tipo: 'Acessório — Anel',       raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Enquanto estiver usando este anel, a constância primária de Destreza aumenta em +1.' },
  { nome: 'Anel de Ave',              tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Anel de ouro com pena gravada. Ao ativar, transforma o usuário em um pássaro de rank 0 que já conheça ou tenha visto.' },
  { nome: 'Colar de Aura Tortuosa',   tipo: 'Acessório — Colar',      raridade: 'Raro', recarga: 'Descanso longo',  carga: 1, acao: 'Bônus',   desc: 'Um pingente em espiral prateada pulsa com energia sombria. Por 3 turnos, em raio de 6m, inimigos fazem Vontade CD 15: falhando ficam Apavorados por 1 turno e refazem o teste no início do turno; passando ficam Amedrontados até o fim do próximo turno. 1 vez por turno, força um ataque corpo a corpo contra você a ser repetido. +5 em Intimidação.' },
  { nome: 'Anel de Esqueleto',        tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Anel de ferro com crânio esculpido. Invoca mão esquelética translúcida por 1 minuto: pega objetos a até 3m e concede vantagem em um teste de Intimidação ou Persuasão.' },
  { nome: 'Anel de Invocar Familiar', tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso longo+', carga: 3, acao: 'Ação',    desc: 'Anel de bronze com símbolos de animais. Invoca familiar animal por 10 minutos. Auxilia em tarefas simples, envia mensagens e fornece bônus em vigilância.' },
  { nome: 'Olho do Além',             tipo: 'Acessório — Amuleto',    raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Amuleto com olho em pedra negra. Por 1 minuto permite enxergar espíritos e criaturas incórporas a até 9m, percebendo suas intenções básicas.' },
  { nome: 'Visão Extra-Planar',       tipo: 'Acessório — Amuleto',    raridade: 'Raro',    recarga: 'Descanso longo+', carga: 3, acao: 'Bônus',   desc: 'Amuleto de cristal translúcido. Por 1 minuto revela criaturas, objetos e portais em planos paralelos a até 12m. Facilita distinguir ilusões.' },
  { nome: 'Óculos da Segunda Vida',   tipo: 'Acessório — Óculos',     raridade: 'Raro',    recarga: 'Descanso longo+', carga: 1, acao: 'Reação',  desc: 'Óculos dourados que brilham à beira da morte. Ao cair a 0 PV, restaura automaticamente 1d10 + Modificador de Vontade em PV.' },
  { nome: 'Dados Coincidentes',       tipo: 'Acessório — Dados',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Par de dados de marfim envelhecido com símbolos arcanos em vez de números.' },
  { nome: 'Bússola Eterna',           tipo: 'Acessório — Bússola',    raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Bússola de bronze antigo. Aponta para o local que o usuário mais deseja encontrar no momento, desde que no mesmo plano e a poucos quilômetros.' },
  { nome: 'Bolsa Espacial',           tipo: 'Acessório — Bolsa',      raridade: 'Incomum', recarga: '',               carga: null, acao: 'Livre',  desc: 'Bolsa extradimensional que armazena até 100 kg ou 1 m³ sem alterar o próprio peso (cerca de 2 kg). Retirar um objeto conhecido é uma ação livre.' },
  { nome: 'Membrana Pendente',        tipo: 'Acessório — Bracelete',  raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Um bracelete de ombro com fios metálicos e uma película viva. Restaura 2d6 PV e remove uma condição menor, como sangramento, envenenamento leve ou entorpecimento.' },
  { nome: 'Troca-Troca',              tipo: 'Acessório — Anéis',      raridade: 'Raro',    recarga: 'Descanso longo+', carga: 1, acao: 'Ação',    desc: 'Par de anéis que troca as mentes de duas criaturas conscientes que os estejam usando por até 10 minutos. Ao fim, cada mente retorna ao corpo original.' },
  { nome: 'Dedo Falso de Confete',    tipo: 'Acessório — Dedo falso', raridade: 'Incomum', recarga: 'Descanso curto+', carga: 2, acao: 'Bônus',   desc: 'Dispara confetes e luz ofuscante em um cone de 3m. Criaturas na área fazem teste de Reflexos; quem falhar fica cego até o fim do próximo turno.' },
  { nome: 'Colar Calmante',           tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: 'Descanso curto+', carga: null, acao: 'Passiva', desc: 'Quando entra em estado Morrendo, concede vantagem em uma salvaguarda de Constituição à sua escolha.' },
  { nome: 'Colar de Luz',             tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: '',               carga: null, acao: 'Passiva', desc: 'Uma pedra amarela no centro do colar ilumina um raio de 6m em locais com pouca luz.' },
  { nome: 'Colar de Cura',            tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: 'Descanso médio ou + / meditar médio ou +', carga: 2, acao: 'Bônus', desc: 'Colar com uma corrente prateada e uma esmeralda em formato de gota. Cura os ferimentos do usuário em 1d12 pontos de vida.' },
  { nome: 'Cura Aprimorada',          tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: 'Descanso curto', carga: 1, acao: 'Passiva', desc: 'Usando este colar, você ganha +1d do tipo de dado da cura que estiver usando. Após aplicar esse benefício uma vez, o colar entra em descanso e precisa ser recarregado.' },
  { nome: 'Pedra da Reflexão',        tipo: 'Acessório — Colar',     raridade: 'Raro', recarga: 'Descanso médio ou + / meditar médio ou +', carga: 6, acao: 'Bônus', desc: 'Colar com uma pedra de quartzo branca que revela uma visão breve do futuro (1 segundo). No seu turno, gaste uma ação bônus e 1 carga para rolar 1d6: com 1, 2 ou 3, você tem desvantagem no próximo ataque por não conseguir processar a informação a tempo; com 4, 5 ou 6, tem vantagem no próximo ataque.' },
  { nome: 'Anel de Energia',          tipo: 'Acessório — Anel',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Um anel de prata com uma pedra azul oval. Ao ser ativado, restaura 8 PE.' },
  { nome: 'Anel de Escama Endurecida', tipo: 'Acessório — Anel', raridade: 'Raro', recarga: 'Ficar submerso embaixo da água por 1 turno', carga: 2, acao: 'Bônus ou Reação', desc: 'Um anel preto com escamas prateadas em sua superfície. Ao ser ativado, concede +2 CA até você ser acertado.' },
  { nome: 'Puxa Corte',              tipo: 'Acessório — Anel',      raridade: 'Raro',    recarga: 'Descanso longo / meditar longo', carga: 5, acao: 'Passiva', desc: 'O anel puxa para si os cortes feitos em você. Ao ser atingido por um ataque cortante, gaste 1 carga para reduzir o dano em 10 e evitar também o ferimento complementar causado pelo golpe. Possui 5 cargas.' },
  { nome: 'Anel da Caveira',         tipo: 'Acessório — Anel',      raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Um anel de osso volumoso, com uma caveira entalhada. Concede ao usuário resistência a dano necrótico, reduzindo esse dano pela metade.' },
  { nome: 'Digestor de Rochas',      tipo: 'Acessório — Anel',      raridade: 'Super raro', recarga: 'Descanso curto', carga: null, acao: 'Bônus', desc: 'Você pode consumir 1 joia, que se perde, e ganha o efeito base dela por 1 minuto, sem o efeito especial.' },
  { nome: 'Anéis Telepáticos',       tipo: 'Acessório — Anéis',     raridade: 'Raro',       recarga: '—', carga: null, acao: 'Passiva', desc: 'Um par de anéis interligados por magia. Seus portadores podem se comunicar telepaticamente a até 5 km de distância. O efeito só funciona enquanto ambos estiverem usando um anel.' },

  // Itens revisados
  { nome: 'Sede Sanguinária', tipo: 'Acessório — Relíquia', raridade: 'Relíquia', recarga: 'Custo de 20 PV por uso', carga: 1, acao: 'Bônus', desc: 'Uma gosma vermelha escorre pelos olhos e consome seu sangue. Gaste 20 PV que não podem ser reduzidos por efeito. 1 vez por combate, por 2 turnos, os dados de dano da arma são rolados em dobro; bônus fixos não dobram.' },
  { nome: 'Coração do Infinito', tipo: 'Acessório — Relíquia', raridade: 'Relíquia', recarga: 'Descanso longo', carga: 1, acao: 'Passiva', desc: 'Ao entrar em combate, revela sua essência por 4 turnos: duas ações por turno, sendo a segunda limitada a ataque ou movimento, imunidade a medo e controle mental, vantagem em salvaguardas e iniciativa, e efeitos adicionais definidos pelo mestre limitados a +2 ou 2d6.' },
  { nome: 'Orbe do Vazio Silencioso', tipo: 'Acessório — Amuleto', raridade: 'Épico', recarga: 'Descanso longo', carga: 1, acao: 'Automática', desc: 'Se cair a 0 PV, volta automaticamente com 1 PV e entra em Segunda Liberação por 2 turnos: ignora penalidades por ferimentos, seus ataques ignoram RD e ganha +6m de deslocamento. Ao final, fica Inconsciente.' },
  { nome: 'Relicário da Espada Quebrada', tipo: 'Acessório — Amuleto', raridade: 'Épico', recarga: 'Descanso longo', carga: 1, acao: 'Bônus', desc: 'Com metade ou menos dos PV, libere a lâmina selada por 2 turnos: ataques ignoram resistências e RD e não podem ser bloqueados. No primeiro turno, age antes de todos.' },
  { nome: 'Marca da Vespa Silenciosa', tipo: 'Acessório — Pingente', raridade: 'Raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Ao atingir o mesmo inimigo duas vezes seguidas sem ser percebido entre os ataques, o segundo golpe ganha +3 no acerto, ignora resistências e causa +1d6. Um ataque pelas costas por turno usa o valor máximo do dano base da arma.' },
  { nome: 'Espelho Ilusório', tipo: 'Acessório — Amuleto', raridade: 'Épico', recarga: 'Descanso longo', carga: 1, acao: 'Bônus', desc: 'Até o início do próximo turno, quem quiser atacá-lo faz Sabedoria CD 15; se falhar, escolhe outro alvo ou perde a ação. Se atacar, o efeito termina e seu primeiro ataque tem vantagem.' },
  { nome: 'Pulseira do Relâmpago Vivo', tipo: 'Acessório — Pulseira', raridade: 'Raro', recarga: 'Descanso médio+', carga: 3, acao: 'Movimento', desc: '1 vez por turno, gaste 1 carga para se teletransportar até 6m até um ponto visível sem provocar ataques de oportunidade. Seu próximo ataque no turno tem vantagem e causa +1d6 elétrico.' },
  { nome: 'Pingente do Predador Desgarrado', tipo: 'Acessório — Amuleto', raridade: 'Super raro', recarga: 'Descanso curto', carga: 1, acao: 'Passiva', desc: 'Com metade ou menos dos PV, por 2 turnos ganha 1 ação adicional por turno, limitada a ataque ou movimento.' },
  { nome: 'Amuleto da Lâmina Negra', tipo: 'Acessório — Amuleto', raridade: 'Relíquia', recarga: 'Descanso longo', carga: 1, acao: 'Passiva', desc: 'Por 2 minutos após entrar em combate, ataques corpo a corpo são corte e ignoram armaduras leves e reduzem resistência. Depois de três acertos seguidos no mesmo inimigo, golpes seguintes causam +2d6 até o fim do combate.' },
  { nome: 'Faixa da Lâmina Ensanguentada', tipo: 'Acessório — Faixa', raridade: 'Super raro', recarga: 'Descanso longo', carga: null, acao: 'Passiva', desc: 'Contra inimigo de ND maior que seu nível, golpes ignoram bônus de Armadura, não os de Escudo. Vantagem contra medo, intimidação e controle mental. Ao sofrer dano crítico, 1 vez por combate, pode revidar com ataque livre.' },
  { nome: 'Máscara Maluca', tipo: 'Acessório — Máscara', raridade: 'Épica', recarga: 'Descanso longo+', carga: 1, acao: 'Ação completa', desc: 'Por 3 turnos em combate ou 5 minutos fora dele: vantagem em testes de Carisma e Destreza, RD 3 contra todo dano e efeitos teatrais sem dano definidos pelo mestre. Maldição: após três ativações, teste de Vontade CD definida pelo mestre; em falha, a máscara substitui a personalidade.' },
  { nome: 'Espelho Vazio', tipo: 'Acessório — Espelho', raridade: 'Épico', recarga: '1 vez por dia', carga: 1, acao: 'Ação completa', desc: 'Passiva: permite entrar no reflexo e retirar alguém de lá. Uma criatura com ND maior que seu nível + Bônus de Classe é imune. Caso falhe em Inteligência CD 18, fica presa por 1 minuto e refaz o teste no início de seu turno; quebrar o espelho a solta.' },
  { nome: 'Brincos de Infusão', tipo: 'Acessório — Brincos', raridade: 'Épico', recarga: 'Descanso longo+', carga: 1, acao: 'Ação completa', desc: 'Duplas criaturas usam um brinco cada e se fundem por até 3 turnos ou até serem separadas. Mantêm os melhores atributos, compartilham habilidades, talentos, resistências e magias e somam PV. Ambas ficam Exaustas nível 2 ao final.' },
  { nome: 'Botas de Corrida', tipo: 'Acessório — Botas', raridade: 'Raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Sua distância de movimento aumenta em +4,5m.' },
  { nome: 'Gotta Go Fast!!', tipo: 'Acessório — Botas', raridade: 'Épico', recarga: 'Descanso médio+', carga: null, acao: 'Movimento', desc: 'Seu deslocamento ganha +3m. 1 vez por turno, substitua movimento por uma disparada com distância dobrada; ao atacar logo após ela, ganha +2 no ataque e causa +1d do mesmo dano da arma.' },
  { nome: 'Amplificador Estenosante', tipo: 'Acessório — Amuleto', raridade: 'Raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Aumenta em 4,5m o alcance dos sons do instrumento e faz seus ataques ofensivos causarem +2 de dano psíquico.' },
  { nome: 'Faixa Dourada', tipo: 'Acessório — Faixa', raridade: 'Super raro', recarga: 'Descanso longo', carga: null, acao: 'Passiva', desc: 'Corpo a corpo: +1 em Força e +1d4 em ataques; à distância: +1 em Destreza e +1d4 em ataques; magia: +1 na CD de Magias e pode usar um feitiço extra por descanso longo.' },
  { nome: 'Pingente da Neve Prateada', tipo: 'Acessório — Amuleto', raridade: 'Raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Ao se mover e atacar no mesmo turno, o alvo sofre -3m de deslocamento até o fim do próximo turno. Se repetir por três turnos consecutivos, faz Vigor CD 15; em falha fica congelado por 1 turno.' },
  { nome: 'Fragmento da Máscara Partida', tipo: 'Acessório — Amuleto', raridade: 'Raro', recarga: 'Descanso longo', carga: null, acao: 'Reação', desc: 'Gastando 2 PE, 1 vez por rodada, troca de lugar com um aliado a até 6m antes de dano crítico ou letal e anula metade do dano. Uma vez por descanso longo, pode gastar reação para impedir um aliado próximo de cair a 0 PV, deixando-o com 1 PV.' },
  { nome: 'Couraça Mágica', tipo: 'Acessório — Capa', raridade: 'Lendário', recarga: 'Descanso longo', carga: 1, acao: 'Ação padrão', desc: 'Por 2 turnos, danos físicos são negados e sua CA aumenta em +3. Pode desativar antes, encerrando a duração e exigindo recarga.' },
  { nome: 'Máscara da Serpente', tipo: 'Acessório — Máscara', raridade: 'Lendário', recarga: 'Descanso médio', carga: 3, acao: 'Bônus', desc: 'Copia magias de até Volume 4 vistas nos últimos 5 minutos e lança sem custo, gastando 1 carga. Vantagem em testes sociais e de manipulação; a magia copiada pode atingir um alvo secundário com efeito cômico debilitante.' },
  { nome: 'Luvas de Cirurgião', tipo: 'Acessório — Luvas', raridade: 'Raro', recarga: 'Descanso longo', carga: 3, acao: 'Ação padrão', desc: 'Ao tocar um aliado, cura 2d6 + seu bônus de Medicina e estanca sangramento. Concede +2 em Primeiros Socorros.' },
  { nome: 'Bracelete do Foco', tipo: 'Acessório — Bracelete', raridade: 'Raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'A primeira habilidade em que gastar PE a cada turno custa 1 PE a menos, mínimo 1.' },

  // Novos acessórios — primeira leva
  { nome: 'Cinto do Carregador', tipo: 'Acessório — Cinto', raridade: 'Comum', recarga: '—', carga: null, acao: 'Passiva', desc: '+4 espaços disponíveis e +10 kg no limite de carga.' },
  { nome: 'Cinto de Saques', tipo: 'Acessório — Cinto', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Livre', desc: '1 vez por turno, sacar ou guardar uma arma ou item leve é ação livre, sem ação de movimento. Concede +2 espaços disponíveis.' },
  { nome: 'Cinto de Equilíbrio', tipo: 'Acessório — Cinto', raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Reação', desc: 'Ao ser derrubado, empurrado ou puxado, ignore o efeito sem teste. Concede +2 em Acrobacia para Equilíbrio.' },
  { nome: 'Cinto de Vitualhas', tipo: 'Acessório — Cinto', raridade: 'Incomum', recarga: 'Descanso longo', carga: 1, acao: 'Bônus', desc: 'Você ou um aliado tocado come um Prato nutritivo pronto com resultado 15: +12 PV e +3 PE.' },
  { nome: 'Cinto do Revide', tipo: 'Acessório — Cinto', raridade: 'Raro', recarga: 'Descanso curto', carga: 3, acao: 'Reação', desc: 'Fivela em forma de punho. 1 carga funciona como Contra-atacar sem exigir +1 em Combate, com +1 no acerto e +1d4 de dano.' },
  { nome: 'Cinturão Vital', tipo: 'Acessório — Cinturão', raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: '+1 na Constância primária de Vigor.' },
  { nome: 'Capa de Viajante', tipo: 'Acessório — Capa', raridade: 'Comum', recarga: '—', carga: null, acao: 'Passiva', desc: 'Protege de frio e chuva comuns, concede +1 em Sobrevivência e +2 espaços disponíveis.' },
  { nome: 'Capa Camaleão', tipo: 'Acessório — Capa', raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus', desc: 'Por 1 minuto, +4 em Furtividade e vantagem para Esconder-se enquanto estiver parado.' },
  { nome: 'Capa Rebatedora', tipo: 'Acessório — Capa', raridade: 'Raro', recarga: 'Descanso longo', carga: 2, acao: 'Reação', desc: 'Ao ser atingido por ataque físico à distância, reduz o dano em 2 × seu Bônus de Classe.' },
  { nome: 'Capa Planadora', tipo: 'Acessório — Capa', raridade: 'Raro', recarga: 'Descanso curto', carga: 2, acao: 'Reação', desc: 'Ao cair, não sofre dano e pode se mover até 9m na horizontal. Não permite voar.' },
  { nome: 'Manto do Anoitecer', tipo: 'Acessório — Manto', raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Em penumbra ou escuridão, +2 de CA e +4 em Furtividade.' },
  { nome: 'Luvas Silenciosas', tipo: 'Acessório — Luvas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: '+2 em Prestidigitação. Abrir fechaduras e desarmar armadilhas não faz ruído.' },
  { nome: 'Luvas Isolantes', tipo: 'Acessório — Luvas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'RD 3 a dano queimante e eletrizante. Objetos quentes ou energizados podem ser manipulados sem ferimento.' },
  { nome: 'Luvas de Mira Firme', tipo: 'Acessório — Luvas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: '+1 em ataques à distância e arremessos; o bônus de Mirar sobe de +2 para +3.' },
  { nome: 'Luvas Reforçadas', tipo: 'Acessório — Luvas', raridade: 'Raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Ataque desarmado causa 1d6 + Força de dano de impacto e recebe +1 no acerto.' },
  { nome: 'Braçal de Parada', tipo: 'Acessório — Braçal', raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Reação', desc: 'Antes do resultado de um ataque físico contra você, ganha +2 de CA contra aquele ataque.' },
  { nome: 'Pulseira da Vigília', tipo: 'Acessório — Pulseira', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: '+2 em Iniciativa e, no primeiro turno de um combate, você não pode ficar Desprevenido.' },
  { nome: 'Botas Aderentes', tipo: 'Acessório — Botas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'Ignora terreno escorregadio sem teste e concede +2 em Equilíbrio.' },
  { nome: 'Botas Aquáticas', tipo: 'Acessório — Botas', raridade: 'Raro', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus', desc: 'Por 1 minuto, caminha sobre água e lama no deslocamento normal sem afundar.' },

  // Novos acessórios — segunda leva
  { nome: 'Cinto de Ferro', tipo: 'Acessório — Cinto', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: '+2 em testes e salvaguardas de Constituição.' },
  { nome: 'Cinto de Munições', tipo: 'Acessório — Cinto', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'Guarda até 40 munições sem espaço nem peso. 1 vez por turno, recarrega arma de fogo ou besta como ação livre.' },
  { nome: 'Cinto de Poções', tipo: 'Acessório — Cinto', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'Guarda até 6 poções sem ocupar espaço e sem risco de quebrar. 1 vez por turno, pegar uma poção não gasta ação.' },
  { nome: 'Cinto do Gigante', tipo: 'Acessório — Cinto', raridade: 'Raro', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus', desc: 'Por 1 minuto, empunha arma de duas mãos com uma mão sem penalidade e ganha +2 em Atletismo e testes de Empurrar.' },
  { nome: 'Cinto do Esquivador', tipo: 'Acessório — Cinto', raridade: 'Raro', recarga: 'Descanso curto', carga: 2, acao: 'Reação', desc: 'Ao usar Esquivar, ganha +3 no teste de Reflexos contra o ataque.' },
  { nome: 'Cinturão do Campeão', tipo: 'Acessório — Cinturão', raridade: 'Épico', recarga: 'Descanso longo', carga: 1, acao: 'Bônus', desc: 'Por 3 turnos, +3 nos testes de ataque e dano e vantagem em salvaguardas de Constituição.' },
  { nome: 'Aljava do Atirador', tipo: 'Acessório — Aljava', raridade: 'Incomum', recarga: 'Descanso curto', carga: null, acao: 'Passiva', desc: 'Guarda até 40 flechas ou virotes sem espaço nem peso. Após descanso curto, até 20 munições comuns gastas reaparecem.' },
  { nome: 'Capa de Peles', tipo: 'Acessório — Capa', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'RD 3 a dano congelante e imunidade aos efeitos de frio extremo do ambiente.' },
  { nome: 'Manto Antimagia', tipo: 'Acessório — Manto', raridade: 'Raro', recarga: 'Descanso longo', carga: 2, acao: 'Reação', desc: 'Ao ser alvo de magia ou efeito mágico, ganha +3 na salvaguarda. Sem salvaguarda, reduz dano em 2 × seu Bônus de Classe.' },
  { nome: 'Capa do Comandante', tipo: 'Acessório — Capa', raridade: 'Raro', recarga: 'Descanso longo', carga: 2, acao: 'Bônus', desc: 'Por 3 turnos, aliados a até 6m que possam vê-lo ganham +1 de CA e +1 em ataques. Não cumulativo com outra Capa do Comandante.' },
  { nome: 'Asas Etéreas', tipo: 'Acessório — Asas', raridade: 'Épico', recarga: 'Descanso longo', carga: 1, acao: 'Bônus', desc: 'Por 1 minuto, ganha deslocamento de voo de 9m, reduzido à metade acima do limite de peso. As asas se desfazem se ficar Caído.' },
  { nome: 'Manoplas de Bloqueio', tipo: 'Acessório — Manoplas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: '+2 em reações de Bloquear.' },
  { nome: 'Luvas de Aderência', tipo: 'Acessório — Luvas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: '+3 nos testes para resistir a Desarmar e +2 em Atletismo.' },
  { nome: 'Luvas do Envenenador', tipo: 'Acessório — Luvas', raridade: 'Raro', recarga: 'Descanso longo', carga: 3, acao: 'Bônus', desc: 'Passe veneno na arma ou punhos. No próximo acerto neste turno: +1d6 químico e o alvo faz Constituição CD 14; em falha fica Envenenado.' },
  { nome: 'Luvas do Conjurador', tipo: 'Acessório — Luvas', raridade: 'Raro', recarga: '—', carga: null, acao: 'Passiva', desc: '+1 na CD das suas habilidades e magias que exijam teste de resistência.' },
  { nome: 'Luvas do Sábio', tipo: 'Acessório — Luvas', raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: '+1 na Constância primária de Sabedoria.' },
  { nome: 'Bracelete Meditativo', tipo: 'Acessório — Bracelete', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'Ao meditar, recupera +6 PE adicionais, em qualquer duração.' },
  { nome: 'Bracelete Escorregadio', tipo: 'Acessório — Bracelete', raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Reação', desc: 'Ao ficar Agarrado ou Imobilizado, escapa sem teste e se move 1,5m.' },
  { nome: 'Bracelete Afiado', tipo: 'Acessório — Bracelete', raridade: 'Raro', recarga: 'Descanso curto', carga: 3, acao: 'Livre', desc: 'Ao acertar um ataque, gaste 1 carga para causar +1d6 do mesmo tipo. Só pode ser usado 1 vez por turno.' },
  { nome: 'Pulseira do Orador', tipo: 'Acessório — Pulseira', raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: '+1 na Constância primária de Carisma.' },
  { nome: 'Relógio Adiantado', tipo: 'Acessório — Relógio', raridade: 'Épico', recarga: 'Descanso longo', carga: 1, acao: 'Livre', desc: 'Neste turno, ganha 1 Ação Padrão adicional, sem conceder Ação Bônus ou Reação extras.' },
  { nome: 'Botas de Neve', tipo: 'Acessório — Botas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'Neve, lama e areia fofa não reduzem seu deslocamento e você não afunda em neve.' },
  { nome: 'Botas Saltitantes', tipo: 'Acessório — Botas', raridade: 'Incomum', recarga: '—', carga: null, acao: 'Passiva', desc: 'Ao pular, usa a distância total do deslocamento e a altura total, em vez da metade.' },
  { nome: 'Botas do Fugitivo', tipo: 'Acessório — Botas', raridade: 'Raro', recarga: 'Descanso curto', carga: 2, acao: 'Reação', desc: 'Ao ser atingido por ataque corpo a corpo, move até 3m sem provocar ataques de oportunidade.' },
  { nome: 'Botas do Salto Sombrio', tipo: 'Acessório — Botas', raridade: 'Super raro', recarga: 'Descanso médio+', carga: 3, acao: 'Movimento', desc: 'Gaste 1 carga para se teletransportar até 9m a um espaço em penumbra ou escuridão que possa ver, sem provocar ataques de oportunidade.' },
  { nome: 'Botas do Terremoto', tipo: 'Acessório — Botas', raridade: 'Épico', recarga: 'Descanso longo', carga: 1, acao: 'Ação padrão', desc: 'Todos os inimigos em 3m fazem Reflexos CD 16: em falha sofrem 4d8 de dano de impacto e ficam Caídos; em sucesso sofrem metade e não caem.' },
];
