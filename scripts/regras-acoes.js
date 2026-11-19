/* Leitura das métricas do livro. Valores ausentes ficam vazios para confirmação. */
(() => {
  const support=new Set(['Armadura Mágica','Detectar Traços Mágicos','Levitar Objeto','Mãos Mágicas','Peso Pena','Soco Direto','Parede de Fogo','Criar Água','Vento Guiado','Forja Sanguínea','Laçadoras','Troca de Pontos','Potrios','Faíscas Cintilantes','Munição Ardente','Armamento Ardente','Lâmina de Água','Sussurro pelo Vento','Impulsão Mágica','Placa Gélida','Armadura Vulcânica','Teleporte','Defesa Flamejante','Muro de Terra','Clone de Lama','Caminho pelo Vento','Controle Gasoso','Lâmina Congelante','Sobrecarga Âmbar','Barreira de Vento','Dobra Espacial']);
  const heal=new Set(['Estabilizador Tempestuoso','Fotossintetizado','Força Vital','Ressuscitar Mortos']);
  const n=value=>value==null?null:Number(value.replace(',','.'));
  const text=html=>(html||'').replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  function analyze(title,html,{spell=false,level=1}={}){
    html=typeof html==='string'?html:'';
    const tags=[...html.matchAll(/<span[^>]*livro-tag-acao[^>]*>(.*?)<\/span>/g)].map(m=>text(m[1])).join(' · '),description=text(html),base=description.split(/Acender:/i)[0],metrics=tags||base;
    let category=heal.has(title)?'heal':support.has(title)?'support':!spell&&/cura|regenera|recupera\s+\d+(?:d\d+)?\s*PV/i.test(base)?'heal':!spell&&/concede|aliad|vantagem|protege/i.test(base)&&!/causa.*dano|inimig/i.test(base)?'support':'attack';
    let range=null;const explicit=metrics.match(/(?:alcance|até|distância de)\s*:?\s*(\d+(?:[,.]\d+)?)\s*m(?![²\w])/i);
    if(explicit)range=n(explicit[1]);else if(/\bCurto\b/i.test(metrics))range=9;else if(/\bMédio\b/i.test(metrics))range=18;else if(/\bLongo\b/i.test(metrics))range=36;else if(/\bImenso\b/i.test(metrics))range=90;else if(/\bToque\b/i.test(metrics))range=0;else if(/\bPessoal\b/i.test(metrics))range=0;
    let self=/\bPessoal\b/i.test(metrics)&&range===0,forms=[];
    const circle=metrics.match(/\bRaio\s+(\d+(?:[,.]\d+)?)\s*m/i)||base.match(/\braio\s+(?:de\s+)?(?:explosão\s+de\s+)?(\d+(?:[,.]\d+)?)\s*m/i);
    const diameter=base.match(/(\d+(?:[,.]\d+)?)\s*m\s*de diâmetro/i);
    const line=metrics.match(/\bLinha(?:\s+(\d+(?:[,.]\d+)?)\s*m)?(?:\s*[×x]\s*(\d+(?:[,.]\d+)?)\s*m)?/i)||base.match(/\blinha de\s*(\d+(?:[,.]\d+)?)\s*m\s*[×x]\s*(\d+(?:[,.]\d+)?)\s*m/i);
    const cone=metrics.match(/\bCone\s+(\d+(?:[,.]\d+)?)\s*m/i)||base.match(/\bcone de\s*(\d+(?:[,.]\d+)?)\s*m/i);
    const square=metrics.match(/Área\s+(\d+(?:[,.]\d+)?)\s*m²/i),dimensions=base.match(/(\d+(?:[,.]\d+)?)\s*m?\s*[×x]\s*(\d+(?:[,.]\d+)?)\s*m/i);
    const ambiguousArea=/Área\s+\d|\bEsfera\s+\d|Área gasosa/i.test(metrics);
    if(!spell&&circle&&!explicit&&/ao redor|em raio|em um raio/i.test(base)){self=true;range=0;}
    const anchor=self?'caster':'point';
    if(circle)forms.push({shape:'circle',radius:n(circle[1]),anchor});
    if(line)forms.push({shape:'line',length:n(line[1]),width:n(line[2]),anchor:category==='attack'?'caster':'point'});
    if(cone)forms.push({shape:'cone',length:n(cone[1]),angle:null,anchor:'caster'});
    if(!forms.length&&square)forms.push({shape:'rectangle',length:dimensions?n(dimensions[1]):Math.sqrt(n(square[1])),width:dimensions?n(dimensions[2]):Math.sqrt(n(square[1])),anchor});
    if(!forms.length&&diameter)forms.push({shape:'circle',radius:n(diameter[1])/2,anchor});
    if(!forms.length&&(ambiguousArea||/explosão|explode/i.test(base)))forms.push({shape:'circle',radius:null,anchor});
    if(!forms.length)forms.push({shape:'target',anchor:'caster'});
    if(['Portão em Fissura','Racha Terra','Erudição Meteórica'].includes(title))for(const form of forms)form.anchor='point';
    if(title==='Troca de Pontos'||title==='Teleporte')forms.splice(0,forms.length,{shape:'target',anchor:'caster'});
    if(title==='Planta Carnívora')forms.splice(0,forms.length,{shape:'circle',radius:2,anchor:'point'});
    if(title==='Torres Contundentes')forms.splice(0,forms.length,{shape:'circle',radius:1.5,anchor:'point'});
    if(title==='Placa Gélida'){forms[0].length=7.5;forms[0].width=null;}
    let forcedMax=null;
    if(!spell){const radii={'Canção de Cura':level>=6?6:4.5,'Mil Cortes':4.5,'Impulso':3,'Orquestra Sinfônica':22,'Prepúcio da Morte':12,'Santuário Sombrio':7.5};if(radii[title]){range=0;self=true;forms.splice(0,forms.length,{shape:'circle',radius:radii[title],anchor:'caster'});if(title==='Canção de Cura'||title==='Orquestra Sinfônica')category='heal';if(title==='Mil Cortes')forcedMax=5;}
      if(title==='Toque Acolhedor'){category='heal';range=12;forcedMax=1;}if(title==='Música de Ferro'){category='support';range=15;forcedMax=100;}
    }
    const count=metrics.match(/(?:até\s+)?(\d+)\s*(?:alvos?|seres?|criaturas?)/i)||(!spell?base.match(/(?:até\s+)(\d+)\s+(?:inimigos|alvos|criaturas|aliados)/i):null);
    const notes=[];if(range===null)notes.push('O livro não define um alcance numérico para esta ação.');
    if(forms.some(f=>f.shape==='circle'&&f.radius==null))notes.push('A área não informa claramente raio ou diâmetro. Confirme o raio.');
    if(forms.some(f=>f.shape==='line'&&(f.width==null||f.length==null)))notes.push('A linha precisa de comprimento e largura confirmados.');
    if(forms.some(f=>f.shape==='cone'&&f.angle==null))notes.push('O livro não define a abertura do cone. Confirme o ângulo.');
    if(title==='Placa Gélida')notes.push('O cabeçalho e a descrição apresentam comprimentos diferentes. Confira as medidas.');

    // Um fragmento não é uma conjuração inteira; efeitos posteriores não são dano inicial.
    const projectileCounts={'Tiros de Chamas':4,'Tiro de Vento':2,'Fragmentos de Gelo':2,'Espinhos Múltiplos':3,'Manipulação Terrena':4,'Bala Carmesim':4,'Mísseis Mágicos':3,'Pedrinhas':2};
    const ambiguous=new Set(['Pedrinhas','Cordão Elétrico','Bomba de Vento','Corte Aéreo','Palma Magmática','Raio Elétrico','Chicote Espinhoso','Campo de Magma','Dilúvio Devastador','Ar Comprimido','Cratera Imensa','Tirar Fôlego','Dilúvio Supremo','Chamas Azuis','Corte Espectral']);
    let damageText='';
    if((spell||projectileCounts[title])&&category==='attack'&&!ambiguous.has(title)){
      const first=[...html.split(/<em>Acend(?:er|ar):/i)[0].matchAll(/<strong>(.*?)<\/strong>/g)].map(m=>text(m[1]));
      damageText=first.find(v=>/\d+d\d+/.test(v)&&!/PV|CA|Resistência/i.test(v))||'';
      if(['Prisão de Água','Supernova'].includes(title))damageText='';
    }
    let dice=[...damageText.matchAll(/(\d+)d(2|4|6|8|10|12|14|16|20|100)\b/gi)].flatMap(m=>Array(Math.min(40,+m[1])).fill(+m[2]));
    if(ambiguous.has(title))notes.push('A fórmula ou a distribuição desta magia precisa de confirmação; não foi presumida a partir de números ambíguos.');
    if(spell&&/turno|rodada|ao fechar|Contato físico|próximo ataque|Passa|Falha|cada fragmento|cada alvo/i.test(base))notes.push('Confirme acertos, resistência e o momento do efeito. Danos posteriores e condições não são aplicados automaticamente.');
    if(title==='Corte Aéreo')notes.push('O dano diminui a cada alvo após o primeiro. Resolva os alvos em ordem com suas fórmulas específicas.');
    if(title==='Chamas Azuis')notes.push('Confirme se o dano indicado é por explosão ou pela conjuração e como sobreposições são resolvidas.');
    if(title==='Furadeira Relâmpago')notes.push('Alvos adicionais usam a distância a partir do primeiro alvo, não do conjurador. Resolva os saltos separadamente.');
    const phases={
      'Linha de Lava':[['Conjurar sem dano imediato',''],['Contato','2d4']],
      'Círculo de Sangue':[['Conjurar sem dano imediato',''],['Falha na resistência','4d6'],['Sucesso na resistência','3d4']],
      'Jaula de Chamas':[['Conjurar sem dano imediato',''],['Dano do turno','5d6'],['Atravessar a jaula','4d6']],
      'Portão em Fissura':[['Abrir a fissura',''],['Fechar a fissura','6d12']],
      'Cipó Independente':[['Invocar sem dano imediato',''],['Ataque do cipó','3d8']],
      'Broto Vampiro':[['Conjurar sem dano imediato',''],['Dano do turno','4d8']],
      'Nevada Contundente':[['Impacto inicial','7d16'],['Segundo turno','5d16']],
      'Fogo Envernizado':[['Impacto inicial','6d12'],['Dano residual','3d8']],
      'Geada Suprema':[['Impacto inicial','8d16'],['Dano residual','3d8']],
      'Inferno Carmesim':[['Impacto inicial','6d20'],['Terreno em chamas','3d10']],
      'Furacão 2000':[['Impacto inicial','10d20'],['Dano do turno','5d20']],
      'Tornado Glacial':[['Impacto inicial','10d20'],['Dano do turno','5d12']],
      'Prisão Glacial':[['Falha: aprisionar sem dano',''],['Sucesso: dano sem prisão','5d10']],
      'Prisão de Água':[['Conjurar sem dano imediato',''],['Acender','1d6']],
      'Supernova':[['Conjurar sem dano imediato',''],['Acender: explosão','8d20']],
      'Chama Arcana':[['Dano comum a todos','24d8'],['Dano com falha na resistência','30d8']],
      'Vento Nato':[['Conjurar sem dano imediato',''],['Rajada contra uma criatura','4d10']]
    };
    const damageOptions=phases[title];if(damageOptions)dice=[...damageOptions[0][1].matchAll(/(\d+)d(\d+)/g)].flatMap(m=>Array(+m[1]).fill(+m[2]));
    const distribution={mode:projectileCounts[title]?'projectiles':forms[0].shape==='target'?'individual':'shared',count:projectileCounts[title]||1};
    return {dice,bonus:0,damageOptions,distribution,category,effects:title==='Parede de Fogo'?['support','attack']:title==='Broto Vampiro'?['attack','heal']:title==='Força Vital'?['heal','support']:[category],range,placements:title==='Torres Contundentes'?5:title==='Chamas Azuis'?4:1,maxTargets:(title==='Torres Contundentes'||title==='Chamas Azuis')?100:forcedMax??(count?Number(count[1]):forms[0].shape==='target'?1:100),includeSelf:category!=='attack',forms,notes,self,description};
  }
  window.RegrasAcoes={analyze};
})();
