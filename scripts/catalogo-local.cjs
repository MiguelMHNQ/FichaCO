// Revisões locais prevalecem sobre o cache da ferramenta de tradução.
const fs=require('node:fs'),path=require('node:path');
module.exports=function carregarCatalogoLocal(){
  const root=path.resolve(__dirname,'../locales');
  const cache=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
  for(const name of ['interface','glossary','overrides','sessions']){
    const entries=JSON.parse(fs.readFileSync(path.join(root,name+'.json'),'utf8'));
    for(const [pt,[en,es]] of Object.entries(entries)){cache.en[pt]=en;cache.es[pt]=es;}
  }
  return cache;
};
