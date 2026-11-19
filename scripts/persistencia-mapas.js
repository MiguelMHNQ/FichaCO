// Persistência compartilhada entre editor, lista de mapas e exclusão de conta.
function abrirBancoMapas() {
  return new Promise((resolve,reject) => {
    const req = indexedDB.open('primordios_tabletop',1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('mapas')) req.result.createObjectStore('mapas',{keyPath:'chave'});
      if (!req.result.objectStoreNames.contains('recursos')) req.result.createObjectStore('recursos',{keyPath:'id'});
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Feche outras abas do editor para continuar.'));
  });
}

async function excluirDadosMapas(usuario, mapaId = null) {
  const db = await abrirBancoMapas();
  try {
    await new Promise((resolve,reject) => {
      const tx = db.transaction(mapaId === null ? ['mapas','recursos'] : ['mapas'],'readwrite');
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      for (const nome of mapaId === null ? ['mapas','recursos'] : ['mapas']) {
        const req = tx.objectStore(nome).openCursor();
        req.onsuccess = () => {
          const cursor = req.result; if (!cursor) return;
          if (cursor.value.usuario === usuario && (mapaId === null || cursor.key === JSON.stringify([usuario,mapaId]))) cursor.delete();
          cursor.continue();
        };
      }
    });
  } finally { db.close(); }
}
