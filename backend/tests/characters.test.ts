import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { CharacterService, characterDocument, type CharacterRepository, type CharacterRecord } from '../domain/characters.js';
import { AppError } from '../domain/errors.js';
import { createApi } from '../http/api.js';
import { MemoryRooms } from '../adapters/memory-rooms.js';
import { RoomService } from '../domain/rooms.js';

const owner = randomUUID(), outsider = randomUUID();
const document = () => ({ id: randomUUID(), nomePersonagem: 'Arqueira', classe: 'Guerreiro', nivel: 2, foto: '', desc: '<texto literal>', dados: { fragmentados_pv: '17' }, estadoCompleto: { usuarioDono: outsider, classe: 'Guerreiro', ganhosNivel: { '2': { pv: 7 } } } });

test('documento de ficha força dono/ID/estado e preserva recursos; rejeita excesso e foto ativa', () => {
  const input = document(); const parsed = characterDocument(input, owner);
  assert.equal(parsed.estadoCompleto.usuarioDono, owner); assert.equal(parsed.estadoCompleto.id, input.id);
  assert.equal(parsed.dados.fragmentados_pv, '17'); assert.equal(parsed.desc, '<texto literal>');
  assert.throws(() => characterDocument({ ...input, foto: 'data:image/svg+xml;base64,PHN2Zz4=' }, owner), { code: 'INVALID_PORTRAIT' });
  assert.throws(() => characterDocument({ ...input, foto: 'data:image/png;base64,YWJj' }, owner), { code: 'INVALID_PORTRAIT' });
  assert.throws(() => characterDocument({ ...input, nivel: '<img>' }, owner), { code: 'INVALID_CHARACTER' });
  assert.throws(() => characterDocument({ ...input, desc: 'x'.repeat(900_000) }, owner), { code: 'CHARACTER_TOO_LARGE' });
  assert.throws(() => characterDocument({ ...input, estadoCompleto: JSON.parse('{"__proto__":{"admin":true}}') }, owner), { code: 'INVALID_CHARACTER' });
  assert.throws(() => characterDocument({ ...input, dados: { primordios_logado: 'forjado' } }, owner), { code: 'INVALID_RESOURCES' });
  assert.throws(() => characterDocument({ ...input, dados: { fragmentados_pv: { objeto:'inválido' } } }, owner), { code: 'INVALID_RESOURCES' });
});

test('API deriva dono da autenticação, valida revisão e limita corpo de fichas sem mudar o limite de salas', async () => {
  const records = new Map<string, CharacterRecord>();
  const repo: CharacterRepository = {
    list: async () => [],
    get: async (user, id) => user === owner ? records.get(id) : undefined,
    create: async (user, doc) => { assert.equal(user, owner); const record = { document: doc, version: 1, updatedAt: 0 }; records.set(doc.id, record); return record; },
    update: async (user, doc, version) => {
      if (user !== owner || !records.has(doc.id)) throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Ficha não encontrada.');
      if (version !== records.get(doc.id)!.version) throw new AppError(409, 'CHARACTER_CONFLICT', 'Conflito.');
      const record = { document: doc, version: version + 1, updatedAt: 1 }; records.set(doc.id, record); return record;
    },
    remove: async (user, id) => { if (user !== owner) throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Ficha não encontrada.'); records.delete(id); }
  };
  const server = http.createServer(createApi({ rooms: new RoomService(new MemoryRooms()), characters: new CharacterService(repo), authenticate: async request => {
    const token = request.headers.authorization; if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Entre.');
    return { id: token === 'Bearer owner' ? owner : outsider, displayName: 'Pessoa' };
  } }));
  server.listen(0,'127.0.0.1'); await once(server,'listening'); const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  const send = (path: string, body: unknown, token = 'owner', method = 'POST') => fetch(url + path, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(url + '/api/characters')).status,401);
    const doc = document(); doc.desc = 'descrição '.repeat(2500);
    const created = await send('/api/characters', { document: doc, mutationId: randomUUID() }); assert.equal(created.status,400); // descrição excede 10 mil caracteres
    doc.desc = 'descrição'; doc.estadoCompleto = { ...doc.estadoCompleto, ...{ historia: 'a'.repeat(25_000) } };
    const valid = await send('/api/characters', { document: doc, mutationId: randomUUID() }); assert.equal(valid.status,201);
    assert.equal((await valid.json() as CharacterRecord).document.estadoCompleto.usuarioDono,owner);
    assert.equal((await fetch(url + '/api/characters/' + doc.id, { headers: { Authorization: 'Bearer outsider' } })).status,404);
    assert.equal((await send('/api/characters/' + doc.id, { document: doc, expectedVersion: 1, mutationId: randomUUID() }, 'outsider','PUT')).status,404);
    assert.equal((await send('/api/characters/' + doc.id, { document: doc, expectedVersion: 1, mutationId: randomUUID() }, 'owner','PUT')).status,200);
    assert.equal((await send('/api/characters/' + doc.id, { document: doc, expectedVersion: 1, mutationId: randomUUID() }, 'owner','PUT')).status,409);
    assert.equal((await send('/api/characters', { document: doc, mutationId: randomUUID(), ownerId: outsider })).status,400);
    assert.equal((await send('/api/rooms', { visibility:'public', maxPlayers:2, name:'a'.repeat(25_000) })).status,413);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('fichas rejeitam HTML em opções e recursos de inventário não numéricos',()=>{
 const d=document();for(const key of ['raca','caminho','arma'])assert.throws(()=>characterDocument({...d,estadoCompleto:{[key]:'<img src=x onerror=alert(1)>'}},owner),{code:'INVALID_CHARACTER'});
 assert.throws(()=>characterDocument({...d,estadoCompleto:{magiasGrimorio:['<svg onload=alert(1)>']}},owner),{code:'INVALID_CHARACTER'});
 assert.throws(()=>characterDocument({...d,estadoCompleto:{constancias:{'Vigor':'<img>'}}},owner),{code:'INVALID_CHARACTER'});
 assert.throws(()=>characterDocument({...d,dados:{fragmentados_inventario:JSON.stringify([{nome:'Objeto',qtd:'" onmouseover="alert(1)',peso:0}])}},owner),{code:'INVALID_RESOURCES'});
 assert.throws(()=>characterDocument({...d,dados:{fragmentados_const_checks:JSON.stringify({Atletismo:'<img>'})}},owner),{code:'INVALID_RESOURCES'});
 const valid=characterDocument({...d,dados:{fragmentados_inventario:JSON.stringify([{nome:'Arco de madeira',qtd:'2',peso:'1.5'}])}},owner);assert.deepEqual(JSON.parse(valid.dados.fragmentados_inventario as string),[{nome:'Arco de madeira',qtd:2,peso:1.5}]);
});
