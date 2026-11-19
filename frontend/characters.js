// Fichas usam a API do backend; credenciais do banco nunca chegam a este módulo.
export function createCharacterClient(auth) {
  let owner, tab, initialized, onlineLoaded = false, panel, dialog;
  const index = new Map(), pending = new Map(), timers = new Map(), inflight = new Map();
  const confirmed = new Map();
  const portraits = new Map();
  const prefix = () => `primordios_ficha_pendente:${owner}:`;
  const key = id => `${prefix()}${tab}:${id}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const summary = (doc, version, updatedAt = Date.now()) => ({ id: doc.id, nomePersonagem: doc.nomePersonagem, classe: doc.classe, nivel: doc.nivel, desc: doc.desc, hasPhoto: !!doc.foto, foto: doc.foto, version, updatedAt });
  const unpack = record => ({ ...record.document, estadoCompleto: { ...record.document.estadoCompleto, revisaoNuvem: record.version } });
  const canonical = record => {
    const state = { ...(record.estadoCompleto || {}) }; delete state.revisaoNuvem;
    const legacy = { fragmentados_pvmax: record.pvMax, fragmentados_pemax: record.peMax, fragmentados_pv: record.pv, fragmentados_pe: record.pe, fragmentados_ca: record.ca, fragmentados_xp: record.xp };
    return { id: record.id, nomePersonagem: record.nomePersonagem, classe: record.classe || state.classe, nivel: Number(record.nivel || state.nivel) || 1, foto: record.foto || '', desc: record.desc || '',
      dados: record.dados || Object.fromEntries(Object.entries(legacy).filter(([,value]) => value !== undefined && value !== null).map(([k,v]) => [k,String(v)])), estadoCompleto: state };
  };
  const fingerprint = doc => JSON.stringify(canonical(doc), (_, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key,value[key]])) : value);
  function changed() { window.dispatchEvent(new CustomEvent('primordios:fichas')); }
  function stored(item) { localStorage.setItem(key(item.document.id), JSON.stringify(item)); pending.set(item.document.id, item); }
  async function api(path, options = {}) {
    const response = await auth.request('/api/characters' + path, { ...options, ...(options.body ? { headers: { 'Content-Type': 'application/json' } } : {}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error?.message || 'Não foi possível acessar as fichas online.'); error.status = response.status; error.code = data.error?.code; throw error; }
    return data;
  }
  function foreignDrafts() {
    return Object.keys(localStorage).filter(k => k.startsWith(prefix()) && !k.startsWith(`${prefix()}${tab}:`)).flatMap(k => {
      try { const item = JSON.parse(localStorage.getItem(k)); return item?.document?.id ? [{ ...item, storageKey: k }] : []; } catch { return []; }
    });
  }
  function status(message, error = false) {
    if (!panel) {
      panel = document.createElement('aside'); panel.className = 'fichas-sync'; panel.setAttribute('aria-label', 'Salvamento das fichas');
      panel.dataset.i18nAriaLabel = 'Salvamento das fichas';
      const text = document.createElement('span'); text.setAttribute('role', 'status'); panel.append(text);
      const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Tentar novamente'; retry.onclick = () => { void client.retry(); }; panel.append(retry);
      const details = document.createElement('button'); details.type = 'button'; details.textContent = 'Ver pendências'; details.onclick = showPending; panel.append(details);
      document.body.append(panel);
    }
    panel.firstChild.textContent = message; panel.dataset.error = String(error);
    panel.children[1].hidden = !error;
    panel.children[2].hidden = !pending.size && !foreignDrafts().length;
  }
  function savedStatus() {
    if ([...pending.values()].some(item => item.conflict) || foreignDrafts().length) status('Há pendências que precisam da sua escolha.', true);
    else status(pending.size ? 'Alterações aguardando envio…' : 'Fichas salvas online.');
  }
  function exportDraft(item) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(item.document, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ficha-pendente.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function showPending() {
    dialog?.remove(); dialog = document.createElement('dialog'); dialog.className = 'fichas-dialog';
    const title = document.createElement('h2'); title.textContent = 'Alterações pendentes'; dialog.append(title);
    const help = document.createElement('p'); help.textContent = 'Suas alterações continuam neste navegador. Em caso de conflito, salve uma cópia para preservar as duas versões.'; dialog.append(help);
    const entries = [...pending.values(), ...foreignDrafts()];
    if (!entries.length) { const text = document.createElement('p'); text.textContent = 'Nenhuma alteração pendente.'; dialog.append(text); }
    for (const item of entries) {
      const row = document.createElement('div'); row.className = 'fichas-pendente';
      const name = document.createElement('strong'); name.textContent = item.document.nomePersonagem || 'Ficha sem nome'; row.append(name);
      const message = document.createElement('p'); message.textContent = item.error || (item.storageKey ? 'Alteração preservada de outra aba.' : 'Aguardando envio.'); row.append(message);
      const download = document.createElement('button'); download.type = 'button'; download.textContent = 'Baixar cópia'; download.onclick = () => exportDraft(item); row.append(download);
      const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Salvar como nova ficha';
      copy.onclick = async () => {
        copy.disabled = true;
        try {
          const original = item.document.id, id = crypto.randomUUID();
          const doc = clone(item.document); doc.id = id; doc.nomePersonagem = doc.nomePersonagem.slice(0, 70) + ' (cópia)';
          doc.estadoCompleto = { ...doc.estadoCompleto, id, usuarioDono: owner, nomePersonagem: doc.nomePersonagem, revisaoNuvem: null };
          if (!client.queue(doc)) throw new Error('Não foi possível preservar a cópia neste navegador.');
          await flush(id);
          if (pending.has(id)) throw new Error('A cópia continua pendente. Tente novamente quando houver conexão.');
          // Não remove uma edição de outra aba que tenha mudado desde a abertura do modal.
          const sourceKey = item.storageKey || key(original);
          const saved = JSON.parse(localStorage.getItem(sourceKey) || 'null');
          if (saved?.mutationId === item.mutationId) { localStorage.removeItem(sourceKey); if (!item.storageKey) pending.delete(original); }
          const fresh = await client.get(id);
          await client.refresh();
          window.dispatchEvent(new CustomEvent('primordios:ficha-copiada', { detail: { original, record: fresh } }));
          changed(); dialog.close(); status('Cópia salva online.');
        } catch (error) { message.textContent = error.message; copy.disabled = false; }
      }; row.append(copy);
      if (!item.storageKey) {
        const discard = document.createElement('button'); discard.type = 'button'; discard.textContent = 'Descartar edição local';
        discard.onclick = async () => {
          if (!confirm(window.PrimordiosI18n?.t('Descartar esta edição local e usar a versão online? A edição local será removida.') || 'Descartar esta edição local e usar a versão online? A edição local será removida.')) return;
          discard.disabled = true;
          try {
            if (inflight.has(item.document.id)) throw new Error('Aguarde o envio em andamento terminar.');
            let current;
            try { current = await api('/' + item.document.id); } catch (error) { if (error.status !== 404) throw error; }
            if (pending.get(item.document.id)?.mutationId !== item.mutationId) throw new Error('A edição mudou. Feche e abra as pendências novamente.');
            clearTimeout(timers.get(item.document.id)); localStorage.removeItem(key(item.document.id)); pending.delete(item.document.id);
            if (current) { index.set(item.document.id, summary(current.document, current.version, current.updatedAt)); confirmed.set(item.document.id, fingerprint(current.document)); }
            else { index.delete(item.document.id); confirmed.delete(item.document.id); }
            window.dispatchEvent(new CustomEvent('primordios:ficha-recarregar', { detail: { id: item.document.id, record: current ? unpack(current) : null } }));
            changed(); dialog.close(); status('Edição local descartada.');
          } catch (error) { message.textContent = error.message; discard.disabled = false; }
        }; row.append(discard);
      }
      dialog.append(row);
    }
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Fechar'; close.onclick = () => dialog.close(); dialog.append(close); document.body.append(dialog); dialog.showModal();
  }
  async function flush(id) {
    if (inflight.has(id)) return inflight.get(id);
    const run = (async () => {
      let item = pending.get(id); if (!item || item.conflict) return;
      try {
        // Guardar a requisição em andamento permite repetir a mesma mutação se a resposta se perder.
        item.flight ||= { document: clone(item.document), mutationId: item.mutationId, baseVersion: item.baseVersion };
        stored(item); const sent = clone(item.flight);
        const result = await api(sent.baseVersion === null ? '' : '/' + id, { method: sent.baseVersion === null ? 'POST' : 'PUT',
          body: JSON.stringify({ document: sent.document, mutationId: sent.mutationId, ...(sent.baseVersion === null ? {} : { expectedVersion: sent.baseVersion }) }) });
        item = pending.get(id);
        if (!item) return;
        index.set(id, summary(result.document, result.version, result.updatedAt));
        confirmed.set(id, fingerprint(result.document));
        if (item.mutationId === sent.mutationId) { localStorage.removeItem(key(id)); pending.delete(id); }
        else { item.baseVersion = result.version; item.flight = null; item.error = ''; stored(item); index.set(id, summary(item.document, result.version)); }
        window.dispatchEvent(new CustomEvent('primordios:ficha-salva', { detail: { id, version: result.version } }));
        changed(); savedStatus();
        if (pending.has(id)) timers.set(id, setTimeout(() => { void flush(id); }, 200));
      } catch (error) {
        item = pending.get(id);
        if (item) { item.error = error.message || 'Falha de conexão.'; item.conflict = error.status === 409 || error.status === 404;
          // Rejeições definitivas não gravaram: permitir corrigir o documento pendente.
          if ([400,413,415,429].includes(error.status)) item.flight = null;
          try { stored(item); } catch {} }
        status(item?.conflict ? 'Conflito: sua edição foi preservada. Veja as pendências.' : 'Envio pendente. Suas alterações continuam neste navegador.', true); changed();
      }
    })();
    inflight.set(id, run); try { await run; } finally { inflight.delete(id); }
  }
  async function tabIdentity() {
    tab = sessionStorage.getItem('primordios_fichas_aba') || crypto.randomUUID();
    if (navigator.locks) await new Promise(resolve => {
      void navigator.locks.request('primordios-fichas-aba:' + tab, { ifAvailable: true }, async lock => {
        if (!lock) { tab = crypto.randomUUID(); resolve(); return; }
        resolve(); await new Promise(release => window.addEventListener('pagehide', release, { once: true }));
      });
    });
    sessionStorage.setItem('primordios_fichas_aba', tab);
  }
  const client = {
    init() {
      return initialized ||= (async () => {
        const state = await auth.status(); if (!state.user || !state.profileComplete) throw new Error('Entre para carregar suas fichas.');
        owner = state.user.id; await tabIdentity();
        for (const k of Object.keys(localStorage).filter(k => k.startsWith(`${prefix()}${tab}:`))) {
          try { const item = JSON.parse(localStorage.getItem(k)); if (item?.document?.id) pending.set(item.document.id, item); } catch {}
        }
        try { await client.refresh(); } catch { status('Não foi possível carregar as fichas online. Tente novamente.', true); }
        for (const item of pending.values()) index.set(item.document.id, summary(item.document, item.baseVersion || 0));
        changed(); for (const id of pending.keys()) if (!pending.get(id).conflict) void flush(id);
        if (foreignDrafts().length) status('Há alterações de outra aba preservadas neste navegador. Veja as pendências.', true);
      })();
    },
    async refresh() {
      const records = await api(''); index.clear(); for (const record of records) index.set(record.id, record);
      for (const item of pending.values()) index.set(item.document.id, summary(item.document, item.baseVersion || 0));
      onlineLoaded = true; savedStatus(); changed();
    },
    list() { return [...index.values()].sort((a,b) => a.updatedAt - b.updatedAt).map(clone); },
    loaded() { return onlineLoaded; },
    async get(id) {
      await client.init(); const item = pending.get(id);
      if (item) return unpack({ document: clone(item.document), version: item.baseVersion });
      const result = await api('/' + id); confirmed.set(id, fingerprint(result.document)); index.set(id, summary(result.document, result.version, result.updatedAt)); return unpack(result);
    },
    async portrait(id) {
      const local = pending.get(id); if (local) return local.document.foto;
      const record = index.get(id); if (typeof record?.foto === 'string') return record.foto;
      const cacheKey = id + ':' + record?.version;
      if (!portraits.has(cacheKey)) {
        if (portraits.size >= 200) portraits.delete(portraits.keys().next().value);
        portraits.set(cacheKey, api('/' + id + '/portrait').then(result => result.foto).catch(error => { portraits.delete(cacheKey); throw error; }));
      }
      return portraits.get(cacheKey);
    },
    queue(record) {
      if (!owner || !tab) return false;
      const doc = canonical(clone(record)); const previous = pending.get(doc.id);
      if (previous && fingerprint(previous.document) === fingerprint(doc) || !previous && confirmed.get(doc.id) === fingerprint(doc)) return true;
      const item = { document: doc, baseVersion: previous ? previous.baseVersion : (record.estadoCompleto?.revisaoNuvem ?? null), mutationId: crypto.randomUUID(), flight: previous?.flight || null, conflict: previous?.conflict || false, error: previous?.error || '' };
      try { stored(item); } catch { status('Sem espaço para preservar a edição. Reduza a foto ou baixe uma cópia.', true); return false; }
      index.set(doc.id, summary(doc, item.baseVersion || 0));
      clearTimeout(timers.get(doc.id)); if (!item.conflict) timers.set(doc.id, setTimeout(() => { void flush(doc.id); }, 700));
      status(item.conflict ? 'Conflito: sua edição foi preservada. Veja as pendências.' : 'Alterações preservadas neste navegador; enviando…', !!item.conflict); changed(); return true;
    },
    async flush(id) { clearTimeout(timers.get(id)); await flush(id); },
    async remove(id) {
      await client.init(); await client.flush(id);
      if (pending.has(id)) throw new Error('Resolva ou preserve as alterações pendentes antes de excluir.');
      const item = index.get(id); if (!item) return;
      try { await api('/' + id, { method: 'DELETE', body: JSON.stringify({ expectedVersion: item.version, mutationId: crypto.randomUUID() }) }); }
      catch (error) { if (error.status !== 404) throw error; }
      index.delete(id); confirmed.delete(id); for(const cached of portraits.keys())if(cached.startsWith(id+':'))portraits.delete(cached);try{if(JSON.parse(sessionStorage.getItem('fragmentados_estado')||'{}').id===id)for(const key of Object.keys(sessionStorage))if(key.startsWith('fragmentados_'))sessionStorage.removeItem(key);}catch{} changed(); status('Ficha excluída online.');
    },
    async retry() {
      try { await client.refresh(); } catch { status('Não foi possível conectar. Suas pendências continuam preservadas.', true); return; }
      for (const id of pending.keys()) await flush(id);
      if ([...pending.values()].some(item => item.conflict) || foreignDrafts().length) status('Existem pendências que precisam da sua escolha.', true);
    },
    async import(source, original) {
      await client.init();
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source + ':' + (original.id || JSON.stringify(original))));
      const importKey = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
      const doc = canonical(clone(original)); doc.id = crypto.randomUUID();
      doc.estadoCompleto = { ...doc.estadoCompleto, id: doc.id, usuarioDono: owner };
      const result = await api('', { method: 'POST', body: JSON.stringify({ document: doc, mutationId: crypto.randomUUID(), importKey }) });
      // Só informar sucesso após confirmar a ficha persistida com leitura autorizada.
      const confirmed = await api('/' + result.document.id);
      index.set(confirmed.document.id, summary(confirmed.document, confirmed.version, confirmed.updatedAt)); changed(); return confirmed.document.id;
    }
  };
  window.addEventListener('online', () => { if (initialized) void client.retry(); });
  window.addEventListener('beforeunload', event => { if (pending.size) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('pagehide', () => { for (const timer of timers.values()) clearTimeout(timer); });
  return client;
}
