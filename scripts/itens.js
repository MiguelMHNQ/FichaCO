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
ARMAS.forEach(arma => {
  const d = arma.dadosLivro;
  arma.tipo = arma.categoria + ' — ' + d.modo;
  arma.dano = d.dano + ' · ' + d.tipo;
  arma.desc = 'Alcance ' + d.alcance + ' · Crítico ' + d.critico + ' · ' + d.peso + ' · ' + d.uso;
});

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
  { nome: 'Botas Aladas',             tipo: 'Acessório — Botas',     raridade: 'Raro',    recarga: '—', carga: null, acao: 'Passiva', desc: 'Bota leve de couro com pequenas asas nas laterais. Enquanto usar as botas, seu deslocamento e sua distância de salto aumentam em 6m.' },
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
  { nome: 'Anel de Adrenalina',       tipo: 'Acessório — Anel',       raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Enquanto estiver usando este anel, a constância primária de Destreza aumenta em +1.' },
  { nome: 'Anel de Ave',              tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Anel de ouro com pena gravada. Ao ativar, transforma o usuário em um pássaro de rank 0 que já conheça ou tenha visto.' },
  { nome: 'Colar de Aura Tortuosa',   tipo: 'Acessório — Colar',      raridade: 'Incomum', recarga: 'Descanso longo',  carga: 1, acao: 'Bônus',   desc: 'Pingente em espiral prateada. Aura distorcida: inimigos fazem teste de Vontade CD 15 (falha = Apavorado; sucesso = Amedrontado). +5 em Intimidação.' },
  { nome: 'Anel de Esqueleto',        tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Anel de ferro com crânio esculpido. Invoca mão esquelética translúcida por 1 minuto: pega objetos a até 3m e concede vantagem em um teste de Intimidação ou Persuasão.' },
  { nome: 'Anel de Invocar Familiar', tipo: 'Acessório — Anel',       raridade: 'Incomum', recarga: 'Descanso longo+', carga: 3, acao: 'Ação',    desc: 'Anel de bronze com símbolos de animais. Invoca familiar animal por 10 minutos. Auxilia em tarefas simples, envia mensagens e fornece bônus em vigilância.' },
  { nome: 'Olho do Além',             tipo: 'Acessório — Amuleto',    raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Amuleto com olho em pedra negra. Por 1 minuto permite enxergar espíritos e criaturas incórporas a até 9m, percebendo suas intenções básicas.' },
  { nome: 'Visão Extra-Planar',       tipo: 'Acessório — Amuleto',    raridade: 'Raro',    recarga: 'Descanso longo+', carga: 3, acao: 'Bônus',   desc: 'Amuleto de cristal translúcido. Por 1 minuto revela criaturas, objetos e portais em planos paralelos a até 12m. Facilita distinguir ilusões.' },
  { nome: 'Óculos da Segunda Vida',   tipo: 'Acessório — Óculos',     raridade: 'Raro',    recarga: 'Descanso longo+', carga: 1, acao: 'Reação',  desc: 'Óculos dourados que brilham à beira da morte. Ao cair a 0 PV, restaura automaticamente 1d10 + Modificador de Vontade em PV.' },
  { nome: 'Dados Coincidentes',       tipo: 'Acessório — Dados',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Par de dados de marfim envelhecido com símbolos arcanos em vez de números.' },
  { nome: 'Bússola Eterna',           tipo: 'Acessório — Bússola',    raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Bússola de bronze antigo. Aponta para o local que o usuário mais deseja encontrar no momento, desde que no mesmo plano e a poucos quilômetros.' },
  { nome: 'Bolsa Espacial',           tipo: 'Acessório — Bolsa',      raridade: 'Incomum', recarga: '',               carga: null, acao: 'Livre',  desc: 'Bolsa extradimensional que armazena até 100 kg ou 1 m³ sem alterar o próprio peso (cerca de 2 kg). Retirar um objeto conhecido é uma ação livre.' },
  { nome: 'Membrana Pendente',        tipo: 'Acessório — Bracelete',  raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Bracelete com uma membrana mágica que restaura 18 PV e remove uma condição menor, como sangramento, envenenamento leve ou entorpecimento.' },
  { nome: 'Troca-Troca',              tipo: 'Acessório — Anéis',      raridade: 'Raro',    recarga: 'Descanso longo+', carga: 1, acao: 'Ação',    desc: 'Par de anéis que troca as mentes de duas criaturas conscientes que os estejam usando por até 10 minutos. Ao fim, cada mente retorna ao corpo original.' },
  { nome: 'Dedo Falso de Confete',    tipo: 'Acessório — Dedo falso', raridade: 'Incomum', recarga: 'Descanso curto+', carga: 2, acao: 'Bônus',   desc: 'Dispara confetes e luz ofuscante em um cone de 3m. Criaturas na área fazem teste de Reflexos; quem falhar fica cego até o fim do próximo turno.' },
  { nome: 'Colar Calmante',           tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: 'Descanso curto+', carga: null, acao: 'Passiva', desc: 'Quando entra em estado Morrendo, concede vantagem em uma salvaguarda de Constituição à sua escolha.' },
  { nome: 'Colar de Luz',             tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: '',               carga: null, acao: 'Passiva', desc: 'Uma pedra amarela no centro do colar ilumina um raio de 6m em locais com pouca luz.' },
  { nome: 'Colar de Cura',            tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: 'Descanso médio ou + / meditar médio ou +', carga: 2, acao: 'Bônus', desc: 'Colar com uma corrente prateada e uma esmeralda em formato de gota. Cura os ferimentos do usuário em 1d12 pontos de vida.' },
  { nome: 'Cura Aprimorada',          tipo: 'Acessório — Colar',     raridade: 'Incomum', recarga: 'Descanso curto', carga: 1, acao: 'Passiva', desc: 'Usando este colar, você ganha +1d do tipo de dado da cura que estiver usando. Após aplicar esse benefício uma vez, o colar entra em descanso e precisa ser recarregado.' },
  { nome: 'Pedra da Reflexão',        tipo: 'Acessório — Colar',     raridade: 'Raro', recarga: 'Descanso médio ou + / meditar médio ou +', carga: 6, acao: 'Bônus', desc: 'Colar com uma pedra de quartzo branca que revela uma visão breve do futuro (1 segundo). No seu turno, gaste uma ação bônus e 1 carga para rolar 1d6: com 1, 2 ou 3, você tem desvantagem no próximo ataque por não conseguir processar a informação a tempo; com 4, 5 ou 6, tem vantagem no próximo ataque.' },
  { nome: 'Anel de Energia',          tipo: 'Acessório — Anel',      raridade: 'Incomum', recarga: 'Descanso médio+', carga: 2, acao: 'Bônus',   desc: 'Anel com uma pedra azul que restaura 16 PE ao ser ativado.' },
  { nome: 'Anel de Escama Endurecida', tipo: 'Acessório — Anel', raridade: 'Raro', recarga: 'Ficar submerso embaixo da água por 1 turno', carga: 2, acao: 'Bônus ou Reação', desc: 'Um anel preto com escamas prateadas em sua superfície. Ao ser ativado, concede +2 CA até você ser acertado.' },
  { nome: 'Puxa Corte',              tipo: 'Acessório — Anel',      raridade: 'Raro',    recarga: 'Descanso longo / meditar longo', carga: 5, acao: 'Passiva', desc: 'O anel puxa para si os cortes feitos em você. Ao ser atingido por um ataque cortante, gaste 1 carga para reduzir o dano em 10 e evitar também o ferimento complementar causado pelo golpe. Possui 5 cargas.' },
  { nome: 'Anel da Caveira',         tipo: 'Acessório — Anel',      raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'Um anel de osso volumoso, com uma caveira entalhada. Concede ao usuário resistência a dano necrótico, reduzindo esse dano pela metade.' },
  { nome: 'Digestor de Rochas',      tipo: 'Acessório — Anel',      raridade: 'Super raro', recarga: '—', carga: null, acao: 'Passiva', desc: 'O usuário que estiver usando este anel ganha a capacidade de digerir minerais, ganhando seus aspectos ou efeitos por 1 minuto.' },
  { nome: 'Anéis Telepáticos',       tipo: 'Acessório — Anéis',     raridade: 'Raro',       recarga: '—', carga: null, acao: 'Passiva', desc: 'Um par de anéis interligados por magia. Seus portadores podem se comunicar telepaticamente a até 5 km de distância. O efeito só funciona enquanto ambos estiverem usando um anel.' },
];
