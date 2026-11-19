import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createApi } from '../http/api.js';
import { DevAuth } from '../adapters/dev-auth.js';
import { MemoryRooms } from '../adapters/memory-rooms.js';
import { RoomService } from '../domain/rooms.js';

async function runServer(handler: ReturnType<typeof createApi>, check: (url: string) => Promise<void>) {
  const server = http.createServer(handler); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try { await check(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); }
}

test('configuração pública expõe somente URL e publishable key, sem exigir conta', async () => {
  await runServer(createApi({ publicAuth: { url: 'https://project.supabase.co', publishableKey: 'sb_publishable_test_key' } }), async url => {
    const response = await fetch(url + '/api/auth/config');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { enabled: true, url: 'https://project.supabase.co', publishableKey: 'sb_publishable_test_key' });
  });
  await runServer(createApi(), async url => {
    assert.deepEqual(await (await fetch(url + '/api/auth/config')).json(), { enabled: false });
  });
});

test('implantação sem Supabase falha fechada e não expõe identidades de desenvolvimento', async () => {
  await runServer(createApi(), async url => {
    const health = await fetch(url + '/api/health'); assert.equal(health.status, 200);
    assert.equal((await health.json() as { configured: boolean }).configured, false);
    assert.equal((await fetch(url + '/api/rooms')).status, 503);
    assert.equal((await fetch(url + '/api/dev/identities', { method: 'POST' })).status, 404);
  });
});

test('API local exige autenticação, bloqueia origem externa e não aceita papel enviado pelo cliente', async () => {
  const auth = new DevAuth();
  const handler = createApi({ rooms: new RoomService(new MemoryRooms()), authenticate: req => auth.authenticate(req), createDevIdentity: nome => auth.create(nome) });
  await runServer(handler, async url => {
    assert.equal((await fetch(url + '/api/rooms')).status, 401);
    const external = await fetch(url + '/api/dev/identities', { method: 'POST', headers: { Origin: 'https://externo.example', 'Content-Type': 'application/json' }, body: '{"name":"Intruso"}' });
    assert.equal(external.status, 403);
    const createIdentity = async (name: string) => {
      const response = await fetch(url + '/api/dev/identities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      assert.equal(response.status, 201); return await response.json() as { token: string; user: { id: string } };
    };
    const owner = await createIdentity('Dono'), player = await createIdentity('Jogador');
    const request = (token: string, path: string, body: unknown, method = 'POST') => fetch(url + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const created = await request(owner.token, '/api/rooms', { visibility: 'private', maxPlayers: 3, password: 'segredo' });
    assert.equal(created.status, 201); assert.equal(created.headers.get('cache-control'), 'no-store');
    const room = await created.json() as { code: string };
    assert.equal((await request(player.token, `/api/rooms/${room.code}/join`, { password: 'segredo', role: 'owner' })).status, 400);
    assert.equal((await request(player.token, `/api/rooms/${room.code}/join`, { password: 'segredo' })).status, 200);
    assert.equal((await request(player.token, `/api/rooms/${room.code}`, { maxPlayers: 10 }, 'PATCH')).status, 403);
    assert.equal((await request(owner.token, `/api/rooms/${room.code}/members/${player.user.id}`, { role: 'moderator' }, 'PATCH')).status, 200);
  });
});

test('JSON inválido, corpo grande e conteúdo inadequado recebem erros controlados', async () => {
  const auth = new DevAuth();
  await runServer(createApi({ rooms: new RoomService(new MemoryRooms()), authenticate: req => auth.authenticate(req), createDevIdentity: n => auth.create(n) }), async url => {
    assert.equal((await fetch(url + '/api/dev/identities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(url + '/api/dev/identities', { method: 'POST', body: 'name=Teste' })).status, 415);
    assert.equal((await fetch(url + '/api/dev/identities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'a'.repeat(20_000) }) })).status, 413);
  });
});

test('token de desenvolvimento expira sem confiar em nome enviado no cabeçalho', async () => {
  let now = 0; const auth = new DevAuth(() => now); const identity = auth.create('Pessoa');
  const request = { headers: { authorization: `Bearer ${identity.token}` } } as http.IncomingMessage;
  assert.equal((await auth.authenticate(request)).id, identity.user.id);
  now += 9 * 60 * 60 * 1000;
  await assert.rejects(auth.authenticate(request), { code: 'UNAUTHENTICATED' });
});

test('API aplica bloqueio de tráfego antes de consultar Auth',async()=>{
 let authenticated=0;
 const {AppError}=await import('../domain/errors.js');
 await runServer(createApi({rooms:new RoomService(new MemoryRooms()),authenticate:async()=>{authenticated++;return {id:'user',displayName:'Teste'};},limitRequest:async()=>{throw new AppError(429,'RATE_LIMITED','Muitas tentativas.');}}),async url=>{const response=await fetch(url+'/api/rooms');assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'60');assert.equal(authenticated,0);});
});
