const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });

for (const file of ['scripts/itens.js', 'scripts/livro-dados.js', 'scripts/proficiencias.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const result = JSON.parse(vm.runInContext(`JSON.stringify({
  names: ARMAS_MAGICAS.map(arma => arma.nome),
  allNames: ARMAS.map(arma => arma.nome),
  complete: ARMAS_MAGICAS.every(arma => arma.magica && arma.raridade && arma.habilidade && arma.dadosLivro.dano),
  book: LIVRO_ARMAS_EXTRA.filter(item => item.titulo !== 'Armas mágicas' && ARMAS_MAGICAS.some(arma => arma.nome === item.titulo)),
  categories: window.Proficiencias.categorias(),
  multi: analisarDanoArma('1d8 + 1d6 + For'),
  fixed: analisarDanoArma('1 + For')
})`, context));

const expectedNames = [
  'Maracutaya', 'Cubo mágico', 'Marreta gravitacional', 'Lua de sangue', 'Martelo relâmpago',
  'Lâmina eco', 'Kensorazu', 'Leve picadinha', 'Katana Espiral', 'Lâmina do horizonte negro',
  'Lâmina tempestade congelada', 'Lâmina Fragmentada', 'Espada rosa sangrenta', 'Agulha da vingança',
  'Dupla sombra divina', 'GomuTengo', 'Lâmina flamejante', 'Garras do Rei Pantera',
  'Círculos ecoantes', 'Punhos Extremos', 'Arcada Tempestuosa', 'Corta planar', 'Luva de almas',
  'Faca Real', 'Abocanhador', 'Balanceador', 'Sangue Maksu', 'Espada do céu invertido',
  'Bastão Triplo', 'Livro Parceiro'
];

assert.deepEqual(result.names, expectedNames);
assert.equal(new Set(result.allNames).size, result.allNames.length);
assert.ok(result.complete);
assert.equal(result.book.length, expectedNames.length);
assert.ok(result.book.every(item => item.texto.includes('<strong>Raridade:</strong> ') && item.texto.includes('<em>Habilidade:</em>')));
assert.deepEqual(result.multi.dados, [8, 6]);
assert.deepEqual(result.multi.atributos, ['Força']);
assert.equal(result.fixed.fixo, 1);
assert.ok(result.categories.some(category => category.opcoes.includes('Espadas')));
assert.ok(result.categories.some(category => category.opcoes.includes('Martelos (Pesada)')));
assert.ok(!result.categories.some(category => category.nome === 'Armas mágicas'));

console.log('OK: 30 armas mágicas únicas, detalhes do livro, raridades, proficiências e rolagens.');
