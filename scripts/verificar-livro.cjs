// Regressão da busca com os dados e renderizadores reais: node scripts/verificar-livro.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const elemento = () => ({ innerHTML: '', value: '', classList: { add() {}, remove() {} }, addEventListener() {} });
const conteudo = elemento(), campo = elemento(), abas = Array.from({ length: 13 }, elemento);
const contexto = vm.createContext({
  document: {
    getElementById: id => id === 'livroConteudo' ? conteudo : campo,
    querySelector: elemento, querySelectorAll: () => abas, addEventListener() {}
  },
  window: { addEventListener() {} }, Sons: { click() {} }
});
// O armazenamento não participa da pesquisa; carrega apenas as definições de regras.
const estado = read('scripts/estado.js');
vm.runInContext(estado.slice(estado.indexOf('const CONSTANCIAS =')), contexto);
for (const file of ['scripts/itens.js', 'scripts/armas-detalhes.js', 'scripts/habilidades.js', 'scripts/livro-dados.js']) vm.runInContext(read(file), contexto);
const html = read('pages/livro.html');
for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(script[1], contexto);
// Para cada categoria, encontra uma consulta real e confirma sua presença na busca global.
vm.runInContext(`
  for (const [categoria, render] of Object.entries(RENDERS)) {
    render('');
    const texto = document.getElementById('livroConteudo').innerHTML.replace(/<[^>]*>/g, ' ');
    const palavras = texto.match(/[A-Za-zÀ-ÿ]{4,}/g) || [];
    let consulta;
    for (const palavra of palavras) {
      render(palavra);
      if (!document.getElementById('livroConteudo').innerHTML.includes('livro-sem-resultado')) { consulta = palavra; break; }
    }
    if (!consulta) throw Error('Sem consulta de teste para ' + categoria);
    const esperado = document.getElementById('livroConteudo').innerHTML;
    pesquisar(consulta);
    if (!document.getElementById('livroConteudo').innerHTML.includes(esperado)) throw Error('Categoria ausente na busca global: ' + categoria);
  }
`, contexto);
vm.runInContext("pesquisar('zxqvnenhumresultado')", contexto);
assert.match(conteudo.innerHTML, /livro-sem-resultado/);
vm.runInContext("pesquisar('  espada  ')", contexto);
const comEspacos = conteudo.innerHTML;
vm.runInContext("pesquisar('espada')", contexto);
assert.equal(conteudo.innerHTML, comEspacos);
vm.runInContext("pesquisar('   ')", contexto);
assert.match(conteudo.innerHTML, /livro-card/);
vm.runInContext(`
  for (const arma of ARMAS) {
    if (!arma.descricaoVisual) throw Error('Arma sem aparência: ' + arma.nome);
    if (arma.desc.includes('Passiva:')) throw Error('Habilidade misturada às estatísticas');
    if (!!botaoHabilidadeArma(arma.nome) !== !!arma.habilidade) throw Error('Botão incorreto: ' + arma.nome);
  }
  for (const entrada of LIVRO_ARMAS_EXTRA.filter(r => !r.subtitulo)) {
    if (!APARENCIA_ARMAS[entrada.titulo]) throw Error('Entrada do livro sem aparência: ' + entrada.titulo);
    if (entrada.texto.includes('<em>Passiva:</em>') && !botaoHabilidadeArma(entrada.titulo)) throw Error('Habilidade perdida: ' + entrada.titulo);
  }
  pesquisar('pressurizada');
  if (!document.getElementById('livroConteudo').innerHTML.includes('data-habilidade-arma="Marreta Impulsiva"')) throw Error('Busca não encontra habilidade');
  pesquisar('culatra');
  if (!document.getElementById('livroConteudo').innerHTML.includes('Adaga Balística')) throw Error('Busca não encontra aparência');
`, contexto);
console.log('OK: busca global nas 13 categorias, consulta sem resultados, espaços e limpeza da pesquisa.');
console.log('OK: aparência de todas as armas, habilidades separadas e pesquisa por habilidade e descrição visual.');
vm.runInContext(`
  const nomes = ARMAS.map(a => a.nome);
  if (new Set(nomes).size !== nomes.length) throw Error('Armas duplicadas');
  for (const arma of ARMAS.filter(a => a.nova)) {
    pesquisar(arma.nome);
    if (!document.getElementById('livroConteudo').innerHTML.includes(arma.nome)) throw Error('Nova arma não pesquisável: '+arma.nome);
    if (LIVRO_ARMAS_EXTRA.filter(r => !r.subtitulo && r.titulo === arma.nome).length !== 1) throw Error('Arma ausente ou duplicada no livro');
  }
  if (ARMAS.find(a => a.nome === 'Arco Longo').dano !== '1d6 + For · Perfurante') throw Error('Arco existente alterado');
  if (ARMAS.find(a => a.nome === 'Arco Composto').dano !== '1d10 + For · Perfurante') throw Error('Arco existente alterado');
  if (ARMAS.find(a => a.nome === 'Quebra Queixo').tipo !== 'Manopla — CaC') throw Error('Quebra Queixo existente alterado');
`, contexto);
console.log('OK: novas armas pesquisáveis, sem duplicação e fichas anteriores preservadas.');
const rolagens = [], avisos = [];
Object.assign(contexto, {
  estado: { arma: null, constancias: { 'Força': 4, Destreza: 2 } },
  calcBonus: valor => valor, totalBonusRaca: () => 0, bonusAcessorioConstancia: () => 0,
  rolagemRapida: (dados, bonus) => rolagens.push({ dados, bonus }), alert: mensagem => avisos.push(mensagem)
});
const ficha = read('scripts/ficha-acessorios.js');
vm.runInContext(ficha.slice(ficha.indexOf('function rolarAtaqueArma()'), ficha.indexOf('function ajustarRecursoFicha(')), contexto);
for (const [nome, quantidade, lados, bonus] of [
  ['Ferroada',2,6,2], ['Dente de Dragão',2,8,4], ['Arcabuz',3,4,0],
  ['Canhão',5,12,0], ['Trabuco de Flecha',10,4,2], ['Espada de Duas Lâminas',1,8,4], ['Ácido',2,4,0]
]) {
  contexto.estado.arma = nome;
  vm.runInContext('rolarAtaqueArma()', contexto);
  const resultado = rolagens.at(-1);
  assert.equal(resultado.dados.length, quantidade);
  assert.ok(resultado.dados.every(d => d === lados));
  assert.equal(resultado.bonus, bonus);
}
const antes = rolagens.length;
contexto.estado.arma = 'Rede';
vm.runInContext('rolarAtaqueArma()', contexto);
assert.equal(rolagens.length, antes);
assert.match(avisos.at(-1), /não foi definido/);
console.log('OK: dano com Força/Destreza, dano sem atributo, ataque individual de duas lâminas e contenção sem rolagem.');
