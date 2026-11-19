import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import type { Pool, PoolClient } from 'pg';
import { readSupabaseConfig } from '../config.js';
import { SupabaseAuth } from '../adapters/supabase-auth.js';
import { PostgresRooms } from '../adapters/postgres-rooms.js';

const request = (token?: string) => ({ headers: token ? { authorization: token } : {} }) as IncomingMessage;

test('configuração ausente permite modo local; configuração parcial ou insegura falha sem revelar segredo', () => {
  assert.equal(readSupabaseConfig({}), undefined);
  assert.throws(() => readSupabaseConfig({ SUPABASE_URL: 'https://project.supabase.co' }), /Preencha/);
  const config = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key', SUPABASE_DB_URL: 'postgresql://primordios_backend.projectref:secret@pooler.example/postgres' };
  assert.equal(readSupabaseConfig(config)?.url, 'https://project.supabase.co');
  assert.throws(() => readSupabaseConfig({ ...config, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private_key' }), /nunca uma chave secreta/);
  assert.throws(() => readSupabaseConfig({ ...config, SUPABASE_URL: 'http://project.supabase.co' }), /HTTPS/);
  assert.throws(() => readSupabaseConfig({ ...config, SUPABASE_DB_URL: 'postgresql://postgres:secret@pooler.example/postgres' }), /restrita/);
  try { readSupabaseConfig({ ...config, SUPABASE_DB_URL: 'senha_secreta_invalida' }); assert.fail('deveria rejeitar'); }
  catch (error) { assert.ok(error instanceof Error); assert.ok(!error.message.includes('senha_secreta_invalida')); }
});

test('auth consulta o provedor; identidade não vem de cabeçalho nem papel dos metadados', async () => {
  let calls = 0;
  const auth = new SupabaseAuth(async token => {
    calls++; assert.equal(token, 'valid');
    return { user: { id: 'verified-user', user_metadata: { display_name: ' Nome ', primordios_profile_complete: true } } };
  });
  await assert.rejects(auth.authenticate(request()), { code: 'UNAUTHENTICATED' });
  await assert.rejects(auth.authenticate(request('Bearer x y')), { code: 'UNAUTHENTICATED' });
  assert.equal(calls, 0);
  const req = request('Bearer valid'); req.headers['x-user-id'] = 'owner';
  assert.deepEqual(await auth.authenticate(req), { id: 'verified-user', displayName: 'Nome' });
  assert.equal(calls, 1);
});

test('auth distingue token recusado de indisponibilidade e nunca retorna credenciais', async () => {
  await assert.rejects(new SupabaseAuth(async () => ({ user: null })).authenticate(request('Bearer expired')), { code: 'UNAUTHENTICATED' });
  await assert.rejects(new SupabaseAuth(async () => ({ user: null, unavailable: true })).authenticate(request('Bearer valid')), { code: 'AUTH_UNAVAILABLE' });
  await assert.rejects(new SupabaseAuth(async () => { throw new Error('token-secret'); }).authenticate(request('Bearer valid')), { code: 'AUTH_UNAVAILABLE', message: 'Não foi possível verificar o login. Tente novamente.' });
});

test('perfil sem nome escolhido ou com controles não libera API; nome nunca concede papel', async () => {
  const authenticate = (metadata: { display_name?: unknown; primordios_profile_complete?: unknown }) => new SupabaseAuth(async () => ({ user: { id: 'verified-user', user_metadata: metadata } })).authenticate(request('Bearer valid'));
  await assert.rejects(authenticate({ display_name: 'Nome Google' }), { code: 'PROFILE_INCOMPLETE' });
  await assert.rejects(authenticate({ display_name: '<owner>', primordios_profile_complete: true }), { code: 'PROFILE_INCOMPLETE' });
  await assert.rejects(authenticate({ display_name: 'Nome\u202e', primordios_profile_complete: true }), { code: 'PROFILE_INCOMPLETE' });
  assert.deepEqual(await authenticate({ display_name: 'Dono', primordios_profile_complete: true }), { id: 'verified-user', displayName: 'Dono' });
});

function database() {
  const queries: string[] = []; let released = false;
  const client = {
    query: async (sql: string) => { queries.push(sql); return { rows: [] }; },
    release: () => { released = true; }
  } as unknown as PoolClient;
  const pool = { connect: async () => client } as unknown as Pool;
  return { rooms: new PostgresRooms(pool), queries, released: () => released };
}

test('transação PostgreSQL adquire lock antes de ler, confirma e libera conexão', async () => {
  const db = database();
  assert.deepEqual(await db.rooms.transaction(tx => tx.list()), []);
  assert.equal(db.queries[0], 'BEGIN');
  const lock = db.queries.findIndex(q => q.includes('pg_advisory_xact_lock'));
  const read = db.queries.findIndex(q => q.includes('SELECT document'));
  assert.ok(lock >= 0 && lock < read);
  assert.equal(db.queries.at(-1), 'COMMIT'); assert.equal(db.released(), true);
});

test('falha de regra de negócio provoca rollback e libera conexão', async () => {
  const db = database();
  await assert.rejects(db.rooms.transaction(async () => { throw new Error('room-full'); }), /room-full/);
  assert.equal(db.queries.at(-1), 'ROLLBACK'); assert.equal(db.released(), true);
  assert.ok(!db.queries.includes('COMMIT'));
});
