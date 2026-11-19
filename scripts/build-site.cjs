// Publica somente o frontend. Código/segredos do backend nunca entram em dist.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destino = path.join(root, 'dist');
if(path.resolve(destino)!==path.resolve(root,'dist')||!destino.startsWith(root+path.sep))throw new Error('Destino inválido para build.');
fs.rmSync(destino,{recursive:true,force:true});
fs.mkdirSync(destino, { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(destino, 'index.html'));
for (const pasta of ['pages', 'styles', 'scripts', 'assets']) {
  fs.cpSync(path.join(root, pasta), path.join(destino, pasta), {
    recursive: true,
    filter: origem => !origem.endsWith('.cjs') && !origem.endsWith('.ts') && !origem.endsWith('.map')
  });
}
console.log('Frontend preparado em dist; backend separado em api/.');
